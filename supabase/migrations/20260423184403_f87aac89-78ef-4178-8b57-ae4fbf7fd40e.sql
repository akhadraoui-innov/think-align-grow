-- ============================================================
-- Lot E2 — Délivrabilité avancée (priority lanes + webhooks)
-- ============================================================

-- ─── 1. Webhook secrets ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_webhook_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_rotated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE (provider_code, organization_id)
);

ALTER TABLE public.email_webhook_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saas_team_manage_webhook_secrets" ON public.email_webhook_secrets;
CREATE POLICY "saas_team_manage_webhook_secrets"
ON public.email_webhook_secrets
FOR ALL
TO authenticated
USING (public.is_saas_team(auth.uid()))
WITH CHECK (public.is_saas_team(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_email_webhook_secrets_lookup
  ON public.email_webhook_secrets(provider_code, organization_id) WHERE is_active;

-- ─── 2. Suppressed_emails: enrichir ───────────────────────
ALTER TABLE public.suppressed_emails
  ADD COLUMN IF NOT EXISTS provider_code TEXT,
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_suppressed_emails_org_email
  ON public.suppressed_emails(COALESCE(organization_id::text,'global'), lower(email));

-- ─── 3. email_automation_runs: tracking délivrabilité ─────
ALTER TABLE public.email_automation_runs
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS complained_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT;

CREATE INDEX IF NOT EXISTS idx_eauto_provider_msgid
  ON public.email_automation_runs(provider_message_id) WHERE provider_message_id IS NOT NULL;

-- ─── 4. Priority lanes ─────────────────────────────────────
SELECT pgmq.create('gi_email_transactional');
SELECT pgmq.create('gi_email_marketing');
SELECT pgmq.create('gi_email_bulk');

-- ─── 5. RPC enqueue_email_priority ────────────────────────
CREATE OR REPLACE FUNCTION public.enqueue_email_priority(
  _payload JSONB,
  _priority TEXT DEFAULT 'transactional'
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE
  _queue TEXT;
  _msg_id BIGINT;
  _enriched JSONB;
BEGIN
  _queue := CASE lower(_priority)
    WHEN 'transactional' THEN 'gi_email_transactional'
    WHEN 'marketing'     THEN 'gi_email_marketing'
    WHEN 'bulk'          THEN 'gi_email_bulk'
    ELSE 'gi_email_transactional'
  END;

  _enriched := _payload || jsonb_build_object('priority', _priority, 'enqueued_at', now());
  SELECT pgmq.send(_queue, _enriched) INTO _msg_id;
  RETURN _msg_id;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_email_priority(JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email_priority(JSONB, TEXT) TO authenticated, service_role;

-- ─── 6. read / delete priority ────────────────────────────
CREATE OR REPLACE FUNCTION public.read_priority_email_batch(
  _priority TEXT,
  _batch_size INT DEFAULT 10,
  _vt INT DEFAULT 30
)
RETURNS TABLE(msg_id BIGINT, read_ct INT, enqueued_at TIMESTAMPTZ, vt TIMESTAMPTZ, message JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE
  _queue TEXT;
BEGIN
  _queue := CASE lower(_priority)
    WHEN 'transactional' THEN 'gi_email_transactional'
    WHEN 'marketing'     THEN 'gi_email_marketing'
    WHEN 'bulk'          THEN 'gi_email_bulk'
    ELSE 'gi_email_transactional'
  END;
  RETURN QUERY SELECT m.msg_id, m.read_ct, m.enqueued_at, m.vt, m.message
               FROM pgmq.read(_queue, _vt, _batch_size) AS m;
END;
$$;

REVOKE ALL ON FUNCTION public.read_priority_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_priority_email_batch(TEXT, INT, INT) TO service_role;

CREATE OR REPLACE FUNCTION public.delete_priority_email(
  _priority TEXT,
  _msg_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE
  _queue TEXT;
BEGIN
  _queue := CASE lower(_priority)
    WHEN 'transactional' THEN 'gi_email_transactional'
    WHEN 'marketing'     THEN 'gi_email_marketing'
    WHEN 'bulk'          THEN 'gi_email_bulk'
    ELSE 'gi_email_transactional'
  END;
  RETURN pgmq.delete(_queue, _msg_id);
END;
$$;

REVOKE ALL ON FUNCTION public.delete_priority_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_priority_email(TEXT, BIGINT) TO service_role;

-- ─── 7. Backlog metrics ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_priority_lane_metrics()
RETURNS TABLE(priority TEXT, queue_length BIGINT, total_messages BIGINT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  RETURN QUERY
  SELECT 'transactional'::TEXT,
         (SELECT m.queue_length FROM pgmq.metrics('gi_email_transactional') m),
         (SELECT m.total_messages FROM pgmq.metrics('gi_email_transactional') m)
  UNION ALL
  SELECT 'marketing'::TEXT,
         (SELECT m.queue_length FROM pgmq.metrics('gi_email_marketing') m),
         (SELECT m.total_messages FROM pgmq.metrics('gi_email_marketing') m)
  UNION ALL
  SELECT 'bulk'::TEXT,
         (SELECT m.queue_length FROM pgmq.metrics('gi_email_bulk') m),
         (SELECT m.total_messages FROM pgmq.metrics('gi_email_bulk') m);
END;
$$;

REVOKE ALL ON FUNCTION public.get_priority_lane_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_priority_lane_metrics() TO authenticated, service_role;

-- ─── 8. Rotate webhook secret ──────────────────────────────
CREATE OR REPLACE FUNCTION public.rotate_email_webhook_secret(
  _provider_code TEXT,
  _organization_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_secret TEXT;
BEGIN
  IF NOT public.is_saas_team(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  _new_secret := encode(gen_random_bytes(32), 'hex');

  INSERT INTO public.email_webhook_secrets (provider_code, organization_id, secret, created_by)
  VALUES (_provider_code, _organization_id, _new_secret, auth.uid())
  ON CONFLICT (provider_code, organization_id)
  DO UPDATE SET 
    secret = EXCLUDED.secret,
    last_rotated_at = now(),
    is_active = TRUE,
    created_by = auth.uid();

  RETURN _new_secret;
END;
$$;

REVOKE ALL ON FUNCTION public.rotate_email_webhook_secret(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rotate_email_webhook_secret(TEXT, UUID) TO authenticated;

-- ─── 9. Get webhook secret (used by edge fn) ──────────────
CREATE OR REPLACE FUNCTION public.get_email_webhook_secret(
  _provider_code TEXT,
  _organization_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT secret FROM public.email_webhook_secrets
  WHERE provider_code = _provider_code
    AND (organization_id = _organization_id OR (organization_id IS NULL AND _organization_id IS NULL))
    AND is_active
  ORDER BY organization_id NULLS LAST
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_email_webhook_secret(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_webhook_secret(TEXT, UUID) TO service_role;