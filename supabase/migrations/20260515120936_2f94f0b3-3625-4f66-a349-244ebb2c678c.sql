
-- ============ S1: RLS INSERT WITH CHECK strict ============

DROP POLICY IF EXISTS "Participants insert artifacts" ON public.challenge_artifacts;
CREATE POLICY "Participants insert artifacts" ON public.challenge_artifacts
FOR INSERT TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND (public.is_workshop_participant(workshop_id, auth.uid())
       OR public.is_workshop_host(workshop_id, auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.challenge_sessions s
    WHERE s.id = session_id AND s.workshop_id = challenge_artifacts.workshop_id
  )
);

DROP POLICY IF EXISTS "Participants insert links" ON public.challenge_artifact_links;
CREATE POLICY "Participants insert links" ON public.challenge_artifact_links
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.challenge_sessions s
    WHERE s.id = session_id
      AND (public.is_workshop_participant(s.workshop_id, auth.uid())
           OR public.is_workshop_host(s.workshop_id, auth.uid()))
  )
);

DROP POLICY IF EXISTS "Participants insert events" ON public.challenge_events;
CREATE POLICY "Participants insert events" ON public.challenge_events
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.challenge_sessions s
    WHERE s.id = session_id
      AND (public.is_workshop_participant(s.workshop_id, auth.uid())
           OR public.is_workshop_host(s.workshop_id, auth.uid()))
  )
);

DROP POLICY IF EXISTS "Participants create AI threads" ON public.challenge_ai_threads;
CREATE POLICY "Participants create AI threads" ON public.challenge_ai_threads
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.challenge_sessions s
    WHERE s.id = session_id
      AND (public.is_workshop_participant(s.workshop_id, auth.uid())
           OR public.is_workshop_host(s.workshop_id, auth.uid()))
  )
);

-- ============ S2: Storage upload policy correcte ============

DROP POLICY IF EXISTS "Participants upload challenge media" ON storage.objects;
CREATE POLICY "Participants upload challenge media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'challenge-media'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.challenge_sessions s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND (public.is_workshop_participant(s.workshop_id, auth.uid())
           OR public.is_workshop_host(s.workshop_id, auth.uid()))
  )
);

DROP POLICY IF EXISTS "Participants read challenge media" ON storage.objects;
CREATE POLICY "Participants read challenge media" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'challenge-media'
  AND EXISTS (
    SELECT 1 FROM public.challenge_sessions s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND (public.is_workshop_participant(s.workshop_id, auth.uid())
           OR public.is_workshop_host(s.workshop_id, auth.uid()))
  )
);

-- ============ S3: Bucket limits + mime allowlist ============

UPDATE storage.buckets
SET file_size_limit = 26214400,  -- 25 MB
    allowed_mime_types = ARRAY['audio/webm','audio/mp4','audio/mpeg','audio/wav','audio/ogg']
WHERE id = 'challenge-media';

-- ============ S5: Realtime publication ============

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_session_context;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_events;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

ALTER TABLE public.challenge_session_context REPLICA IDENTITY FULL;
ALTER TABLE public.challenge_events REPLICA IDENTITY FULL;
