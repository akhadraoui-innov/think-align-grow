-- get_system_health: agrège l'état de la plateforme
CREATE OR REPLACE FUNCTION public.get_system_health()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _providers jsonb;
  _cron jsonb;
  _queues jsonb;
  _audit jsonb;
  _quota_alerts jsonb;
  _secrets jsonb;
  _brand jsonb;
  _critical_count int := 0;
BEGIN
  IF NOT public.is_saas_team(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: SaaS team only';
  END IF;

  -- Providers (last 24h health)
  SELECT COALESCE(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
    INTO _providers
  FROM public.get_email_provider_health(24) p;

  -- Cron jobs
  SELECT COALESCE(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
    INTO _cron
  FROM public.get_email_cron_health() c;

  -- Priority lanes / queue backlogs
  SELECT COALESCE(jsonb_agg(to_jsonb(q)), '[]'::jsonb)
    INTO _queues
  FROM public.get_priority_lane_metrics() q;

  -- Audit chain
  SELECT to_jsonb(a) INTO _audit FROM public.verify_audit_chain_integrity() a;

  -- Quota alerts (orgs > 80%)
  SELECT COALESCE(jsonb_agg(to_jsonb(qa)), '[]'::jsonb)
    INTO _quota_alerts
  FROM public.get_email_quota_alerts() qa;

  -- Secrets vault status: count of expected keys present
  _secrets := jsonb_build_object(
    'email_hmac_secret', EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'email_hmac_secret'),
    'count_total', (SELECT COUNT(*) FROM vault.decrypted_secrets)
  );

  -- Brand assets: presence of any logo upload in storage bucket
  _brand := jsonb_build_object(
    'logo_uploaded', EXISTS (
      SELECT 1 FROM storage.objects
       WHERE bucket_id IN ('email-assets','brand-assets','public')
         AND name ILIKE '%logo%'
       LIMIT 1
    )
  );

  -- Compute critical findings count
  IF (_audit->>'valid')::boolean IS FALSE THEN
    _critical_count := _critical_count + 1;
  END IF;

  -- Provider down counted as critical
  SELECT _critical_count + COALESCE(SUM(CASE WHEN (p->>'circuit_open')::boolean THEN 1 ELSE 0 END), 0)::int
    INTO _critical_count
  FROM jsonb_array_elements(_providers) p;

  RETURN jsonb_build_object(
    'generated_at', now(),
    'providers', _providers,
    'cron_jobs', _cron,
    'pgmq_backlogs', _queues,
    'audit_chain', _audit,
    'quota_alerts', _quota_alerts,
    'secrets_status', _secrets,
    'brand_assets_status', _brand,
    'critical_count', _critical_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_system_health() TO authenticated;

-- get_edge_function_metrics: best-effort aggregation from email_send_log (latency_ms field)
CREATE OR REPLACE FUNCTION public.get_edge_function_metrics(_hours integer DEFAULT 24)
RETURNS TABLE(
  function_name text,
  invocations bigint,
  errors bigint,
  p50_ms numeric,
  p95_ms numeric,
  error_rate numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_saas_team(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: SaaS team only';
  END IF;

  RETURN QUERY
  WITH src AS (
    SELECT
      COALESCE(metadata->>'edge_function', 'trigger-email') AS fn,
      status,
      COALESCE((metadata->>'latency_ms')::numeric, NULL) AS latency
    FROM public.email_send_log
    WHERE created_at >= now() - make_interval(hours => _hours)
  )
  SELECT
    fn AS function_name,
    COUNT(*)::bigint AS invocations,
    COUNT(*) FILTER (WHERE status IN ('failed','dlq','bounced'))::bigint AS errors,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY latency) AS p50_ms,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY latency) AS p95_ms,
    ROUND(
      COUNT(*) FILTER (WHERE status IN ('failed','dlq','bounced'))::numeric
      / NULLIF(COUNT(*), 0) * 100, 2
    ) AS error_rate
  FROM src
  GROUP BY fn
  ORDER BY invocations DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_edge_function_metrics(integer) TO authenticated;