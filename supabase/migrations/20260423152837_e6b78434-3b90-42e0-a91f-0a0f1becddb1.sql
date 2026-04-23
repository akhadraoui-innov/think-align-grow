-- ── Fix search_path on pgmq wrapper functions ────────────────────────────
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

-- ── Phase 4 — DB triggers for welcome / suspended events ────────────────
-- Helper that POSTs to trigger-email edge function asynchronously via pg_net.
CREATE OR REPLACE FUNCTION public.dispatch_email_event(
  _event text,
  _organization_id uuid,
  _recipient_email text,
  _recipient_user_id uuid,
  _entity_id text,
  _payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _url text := 'https://yucwxukikfianvaokebs.supabase.co/functions/v1/trigger-email';
  _anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1Y3d4dWtpa2ZpYW52YW9rZWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDk3NTcsImV4cCI6MjA4ODU4NTc1N30.F28P1HlX6nF7xNOStb4YabS8SEKddru5RegUR2m0sFQ';
BEGIN
  IF _recipient_email IS NULL OR _recipient_email = '' THEN RETURN; END IF;
  PERFORM extensions.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer '||_anon
    ),
    body := jsonb_build_object(
      'event', _event,
      'organization_id', _organization_id,
      'recipient_email', _recipient_email,
      'recipient_user_id', _recipient_user_id,
      'entity_id', _entity_id,
      'payload', COALESCE(_payload,'{}'::jsonb)
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Never block business operations on email dispatch failure
  NULL;
END;
$$;

-- Welcome email when a profile is first created
CREATE OR REPLACE FUNCTION public.trg_email_welcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.dispatch_email_event(
    'user.created',
    NULL,
    NEW.email,
    NEW.user_id,
    NEW.user_id::text,
    jsonb_build_object(
      'firstName', COALESCE(split_part(NEW.display_name,' ',1), 'à toi'),
      'displayName', NEW.display_name
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_email_welcome ON public.profiles;
CREATE TRIGGER trg_email_welcome
AFTER INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.email IS NOT NULL)
EXECUTE FUNCTION public.trg_email_welcome();

-- Suspended email when profile.status flips to 'suspended'
CREATE OR REPLACE FUNCTION public.trg_email_suspended()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'suspended' AND OLD.status IS DISTINCT FROM 'suspended' THEN
    PERFORM public.dispatch_email_event(
      'user.status.suspended',
      NULL,
      NEW.email,
      NEW.user_id,
      NEW.user_id::text || ':' || extract(epoch from now())::text,
      jsonb_build_object('displayName', NEW.display_name)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_email_suspended ON public.profiles;
CREATE TRIGGER trg_email_suspended
AFTER UPDATE OF status ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trg_email_suspended();

-- ── Phase 4 — Daily cron: login reminder for inactive users ─────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function scanned daily; dispatches one reminder per inactive user, max 1/30j
CREATE OR REPLACE FUNCTION public.cron_dispatch_login_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row record;
  _days int;
BEGIN
  FOR _row IN
    SELECT
      p.user_id, p.email, p.display_name, p.last_seen_at,
      (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = p.user_id LIMIT 1) AS org_id,
      COALESCE(
        (SELECT o.inactivity_reminder_days FROM public.organizations o
          JOIN public.organization_members om2 ON om2.organization_id = o.id
          WHERE om2.user_id = p.user_id LIMIT 1),
        30
      ) AS reminder_days
    FROM public.profiles p
    WHERE p.email IS NOT NULL
      AND COALESCE(p.status,'active') = 'active'
      AND p.last_seen_at IS NOT NULL
  LOOP
    _days := EXTRACT(DAY FROM (now() - _row.last_seen_at))::int;

    -- Inactive enough?
    IF _days < _row.reminder_days THEN CONTINUE; END IF;

    -- Already reminded in the last 30 days?
    IF EXISTS (
      SELECT 1 FROM public.email_automation_runs r
      WHERE r.trigger_event = 'user.inactive'
        AND r.recipient_user_id = _row.user_id
        AND r.created_at > now() - interval '30 days'
    ) THEN CONTINUE; END IF;

    PERFORM public.dispatch_email_event(
      'user.inactive',
      _row.org_id,
      _row.email,
      _row.user_id,
      _row.user_id::text || ':' || to_char(now(),'YYYY-MM-DD'),
      jsonb_build_object(
        'firstName', COALESCE(split_part(_row.display_name,' ',1),'à toi'),
        'daysInactive', _days
      )
    );
  END LOOP;
END;
$$;

-- Schedule: every day at 09:00 UTC
SELECT cron.unschedule('email-login-reminders') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='email-login-reminders');
SELECT cron.schedule(
  'email-login-reminders',
  '0 9 * * *',
  $cron$ SELECT public.cron_dispatch_login_reminders(); $cron$
);