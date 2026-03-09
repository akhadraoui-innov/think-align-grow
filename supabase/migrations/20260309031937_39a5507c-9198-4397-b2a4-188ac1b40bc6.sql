
-- Workshop status enum
CREATE TYPE public.workshop_status AS ENUM ('lobby', 'active', 'paused', 'completed');

-- Workshop deliverable type enum
CREATE TYPE public.deliverable_type AS ENUM ('swot', 'bmc', 'pitch_deck', 'action_plan');

-- Workshops table
CREATE TABLE public.workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  host_id uuid NOT NULL,
  status workshop_status NOT NULL DEFAULT 'lobby',
  current_card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  current_step integer NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}',
  timer_seconds integer DEFAULT 120,
  timer_started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Workshop participants
CREATE TABLE public.workshop_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'participant' CHECK (role IN ('host', 'participant')),
  is_connected boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workshop_id, user_id)
);

-- Workshop responses (one per participant per card)
CREATE TABLE public.workshop_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.workshop_participants(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  response_text text,
  vote integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workshop_id, participant_id, card_id)
);

-- Workshop deliverables
CREATE TABLE public.workshop_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  type deliverable_type NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  generated_by text DEFAULT 'manual',
  credits_used integer DEFAULT 0,
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_deliverables ENABLE ROW LEVEL SECURITY;

-- RLS: Workshops - host can manage, participants can view
CREATE POLICY "Host can manage own workshops" ON public.workshops
  FOR ALL TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Participants can view workshops" ON public.workshops
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workshop_participants
    WHERE workshop_participants.workshop_id = workshops.id
    AND workshop_participants.user_id = auth.uid()
  ));

-- RLS: Participants - anyone auth can join, participants can view
CREATE POLICY "Authenticated users can join workshops" ON public.workshop_participants
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Participants can view workshop members" ON public.workshop_participants
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workshop_participants wp
    WHERE wp.workshop_id = workshop_participants.workshop_id
    AND wp.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own participant record" ON public.workshop_participants
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- RLS: Responses - own responses + view all in joined workshop
CREATE POLICY "Participants can insert own responses" ON public.workshop_responses
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workshop_participants wp
    WHERE wp.id = workshop_responses.participant_id
    AND wp.user_id = auth.uid()
  ));

CREATE POLICY "Participants can view workshop responses" ON public.workshop_responses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workshop_participants wp
    WHERE wp.workshop_id = workshop_responses.workshop_id
    AND wp.user_id = auth.uid()
  ));

CREATE POLICY "Participants can update own responses" ON public.workshop_responses
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workshop_participants wp
    WHERE wp.id = workshop_responses.participant_id
    AND wp.user_id = auth.uid()
  ));

-- RLS: Deliverables - participants can view
CREATE POLICY "Participants can view deliverables" ON public.workshop_deliverables
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workshop_participants wp
    WHERE wp.workshop_id = workshop_deliverables.workshop_id
    AND wp.user_id = auth.uid()
  ));

CREATE POLICY "Host can manage deliverables" ON public.workshop_deliverables
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workshops w
    WHERE w.id = workshop_deliverables.workshop_id
    AND w.host_id = auth.uid()
  ));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.workshops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workshop_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workshop_responses;

-- Updated_at trigger
CREATE TRIGGER update_workshops_updated_at
  BEFORE UPDATE ON public.workshops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
