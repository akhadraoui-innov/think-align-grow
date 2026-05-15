
-- ============ F1: pgvector retrieval RPC ============

CREATE OR REPLACE FUNCTION public.match_challenge_artifacts(
  _query vector(1536),
  _session uuid,
  _k int DEFAULT 8,
  _exclude uuid DEFAULT NULL
)
RETURNS TABLE(id uuid, content text, kind public.challenge_artifact_kind, criticality text, emoji text, similarity float)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.content, a.kind, a.criticality, a.emoji,
         1 - (a.embedding <=> _query) AS similarity
  FROM public.challenge_artifacts a
  WHERE a.session_id = _session
    AND a.embedding IS NOT NULL
    AND a.status = 'active'
    AND (_exclude IS NULL OR a.id <> _exclude)
  ORDER BY a.embedding <=> _query
  LIMIT GREATEST(_k, 1);
$$;

REVOKE EXECUTE ON FUNCTION public.match_challenge_artifacts(vector, uuid, int, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_challenge_artifacts(vector, uuid, int, uuid) TO authenticated, service_role;

-- ============ F2: Event-sourcing triggers ============

CREATE OR REPLACE FUNCTION public.trg_log_challenge_artifact_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _ev_type text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _ev_type := 'artifact.created.' || NEW.kind::text;
    INSERT INTO public.challenge_events (session_id, workshop_id, type, actor_id, payload)
    VALUES (NEW.session_id, NEW.workshop_id, _ev_type, NEW.author_id,
      jsonb_build_object('artifact_id', NEW.id, 'kind', NEW.kind, 'subject_id', NEW.subject_id, 'criticality', NEW.criticality));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      _ev_type := 'artifact.status.' || NEW.status;
      INSERT INTO public.challenge_events (session_id, workshop_id, type, actor_id, payload)
      VALUES (NEW.session_id, NEW.workshop_id, _ev_type, COALESCE(NEW.resolved_by, NEW.author_id),
        jsonb_build_object('artifact_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status));
    END IF;
    IF (OLD.ai_meta->>'status') IS DISTINCT FROM (NEW.ai_meta->>'status')
       AND (NEW.ai_meta->>'status') = 'answered' THEN
      INSERT INTO public.challenge_events (session_id, workshop_id, type, actor_id, payload)
      VALUES (NEW.session_id, NEW.workshop_id, 'ai.answered', NEW.author_id,
        jsonb_build_object('artifact_id', NEW.id, 'model', NEW.ai_meta->>'model'));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_cart_event ON public.challenge_artifacts;
CREATE TRIGGER trg_cart_event
AFTER INSERT OR UPDATE ON public.challenge_artifacts
FOR EACH ROW EXECUTE FUNCTION public.trg_log_challenge_artifact_event();

CREATE OR REPLACE FUNCTION public.trg_log_challenge_session_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.challenge_events (session_id, workshop_id, type, actor_id, payload)
    VALUES (NEW.id, NEW.workshop_id, 'session.created', NEW.created_by,
      jsonb_build_object('template_id', NEW.template_id, 'status', NEW.status));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.challenge_events (session_id, workshop_id, type, actor_id, payload)
    VALUES (NEW.id, NEW.workshop_id, 'session.status.' || NEW.status, auth.uid(),
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_csess_event ON public.challenge_sessions;
CREATE TRIGGER trg_csess_event
AFTER INSERT OR UPDATE ON public.challenge_sessions
FOR EACH ROW EXECUTE FUNCTION public.trg_log_challenge_session_event();
