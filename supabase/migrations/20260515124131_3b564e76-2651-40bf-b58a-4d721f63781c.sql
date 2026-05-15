CREATE OR REPLACE FUNCTION public.trg_log_challenge_session_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.challenge_events(session_id, actor_id, kind, payload)
    VALUES (NEW.id, NEW.created_by, 'session.start'::challenge_event_kind,
      jsonb_build_object('template_id', NEW.template_id, 'status', NEW.status));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.challenge_events(session_id, actor_id, kind, payload)
    VALUES (NEW.id, auth.uid(), 'session.phase'::challenge_event_kind,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_log_challenge_artifact_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.challenge_events(session_id, actor_id, kind, target_id, payload)
    VALUES (NEW.session_id, NEW.author_id, 'artifact.created'::challenge_event_kind, NEW.id,
      jsonb_build_object('kind', NEW.kind, 'subject_id', NEW.subject_id, 'criticality', NEW.criticality));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'resolved' THEN
        INSERT INTO public.challenge_events(session_id, actor_id, kind, target_id, payload)
        VALUES (NEW.session_id, COALESCE(NEW.resolved_by, NEW.author_id), 'artifact.resolved'::challenge_event_kind, NEW.id,
          jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
      ELSIF NEW.status = 'archived' THEN
        INSERT INTO public.challenge_events(session_id, actor_id, kind, target_id, payload)
        VALUES (NEW.session_id, COALESCE(NEW.resolved_by, NEW.author_id), 'artifact.deleted'::challenge_event_kind, NEW.id,
          jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
      ELSE
        INSERT INTO public.challenge_events(session_id, actor_id, kind, target_id, payload)
        VALUES (NEW.session_id, COALESCE(NEW.resolved_by, NEW.author_id), 'artifact.updated'::challenge_event_kind, NEW.id,
          jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
      END IF;
    END IF;
    IF (OLD.ai_meta->>'status') IS DISTINCT FROM (NEW.ai_meta->>'status')
       AND (NEW.ai_meta->>'status') = 'answered' THEN
      INSERT INTO public.challenge_events(session_id, actor_id, kind, target_id, payload)
      VALUES (NEW.session_id, NEW.author_id, 'ai.responded'::challenge_event_kind, NEW.id,
        jsonb_build_object('model', NEW.ai_meta->>'model'));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;