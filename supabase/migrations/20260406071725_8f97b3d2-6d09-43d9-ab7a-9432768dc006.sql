
-- ══════════════════════════════════════════════════════════
-- UCM MODULE — TABLES + RLS + PERMISSIONS + SEED DATA
-- ══════════════════════════════════════════════════════════

-- 1. UCM_SECTORS
CREATE TABLE public.ucm_sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  icon text DEFAULT '🏢',
  group_name text,
  functions jsonb NOT NULL DEFAULT '{}'::jsonb,
  knowledge text,
  is_custom boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ucm_sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ucm_sectors_read" ON public.ucm_sectors FOR SELECT USING (
  organization_id IS NULL OR public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);
CREATE POLICY "ucm_sectors_write" ON public.ucm_sectors FOR INSERT WITH CHECK (
  public.is_saas_team(auth.uid()) OR (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id))
);
CREATE POLICY "ucm_sectors_update" ON public.ucm_sectors FOR UPDATE USING (
  public.is_saas_team(auth.uid()) OR (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id))
);
CREATE POLICY "ucm_sectors_delete" ON public.ucm_sectors FOR DELETE USING (public.is_saas_team(auth.uid()));

-- 2. UCM_ANALYSIS_SECTIONS
CREATE TABLE public.ucm_analysis_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  code text NOT NULL, title text NOT NULL, icon text, sort_order int DEFAULT 0,
  brief_instruction text NOT NULL, detailed_instruction text NOT NULL,
  is_active boolean DEFAULT true, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ucm_analysis_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ucm_as_read" ON public.ucm_analysis_sections FOR SELECT USING (
  organization_id IS NULL OR public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);
CREATE POLICY "ucm_as_write" ON public.ucm_analysis_sections FOR INSERT WITH CHECK (public.is_saas_team(auth.uid()));
CREATE POLICY "ucm_as_upd" ON public.ucm_analysis_sections FOR UPDATE USING (public.is_saas_team(auth.uid()));
CREATE POLICY "ucm_as_del" ON public.ucm_analysis_sections FOR DELETE USING (public.is_saas_team(auth.uid()));

-- 3. UCM_GLOBAL_ANALYSIS_SECTIONS
CREATE TABLE public.ucm_global_analysis_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  code text NOT NULL, title text NOT NULL, icon text, sort_order int DEFAULT 0,
  instruction text NOT NULL, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ucm_global_analysis_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ucm_gas_read" ON public.ucm_global_analysis_sections FOR SELECT USING (
  organization_id IS NULL OR public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);
CREATE POLICY "ucm_gas_write" ON public.ucm_global_analysis_sections FOR INSERT WITH CHECK (public.is_saas_team(auth.uid()));
CREATE POLICY "ucm_gas_upd" ON public.ucm_global_analysis_sections FOR UPDATE USING (public.is_saas_team(auth.uid()));
CREATE POLICY "ucm_gas_del" ON public.ucm_global_analysis_sections FOR DELETE USING (public.is_saas_team(auth.uid()));

-- 4. UCM_PROJECTS
CREATE TABLE public.ucm_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid, company text NOT NULL DEFAULT '', context text DEFAULT '', immersion text DEFAULT '',
  sector_id uuid REFERENCES public.ucm_sectors(id), sector_label text,
  selected_functions text[] DEFAULT '{}', status text DEFAULT 'draft',
  tags text[] DEFAULT '{}', notes text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ucm_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ucm_proj_read" ON public.ucm_projects FOR SELECT USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);
CREATE POLICY "ucm_proj_ins" ON public.ucm_projects FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "ucm_proj_upd" ON public.ucm_projects FOR UPDATE USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);
CREATE POLICY "ucm_proj_del" ON public.ucm_projects FOR DELETE USING (
  created_by = auth.uid() OR public.is_saas_team(auth.uid())
);
CREATE TRIGGER ucm_projects_updated_at BEFORE UPDATE ON public.ucm_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. UCM_USE_CASES
CREATE TABLE public.ucm_use_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.ucm_projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL, description text, priority text, complexity text, impact_level text,
  horizon text, data_readiness text, ai_techniques text[] DEFAULT '{}',
  value_drivers text[] DEFAULT '{}', functions text[] DEFAULT '{}',
  is_selected boolean DEFAULT false, is_generated boolean DEFAULT true, sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ucm_use_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ucm_uc_read" ON public.ucm_use_cases FOR SELECT USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);
CREATE POLICY "ucm_uc_ins" ON public.ucm_use_cases FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "ucm_uc_upd" ON public.ucm_use_cases FOR UPDATE USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);
CREATE POLICY "ucm_uc_del" ON public.ucm_use_cases FOR DELETE USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);

-- 6. UCM_UC_CONTEXTS
CREATE TABLE public.ucm_uc_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id uuid NOT NULL REFERENCES public.ucm_use_cases(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  situation text, tools text, team text, volumes text, pain_points text, objectives text, constraints text,
  custom_fields jsonb DEFAULT '{}'::jsonb, updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ucm_uc_contexts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ucm_ctx_read" ON public.ucm_uc_contexts FOR SELECT USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);
CREATE POLICY "ucm_ctx_ins" ON public.ucm_uc_contexts FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "ucm_ctx_upd" ON public.ucm_uc_contexts FOR UPDATE USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);
CREATE POLICY "ucm_ctx_del" ON public.ucm_uc_contexts FOR DELETE USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);

-- 7. UCM_ANALYSES
CREATE TABLE public.ucm_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id uuid NOT NULL REFERENCES public.ucm_use_cases(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.ucm_projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  section_id text NOT NULL, mode text NOT NULL, content text,
  ai_provider text, ai_model text, tokens_used int DEFAULT 0,
  generation_time_ms int, prompt_hash text, version int DEFAULT 1,
  is_current boolean DEFAULT true, generated_by uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE(use_case_id, section_id, mode, version)
);
ALTER TABLE public.ucm_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ucm_ana_read" ON public.ucm_analyses FOR SELECT USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);
CREATE POLICY "ucm_ana_ins" ON public.ucm_analyses FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "ucm_ana_upd" ON public.ucm_analyses FOR UPDATE USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);
CREATE POLICY "ucm_ana_del" ON public.ucm_analyses FOR DELETE USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);

-- 8. UCM_GLOBAL_SECTIONS
CREATE TABLE public.ucm_global_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.ucm_projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  section_id text NOT NULL, content text, ai_provider text, ai_model text,
  tokens_used int DEFAULT 0, version int DEFAULT 1, is_current boolean DEFAULT true,
  generated_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, section_id, version)
);
ALTER TABLE public.ucm_global_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ucm_gs_read" ON public.ucm_global_sections FOR SELECT USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);
CREATE POLICY "ucm_gs_ins" ON public.ucm_global_sections FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "ucm_gs_upd" ON public.ucm_global_sections FOR UPDATE USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);
CREATE POLICY "ucm_gs_del" ON public.ucm_global_sections FOR DELETE USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);

-- 9. UCM_CHAT_MESSAGES
CREATE TABLE public.ucm_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.ucm_projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid, role text NOT NULL, content text NOT NULL, tokens_used int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ucm_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ucm_chat_read" ON public.ucm_chat_messages FOR SELECT USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);
CREATE POLICY "ucm_chat_ins" ON public.ucm_chat_messages FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));

-- 10. UCM_EXPORTS
CREATE TABLE public.ucm_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.ucm_projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid, format text NOT NULL DEFAULT 'docx', file_url text, file_size_bytes int,
  options jsonb DEFAULT '{}'::jsonb, status text DEFAULT 'pending', error_message text,
  created_at timestamptz DEFAULT now(), expires_at timestamptz
);
ALTER TABLE public.ucm_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ucm_exp_read" ON public.ucm_exports FOR SELECT USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);
CREATE POLICY "ucm_exp_ins" ON public.ucm_exports FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "ucm_exp_upd" ON public.ucm_exports FOR UPDATE USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);
CREATE POLICY "ucm_exp_del" ON public.ucm_exports FOR DELETE USING (public.is_saas_team(auth.uid()));

-- 11. UCM_QUOTA_USAGE
CREATE TABLE public.ucm_quota_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period text NOT NULL, uc_generations int DEFAULT 0, analysis_generations int DEFAULT 0,
  global_generations int DEFAULT 0, chat_messages int DEFAULT 0, exports int DEFAULT 0,
  total_tokens int DEFAULT 0, total_cost_cents int DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, period)
);
ALTER TABLE public.ucm_quota_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ucm_quota_read" ON public.ucm_quota_usage FOR SELECT USING (
  public.is_org_member(auth.uid(), organization_id) OR public.is_saas_team(auth.uid())
);
CREATE POLICY "ucm_quota_write" ON public.ucm_quota_usage FOR INSERT WITH CHECK (public.is_saas_team(auth.uid()));
CREATE POLICY "ucm_quota_upd" ON public.ucm_quota_usage FOR UPDATE USING (public.is_saas_team(auth.uid()));

-- HELPER: increment quota atomically
CREATE OR REPLACE FUNCTION public.ucm_increment_quota(_org_id uuid, _field text, _tokens int DEFAULT 0)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _period text := to_char(now(), 'YYYY-MM');
BEGIN
  INSERT INTO ucm_quota_usage (organization_id, period) VALUES (_org_id, _period) ON CONFLICT (organization_id, period) DO NOTHING;
  EXECUTE format('UPDATE ucm_quota_usage SET %I = %I + 1, total_tokens = total_tokens + $1, updated_at = now() WHERE organization_id = $2 AND period = $3', _field, _field) USING _tokens, _org_id, _period;
END;
$$;

-- INDEXES
CREATE INDEX idx_ucm_projects_org ON public.ucm_projects(organization_id);
CREATE INDEX idx_ucm_uc_project ON public.ucm_use_cases(project_id);
CREATE INDEX idx_ucm_uc_org ON public.ucm_use_cases(organization_id);
CREATE INDEX idx_ucm_analyses_uc ON public.ucm_analyses(use_case_id);
CREATE INDEX idx_ucm_analyses_project ON public.ucm_analyses(project_id);
CREATE INDEX idx_ucm_gs_project ON public.ucm_global_sections(project_id);
CREATE INDEX idx_ucm_chat_project ON public.ucm_chat_messages(project_id);
CREATE INDEX idx_ucm_sectors_org ON public.ucm_sectors(organization_id);

-- PERMISSIONS DOMAIN
INSERT INTO public.permission_domains (key, label, icon, sort_order) VALUES ('ucm', 'Use Case Management', 'Lightbulb', 100);

INSERT INTO public.permission_definitions (key, label, description, domain_key, sort_order) VALUES
  ('ucm.projects.create', 'Créer des projets UCM', 'Permet de créer de nouveaux projets d''analyse IA', 'ucm', 1),
  ('ucm.projects.read_all', 'Voir tous les projets UCM', 'Accès à tous les projets de l''organisation', 'ucm', 2),
  ('ucm.uc.generate', 'Générer des use cases', 'Lancer la génération IA de use cases', 'ucm', 3),
  ('ucm.uc.analyze', 'Analyser (fiche décision)', 'Générer des analyses en mode brief', 'ucm', 4),
  ('ucm.uc.analyze_detailed', 'Analyser (complet)', 'Générer des analyses détaillées complètes', 'ucm', 5),
  ('ucm.global.generate', 'Synthèse globale', 'Générer les sections de synthèse globale', 'ucm', 6),
  ('ucm.chat.use', 'Chat consultant IA', 'Utiliser le chat consultant IA contextuel', 'ucm', 7),
  ('ucm.export.docx', 'Exporter DOCX', 'Générer et télécharger des exports Word', 'ucm', 8),
  ('ucm.sectors.manage', 'Gérer les secteurs', 'Créer et modifier des secteurs personnalisés', 'ucm', 9),
  ('ucm.config.manage', 'Configuration UCM', 'Gérer les paramètres IA et prompts UCM', 'ucm', 10);

-- ROLE PERMISSIONS
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('super_admin'::app_role, 'ucm.projects.create'), ('super_admin'::app_role, 'ucm.projects.read_all'),
  ('super_admin'::app_role, 'ucm.uc.generate'), ('super_admin'::app_role, 'ucm.uc.analyze'),
  ('super_admin'::app_role, 'ucm.uc.analyze_detailed'), ('super_admin'::app_role, 'ucm.global.generate'),
  ('super_admin'::app_role, 'ucm.chat.use'), ('super_admin'::app_role, 'ucm.export.docx'),
  ('super_admin'::app_role, 'ucm.sectors.manage'), ('super_admin'::app_role, 'ucm.config.manage'),
  ('owner'::app_role, 'ucm.projects.create'), ('owner'::app_role, 'ucm.projects.read_all'),
  ('owner'::app_role, 'ucm.uc.generate'), ('owner'::app_role, 'ucm.uc.analyze'),
  ('owner'::app_role, 'ucm.uc.analyze_detailed'), ('owner'::app_role, 'ucm.global.generate'),
  ('owner'::app_role, 'ucm.chat.use'), ('owner'::app_role, 'ucm.export.docx'),
  ('owner'::app_role, 'ucm.sectors.manage'),
  ('admin'::app_role, 'ucm.projects.create'), ('admin'::app_role, 'ucm.projects.read_all'),
  ('admin'::app_role, 'ucm.uc.generate'), ('admin'::app_role, 'ucm.uc.analyze'),
  ('admin'::app_role, 'ucm.uc.analyze_detailed'), ('admin'::app_role, 'ucm.global.generate'),
  ('admin'::app_role, 'ucm.chat.use'), ('admin'::app_role, 'ucm.export.docx'),
  ('manager'::app_role, 'ucm.projects.create'), ('manager'::app_role, 'ucm.projects.read_all'),
  ('manager'::app_role, 'ucm.uc.generate'), ('manager'::app_role, 'ucm.uc.analyze'),
  ('manager'::app_role, 'ucm.uc.analyze_detailed'), ('manager'::app_role, 'ucm.global.generate'),
  ('manager'::app_role, 'ucm.chat.use'), ('manager'::app_role, 'ucm.export.docx'),
  ('lead'::app_role, 'ucm.projects.create'), ('lead'::app_role, 'ucm.uc.generate'),
  ('lead'::app_role, 'ucm.uc.analyze'), ('lead'::app_role, 'ucm.chat.use'),
  ('member'::app_role, 'ucm.projects.create'), ('member'::app_role, 'ucm.uc.generate'),
  ('member'::app_role, 'ucm.uc.analyze');

-- SEED: 35 SECTORS
INSERT INTO public.ucm_sectors (organization_id, code, label, icon, group_name, functions, knowledge, is_custom, sort_order) VALUES
(NULL, 'banque_detail', 'Banque de détail', '🏦', 'Finance', '{"core_business":["Gestion des comptes","Crédit & financement","Épargne & investissement","Paiements & transactions"],"dedicated":["Conformité bancaire","Gestion des risques","KYC/AML"],"core_support":["Relation client","Service après-vente","Réclamations"],"global_support":["RH","Finance & comptabilité","IT & systèmes","Juridique"],"other":["Innovation digitale","Open Banking"]}'::jsonb, 'Secteur hautement régulé (Bâle III/IV, DSP2, RGPD). Enjeux : digitalisation des parcours client, lutte contre la fraude, open banking, inclusion financière.', false, 1),
(NULL, 'banque_investissement', 'Banque d''investissement', '📈', 'Finance', '{"core_business":["Trading & marchés","Fusions & acquisitions","Structuration financière","Research"],"dedicated":["Risk management","Compliance MiFID","Middle office"],"core_support":["Client institutionnel","Operations","Clearing & settlement"],"global_support":["RH","Finance","IT","Juridique"],"other":["Quant research","ESG investing"]}'::jsonb, 'Régulations MiFID II, Dodd-Frank. Enjeux : trading algorithmique, gestion des risques en temps réel, ESG, tokenisation.', false, 2),
(NULL, 'assurance', 'Assurance', '🛡️', 'Finance', '{"core_business":["Souscription","Tarification","Gestion des sinistres","Réassurance"],"dedicated":["Actuariat","Conformité Solvabilité II","Prévention"],"core_support":["Distribution","Service client","Gestion des contrats"],"global_support":["RH","Finance","IT","Juridique"],"other":["Insurtech","Assurance paramétrique"]}'::jsonb, 'Régulations Solvabilité II, DDA. Enjeux : personnalisation des offres, détection de fraude, sinistres automatisés.', false, 3),
(NULL, 'gestion_actifs', 'Gestion d''actifs', '💎', 'Finance', '{"core_business":["Gestion de portefeuille","Allocation d''actifs","Performance & reporting","Due diligence"],"dedicated":["Compliance","Risk & attribution","ESG scoring"],"core_support":["Relations investisseurs","Back office","Valorisation"],"global_support":["RH","Finance","IT","Juridique"],"other":["Private equity","Crypto assets"]}'::jsonb, 'Régulations AIFMD, UCITS. Enjeux : gestion passive vs active, ESG, alternative data.', false, 4),
(NULL, 'fintech', 'Fintech & Néobanque', '🚀', 'Finance', '{"core_business":["Paiements digitaux","Lending","Wealth management","Crypto & DeFi"],"dedicated":["RegTech","Scoring alternatif","Open banking API"],"core_support":["Onboarding digital","Support client","KYC automatisé"],"global_support":["Growth","Engineering","Data","Legal"],"other":["Embedded finance","BNPL"]}'::jsonb, 'Environnement agile, cloud-native. Enjeux : scalabilité, UX mobile-first, embedded finance.', false, 5),
(NULL, 'commerce_detail', 'Commerce de détail', '🛒', 'Commerce', '{"core_business":["Merchandising","Pricing","Supply chain","E-commerce"],"dedicated":["Category management","Promotions","Fidélité"],"core_support":["Service client","Logistique","Magasins"],"global_support":["RH","Finance","IT","Marketing"],"other":["Commerce unifié","Social commerce"]}'::jsonb, 'Enjeux : omnicanalité, personnalisation, optimisation des stocks, last-mile delivery.', false, 6),
(NULL, 'luxe', 'Luxe & Mode', '👜', 'Commerce', '{"core_business":["Design & création","Merchandising","Distribution sélective","E-commerce premium"],"dedicated":["Brand management","Clienteling","Made to order"],"core_support":["Service VIP","Logistique de précision","Visual merchandising"],"global_support":["RH","Finance","IT","Communication"],"other":["Metaverse","NFT & digital fashion"]}'::jsonb, 'Enjeux : expérience client ultra-premium, contrefaçon, durabilité.', false, 7),
(NULL, 'grande_distribution', 'Grande distribution', '🏪', 'Commerce', '{"core_business":["Achats & sourcing","Logistique & supply chain","Pricing & promotions","Magasins"],"dedicated":["MDD","Frais & ultra-frais","Drive & livraison"],"core_support":["Relation client","Fidélité","Qualité"],"global_support":["RH","Finance","IT","RSE"],"other":["Quick commerce","Agriculture urbaine"]}'::jsonb, 'Marges serrées, volumes massifs. Enjeux : prévision de la demande, réduction du gaspillage.', false, 8),
(NULL, 'ecommerce', 'E-commerce & Marketplace', '📦', 'Commerce', '{"core_business":["Catalogue & content","Pricing dynamique","Fulfillment","Marketplace management"],"dedicated":["SEO/SEM","Conversion optimization","Seller management"],"core_support":["Service client","Retours","Paiement"],"global_support":["Tech","Data","Finance","RH"],"other":["Live shopping","Recommandation IA"]}'::jsonb, 'Enjeux : personnalisation temps réel, logistique rapide, gestion des retours.', false, 9),
(NULL, 'agroalimentaire', 'Agroalimentaire', '🌾', 'Commerce', '{"core_business":["R&D produit","Production","Supply chain","Distribution"],"dedicated":["Qualité & sécurité alimentaire","Traçabilité","Innovation produit"],"core_support":["Marketing","Ventes","Logistique"],"global_support":["RH","Finance","IT","RSE"],"other":["Agriculture de précision","Protéines alternatives"]}'::jsonb, 'Régulations strictes (HACCP, FDA). Enjeux : traçabilité, durabilité, clean label.', false, 10),
(NULL, 'industrie_manufacturiere', 'Industrie manufacturière', '🏭', 'Industrie', '{"core_business":["Production","Maintenance","Qualité","Supply chain"],"dedicated":["Lean manufacturing","Automatisation","R&D industrielle"],"core_support":["Achats","Logistique","Service client"],"global_support":["RH","Finance","IT","HSE"],"other":["Industrie 4.0","Jumeau numérique"]}'::jsonb, 'Enjeux : productivité, maintenance prédictive, qualité zero-défaut, décarbonation.', false, 11),
(NULL, 'automobile', 'Automobile', '🚗', 'Industrie', '{"core_business":["Conception véhicule","Production","Qualité","Après-vente"],"dedicated":["ADAS & autonome","Électrification","Connected car"],"core_support":["Distribution","Service client","Pièces détachées"],"global_support":["RH","Finance","IT","RSE"],"other":["Mobilité as a Service","Vehicle-to-Grid"]}'::jsonb, 'Transition électrique massive. Enjeux : ADAS, battery management, software-defined vehicle.', false, 12),
(NULL, 'aeronautique', 'Aéronautique & Défense', '✈️', 'Industrie', '{"core_business":["Conception","Production","MRO","Programme management"],"dedicated":["Certification & navigabilité","Supply chain critique","Simulation"],"core_support":["Achats","Logistique","Support client"],"global_support":["RH","Finance","IT","Sûreté"],"other":["Urban Air Mobility","Space tech"]}'::jsonb, 'Régulations EASA/FAA, cycles longs. Enjeux : jumeaux numériques, MRO prédictif.', false, 13),
(NULL, 'energie', 'Énergie & Utilities', '⚡', 'Industrie', '{"core_business":["Production","Transport & distribution","Trading énergie","Maintenance réseau"],"dedicated":["Smart grid","Énergies renouvelables","Efficacité énergétique"],"core_support":["Relation client","Facturation","Interventions terrain"],"global_support":["RH","Finance","IT","HSE"],"other":["Hydrogène","Stockage énergie"]}'::jsonb, 'Transition énergétique. Enjeux : prédiction production EnR, smart grid, maintenance prédictive.', false, 14),
(NULL, 'construction_btp', 'Construction & BTP', '🏗️', 'Industrie', '{"core_business":["Études & conception","Chantier","Gestion de projet","Maintenance bâtiment"],"dedicated":["BIM","Sécurité chantier","Estimation & chiffrage"],"core_support":["Achats","Sous-traitance","Qualité"],"global_support":["RH","Finance","IT","Juridique"],"other":["Construction modulaire","Smart building"]}'::jsonb, 'Secteur fragmenté. Enjeux : productivité chantier, BIM, sécurité, décarbonation.', false, 15),
(NULL, 'conseil_strategie', 'Conseil en stratégie', '🎯', 'Services', '{"core_business":["Due diligence","Stratégie corporate","Transformation","M&A advisory"],"dedicated":["Benchmarking","Modélisation financière","Market sizing"],"core_support":["Staffing","Knowledge management","Proposals"],"global_support":["RH","Finance","IT","Marketing"],"other":["Digital advisory","ESG consulting"]}'::jsonb, 'Modèle pyramidal. Enjeux : productivité consultants, qualité livrables, knowledge management.', false, 16),
(NULL, 'conseil_management', 'Conseil en management', '📋', 'Services', '{"core_business":["Transformation organisationnelle","Change management","Performance opérationnelle","PMO"],"dedicated":["Diagnostic organisationnel","Coaching","Facilitation"],"core_support":["Staffing","Proposals","Delivery"],"global_support":["RH","Finance","IT","Communication"],"other":["Agile coaching","Culture transformation"]}'::jsonb, 'Accompagnement humain fort. Enjeux : scalabilité, mesure d''impact, remote consulting.', false, 17),
(NULL, 'esn_ssii', 'ESN / Société de services IT', '💻', 'Services', '{"core_business":["Développement logiciel","Infrastructure & cloud","Cybersécurité","Data & IA"],"dedicated":["Architecture SI","DevOps","Testing & QA"],"core_support":["Avant-vente","Staffing","Delivery management"],"global_support":["RH","Finance","IT interne","Juridique"],"other":["Low-code","Quantum computing"]}'::jsonb, 'Modèle régie/forfait. Enjeux : rétention talents, montée en compétences IA.', false, 18),
(NULL, 'sante', 'Santé & Pharma', '🏥', 'Services', '{"core_business":["R&D & essais cliniques","Production pharma","Distribution","Pharmacovigilance"],"dedicated":["Affaires réglementaires","Medical affairs","Market access"],"core_support":["Force de vente","Supply chain","Qualité"],"global_support":["RH","Finance","IT","Juridique"],"other":["Digital therapeutics","Médecine personnalisée"]}'::jsonb, 'Ultra-régulé (FDA, EMA, GxP). Enjeux : accélération R&D, real-world evidence.', false, 19),
(NULL, 'telecom', 'Télécommunications', '📡', 'Tech', '{"core_business":["Réseau & infrastructure","Offres & pricing","Service client","B2B solutions"],"dedicated":["Planification réseau","Fraude & revenue assurance","Churn management"],"core_support":["Facturation","Interventions terrain","Boutiques"],"global_support":["RH","Finance","IT","Juridique"],"other":["5G use cases","Edge computing"]}'::jsonb, 'Marché mature. Enjeux : 5G, réduction churn, automatisation réseau.', false, 20),
(NULL, 'media_entertainment', 'Média & Entertainment', '🎬', 'Tech', '{"core_business":["Contenu & production","Distribution","Monétisation","Audience"],"dedicated":["Content recommendation","Ad tech","Rights management"],"core_support":["Marketing","Service abonnés","Partenariats"],"global_support":["RH","Finance","IT","Juridique"],"other":["Streaming","Gaming","AI-generated content"]}'::jsonb, 'Disruption streaming. Enjeux : personnalisation, engagement, monétisation multi-canal.', false, 21),
(NULL, 'saas_tech', 'SaaS & Éditeur logiciel', '☁️', 'Tech', '{"core_business":["Produit & engineering","Platform & infra","Data & analytics","Sécurité"],"dedicated":["Product management","DevRel","Customer success"],"core_support":["Sales","Marketing","Support"],"global_support":["RH","Finance","IT","Legal"],"other":["AI/ML platform","API economy"]}'::jsonb, 'Modèle récurrent (ARR, NRR). Enjeux : product-led growth, rétention, AI-native.', false, 22),
(NULL, 'cybersecurite', 'Cybersécurité', '🔒', 'Tech', '{"core_business":["SOC & détection","Réponse à incident","GRC","Pentest & audit"],"dedicated":["Threat intelligence","Identity & access","Cloud security"],"core_support":["Conseil & accompagnement","Formation","Support"],"global_support":["RH","Finance","R&D","Legal"],"other":["Zero Trust","OT security"]}'::jsonb, 'Marché en forte croissance. Enjeux : pénurie talents, automatisation SOC, NIS2/DORA.', false, 23),
(NULL, 'transport_logistique', 'Transport & Logistique', '🚛', 'Industrie', '{"core_business":["Transport","Entreposage","Last mile","Freight forwarding"],"dedicated":["Optimisation de tournées","Traçabilité","Gestion de flotte"],"core_support":["Service client","Douanes","Facturation"],"global_support":["RH","Finance","IT","HSE"],"other":["Logistique verte","Drones & robots"]}'::jsonb, 'Marges faibles. Enjeux : optimisation tournées, traçabilité, décarbonation.', false, 24),
(NULL, 'immobilier', 'Immobilier & PropTech', '🏠', 'Services', '{"core_business":["Promotion","Gestion locative","Transaction","Asset management"],"dedicated":["Estimation & pricing","Smart building","Sustainability"],"core_support":["Relation client","Juridique immo","Marketing"],"global_support":["RH","Finance","IT","Conformité"],"other":["Coliving","Tokenisation immobilière"]}'::jsonb, 'Cycles longs. Enjeux : RE2020, smart building, data-driven asset management.', false, 25),
(NULL, 'education', 'Éducation & EdTech', '🎓', 'Services', '{"core_business":["Conception pédagogique","Delivery formation","Évaluation","Certification"],"dedicated":["Adaptive learning","LMS/LXP","Gamification"],"core_support":["Inscription","Accompagnement","Alumni"],"global_support":["RH","Finance","IT","Communication"],"other":["Micro-credentials","AI tutoring"]}'::jsonb, 'Disruption digitale. Enjeux : personnalisation parcours, engagement apprenant.', false, 26),
(NULL, 'hotellerie_tourisme', 'Hôtellerie & Tourisme', '🏨', 'Commerce', '{"core_business":["Revenue management","Opérations hôtelières","Distribution","F&B"],"dedicated":["Yield management","Guest experience","Loyalty"],"core_support":["Réservation","Service client","Maintenance"],"global_support":["RH","Finance","IT","Marketing"],"other":["Bleisure","Sustainable tourism"]}'::jsonb, 'Secteur saisonnier. Enjeux : yield management, personnalisation, automatisation.', false, 27),
(NULL, 'administration_publique', 'Administration publique', '🏛️', 'Public', '{"core_business":["Service aux usagers","Politiques publiques","Gestion budgétaire","Marchés publics"],"dedicated":["Dématérialisation","Open data","Identité numérique"],"core_support":["RH publique","Communication","IT publique"],"global_support":["Budget","Audit","Juridique","Conformité"],"other":["GovTech","Smart city"]}'::jsonb, 'Contraintes : marchés publics, RGPD renforcé, souveraineté. Enjeux : dématérialisation.', false, 28),
(NULL, 'collectivites', 'Collectivités territoriales', '🏘️', 'Public', '{"core_business":["Urbanisme","Social","Transport","Éducation locale"],"dedicated":["Smart city","Participation citoyenne","Gestion des déchets"],"core_support":["État civil","Accueil","Communication"],"global_support":["RH","Budget","IT","Juridique"],"other":["Transition écologique","Tiers-lieux"]}'::jsonb, 'Proximité citoyen. Enjeux : smart city, participation citoyenne.', false, 29),
(NULL, 'sante_publique', 'Santé publique & Hôpital', '🏥', 'Public', '{"core_business":["Parcours patient","Bloc opératoire","Urgences","Imagerie"],"dedicated":["Télémédecine","Pharmacie hospitalière","Recherche clinique"],"core_support":["Admissions","Facturation","Logistique hospitalière"],"global_support":["RH médicale","Finance","IT hospitalière","Qualité"],"other":["IA diagnostique","Jumeaux numériques patient"]}'::jsonb, 'Ultra-contraint (HAS, CNIL). Enjeux : parcours patient, planification bloc.', false, 30),
(NULL, 'rh_recrutement', 'RH & Recrutement', '👥', 'Services', '{"core_business":["Recrutement","GPEC","Formation","Paie & admin"],"dedicated":["Talent management","People analytics","QVCT"],"core_support":["Communication RH","Juridique social","SIRH"],"global_support":["Finance","IT","Direction générale","RSE"],"other":["HR Tech","Freelance management"]}'::jsonb, 'Pénurie de talents. Enjeux : recrutement IA, engagement, skill-based org.', false, 31),
(NULL, 'juridique', 'Juridique & LegalTech', '⚖️', 'Services', '{"core_business":["Conseil juridique","Contentieux","Contrats","M&A juridique"],"dedicated":["Legal ops","Compliance","IP & data privacy"],"core_support":["Knowledge management","Secrétariat juridique","Facturation"],"global_support":["RH","Finance","IT","Communication"],"other":["Smart contracts","Justice prédictive"]}'::jsonb, 'Profession en mutation. Enjeux : automatisation contrats, due diligence IA.', false, 32),
(NULL, 'agriculture', 'Agriculture & AgriTech', '🌱', 'Industrie', '{"core_business":["Culture & élevage","Transformation","Distribution","Négoce"],"dedicated":["Agriculture de précision","Traçabilité","Météo & prédiction"],"core_support":["Vente","Logistique","Qualité"],"global_support":["RH","Finance","IT","Environnement"],"other":["AgriTech","Vertical farming"]}'::jsonb, 'Transition agro-écologique. Enjeux : agriculture de précision, réduction intrants.', false, 33),
(NULL, 'sport_wellness', 'Sport & Wellness', '⚽', 'Services', '{"core_business":["Événementiel sportif","Club management","Coaching","E-sport"],"dedicated":["Performance analytics","Fan engagement","Sponsoring"],"core_support":["Billetterie","Merchandising","Communication"],"global_support":["RH","Finance","IT","Juridique"],"other":["Wearables","Sport data"]}'::jsonb, 'Data-driven sport. Enjeux : performance analytics, fan engagement.', false, 34),
(NULL, 'ong_association', 'ONG & Associations', '🤝', 'Public', '{"core_business":["Collecte de fonds","Programmes terrain","Plaidoyer","Recherche"],"dedicated":["Gestion des bénévoles","Impact measurement","Communication solidaire"],"core_support":["Administration","Logistique","Reporting bailleurs"],"global_support":["RH","Finance","IT","Juridique"],"other":["Civic tech","Philanthropie digitale"]}'::jsonb, 'Budget contraint, mission sociale. Enjeux : optimisation collecte, mesure d''impact.', false, 35);

-- SEED: 6 ANALYSIS SECTIONS
INSERT INTO public.ucm_analysis_sections (organization_id, code, title, icon, sort_order, brief_instruction, detailed_instruction) VALUES
(NULL, 'process', 'Processus & Organisation', '⚙️', 1, 'Analyse le processus métier actuel et propose une transformation IA. Structure : état actuel (pain points, volumes, coûts), processus cible avec IA (flux optimisé, automatisations, rôles redéfinis), quick wins vs transformations profondes, KPIs de succès. Format fiche décision : concis, actionable, 2-3 pages max.', 'Réalise une analyse exhaustive du processus métier. Cartographie détaillée du processus actuel (BPMN simplifié, acteurs, systèmes, données, points de friction, temps de cycle). Modélise le processus cible avec IA. Plan de déploiement progressif. Métriques détaillées avant/après. Format : 8-12 pages, profondeur cabinet tier 1.'),
(NULL, 'data', 'Données & IA', '📊', 2, 'Évalue les données nécessaires et l''architecture IA. Sources de données requises, qualité et disponibilité, techniques IA recommandées, architecture simplifiée, risques data. Format fiche décision concise.', 'Analyse complète de la stratégie data et IA. Inventaire détaillé des sources, évaluation qualité, architecture technique détaillée, stack recommandé, plan de gouvernance data (RGPD, éthique IA, explicabilité). Format : 8-12 pages.'),
(NULL, 'tech', 'Architecture technique', '🏗️', 3, 'Architecture technique cible : composants clés, infrastructure, intégrations SI, stack technologique, estimation budgétaire. Format fiche décision.', 'Architecture technique complète niveau design. Diagramme, choix technologiques justifiés, intégrations SI, stratégie de déploiement, sécurité, scalabilité, estimation budgétaire détaillée. Format : 8-12 pages.'),
(NULL, 'impact', 'Impact & ROI', '💰', 4, 'Quantifie l''impact business : gains attendus, investissement requis, timeline de ROI, impacts qualitatifs, comparaison statu quo. Format fiche décision avec chiffres clés.', 'Business case complet niveau comité d''investissement. Modélisation financière multi-scénarios, NPV, IRR, payback, impacts non financiers quantifiés, analyse de sensibilité. Format : 8-12 pages, prêt pour board.'),
(NULL, 'roadmap', 'Roadmap & Déploiement', '🗺️', 5, 'Roadmap : phases POC → Pilote → Scale, jalons, ressources, dépendances, facteurs clés de succès. Format fiche décision.', 'Roadmap détaillée niveau programme. Plan de déploiement en phases avec objectifs, livrables, KPIs, ressources, budget, durée, risques. Gouvernance projet, plan de ressourcing, stratégie de scaling. Format : 8-12 pages.'),
(NULL, 'risks', 'Risques & Change Management', '⚠️', 6, 'Risques principaux (technique, organisationnel, éthique, réglementaire) avec mitigation, plan de change et communication, compétences à développer. Format fiche décision.', 'Analyse de risques exhaustive et stratégie de change management. Matrice de risques détaillée, plan de mitigation, analyse parties prenantes, plan de communication et formation, gestion des résistances, KPIs d''adoption. Format : 8-12 pages.');

-- SEED: 7 GLOBAL SECTIONS
INSERT INTO public.ucm_global_analysis_sections (organization_id, code, title, icon, sort_order, instruction) VALUES
(NULL, 'g_exec', 'Executive Summary', '📋', 1, 'Executive summary pour le comité de direction. Vision IA, périmètre, use cases prioritaires, ROI global, recommandations, prochaines étapes. 2-3 pages max.'),
(NULL, 'g_synergies', 'Synergies & Interdépendances', '🔗', 2, 'Analyse synergies entre use cases. Données partagées, composants mutualisables, compétences transverses, séquencement optimal.'),
(NULL, 'g_roadmap', 'Roadmap Programme', '📅', 3, 'Roadmap globale du programme IA. Phases macro 6-12-18-24 mois, jalons, ressources, budget, gouvernance, quick wins.'),
(NULL, 'g_archi', 'Architecture Cible', '🏛️', 4, 'Architecture IA cible globale. Plateforme data & IA commune, composants partagés, intégrations SI, infrastructure, gouvernance data.'),
(NULL, 'g_business', 'Business Case Global', '💼', 5, 'Business case consolidé. Investissement total, gains cumulés, ROI programme, analyse de sensibilité, scénarios de déploiement.'),
(NULL, 'g_change', 'Transformation & Change', '🔄', 6, 'Stratégie de transformation globale. Impact organisationnel, compétences, formation, culture data/IA, indicateurs de maturité.'),
(NULL, 'g_next', 'Recommandations & Next Steps', '🎯', 7, 'Recommandations finales. Top 3 actions immédiates, décisions COMEX, gouvernance, partenaires, évolution 3-5 ans.');

-- Add ucm_quotas to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS ucm_quotas jsonb DEFAULT '{"max_projects":5,"max_uc_per_project":10,"max_analyses_per_month":50,"max_exports_per_month":10}'::jsonb;
