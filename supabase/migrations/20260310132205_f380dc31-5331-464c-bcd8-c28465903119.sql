
-- Add columns to challenge_responses
ALTER TABLE public.challenge_responses 
  ADD COLUMN format text NOT NULL DEFAULT 'normal',
  ADD COLUMN maturity integer NOT NULL DEFAULT 0,
  ADD COLUMN rank integer NOT NULL DEFAULT 0;

-- Create challenge_staging table
CREATE TABLE public.challenge_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.challenge_subjects(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  format text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.challenge_staging ENABLE ROW LEVEL SECURITY;

-- RLS policies for challenge_staging
CREATE POLICY "Participants can view staging"
  ON public.challenge_staging FOR SELECT
  TO authenticated
  USING (is_workshop_participant(workshop_id, auth.uid()));

CREATE POLICY "Users can insert own staging"
  ON public.challenge_staging FOR INSERT
  TO authenticated
  WITH CHECK (is_workshop_participant(workshop_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Users can update own staging"
  ON public.challenge_staging FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own staging"
  ON public.challenge_staging FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_staging;
