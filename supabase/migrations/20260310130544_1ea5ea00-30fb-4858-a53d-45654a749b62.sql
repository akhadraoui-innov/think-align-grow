
-- Enum for subject type
CREATE TYPE public.challenge_subject_type AS ENUM ('question', 'challenge', 'context');

-- Enum for slot type
CREATE TYPE public.challenge_slot_type AS ENUM ('single', 'multi', 'ranked');

-- Templates
CREATE TABLE public.challenge_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  pillar_id UUID REFERENCES public.pillars(id) ON DELETE SET NULL,
  toolkit_id UUID NOT NULL REFERENCES public.toolkits(id) ON DELETE CASCADE,
  difficulty TEXT DEFAULT 'intermediate',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.challenge_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published toolkit templates are viewable"
  ON public.challenge_templates FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.toolkits t WHERE t.id = challenge_templates.toolkit_id AND t.status = 'published'
  ));

-- Subjects
CREATE TABLE public.challenge_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.challenge_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type public.challenge_subject_type NOT NULL DEFAULT 'question',
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.challenge_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subjects viewable via template"
  ON public.challenge_subjects FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.challenge_templates ct
    JOIN public.toolkits t ON t.id = ct.toolkit_id
    WHERE ct.id = challenge_subjects.template_id AND t.status = 'published'
  ));

-- Slots
CREATE TABLE public.challenge_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.challenge_subjects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  slot_type public.challenge_slot_type NOT NULL DEFAULT 'single',
  hint TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.challenge_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Slots viewable via subject"
  ON public.challenge_slots FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.challenge_subjects cs
    JOIN public.challenge_templates ct ON ct.id = cs.template_id
    JOIN public.toolkits t ON t.id = ct.toolkit_id
    WHERE cs.id = challenge_slots.subject_id AND t.status = 'published'
  ));

-- Responses
CREATE TABLE public.challenge_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.challenge_subjects(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES public.challenge_slots(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.challenge_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view challenge responses"
  ON public.challenge_responses FOR SELECT
  TO authenticated
  USING (is_workshop_participant(workshop_id, auth.uid()));

CREATE POLICY "Participants can insert own responses"
  ON public.challenge_responses FOR INSERT
  TO authenticated
  WITH CHECK (is_workshop_participant(workshop_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Users can update own responses"
  ON public.challenge_responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own responses"
  ON public.challenge_responses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Analyses
CREATE TABLE public.challenge_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.challenge_templates(id) ON DELETE CASCADE,
  analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.challenge_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view analyses"
  ON public.challenge_analyses FOR SELECT
  TO authenticated
  USING (is_workshop_participant(workshop_id, auth.uid()));

CREATE POLICY "Host can manage analyses"
  ON public.challenge_analyses FOR ALL
  TO authenticated
  USING (is_workshop_host(workshop_id, auth.uid()));

-- Enable realtime for responses
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_responses;
