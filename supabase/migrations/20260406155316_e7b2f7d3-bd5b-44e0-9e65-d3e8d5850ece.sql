
-- 1. Add UCM columns to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS ucm_plan TEXT DEFAULT 'starter';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS ucm_ai_config JSONB DEFAULT '{
  "uc_generation": {"model":"google/gemini-2.5-flash","temperature":0.7,"max_tokens":4096},
  "analysis": {"model":"google/gemini-2.5-flash","temperature":0.4,"max_tokens":8192},
  "synthesis": {"model":"google/gemini-2.5-pro","temperature":0.5,"max_tokens":8192},
  "chat": {"model":"google/gemini-2.5-flash","temperature":0.6,"max_tokens":2048},
  "consultant_brand_name":"GrowthInnov",
  "max_concurrent_agents":3
}'::jsonb;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS ucm_branding JSONB DEFAULT '{
  "primary_color":"#0065FF",
  "accent_color":"#6554C0",
  "company_name_in_exports":"GrowthInnov"
}'::jsonb;

-- 2. Function: get_ucm_section_prompt (tenant override → global fallback)
CREATE OR REPLACE FUNCTION public.get_ucm_section_prompt(
  p_org_id UUID,
  p_section_code TEXT,
  p_mode TEXT
) RETURNS TEXT AS $$
DECLARE
  v_prompt TEXT;
BEGIN
  SELECT CASE WHEN p_mode = 'brief' THEN brief_instruction ELSE detailed_instruction END
  INTO v_prompt
  FROM public.ucm_analysis_sections
  WHERE organization_id = p_org_id AND code = p_section_code AND is_active = true;

  IF v_prompt IS NULL THEN
    SELECT CASE WHEN p_mode = 'brief' THEN brief_instruction ELSE detailed_instruction END
    INTO v_prompt
    FROM public.ucm_analysis_sections
    WHERE organization_id IS NULL AND code = p_section_code AND is_active = true;
  END IF;

  RETURN v_prompt;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 3. Function: get_ucm_global_prompt (tenant override → global fallback)
CREATE OR REPLACE FUNCTION public.get_ucm_global_prompt(
  p_org_id UUID,
  p_section_code TEXT
) RETURNS TEXT AS $$
DECLARE
  v_prompt TEXT;
BEGIN
  SELECT instruction INTO v_prompt
  FROM public.ucm_global_analysis_sections
  WHERE organization_id = p_org_id AND code = p_section_code AND is_active = true;

  IF v_prompt IS NULL THEN
    SELECT instruction INTO v_prompt
    FROM public.ucm_global_analysis_sections
    WHERE organization_id IS NULL AND code = p_section_code AND is_active = true;
  END IF;

  RETURN v_prompt;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 4. Function: check_ucm_quota
CREATE OR REPLACE FUNCTION public.check_ucm_quota(
  p_org_id UUID,
  p_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_quotas JSONB;
  v_usage RECORD;
  v_period TEXT;
BEGIN
  v_period := to_char(now(), 'YYYY-MM');

  SELECT ucm_quotas INTO v_quotas FROM public.organizations WHERE id = p_org_id;
  IF v_quotas IS NULL THEN RETURN true; END IF;

  SELECT * INTO v_usage FROM public.ucm_quota_usage WHERE organization_id = p_org_id AND period = v_period;

  CASE p_action
    WHEN 'uc_generation' THEN
      RETURN COALESCE(v_usage.uc_generations, 0) < COALESCE((v_quotas->>'max_uc_generations_per_month')::int, 999999);
    WHEN 'analysis' THEN
      RETURN COALESCE(v_usage.analysis_generations, 0) < COALESCE((v_quotas->>'max_analyses_per_month')::int, 999999);
    WHEN 'global' THEN
      RETURN COALESCE(v_usage.global_generations, 0) < COALESCE((v_quotas->>'max_globals_per_month')::int, 999999);
    WHEN 'chat' THEN
      RETURN COALESCE(v_usage.chat_messages, 0) < COALESCE((v_quotas->>'max_chat_per_month')::int, 999999);
    WHEN 'export' THEN
      RETURN COALESCE(v_usage.exports, 0) < COALESCE((v_quotas->>'max_exports_per_month')::int, 999999);
    ELSE
      RETURN true;
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 5. Create ucm-exports storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('ucm-exports', 'ucm-exports', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage policies for ucm-exports
CREATE POLICY "Authenticated users can upload exports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ucm-exports');

CREATE POLICY "Authenticated users can read exports"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ucm-exports');
