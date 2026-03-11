
-- Table ai_providers
CREATE TABLE public.ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  base_url text NOT NULL,
  auth_header_prefix text NOT NULL DEFAULT 'Bearer',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Saas team can manage ai_providers"
  ON public.ai_providers FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

CREATE POLICY "Saas team can view ai_providers"
  ON public.ai_providers FOR SELECT TO authenticated
  USING (is_saas_team(auth.uid()));

-- Seed providers
INSERT INTO public.ai_providers (slug, name, base_url, auth_header_prefix) VALUES
  ('lovable', 'Lovable AI', 'https://ai.gateway.lovable.dev/v1', 'Bearer'),
  ('openai', 'OpenAI', 'https://api.openai.com/v1', 'Bearer'),
  ('google', 'Google (Gemini)', 'https://generativelanguage.googleapis.com/v1beta/openai', 'Bearer'),
  ('anthropic', 'Anthropic', 'https://api.anthropic.com/v1', 'x-api-key'),
  ('custom', 'Custom', 'https://your-api.example.com/v1', 'Bearer');

-- Table ai_configurations
CREATE TABLE public.ai_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.ai_providers(id) ON DELETE RESTRICT,
  api_key text,
  model_chat text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  model_structured text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  prompts jsonb NOT NULL DEFAULT '{}'::jsonb,
  max_tokens integer NOT NULL DEFAULT 1000,
  temperature numeric NOT NULL DEFAULT 0.7,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

ALTER TABLE public.ai_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Saas team can manage ai_configurations"
  ON public.ai_configurations FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

CREATE POLICY "Saas team can view ai_configurations"
  ON public.ai_configurations FOR SELECT TO authenticated
  USING (is_saas_team(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_ai_configurations_updated_at
  BEFORE UPDATE ON public.ai_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
