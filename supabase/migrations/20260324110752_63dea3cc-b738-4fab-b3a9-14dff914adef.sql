
-- Create academy_functions table
CREATE TABLE public.academy_functions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  department text,
  seniority text,
  industry text,
  company_size text,
  responsibilities jsonb NOT NULL DEFAULT '[]',
  tools_used jsonb NOT NULL DEFAULT '[]',
  kpis jsonb NOT NULL DEFAULT '[]',
  ai_use_cases jsonb NOT NULL DEFAULT '[]',
  organization_id uuid REFERENCES public.organizations(id),
  status text NOT NULL DEFAULT 'draft',
  generation_mode text NOT NULL DEFAULT 'manual',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create academy_function_users table
CREATE TABLE public.academy_function_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_id uuid NOT NULL REFERENCES public.academy_functions(id) ON DELETE CASCADE,
  custom_context jsonb NOT NULL DEFAULT '{}',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, function_id)
);

-- Add function_id to academy_paths
ALTER TABLE public.academy_paths ADD COLUMN function_id uuid REFERENCES public.academy_functions(id);

-- Enable RLS
ALTER TABLE public.academy_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_function_users ENABLE ROW LEVEL SECURITY;

-- RLS for academy_functions
CREATE POLICY "saas_manage_functions" ON public.academy_functions
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

CREATE POLICY "published_functions_viewable" ON public.academy_functions
  FOR SELECT TO authenticated
  USING (status = 'published');

-- RLS for academy_function_users
CREATE POLICY "saas_manage_function_users" ON public.academy_function_users
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

CREATE POLICY "users_view_own_function" ON public.academy_function_users
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger for academy_functions
CREATE TRIGGER update_academy_functions_updated_at
  BEFORE UPDATE ON public.academy_functions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
