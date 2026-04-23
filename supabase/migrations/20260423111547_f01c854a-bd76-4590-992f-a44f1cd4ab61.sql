
-- Fix du trigger d'audit existant (la colonne s'appelle permission_key, pas permission_code)
CREATE OR REPLACE FUNCTION public.trg_log_role_permissions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_activity('permission.granted', 'role_permission', NEW.id::text, NULL,
      jsonb_build_object('role', NEW.role, 'permission_key', NEW.permission_key));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_activity('permission.revoked', 'role_permission', OLD.id::text, NULL,
      jsonb_build_object('role', OLD.role, 'permission_key', OLD.permission_key));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 1. Colonnes additionnelles sur organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS brand_logo_url text,
  ADD COLUMN IF NOT EXISTS email_sender_domain text,
  ADD COLUMN IF NOT EXISTS email_tracking_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS inactivity_reminder_days integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS email_features_override jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Table email_providers
CREATE TABLE IF NOT EXISTS public.email_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  config_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_providers_read_authenticated" ON public.email_providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "email_providers_manage_saas" ON public.email_providers FOR ALL TO authenticated
  USING (public.is_saas_team(auth.uid())) WITH CHECK (public.is_saas_team(auth.uid()));

-- 3. Table email_provider_configs
CREATE TABLE IF NOT EXISTS public.email_provider_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider_code text NOT NULL REFERENCES public.email_providers(code),
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  from_email text,
  from_name text,
  reply_to text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX IF NOT EXISTS idx_email_provider_configs_org ON public.email_provider_configs(organization_id);
ALTER TABLE public.email_provider_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "epc_select_saas" ON public.email_provider_configs FOR SELECT TO authenticated USING (public.is_saas_team(auth.uid()));
CREATE POLICY "epc_select_org_admin" ON public.email_provider_configs FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id));
CREATE POLICY "epc_manage_saas" ON public.email_provider_configs FOR ALL TO authenticated
  USING (public.is_saas_team(auth.uid())) WITH CHECK (public.is_saas_team(auth.uid()));
CREATE POLICY "epc_manage_org_admin" ON public.email_provider_configs FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id));
CREATE TRIGGER trg_epc_updated_at BEFORE UPDATE ON public.email_provider_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Table email_templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  subject text NOT NULL,
  markdown_body text NOT NULL DEFAULT '',
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_templates_code_org_unique UNIQUE (code, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_email_templates_code ON public.email_templates(code);
CREATE INDEX IF NOT EXISTS idx_email_templates_org ON public.email_templates(organization_id);
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_templates_read_global" ON public.email_templates FOR SELECT TO authenticated USING (organization_id IS NULL);
CREATE POLICY "email_templates_read_org" ON public.email_templates FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "email_templates_manage_saas" ON public.email_templates FOR ALL TO authenticated
  USING (public.is_saas_team(auth.uid())) WITH CHECK (public.is_saas_team(auth.uid()));
CREATE POLICY "email_templates_manage_org_admin" ON public.email_templates FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id));
CREATE TRIGGER trg_email_templates_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Versions
CREATE TABLE IF NOT EXISTS public.email_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  snapshot jsonb NOT NULL,
  changed_by uuid,
  change_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_etv_template ON public.email_template_versions(template_id);
ALTER TABLE public.email_template_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "etv_read_via_template" ON public.email_template_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.email_templates t WHERE t.id = template_id AND (
    public.is_saas_team(auth.uid()) OR t.organization_id IS NULL
    OR (t.organization_id IS NOT NULL AND public.is_org_member(auth.uid(), t.organization_id))
  )));
CREATE POLICY "etv_insert_saas_or_admin" ON public.email_template_versions FOR INSERT TO authenticated
  WITH CHECK (public.is_saas_team(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.email_templates t WHERE t.id = template_id
      AND t.organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), t.organization_id)
  ));

CREATE OR REPLACE FUNCTION public.capture_email_template_version()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _next int;
BEGIN
  SELECT COALESCE(MAX(version_number),0)+1 INTO _next
  FROM public.email_template_versions WHERE template_id = OLD.id;
  INSERT INTO public.email_template_versions (template_id, version_number, snapshot, changed_by, change_summary)
  VALUES (OLD.id, _next, to_jsonb(OLD), auth.uid(),
    CASE
      WHEN OLD.subject IS DISTINCT FROM NEW.subject THEN 'subject changed'
      WHEN OLD.markdown_body IS DISTINCT FROM NEW.markdown_body THEN 'body changed'
      ELSE 'minor changes'
    END);
  RETURN NEW;
END;$$;

CREATE TRIGGER trg_email_templates_version BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  WHEN (OLD.subject IS DISTINCT FROM NEW.subject OR OLD.markdown_body IS DISTINCT FROM NEW.markdown_body)
  EXECUTE FUNCTION public.capture_email_template_version();

-- 6. Automations
CREATE TABLE IF NOT EXISTS public.email_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  trigger_event text NOT NULL,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  template_code text NOT NULL,
  delay_minutes integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_automations_code_org_unique UNIQUE (code, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_email_automations_event ON public.email_automations(trigger_event);
CREATE INDEX IF NOT EXISTS idx_email_automations_org ON public.email_automations(organization_id);
ALTER TABLE public.email_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_automations_read_global" ON public.email_automations FOR SELECT TO authenticated USING (organization_id IS NULL);
CREATE POLICY "email_automations_read_org" ON public.email_automations FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "email_automations_manage_saas" ON public.email_automations FOR ALL TO authenticated
  USING (public.is_saas_team(auth.uid())) WITH CHECK (public.is_saas_team(auth.uid()));
CREATE POLICY "email_automations_manage_org_admin" ON public.email_automations FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id));
CREATE TRIGGER trg_email_automations_updated_at BEFORE UPDATE ON public.email_automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Runs
CREATE TABLE IF NOT EXISTS public.email_automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid REFERENCES public.email_automations(id) ON DELETE SET NULL,
  template_code text NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  trigger_event text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'scheduled',
  provider_used text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  error text,
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ear_org ON public.email_automation_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ear_status ON public.email_automation_runs(status);
CREATE INDEX IF NOT EXISTS idx_ear_event ON public.email_automation_runs(trigger_event);
CREATE INDEX IF NOT EXISTS idx_ear_idem ON public.email_automation_runs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_ear_created ON public.email_automation_runs(created_at DESC);
ALTER TABLE public.email_automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ear_select_saas" ON public.email_automation_runs FOR SELECT TO authenticated USING (public.is_saas_team(auth.uid()));
CREATE POLICY "ear_select_org_admin" ON public.email_automation_runs FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id));

-- 8. Stats view
CREATE OR REPLACE VIEW public.v_email_stats AS
SELECT
  date_trunc('day', created_at)::date AS day,
  organization_id,
  template_code,
  trigger_event,
  provider_used,
  COUNT(*) FILTER (WHERE status = 'sent') AS sent_count,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
  COUNT(*) FILTER (WHERE status = 'scheduled') AS scheduled_count,
  COUNT(*) FILTER (WHERE opened_at IS NOT NULL) AS opened_count,
  COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) AS clicked_count,
  COUNT(*) AS total_count
FROM public.email_automation_runs
GROUP BY 1, 2, 3, 4, 5;

-- 9. Audit triggers
CREATE OR REPLACE FUNCTION public.trg_log_email_template()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP='INSERT' THEN PERFORM public.log_activity('email.template.created','email_template',NEW.id::text,NEW.organization_id,jsonb_build_object('code',NEW.code,'name',NEW.name)); RETURN NEW;
  ELSIF TG_OP='UPDATE' THEN PERFORM public.log_activity('email.template.updated','email_template',NEW.id::text,NEW.organization_id,jsonb_build_object('code',NEW.code)); RETURN NEW;
  ELSIF TG_OP='DELETE' THEN PERFORM public.log_activity('email.template.deleted','email_template',OLD.id::text,OLD.organization_id,jsonb_build_object('code',OLD.code)); RETURN OLD;
  END IF; RETURN NULL;
END;$$;
CREATE TRIGGER trg_log_email_templates AFTER INSERT OR UPDATE OR DELETE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_email_template();

CREATE OR REPLACE FUNCTION public.trg_log_email_automation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP='INSERT' THEN PERFORM public.log_activity('email.automation.created','email_automation',NEW.id::text,NEW.organization_id,jsonb_build_object('code',NEW.code,'event',NEW.trigger_event)); RETURN NEW;
  ELSIF TG_OP='UPDATE' THEN PERFORM public.log_activity('email.automation.updated','email_automation',NEW.id::text,NEW.organization_id,jsonb_build_object('code',NEW.code)); RETURN NEW;
  ELSIF TG_OP='DELETE' THEN PERFORM public.log_activity('email.automation.deleted','email_automation',OLD.id::text,OLD.organization_id,jsonb_build_object('code',OLD.code)); RETURN OLD;
  END IF; RETURN NULL;
END;$$;
CREATE TRIGGER trg_log_email_automations AFTER INSERT OR UPDATE OR DELETE ON public.email_automations
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_email_automation();

-- 10. Seed providers
INSERT INTO public.email_providers (code, name, description, config_schema) VALUES
  ('lovable','Lovable Email','Service email natif intégré (queue pgmq + DKIM/SPF managés)','{"fields":[]}'::jsonb),
  ('resend','Resend','API moderne pour emails transactionnels','{"fields":[{"key":"api_key","label":"API Key","type":"password","required":true}]}'::jsonb),
  ('sendgrid','SendGrid','Plateforme email enterprise (Twilio)','{"fields":[{"key":"api_key","label":"API Key","type":"password","required":true}]}'::jsonb),
  ('smtp','SMTP Custom','Serveur SMTP personnalisé','{"fields":[{"key":"host","label":"Host","type":"text","required":true},{"key":"port","label":"Port","type":"number","required":true},{"key":"username","label":"Username","type":"text","required":true},{"key":"password","label":"Password","type":"password","required":true},{"key":"secure","label":"TLS","type":"boolean","required":false}]}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 11. Seed templates
INSERT INTO public.email_templates (code, organization_id, name, description, subject, markdown_body, variables) VALUES
  ('welcome', NULL, 'Bienvenue', 'Email envoyé après création du compte',
   'Bienvenue sur GROWTHINNOV, {{firstName}} !',
   E'# Bienvenue {{firstName}} 👋\n\nNous sommes ravis de t''accueillir sur **GROWTHINNOV**, la plateforme qui transforme ta façon d''innover.\n\n## 🎁 10 crédits offerts\n\nTon compte est crédité de **10 crédits gratuits** pour commencer à explorer.\n\n## Tes premiers pas\n\n1. Découvre l''**Academy** et ses parcours certifiants\n2. Lance ton premier **Workshop** collaboratif\n3. Génère un **Toolkit** stratégique avec l''IA\n\n[Découvrir la plateforme]({{appUrl}})\n\nÀ très vite,\nL''équipe GROWTHINNOV',
   '["firstName","appUrl"]'::jsonb),
  ('account_suspended', NULL, 'Compte suspendu', 'Notification de suspension de compte',
   'Ton compte GROWTHINNOV a été suspendu',
   E'# Compte suspendu\n\nBonjour {{firstName}},\n\nNous t''informons que ton compte GROWTHINNOV a été **suspendu**.\n\n**Motif :** {{reason}}\n\n## Que faire ?\n\nSi tu penses qu''il s''agit d''une erreur ou souhaites contester cette décision, contacte notre équipe support.\n\n[Contacter le support](mailto:support@growthinnov.com)\n\nCordialement,\nL''équipe GROWTHINNOV',
   '["firstName","reason"]'::jsonb),
  ('login_reminder', NULL, 'Relance connexion', 'Email de relance après inactivité',
   'On t''a manqué, {{firstName}} ! Voici ce qui se passe sur GROWTHINNOV',
   E'# Ça fait {{daysSinceLogin}} jours, {{firstName}} 👀\n\nOn ne t''a pas vu depuis un moment et il s''est passé pas mal de choses sur la plateforme.\n\n## ✨ Les nouveautés à découvrir\n\n- 🎓 Nouveaux parcours Academy disponibles\n- 🚀 L''IA Marketing pour générer tes contenus\n- 📊 Tableaux de bord enrichis\n\n[Reviens explorer]({{appUrl}})\n\nL''équipe GROWTHINNOV',
   '["firstName","daysSinceLogin","appUrl"]'::jsonb),
  ('invitation', NULL, 'Invitation organisation', 'Invitation à rejoindre une organisation',
   '{{inviterName}} t''invite à rejoindre {{orgName}} sur GROWTHINNOV',
   E'# Tu es invité(e) à rejoindre {{orgName}} 🎉\n\nBonjour,\n\n**{{inviterName}}** t''invite à rejoindre l''organisation **{{orgName}}** sur GROWTHINNOV en tant que **{{role}}**.\n\n## Pour accepter\n\nClique simplement sur le bouton ci-dessous (lien valable {{expiresIn}}) :\n\n[Accepter l''invitation]({{invitationUrl}})\n\nSi tu n''attendais pas cette invitation, ignore simplement ce message.\n\nÀ bientôt,\nL''équipe GROWTHINNOV',
   '["inviterName","orgName","role","invitationUrl","expiresIn"]'::jsonb)
ON CONFLICT (code, organization_id) DO NOTHING;

-- 12. Seed automations
INSERT INTO public.email_automations (code, organization_id, name, description, trigger_event, template_code, delay_minutes) VALUES
  ('welcome_on_signup', NULL, 'Bienvenue à l''inscription', 'Envoi du mail de bienvenue à la création du compte', 'user.created', 'welcome', 0),
  ('suspended_on_status_change', NULL, 'Notification suspension', 'Envoi lors de la suspension d''un compte', 'user.status.suspended', 'account_suspended', 0),
  ('reminder_inactivity', NULL, 'Relance inactivité', 'Relance des utilisateurs inactifs', 'user.inactive', 'login_reminder', 0),
  ('invitation_send', NULL, 'Envoi invitation', 'Email d''invitation à rejoindre une organisation', 'org.invitation.sent', 'invitation', 0)
ON CONFLICT (code, organization_id) DO NOTHING;

-- 13. Permission domain + définitions
INSERT INTO public.permission_domains (key, label, icon, sort_order) VALUES
  ('email', 'Emails', 'Mail', 80)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.permission_definitions (key, label, description, domain_key, sort_order) VALUES
  ('email.compose', 'Composer des emails (IA)', 'Accès à l''assistant IA pour composer et configurer les emails', 'email', 10),
  ('email.templates.manage', 'Gérer les modèles email', 'Créer, modifier et supprimer les modèles d''email', 'email', 20),
  ('email.automations.manage', 'Gérer les automations email', 'Créer, modifier et supprimer les automations', 'email', 30),
  ('email.providers.manage', 'Gérer les fournisseurs email', 'Configurer les fournisseurs et identifiants', 'email', 40),
  ('email.logs.view', 'Voir les journaux email', 'Accès aux logs et statistiques d''envoi', 'email', 50)
ON CONFLICT (key) DO NOTHING;

-- 14. Octroi par défaut
INSERT INTO public.role_permissions (role, permission_key)
SELECT r.role::app_role, p.key
FROM (VALUES ('super_admin'),('customer_lead'),('innovation_lead')) r(role)
CROSS JOIN (VALUES ('email.compose'),('email.templates.manage'),('email.automations.manage'),('email.providers.manage'),('email.logs.view')) p(key)
ON CONFLICT (role, permission_key) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key)
SELECT 'owner'::app_role, key FROM (VALUES ('email.compose'),('email.templates.manage'),('email.automations.manage'),('email.logs.view')) p(key)
ON CONFLICT (role, permission_key) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key)
SELECT 'admin'::app_role, key FROM (VALUES ('email.compose'),('email.templates.manage'),('email.automations.manage'),('email.logs.view')) p(key)
ON CONFLICT (role, permission_key) DO NOTHING;

-- 15. Bucket brand-assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "brand_assets_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'brand-assets');
CREATE POLICY "brand_assets_saas_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-assets' AND public.is_saas_team(auth.uid()));
CREATE POLICY "brand_assets_saas_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-assets' AND public.is_saas_team(auth.uid()));
CREATE POLICY "brand_assets_saas_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'brand-assets' AND public.is_saas_team(auth.uid()));
