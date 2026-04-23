DROP VIEW IF EXISTS public.email_cron_health;

CREATE OR REPLACE FUNCTION public.get_email_cron_health()
RETURNS TABLE (
  jobname text,
  schedule text,
  active boolean,
  last_status text,
  last_start timestamptz,
  last_end timestamptz,
  last_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_saas_team(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: SaaS team only';
  END IF;

  RETURN QUERY
  SELECT
    j.jobname::text,
    j.schedule::text,
    j.active,
    jr.status::text,
    jr.start_time,
    jr.end_time,
    jr.return_message::text
  FROM cron.job j
  LEFT JOIN LATERAL (
    SELECT * FROM cron.job_run_details d
    WHERE d.jobid = j.jobid
    ORDER BY d.start_time DESC LIMIT 1
  ) jr ON true
  WHERE j.jobname IN (
    'purge_expired_email_tokens_daily',
    'process-email-queue',
    'cron_dispatch_login_reminders'
  );
END;
$$;