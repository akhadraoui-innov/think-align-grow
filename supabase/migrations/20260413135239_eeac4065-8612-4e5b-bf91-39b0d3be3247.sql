
CREATE TABLE public.business_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_name text NOT NULL,
  segment text NOT NULL,
  user_count integer NOT NULL DEFAULT 50,
  challenges text DEFAULT '',
  sale_model_id text NOT NULL,
  role_configs jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_setup_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_service_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  engagement_months integer NOT NULL DEFAULT 12,
  totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  quote_markdown text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  parent_quote_id uuid REFERENCES public.business_quotes(id),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas_manage_quotes" ON public.business_quotes
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

CREATE TRIGGER update_business_quotes_updated_at
  BEFORE UPDATE ON public.business_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
