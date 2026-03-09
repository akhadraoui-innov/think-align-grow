
-- Create security definer function to check workshop participation without triggering RLS
CREATE OR REPLACE FUNCTION public.is_workshop_participant(_workshop_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workshop_participants
    WHERE workshop_id = _workshop_id AND user_id = _user_id
  );
$$;

-- Also check if user is workshop host
CREATE OR REPLACE FUNCTION public.is_workshop_host(_workshop_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workshops
    WHERE id = _workshop_id AND host_id = _user_id
  );
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Participants can view workshop members" ON public.workshop_participants;

-- Recreate with security definer function
CREATE POLICY "Participants can view workshop members"
ON public.workshop_participants
FOR SELECT
TO authenticated
USING (
  public.is_workshop_participant(workshop_id, auth.uid())
);

-- Fix workshops SELECT policy too (it references workshop_participants)
DROP POLICY IF EXISTS "Participants can view workshops" ON public.workshops;

CREATE POLICY "Participants can view workshops"
ON public.workshops
FOR SELECT
TO authenticated
USING (
  public.is_workshop_participant(id, auth.uid())
);

-- Fix workshop_responses policies
DROP POLICY IF EXISTS "Participants can view workshop responses" ON public.workshop_responses;
CREATE POLICY "Participants can view workshop responses"
ON public.workshop_responses
FOR SELECT
TO authenticated
USING (
  public.is_workshop_participant(workshop_id, auth.uid())
);

DROP POLICY IF EXISTS "Participants can insert own responses" ON public.workshop_responses;
CREATE POLICY "Participants can insert own responses"
ON public.workshop_responses
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_workshop_participant(workshop_id, auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.workshop_participants wp
    WHERE wp.id = participant_id AND wp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Participants can update own responses" ON public.workshop_responses;
CREATE POLICY "Participants can update own responses"
ON public.workshop_responses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workshop_participants wp
    WHERE wp.id = participant_id AND wp.user_id = auth.uid()
  )
);

-- Fix workshop_deliverables SELECT policy
DROP POLICY IF EXISTS "Participants can view deliverables" ON public.workshop_deliverables;
CREATE POLICY "Participants can view deliverables"
ON public.workshop_deliverables
FOR SELECT
TO authenticated
USING (
  public.is_workshop_participant(workshop_id, auth.uid())
);

-- Also need to allow joining by code (SELECT workshop before being a participant)
DROP POLICY IF EXISTS "Anyone can find workshop by code" ON public.workshops;
CREATE POLICY "Anyone can find workshop by code"
ON public.workshops
FOR SELECT
TO authenticated
USING (true);
