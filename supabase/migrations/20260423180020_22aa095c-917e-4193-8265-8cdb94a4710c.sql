-- Provider health (reliability monitoring)
CREATE OR REPLACE FUNCTION public.get_email_provider_health(_hours int DEFAULT 24)
RETURNS TABLE (
  provider text,
  total bigint,
  sent bigint,
  failed bigint,
  bounced bigint,
  dlq bigint,
  failure_rate numeric,
  circuit_open boolean
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
  WITH stats AS (
    SELECT
      COALESCE(metadata->>'provider', 'unknown') AS p,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'sent') AS sent,
      COUNT(*) FILTER (WHERE status = 'failed') AS failed,
      COUNT(*) FILTER (WHERE status = 'bounced') AS bounced,
      COUNT(*) FILTER (WHERE status = 'dlq') AS dlq
    FROM public.email_send_log
    WHERE created_at > now() - (_hours || ' hours')::interval
    GROUP BY 1
  )
  SELECT
    s.p,
    s.total,
    s.sent,
    s.failed,
    s.bounced,
    s.dlq,
    ROUND((s.failed + s.bounced + s.dlq)::numeric / NULLIF(s.total, 0) * 100, 2),
    NOT public.check_circuit_breaker(s.p)
  FROM stats s
  ORDER BY s.total DESC;
END;
$$;

-- Quota alerts (orgs >80% of monthly limit)
CREATE OR REPLACE FUNCTION public.get_email_quota_alerts()
RETURNS TABLE (
  organization_id uuid,
  organization_name text,
  sent_count int,
  monthly_limit int,
  usage_percent numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _period date := date_trunc('month', now())::date;
BEGIN
  IF NOT public.is_saas_team(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: SaaS team only';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.name,
    COALESCE(qu.sent_count, 0)::int,
    COALESCE((public.get_org_effective_features(o.id)->>'email_monthly_limit')::int, 999999),
    ROUND(COALESCE(qu.sent_count, 0)::numeric
      / NULLIF(COALESCE((public.get_org_effective_features(o.id)->>'email_monthly_limit')::int, 999999), 0) * 100, 1)
  FROM public.organizations o
  LEFT JOIN public.email_quota_usage qu
    ON qu.organization_id = o.id AND qu.period_start = _period
  WHERE COALESCE(qu.sent_count, 0)::numeric
    / NULLIF(COALESCE((public.get_org_effective_features(o.id)->>'email_monthly_limit')::int, 999999), 0) > 0.80
  ORDER BY usage_percent DESC;
END;
$$;

-- DLQ replay (re-enqueue from dead-letter)
CREATE OR REPLACE FUNCTION public.replay_dlq_message(_message_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log record;
BEGIN
  IF NOT public.is_saas_team(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: SaaS team only';
  END IF;

  SELECT * INTO _log FROM public.email_send_log
  WHERE message_id = _message_id AND status = 'dlq'
  ORDER BY created_at DESC LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found_or_not_dlq');
  END IF;

  -- Mark as replay-pending and log activity
  INSERT INTO public.email_send_log (
    recipient_email, template_name, status, message_id, organization_id, metadata
  ) VALUES (
    _log.recipient_email, _log.template_name, 'pending', _log.message_id, _log.organization_id,
    COALESCE(_log.metadata, '{}'::jsonb) || jsonb_build_object('replay_of_dlq', true, 'replayed_by', auth.uid(), 'replayed_at', now())
  );

  PERFORM public.log_activity(
    'email.dlq.replayed', 'email_send_log', _message_id, _log.organization_id,
    jsonb_build_object('original_template', _log.template_name)
  );

  RETURN jsonb_build_object('ok', true, 'message_id', _message_id, 'queued_at', now());
END;
$$;