
-- ==========================================
-- Lot 1.3 + 2.1 + 3.2 + 3.3 schema
-- ==========================================

-- 1) Syntheses scope (slot / subject / session-global)
ALTER TABLE public.challenge_syntheses
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'session',
  ADD COLUMN IF NOT EXISTS scope_id uuid;
CREATE INDEX IF NOT EXISTS idx_csyn_scope ON public.challenge_syntheses(session_id, scope, scope_id);

-- 2) Embeddings: allow "interaction" source_type
ALTER TABLE public.challenge_embeddings
  DROP CONSTRAINT IF EXISTS challenge_embeddings_source_type_check;
ALTER TABLE public.challenge_embeddings
  ADD CONSTRAINT challenge_embeddings_source_type_check
  CHECK (source_type = ANY (ARRAY['artifact','card','subject','slot','briefing','thread','synthesis','interaction']));

-- 3) Subjects: timer
ALTER TABLE public.challenge_subjects
  ADD COLUMN IF NOT EXISTS timer_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS timer_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS timer_paused_at timestamptz;

-- 4) Sessions: spotlight + anonymous
ALTER TABLE public.challenge_sessions
  ADD COLUMN IF NOT EXISTS spotlight_artifact_id uuid,
  ADD COLUMN IF NOT EXISTS spotlight_subject_id uuid,
  ADD COLUMN IF NOT EXISTS spotlight_slot_id uuid,
  ADD COLUMN IF NOT EXISTS anonymous_mode boolean NOT NULL DEFAULT false;

-- 5) RAG metrics
CREATE TABLE IF NOT EXISTS public.challenge_rag_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.challenge_sessions(id) ON DELETE CASCADE,
  workshop_id uuid NOT NULL,
  user_id uuid,
  query text NOT NULL,
  kinds text[] NOT NULL DEFAULT '{}',
  hit_count integer NOT NULL DEFAULT 0,
  top_score double precision,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ragmetrics_session ON public.challenge_rag_metrics(session_id, created_at DESC);
ALTER TABLE public.challenge_rag_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Host reads rag metrics" ON public.challenge_rag_metrics;
CREATE POLICY "Host reads rag metrics" ON public.challenge_rag_metrics
  FOR SELECT TO authenticated
  USING (is_workshop_host(workshop_id, auth.uid()));

DROP POLICY IF EXISTS "Service inserts rag metrics" ON public.challenge_rag_metrics;
CREATE POLICY "Service inserts rag metrics" ON public.challenge_rag_metrics
  FOR INSERT TO authenticated
  WITH CHECK (is_workshop_participant(workshop_id, auth.uid()) OR is_workshop_host(workshop_id, auth.uid()));

-- ==========================================
-- 6) Interactions triggers (SECURITY DEFINER)
-- ==========================================

CREATE OR REPLACE FUNCTION public.log_artifact_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text;
  v_actor uuid;
  v_payload jsonb := '{}'::jsonb;
  v_workshop uuid;
  v_session uuid;
  v_artifact uuid;
  v_subject uuid;
  v_slot uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_kind := 'create';
    v_actor := NEW.author_id;
    v_workshop := NEW.workshop_id;
    v_session := NEW.session_id;
    v_artifact := NEW.id;
    v_subject := NEW.subject_id;
    v_slot := NEW.slot_id;
    v_payload := jsonb_build_object('kind', NEW.kind, 'content_preview', left(coalesce(NEW.content, NEW.transcription, ''), 200));
  ELSIF TG_OP = 'UPDATE' THEN
    v_actor := coalesce(NEW.author_id, OLD.author_id);
    v_workshop := NEW.workshop_id;
    v_session := NEW.session_id;
    v_artifact := NEW.id;
    v_subject := NEW.subject_id;
    v_slot := NEW.slot_id;
    -- Detect kind
    IF (OLD.position IS DISTINCT FROM NEW.position) OR (OLD.slot_id IS DISTINCT FROM NEW.slot_id) OR (OLD.subject_id IS DISTINCT FROM NEW.subject_id) THEN
      v_kind := 'move';
      v_payload := jsonb_build_object('from_slot', OLD.slot_id, 'to_slot', NEW.slot_id, 'from_subject', OLD.subject_id, 'to_subject', NEW.subject_id);
    ELSIF (OLD.status IS DISTINCT FROM NEW.status) THEN
      v_kind := 'status';
      v_payload := jsonb_build_object('from', OLD.status, 'to', NEW.status);
    ELSIF (OLD.content IS DISTINCT FROM NEW.content) OR (OLD.transcription IS DISTINCT FROM NEW.transcription) THEN
      v_kind := 'edit';
      v_payload := jsonb_build_object('content_preview', left(coalesce(NEW.content, NEW.transcription, ''), 200));
    ELSE
      RETURN NEW; -- noop
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_kind := 'delete';
    v_actor := OLD.author_id;
    v_workshop := OLD.workshop_id;
    v_session := OLD.session_id;
    v_artifact := OLD.id;
    v_subject := OLD.subject_id;
    v_slot := OLD.slot_id;
    v_payload := jsonb_build_object('kind', OLD.kind);
  END IF;

  IF v_actor IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO public.challenge_interactions (session_id, workshop_id, artifact_id, slot_id, subject_id, actor_id, kind, payload)
  VALUES (v_session, v_workshop, v_artifact, v_slot, v_subject, v_actor, v_kind, v_payload);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_log_artifact_interaction_ins ON public.challenge_artifacts;
DROP TRIGGER IF EXISTS trg_log_artifact_interaction_upd ON public.challenge_artifacts;
DROP TRIGGER IF EXISTS trg_log_artifact_interaction_del ON public.challenge_artifacts;
CREATE TRIGGER trg_log_artifact_interaction_ins AFTER INSERT ON public.challenge_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.log_artifact_interaction();
CREATE TRIGGER trg_log_artifact_interaction_upd AFTER UPDATE ON public.challenge_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.log_artifact_interaction();
CREATE TRIGGER trg_log_artifact_interaction_del AFTER DELETE ON public.challenge_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.log_artifact_interaction();

CREATE OR REPLACE FUNCTION public.log_vote_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workshop uuid;
  v_subject uuid;
  v_slot uuid;
BEGIN
  SELECT a.workshop_id, a.subject_id, a.slot_id INTO v_workshop, v_subject, v_slot
    FROM public.challenge_artifacts a WHERE a.id = NEW.artifact_id;
  IF v_workshop IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.challenge_interactions (session_id, workshop_id, artifact_id, slot_id, subject_id, actor_id, kind, payload)
  VALUES (NEW.session_id, v_workshop, NEW.artifact_id, v_slot, v_subject, NEW.user_id, 'vote',
          jsonb_build_object('weight', NEW.weight, 'round', NEW.vote_round));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_log_vote_interaction ON public.challenge_votes;
CREATE TRIGGER trg_log_vote_interaction AFTER INSERT ON public.challenge_votes
  FOR EACH ROW EXECUTE FUNCTION public.log_vote_interaction();

CREATE OR REPLACE FUNCTION public.log_reaction_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workshop uuid;
  v_session uuid;
  v_subject uuid;
  v_slot uuid;
BEGIN
  SELECT a.workshop_id, a.session_id, a.subject_id, a.slot_id INTO v_workshop, v_session, v_subject, v_slot
    FROM public.challenge_artifacts a WHERE a.id = NEW.artifact_id;
  IF v_workshop IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.challenge_interactions (session_id, workshop_id, artifact_id, slot_id, subject_id, actor_id, kind, payload)
  VALUES (v_session, v_workshop, NEW.artifact_id, v_slot, v_subject, NEW.user_id, 'react',
          jsonb_build_object('emoji', NEW.emoji));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_log_reaction_interaction ON public.challenge_reactions;
CREATE TRIGGER trg_log_reaction_interaction AFTER INSERT ON public.challenge_reactions
  FOR EACH ROW EXECUTE FUNCTION public.log_reaction_interaction();

CREATE OR REPLACE FUNCTION public.log_lock_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subject uuid;
  v_slot uuid;
BEGIN
  SELECT a.subject_id, a.slot_id INTO v_subject, v_slot
    FROM public.challenge_artifacts a WHERE a.id = NEW.artifact_id;
  INSERT INTO public.challenge_interactions (session_id, workshop_id, artifact_id, slot_id, subject_id, actor_id, kind, payload)
  VALUES (NEW.session_id, NEW.workshop_id, NEW.artifact_id, v_slot, v_subject, NEW.locked_by, 'lock', '{}'::jsonb);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_log_lock_interaction ON public.challenge_artifact_locks;
CREATE TRIGGER trg_log_lock_interaction AFTER INSERT ON public.challenge_artifact_locks
  FOR EACH ROW EXECUTE FUNCTION public.log_lock_interaction();

-- ==========================================
-- 7) Cron: cleanup expired locks daily 03:00
-- ==========================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup_challenge_artifact_locks') THEN
    PERFORM cron.unschedule('cleanup_challenge_artifact_locks');
  END IF;
END $$;

SELECT cron.schedule(
  'cleanup_challenge_artifact_locks',
  '0 3 * * *',
  $$DELETE FROM public.challenge_artifact_locks WHERE expires_at < now();$$
);

-- ==========================================
-- 8) Sticker delete RLS: only author or host
-- ==========================================

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'public.challenge_artifacts'::regclass AND polcmd = 'd'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.challenge_artifacts', r.polname);
  END LOOP;
END $$;

CREATE POLICY "Author or host can delete artifacts"
ON public.challenge_artifacts
FOR DELETE
TO authenticated
USING (
  author_id = auth.uid()
  OR is_workshop_host(workshop_id, auth.uid())
);
