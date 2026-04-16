-- ════════════════════════════════════════════════════════════════
-- Practice Studio v2 — Schema evolution
-- ════════════════════════════════════════════════════════════════

-- 1. Extend academy_practices with new configuration columns
ALTER TABLE public.academy_practices
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS coaching_mode text NOT NULL DEFAULT 'guided',
  ADD COLUMN IF NOT EXISTS objectives jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS success_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS evaluation_strategy text NOT NULL DEFAULT 'dimensions',
  ADD COLUMN IF NOT EXISTS evaluation_weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS restitution_template jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS attached_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS model_override text,
  ADD COLUMN IF NOT EXISTS temperature_override numeric,
  ADD COLUMN IF NOT EXISTS audience text,
  ADD COLUMN IF NOT EXISTS universe text,
  ADD COLUMN IF NOT EXISTS estimated_minutes integer DEFAULT 20,
  ADD COLUMN IF NOT EXISTS hints jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS guardrails jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill: existing standalone practices with no org become public
UPDATE public.academy_practices
SET is_public = true
WHERE organization_id IS NULL AND module_id IS NULL AND is_public = false;

-- 2. practice_organizations — multi-org targeting
CREATE TABLE IF NOT EXISTS public.practice_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES public.academy_practices(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid,
  UNIQUE(practice_id, organization_id)
);

ALTER TABLE public.practice_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas_manage_practice_orgs" ON public.practice_organizations
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

CREATE POLICY "org_members_view_practice_orgs" ON public.practice_organizations
  FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

-- Backfill from existing organization_id
INSERT INTO public.practice_organizations (practice_id, organization_id)
SELECT id, organization_id
FROM public.academy_practices
WHERE organization_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. practice_user_assignments — per-user targeting
CREATE TABLE IF NOT EXISTS public.practice_user_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES public.academy_practices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz,
  notes text,
  UNIQUE(practice_id, user_id)
);

ALTER TABLE public.practice_user_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas_manage_practice_assignments" ON public.practice_user_assignments
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

CREATE POLICY "users_view_own_assignments" ON public.practice_user_assignments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "org_admins_view_assignments" ON public.practice_user_assignments
  FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND is_org_admin(auth.uid(), organization_id));

-- 4. practice_versions — snapshots & rollback
CREATE TABLE IF NOT EXISTS public.practice_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES public.academy_practices(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  changed_by uuid,
  change_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(practice_id, version_number)
);

ALTER TABLE public.practice_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas_manage_practice_versions" ON public.practice_versions
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

-- 5. practice_blocks — reusable building blocks
CREATE TABLE IF NOT EXISTS public.practice_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('persona','rubric','guardrail','mechanic','prompt_snippet')),
  name text NOT NULL,
  description text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_global boolean NOT NULL DEFAULT false,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas_manage_practice_blocks" ON public.practice_blocks
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

CREATE POLICY "view_practice_blocks" ON public.practice_blocks
  FOR SELECT TO authenticated
  USING (is_global OR (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id)));

-- 6. practice_variants — A/B testing
CREATE TABLE IF NOT EXISTS public.practice_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES public.academy_practices(id) ON DELETE CASCADE,
  variant_label text NOT NULL,
  system_prompt text NOT NULL DEFAULT '',
  weight integer NOT NULL DEFAULT 50,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(practice_id, variant_label)
);

ALTER TABLE public.practice_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas_manage_practice_variants" ON public.practice_variants
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

CREATE POLICY "view_practice_variants" ON public.practice_variants
  FOR SELECT TO authenticated
  USING (true);

-- 7. Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_academy_practices_updated_at ON public.academy_practices;
CREATE TRIGGER update_academy_practices_updated_at
  BEFORE UPDATE ON public.academy_practices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_practice_blocks_updated_at ON public.practice_blocks;
CREATE TRIGGER update_practice_blocks_updated_at
  BEFORE UPDATE ON public.practice_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Extended visibility policy on academy_practices
DROP POLICY IF EXISTS "view_practices_extended" ON public.academy_practices;
CREATE POLICY "view_practices_extended" ON public.academy_practices
  FOR SELECT TO authenticated
  USING (
    is_public
    OR EXISTS (
      SELECT 1 FROM public.practice_organizations po
      WHERE po.practice_id = academy_practices.id
        AND is_org_member(auth.uid(), po.organization_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.practice_user_assignments pua
      WHERE pua.practice_id = academy_practices.id
        AND pua.user_id = auth.uid()
    )
  );

-- 9. Indexes
CREATE INDEX IF NOT EXISTS idx_practice_orgs_org ON public.practice_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_practice_orgs_practice ON public.practice_organizations(practice_id);
CREATE INDEX IF NOT EXISTS idx_practice_assignments_user ON public.practice_user_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_assignments_practice ON public.practice_user_assignments(practice_id);
CREATE INDEX IF NOT EXISTS idx_practice_versions_practice ON public.practice_versions(practice_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_practice_blocks_kind ON public.practice_blocks(kind);
CREATE INDEX IF NOT EXISTS idx_academy_practices_status ON public.academy_practices(status);
CREATE INDEX IF NOT EXISTS idx_academy_practices_universe ON public.academy_practices(universe);