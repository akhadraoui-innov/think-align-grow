
-- ═══════════════════════════════════════════════════════════════════
-- v2.6.1 LOT A — Fondations Email & Plans
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- 1. Helper : get_org_effective_features
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_org_effective_features(_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan_features jsonb := '{}'::jsonb;
  _override jsonb := '{}'::jsonb;
BEGIN
  IF _org_id IS NULL THEN
    -- Default platform features (used for global emails not tied to an org)
    RETURN '{"custom_email_domain": false, "custom_email_provider": false, "email_co_branding": false, "email_tracking": true}'::jsonb;
  END IF;

  SELECT COALESCE(sp.features, '{}'::jsonb)
    INTO _plan_features
  FROM public.organization_subscriptions os
  JOIN public.subscription_plans sp ON sp.id = os.plan_id
  WHERE os.organization_id = _org_id
    AND os.status IN ('active','trial')
    AND (os.expires_at IS NULL OR os.expires_at > now())
  ORDER BY os.started_at DESC
  LIMIT 1;

  SELECT COALESCE(o.email_features_override, '{}'::jsonb)
    INTO _override
  FROM public.organizations o
  WHERE o.id = _org_id;

  -- Override wins over plan features
  RETURN COALESCE(_plan_features, '{}'::jsonb) || COALESCE(_override, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_org_effective_features(uuid) TO authenticated, service_role;

-- ───────────────────────────────────────────────────────────────────
-- 2. Email quota table + helper
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_quota_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start date NOT NULL DEFAULT date_trunc('month', now())::date,
  sent_count integer NOT NULL DEFAULT 0,
  plan_limit integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_quota_org_period
  ON public.email_quota_usage(COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), period_start);

ALTER TABLE public.email_quota_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quota_view_org_admin" ON public.email_quota_usage;
CREATE POLICY "quota_view_org_admin" ON public.email_quota_usage
  FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id));

DROP POLICY IF EXISTS "quota_view_saas" ON public.email_quota_usage;
CREATE POLICY "quota_view_saas" ON public.email_quota_usage
  FOR SELECT TO authenticated
  USING (public.is_saas_team(auth.uid()));

DROP POLICY IF EXISTS "quota_manage_saas" ON public.email_quota_usage;
CREATE POLICY "quota_manage_saas" ON public.email_quota_usage
  FOR ALL TO authenticated
  USING (public.is_saas_team(auth.uid()))
  WITH CHECK (public.is_saas_team(auth.uid()));

CREATE OR REPLACE FUNCTION public.check_email_quota(_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _features jsonb;
  _limit int;
  _used int;
  _period date := date_trunc('month', now())::date;
BEGIN
  IF _org_id IS NULL THEN RETURN true; END IF;
  _features := public.get_org_effective_features(_org_id);
  _limit := COALESCE((_features->>'email_monthly_limit')::int, 999999);
  SELECT COALESCE(sent_count, 0) INTO _used
    FROM public.email_quota_usage
    WHERE organization_id = _org_id AND period_start = _period;
  RETURN COALESCE(_used, 0) < _limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_email_quota(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.increment_email_quota(_org_id uuid, _by int DEFAULT 1)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _period date := date_trunc('month', now())::date;
BEGIN
  IF _org_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.email_quota_usage(organization_id, period_start, sent_count)
    VALUES (_org_id, _period, _by)
  ON CONFLICT (COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), period_start)
    DO UPDATE SET sent_count = email_quota_usage.sent_count + _by,
                  updated_at = now();
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_email_quota(uuid, int) TO service_role;

-- ───────────────────────────────────────────────────────────────────
-- 3. Circuit breaker per provider
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_circuit_breaker(_provider_code text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total int;
  _failed int;
  _failure_rate numeric;
BEGIN
  SELECT COUNT(*) FILTER (WHERE status IN ('sent','failed','bounced','dlq')),
         COUNT(*) FILTER (WHERE status IN ('failed','dlq','bounced'))
    INTO _total, _failed
  FROM (
    SELECT status FROM public.email_send_log
    WHERE metadata->>'provider' = _provider_code
    ORDER BY created_at DESC
    LIMIT 100
  ) recent;

  IF _total < 20 THEN RETURN true; END IF; -- not enough data, allow

  _failure_rate := _failed::numeric / NULLIF(_total, 0);
  RETURN _failure_rate < 0.20;
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_circuit_breaker(text) TO authenticated, service_role;

-- ───────────────────────────────────────────────────────────────────
-- 4. Idempotency keys
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_idempotency_keys (
  key text PRIMARY KEY,
  response_payload jsonb,
  organization_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_idem_keys_expires ON public.email_idempotency_keys(expires_at);

ALTER TABLE public.email_idempotency_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "idem_service_only" ON public.email_idempotency_keys;
CREATE POLICY "idem_service_only" ON public.email_idempotency_keys
  FOR ALL TO authenticated
  USING (public.is_saas_team(auth.uid()))
  WITH CHECK (public.is_saas_team(auth.uid()));

-- ───────────────────────────────────────────────────────────────────
-- 5. Audit log IMMUTABLE with hash chain SHA-256
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs_immutable (
  id bigserial PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,
  actor_email text,
  organization_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  prev_hash text,
  current_hash text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_imm_occurred ON public.audit_logs_immutable(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_imm_org ON public.audit_logs_immutable(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_imm_actor ON public.audit_logs_immutable(actor_id);

ALTER TABLE public.audit_logs_immutable ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_imm_view_saas" ON public.audit_logs_immutable;
CREATE POLICY "audit_imm_view_saas" ON public.audit_logs_immutable
  FOR SELECT TO authenticated
  USING (public.is_saas_team(auth.uid()));

-- NO INSERT/UPDATE/DELETE policies for non-SaaS = append-only via RPC only

CREATE OR REPLACE FUNCTION public.append_audit_log(
  _action text,
  _entity_type text DEFAULT NULL,
  _entity_id text DEFAULT NULL,
  _organization_id uuid DEFAULT NULL,
  _payload jsonb DEFAULT '{}'::jsonb
) RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _last_hash text;
  _actor_email text;
  _new_hash text;
  _new_id bigint;
  _occurred timestamptz := now();
  _serialized text;
BEGIN
  SELECT current_hash INTO _last_hash
  FROM public.audit_logs_immutable
  ORDER BY id DESC LIMIT 1;

  SELECT email INTO _actor_email FROM auth.users WHERE id = auth.uid();

  _serialized := COALESCE(_last_hash,'GENESIS')
    || '|' || COALESCE(auth.uid()::text, 'system')
    || '|' || _action
    || '|' || COALESCE(_entity_type,'')
    || '|' || COALESCE(_entity_id,'')
    || '|' || COALESCE(_organization_id::text,'')
    || '|' || _payload::text
    || '|' || _occurred::text;

  _new_hash := encode(extensions.digest(_serialized, 'sha256'), 'hex');

  INSERT INTO public.audit_logs_immutable(
    occurred_at, actor_id, actor_email, organization_id, action,
    entity_type, entity_id, payload, prev_hash, current_hash
  ) VALUES (
    _occurred, auth.uid(), _actor_email, _organization_id, _action,
    _entity_type, _entity_id, COALESCE(_payload, '{}'::jsonb), _last_hash, _new_hash
  ) RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.append_audit_log(text, text, text, uuid, jsonb) TO authenticated, service_role;

-- Block direct UPDATE/DELETE via trigger (defense in depth)
CREATE OR REPLACE FUNCTION public.audit_logs_immutable_block()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs_immutable is append-only (use append_audit_log RPC)';
END;
$$;

DROP TRIGGER IF EXISTS audit_imm_no_update ON public.audit_logs_immutable;
CREATE TRIGGER audit_imm_no_update
  BEFORE UPDATE OR DELETE ON public.audit_logs_immutable
  FOR EACH ROW EXECUTE FUNCTION public.audit_logs_immutable_block();

-- Integrity verification view
CREATE OR REPLACE VIEW public.v_audit_log_integrity AS
WITH ordered AS (
  SELECT id, prev_hash, current_hash,
         LAG(current_hash) OVER (ORDER BY id) AS computed_prev
  FROM public.audit_logs_immutable
)
SELECT id,
       prev_hash,
       computed_prev,
       (prev_hash IS NOT DISTINCT FROM computed_prev) AS chain_ok
FROM ordered;

GRANT SELECT ON public.v_audit_log_integrity TO authenticated;
