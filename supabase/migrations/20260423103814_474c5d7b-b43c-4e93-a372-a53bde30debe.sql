
-- ============================================================================
-- PHASE 1 — TRAÇABILITÉ AUTOMATIQUE VIA TRIGGERS
-- ============================================================================

-- Fonction générique de log d'activité
CREATE OR REPLACE FUNCTION public.log_activity(
  _action text,
  _entity_type text,
  _entity_id text,
  _organization_id uuid DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor_id uuid;
BEGIN
  _actor_id := auth.uid();
  -- Si pas d'acteur connecté (trigger système), on log quand même avec un UUID nul-like
  IF _actor_id IS NULL THEN
    _actor_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, organization_id, metadata, created_at)
  VALUES (_actor_id, _action, _entity_type, _entity_id, _organization_id, _metadata, now());
EXCEPTION WHEN OTHERS THEN
  -- Ne jamais bloquer une opération métier à cause d'un échec de log
  NULL;
END;
$$;

-- Index pour lecture rapide
CREATE INDEX IF NOT EXISTS idx_activity_logs_org_created ON public.activity_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);

-- ----- Trigger: organizations -----
CREATE OR REPLACE FUNCTION public.trg_log_organizations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_activity('org.created', 'organization', NEW.id::text, NEW.id, jsonb_build_object('name', NEW.name));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_activity('org.updated', 'organization', NEW.id::text, NEW.id,
      jsonb_build_object('changed', (SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(to_jsonb(NEW))
        WHERE to_jsonb(NEW) -> key IS DISTINCT FROM to_jsonb(OLD) -> key
          AND key NOT IN ('updated_at'))));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_activity('org.deleted', 'organization', OLD.id::text, OLD.id, jsonb_build_object('name', OLD.name));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS log_organizations_trg ON public.organizations;
CREATE TRIGGER log_organizations_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_organizations();

-- ----- Trigger: organization_members -----
CREATE OR REPLACE FUNCTION public.trg_log_org_members()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_activity('org.member.added', 'organization_member', NEW.id::text, NEW.organization_id,
      jsonb_build_object('member_user_id', NEW.user_id, 'role', NEW.role));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      PERFORM public.log_activity('org.member.role_changed', 'organization_member', NEW.id::text, NEW.organization_id,
        jsonb_build_object('member_user_id', NEW.user_id, 'old_role', OLD.role, 'new_role', NEW.role));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_activity('org.member.removed', 'organization_member', OLD.id::text, OLD.organization_id,
      jsonb_build_object('member_user_id', OLD.user_id, 'role', OLD.role));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS log_org_members_trg ON public.organization_members;
CREATE TRIGGER log_org_members_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_org_members();

-- ----- Trigger: user_roles -----
CREATE OR REPLACE FUNCTION public.trg_log_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_activity('user.role.granted', 'user_role', NEW.id::text, NULL,
      jsonb_build_object('target_user_id', NEW.user_id, 'role', NEW.role));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_activity('user.role.revoked', 'user_role', OLD.id::text, NULL,
      jsonb_build_object('target_user_id', OLD.user_id, 'role', OLD.role));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS log_user_roles_trg ON public.user_roles;
CREATE TRIGGER log_user_roles_trg
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_user_roles();

-- ----- Trigger: teams -----
CREATE OR REPLACE FUNCTION public.trg_log_teams()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_activity('team.created', 'team', NEW.id::text, NEW.organization_id,
      jsonb_build_object('name', NEW.name));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_activity('team.updated', 'team', NEW.id::text, NEW.organization_id,
      jsonb_build_object('name', NEW.name));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_activity('team.deleted', 'team', OLD.id::text, OLD.organization_id,
      jsonb_build_object('name', OLD.name));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS log_teams_trg ON public.teams;
CREATE TRIGGER log_teams_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_teams();

-- ----- Trigger: team_members -----
CREATE OR REPLACE FUNCTION public.trg_log_team_members()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _org uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT organization_id INTO _org FROM public.teams WHERE id = NEW.team_id;
    PERFORM public.log_activity('team.member.added', 'team_member', NEW.id::text, _org,
      jsonb_build_object('team_id', NEW.team_id, 'member_user_id', NEW.user_id));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT organization_id INTO _org FROM public.teams WHERE id = OLD.team_id;
    PERFORM public.log_activity('team.member.removed', 'team_member', OLD.id::text, _org,
      jsonb_build_object('team_id', OLD.team_id, 'member_user_id', OLD.user_id));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS log_team_members_trg ON public.team_members;
CREATE TRIGGER log_team_members_trg
  AFTER INSERT OR DELETE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_team_members();

-- ----- Trigger: credit_transactions -----
CREATE OR REPLACE FUNCTION public.trg_log_credit_transactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_activity('credits.' || NEW.type, 'credit_transaction', NEW.id::text, NULL,
      jsonb_build_object('target_user_id', NEW.user_id, 'amount', NEW.amount, 'description', NEW.description));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS log_credit_transactions_trg ON public.credit_transactions;
CREATE TRIGGER log_credit_transactions_trg
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_credit_transactions();

-- ----- Trigger: role_permissions -----
CREATE OR REPLACE FUNCTION public.trg_log_role_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_activity('permission.granted', 'role_permission', NEW.id::text, NULL,
      jsonb_build_object('role', NEW.role, 'permission_code', NEW.permission_code));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_activity('permission.revoked', 'role_permission', OLD.id::text, NULL,
      jsonb_build_object('role', OLD.role, 'permission_code', OLD.permission_code));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS log_role_permissions_trg ON public.role_permissions;
CREATE TRIGGER log_role_permissions_trg
  AFTER INSERT OR DELETE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_role_permissions();

-- ----- Trigger: profiles status -----
CREATE OR REPLACE FUNCTION public.trg_log_profile_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.log_activity('user.status.' || NEW.status, 'profile', NEW.user_id::text, NULL,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_profile_status_trg ON public.profiles;
CREATE TRIGGER log_profile_status_trg
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_profile_status();

-- ============================================================================
-- PHASE 2 — INVITATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_invitations_org ON public.organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON public.organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON public.organization_invitations(token);

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view their invitations"
  ON public.organization_invitations FOR SELECT
  USING (public.is_org_admin(auth.uid(), organization_id) OR public.is_saas_team(auth.uid()));

CREATE POLICY "Org admins can create invitations"
  ON public.organization_invitations FOR INSERT
  WITH CHECK ((public.is_org_admin(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())) AND invited_by = auth.uid());

CREATE POLICY "Org admins can update their invitations"
  ON public.organization_invitations FOR UPDATE
  USING (public.is_org_admin(auth.uid(), organization_id) OR public.is_saas_team(auth.uid()));

CREATE POLICY "Org admins can delete their invitations"
  ON public.organization_invitations FOR DELETE
  USING (public.is_org_admin(auth.uid(), organization_id) OR public.is_saas_team(auth.uid()));

-- Fonction publique pour récupérer une invitation via token (anonyme OK)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token uuid)
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  organization_name text,
  email text,
  role text,
  expires_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.organization_id, o.name, i.email, i.role, i.expires_at, i.accepted_at, i.revoked_at
  FROM public.organization_invitations i
  JOIN public.organizations o ON o.id = i.organization_id
  WHERE i.token = _token;
$$;

-- Fonction d'acceptation
CREATE OR REPLACE FUNCTION public.accept_invitation(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv record;
  _user_id uuid;
  _user_email text;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;

  SELECT * INTO _inv FROM public.organization_invitations WHERE token = _token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invitation_not_found');
  END IF;

  IF _inv.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_accepted');
  END IF;

  IF _inv.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invitation_revoked');
  END IF;

  IF _inv.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'invitation_expired');
  END IF;

  IF lower(_inv.email) <> lower(_user_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'email_mismatch', 'expected', _inv.email);
  END IF;

  -- Insert membership (idempotent)
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (_inv.organization_id, _user_id, _inv.role::public.org_role)
  ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.organization_invitations
  SET accepted_at = now(), accepted_by = _user_id
  WHERE id = _inv.id;

  RETURN jsonb_build_object('success', true, 'organization_id', _inv.organization_id);
END;
$$;

-- ============================================================================
-- PHASE 3 — SÉCURITÉ OWNER & SYNC EMAIL
-- ============================================================================

-- Empêcher de retirer/dégrader le dernier owner
CREATE OR REPLACE FUNCTION public.protect_last_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner_count int;
BEGIN
  IF TG_OP = 'DELETE' AND OLD.role = 'owner' THEN
    SELECT COUNT(*) INTO _owner_count FROM public.organization_members
      WHERE organization_id = OLD.organization_id AND role = 'owner' AND id <> OLD.id;
    IF _owner_count = 0 THEN
      RAISE EXCEPTION 'Impossible de retirer le dernier propriétaire de l''organisation' USING ERRCODE = 'P0001';
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role <> 'owner' THEN
    SELECT COUNT(*) INTO _owner_count FROM public.organization_members
      WHERE organization_id = OLD.organization_id AND role = 'owner' AND id <> OLD.id;
    IF _owner_count = 0 THEN
      RAISE EXCEPTION 'Impossible de dégrader le dernier propriétaire de l''organisation' USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS protect_last_owner_trg ON public.organization_members;
CREATE TRIGGER protect_last_owner_trg
  BEFORE UPDATE OR DELETE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.protect_last_owner();

-- Mise à jour de handle_new_user pour copier l'email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email)
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email WHERE profiles.email IS NULL;

  INSERT INTO public.user_credits (user_id, balance, lifetime_earned)
  VALUES (NEW.id, 10, 10)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 10, 'earned', 'Crédits de bienvenue');

  RETURN NEW;
END;
$$;

-- Backfill emails existants
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND (p.email IS NULL OR p.email = '');

-- ============================================================================
-- PHASE 7 — HARDENING: BUCKETS PRIVÉS POUR AVATARS
-- ============================================================================

-- avatars devient privé (un user lit/écrit ses propres fichiers, SaaS team voit tout)
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "SaaS team can manage avatars" ON storage.objects;

CREATE POLICY "Users can view own avatar"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_saas_team(auth.uid())));

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "SaaS team can manage avatars"
  ON storage.objects FOR ALL
  USING (bucket_id = 'avatars' AND public.is_saas_team(auth.uid()));
