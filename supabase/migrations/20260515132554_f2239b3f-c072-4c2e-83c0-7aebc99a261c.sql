
-- 1. Add 'image' to artifact kinds
ALTER TYPE public.challenge_artifact_kind ADD VALUE IF NOT EXISTS 'image';

-- 2. Locks table
CREATE TABLE IF NOT EXISTS public.challenge_artifact_locks (
  artifact_id uuid PRIMARY KEY REFERENCES public.challenge_artifacts(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.challenge_sessions(id) ON DELETE CASCADE,
  workshop_id uuid NOT NULL,
  locked_by uuid NOT NULL,
  locked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 seconds')
);
CREATE INDEX IF NOT EXISTS idx_artlocks_session ON public.challenge_artifact_locks(session_id);
CREATE INDEX IF NOT EXISTS idx_artlocks_expires ON public.challenge_artifact_locks(expires_at);

ALTER TABLE public.challenge_artifact_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read locks"
ON public.challenge_artifact_locks FOR SELECT TO authenticated
USING (
  public.is_workshop_participant(workshop_id, auth.uid())
  OR public.is_workshop_host(workshop_id, auth.uid())
);

-- mutations done via SECURITY DEFINER RPCs only (no direct policies)

-- 3. RPCs to acquire / release locks
CREATE OR REPLACE FUNCTION public.try_acquire_artifact_lock(_artifact_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _session uuid;
  _workshop uuid;
  _existing_by uuid;
  _existing_exp timestamptz;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('acquired', false, 'error', 'unauthenticated');
  END IF;

  SELECT session_id, workshop_id INTO _session, _workshop
  FROM public.challenge_artifacts WHERE id = _artifact_id;

  IF _session IS NULL THEN
    RETURN jsonb_build_object('acquired', false, 'error', 'artifact_not_found');
  END IF;

  IF NOT (public.is_workshop_participant(_workshop, _uid) OR public.is_workshop_host(_workshop, _uid)) THEN
    RETURN jsonb_build_object('acquired', false, 'error', 'forbidden');
  END IF;

  SELECT locked_by, expires_at INTO _existing_by, _existing_exp
  FROM public.challenge_artifact_locks WHERE artifact_id = _artifact_id;

  IF _existing_by IS NOT NULL AND _existing_by <> _uid AND _existing_exp > now() THEN
    RETURN jsonb_build_object(
      'acquired', false,
      'locked_by', _existing_by,
      'expires_at', _existing_exp
    );
  END IF;

  INSERT INTO public.challenge_artifact_locks(artifact_id, session_id, workshop_id, locked_by, locked_at, expires_at)
  VALUES (_artifact_id, _session, _workshop, _uid, now(), now() + interval '90 seconds')
  ON CONFLICT (artifact_id) DO UPDATE
    SET locked_by = EXCLUDED.locked_by,
        locked_at = EXCLUDED.locked_at,
        expires_at = EXCLUDED.expires_at;

  RETURN jsonb_build_object(
    'acquired', true,
    'locked_by', _uid,
    'expires_at', now() + interval '90 seconds'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.release_artifact_lock(_artifact_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.challenge_artifact_locks
  WHERE artifact_id = _artifact_id AND locked_by = auth.uid();
END;
$$;

-- 4. Interactions journal
CREATE TABLE IF NOT EXISTS public.challenge_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.challenge_sessions(id) ON DELETE CASCADE,
  workshop_id uuid NOT NULL,
  artifact_id uuid REFERENCES public.challenge_artifacts(id) ON DELETE SET NULL,
  slot_id uuid,
  subject_id uuid,
  actor_id uuid NOT NULL,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cint_session ON public.challenge_interactions(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cint_artifact ON public.challenge_interactions(artifact_id);
CREATE INDEX IF NOT EXISTS idx_cint_slot ON public.challenge_interactions(slot_id);
CREATE INDEX IF NOT EXISTS idx_cint_subject ON public.challenge_interactions(subject_id);

ALTER TABLE public.challenge_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read interactions"
ON public.challenge_interactions FOR SELECT TO authenticated
USING (
  public.is_workshop_participant(workshop_id, auth.uid())
  OR public.is_workshop_host(workshop_id, auth.uid())
);

CREATE POLICY "Participants can write interactions"
ON public.challenge_interactions FOR INSERT TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND (
    public.is_workshop_participant(workshop_id, auth.uid())
    OR public.is_workshop_host(workshop_id, auth.uid())
  )
);

-- Trigger on artifact mutations
CREATE OR REPLACE FUNCTION public.trg_log_artifact_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _kind text; _actor uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _kind := 'create';
    _actor := NEW.author_id;
    INSERT INTO public.challenge_interactions(session_id, workshop_id, artifact_id, slot_id, subject_id, actor_id, kind, payload)
    VALUES (NEW.session_id, NEW.workshop_id, NEW.id, NEW.slot_id, NEW.subject_id, _actor, _kind,
      jsonb_build_object('artifact_kind', NEW.kind, 'criticality', NEW.criticality));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    _actor := COALESCE(auth.uid(), NEW.author_id);
    -- position change
    IF OLD.position IS DISTINCT FROM NEW.position THEN
      INSERT INTO public.challenge_interactions(session_id, workshop_id, artifact_id, slot_id, subject_id, actor_id, kind, payload)
      VALUES (NEW.session_id, NEW.workshop_id, NEW.id, NEW.slot_id, NEW.subject_id, _actor, 'move',
        jsonb_build_object('from', OLD.position, 'to', NEW.position));
    END IF;
    -- slot change
    IF OLD.slot_id IS DISTINCT FROM NEW.slot_id THEN
      INSERT INTO public.challenge_interactions(session_id, workshop_id, artifact_id, slot_id, subject_id, actor_id, kind, payload)
      VALUES (NEW.session_id, NEW.workshop_id, NEW.id, NEW.slot_id, NEW.subject_id, _actor, 'reslot',
        jsonb_build_object('from_slot', OLD.slot_id, 'to_slot', NEW.slot_id));
    END IF;
    -- content change
    IF OLD.content IS DISTINCT FROM NEW.content THEN
      INSERT INTO public.challenge_interactions(session_id, workshop_id, artifact_id, slot_id, subject_id, actor_id, kind, payload)
      VALUES (NEW.session_id, NEW.workshop_id, NEW.id, NEW.slot_id, NEW.subject_id, _actor, 'edit',
        jsonb_build_object('len', length(coalesce(NEW.content, ''))));
    END IF;
    -- ai answer
    IF (OLD.ai_meta->>'status') IS DISTINCT FROM (NEW.ai_meta->>'status')
       AND (NEW.ai_meta->>'status') = 'answered' THEN
      INSERT INTO public.challenge_interactions(session_id, workshop_id, artifact_id, slot_id, subject_id, actor_id, kind, payload)
      VALUES (NEW.session_id, NEW.workshop_id, NEW.id, NEW.slot_id, NEW.subject_id, _actor, 'ai_answer',
        jsonb_build_object('mode', NEW.ai_meta->>'mode', 'model', NEW.ai_meta->>'model'));
    END IF;
    -- status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.challenge_interactions(session_id, workshop_id, artifact_id, slot_id, subject_id, actor_id, kind, payload)
      VALUES (NEW.session_id, NEW.workshop_id, NEW.id, NEW.slot_id, NEW.subject_id, _actor, 'status',
        jsonb_build_object('from', OLD.status, 'to', NEW.status));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_artifact_interaction ON public.challenge_artifacts;
CREATE TRIGGER trg_artifact_interaction
AFTER INSERT OR UPDATE ON public.challenge_artifacts
FOR EACH ROW EXECUTE FUNCTION public.trg_log_artifact_interaction();

-- Reaction trigger
CREATE OR REPLACE FUNCTION public.trg_log_reaction_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _wid uuid; _sid uuid; _slot uuid; _subj uuid;
BEGIN
  SELECT workshop_id, session_id, slot_id, subject_id INTO _wid, _sid, _slot, _subj
  FROM public.challenge_artifacts WHERE id = COALESCE(NEW.artifact_id, OLD.artifact_id);
  IF _sid IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  INSERT INTO public.challenge_interactions(session_id, workshop_id, artifact_id, slot_id, subject_id, actor_id, kind, payload)
  VALUES (_sid, _wid, COALESCE(NEW.artifact_id, OLD.artifact_id), _slot, _subj,
    COALESCE(NEW.user_id, OLD.user_id),
    CASE WHEN TG_OP = 'INSERT' THEN 'react' ELSE 'unreact' END,
    jsonb_build_object('emoji', COALESCE(NEW.emoji, OLD.emoji)));
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_reaction_interaction ON public.challenge_reactions;
CREATE TRIGGER trg_reaction_interaction
AFTER INSERT OR DELETE ON public.challenge_reactions
FOR EACH ROW EXECUTE FUNCTION public.trg_log_reaction_interaction();

-- Vote trigger
CREATE OR REPLACE FUNCTION public.trg_log_vote_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _wid uuid; _sid uuid; _slot uuid; _subj uuid;
BEGIN
  SELECT workshop_id, session_id, slot_id, subject_id INTO _wid, _sid, _slot, _subj
  FROM public.challenge_artifacts WHERE id = COALESCE(NEW.artifact_id, OLD.artifact_id);
  IF _sid IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  INSERT INTO public.challenge_interactions(session_id, workshop_id, artifact_id, slot_id, subject_id, actor_id, kind, payload)
  VALUES (_sid, _wid, COALESCE(NEW.artifact_id, OLD.artifact_id), _slot, _subj,
    COALESCE(NEW.user_id, OLD.user_id),
    CASE WHEN TG_OP = 'INSERT' THEN 'vote' ELSE 'unvote' END,
    '{}'::jsonb);
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_vote_interaction ON public.challenge_votes;
CREATE TRIGGER trg_vote_interaction
AFTER INSERT OR DELETE ON public.challenge_votes
FOR EACH ROW EXECUTE FUNCTION public.trg_log_vote_interaction();

-- 5. Co-pilot threads
CREATE TABLE IF NOT EXISTS public.challenge_copilot_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.challenge_sessions(id) ON DELETE CASCADE,
  workshop_id uuid NOT NULL,
  user_id uuid NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_copilot_session ON public.challenge_copilot_threads(session_id);

ALTER TABLE public.challenge_copilot_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own copilot thread read"
ON public.challenge_copilot_threads FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Own copilot thread write"
ON public.challenge_copilot_threads FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() AND (
    public.is_workshop_participant(workshop_id, auth.uid())
    OR public.is_workshop_host(workshop_id, auth.uid())
  )
);

CREATE POLICY "Own copilot thread update"
ON public.challenge_copilot_threads FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Own copilot thread delete"
ON public.challenge_copilot_threads FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- 6. Storage bucket for images
INSERT INTO storage.buckets(id, name, public)
VALUES ('challenge-images', 'challenge-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read challenge-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'challenge-images');

CREATE POLICY "Authenticated upload challenge-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'challenge-images' AND (storage.foldername(name))[1] IS NOT NULL);

CREATE POLICY "Authenticated update own challenge-images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'challenge-images' AND owner = auth.uid())
WITH CHECK (bucket_id = 'challenge-images' AND owner = auth.uid());

CREATE POLICY "Authenticated delete own challenge-images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'challenge-images' AND owner = auth.uid());
