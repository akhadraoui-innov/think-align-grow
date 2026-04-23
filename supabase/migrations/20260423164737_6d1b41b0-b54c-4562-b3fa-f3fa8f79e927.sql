
-- Email template translations (multi-locale FR/EN)
CREATE TABLE IF NOT EXISTS public.email_template_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  subject TEXT NOT NULL,
  markdown_body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, locale)
);

ALTER TABLE public.email_template_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas_team_full_access_translations"
  ON public.email_template_translations
  FOR ALL TO authenticated
  USING (public.is_saas_team(auth.uid()))
  WITH CHECK (public.is_saas_team(auth.uid()));

CREATE POLICY "org_admins_manage_their_template_translations"
  ON public.email_template_translations
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.email_templates t
    WHERE t.id = template_id
      AND t.organization_id IS NOT NULL
      AND public.is_org_admin(auth.uid(), t.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.email_templates t
    WHERE t.id = template_id
      AND t.organization_id IS NOT NULL
      AND public.is_org_admin(auth.uid(), t.organization_id)
  ));

CREATE INDEX IF NOT EXISTS idx_email_template_translations_template
  ON public.email_template_translations(template_id, locale);

CREATE TRIGGER trg_email_template_translations_updated_at
  BEFORE UPDATE ON public.email_template_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Suppressions
CREATE TABLE IF NOT EXISTS public.email_suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('bounce','complaint','unsubscribe','manual')),
  source_provider TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  suppressed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reactivated_at TIMESTAMPTZ,
  reactivated_by UUID,
  is_active BOOLEAN GENERATED ALWAYS AS (reactivated_at IS NULL) STORED,
  UNIQUE (email, organization_id, reason)
);

ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas_team_full_access_suppressions"
  ON public.email_suppressions FOR ALL TO authenticated
  USING (public.is_saas_team(auth.uid()))
  WITH CHECK (public.is_saas_team(auth.uid()));

CREATE POLICY "org_admins_view_suppressions"
  ON public.email_suppressions FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "org_admins_reactivate_suppressions"
  ON public.email_suppressions FOR UPDATE TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id));

CREATE INDEX IF NOT EXISTS idx_email_suppressions_email_org
  ON public.email_suppressions(email, organization_id) WHERE is_active;

-- A/B tests on subjects
CREATE TABLE IF NOT EXISTS public.email_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  variant_a_subject TEXT NOT NULL,
  variant_b_subject TEXT NOT NULL,
  variant_a_sent INTEGER NOT NULL DEFAULT 0,
  variant_b_sent INTEGER NOT NULL DEFAULT 0,
  variant_a_opened INTEGER NOT NULL DEFAULT 0,
  variant_b_opened INTEGER NOT NULL DEFAULT 0,
  variant_a_clicked INTEGER NOT NULL DEFAULT 0,
  variant_b_clicked INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','paused','completed')),
  winner CHAR(1) CHECK (winner IN ('A','B')),
  significance_pct NUMERIC,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas_team_full_access_ab_tests"
  ON public.email_ab_tests FOR ALL TO authenticated
  USING (public.is_saas_team(auth.uid()))
  WITH CHECK (public.is_saas_team(auth.uid()));

CREATE POLICY "org_admins_manage_ab_tests"
  ON public.email_ab_tests FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id));

CREATE TRIGGER trg_email_ab_tests_updated_at
  BEFORE UPDATE ON public.email_ab_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bayesian-ish significance (z-test approx on open rates)
CREATE OR REPLACE FUNCTION public.compute_ab_significance(
  _a_sent INTEGER, _a_opened INTEGER,
  _b_sent INTEGER, _b_opened INTEGER
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE pa NUMERIC; pb NUMERIC; se NUMERIC; z NUMERIC;
BEGIN
  IF _a_sent < 50 OR _b_sent < 50 THEN RETURN 0; END IF;
  pa := _a_opened::NUMERIC / _a_sent;
  pb := _b_opened::NUMERIC / _b_sent;
  se := sqrt((pa*(1-pa)/_a_sent) + (pb*(1-pb)/_b_sent));
  IF se = 0 THEN RETURN 0; END IF;
  z := abs(pa - pb) / se;
  RETURN LEAST(99.9, GREATEST(0,
    CASE
      WHEN z >= 2.58 THEN 99.0
      WHEN z >= 1.96 THEN 95.0
      WHEN z >= 1.65 THEN 90.0
      WHEN z >= 1.28 THEN 80.0
      ELSE z * 50
    END
  ));
END;
$$;

-- Convenience: snapshot current template into email_template_versions on update
-- (defensive in case the trigger isn't already in place)
CREATE OR REPLACE FUNCTION public.snapshot_email_template_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
       OLD.subject IS DISTINCT FROM NEW.subject
    OR OLD.markdown_body IS DISTINCT FROM NEW.markdown_body
  ) THEN
    INSERT INTO public.email_template_versions (
      template_id, version, subject, markdown_body, variables, created_by
    ) VALUES (
      OLD.id, OLD.version, OLD.subject, OLD.markdown_body, OLD.variables, OLD.created_by
    )
    ON CONFLICT (template_id, version) DO NOTHING;
    NEW.version := COALESCE(OLD.version, 1) + 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_snapshot_email_template_version ON public.email_templates;
CREATE TRIGGER trg_snapshot_email_template_version
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.snapshot_email_template_version();
