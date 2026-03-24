ALTER TABLE public.academy_personae
  ADD COLUMN IF NOT EXISTS parent_persona_id uuid REFERENCES public.academy_personae(id),
  ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb;