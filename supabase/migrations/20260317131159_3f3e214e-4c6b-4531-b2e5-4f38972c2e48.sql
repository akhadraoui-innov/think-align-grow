
CREATE TABLE public.challenge_template_toolkits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.challenge_templates(id) ON DELETE CASCADE,
  toolkit_id uuid NOT NULL REFERENCES public.toolkits(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_id, toolkit_id)
);

ALTER TABLE public.challenge_template_toolkits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Saas team can manage template toolkits" ON public.challenge_template_toolkits
  FOR ALL TO authenticated USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

CREATE POLICY "View via published toolkit" ON public.challenge_template_toolkits
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.toolkits t WHERE t.id = toolkit_id AND t.status = 'published')
  );

-- Migrate existing data
INSERT INTO public.challenge_template_toolkits (template_id, toolkit_id)
SELECT id, toolkit_id FROM public.challenge_templates;
