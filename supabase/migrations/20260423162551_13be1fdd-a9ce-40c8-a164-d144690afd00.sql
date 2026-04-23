
-- =============================================================================
-- Lot A finalisé : dispatch_email_event async + HMAC + SSRF guard
-- =============================================================================

-- ── 1. Helper Vault pour stocker/lire le secret HMAC ─────────────────────────
CREATE OR REPLACE FUNCTION public.get_or_create_email_hmac_secret()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  _secret text;
  _id uuid;
BEGIN
  -- Try to read existing secret
  SELECT decrypted_secret INTO _secret
  FROM vault.decrypted_secrets
  WHERE name = 'email_hmac_secret'
  LIMIT 1;

  IF _secret IS NOT NULL THEN
    RETURN _secret;
  END IF;

  -- Generate new 256-bit random hex secret and persist in vault
  _secret := encode(extensions.gen_random_bytes(32), 'hex');
  SELECT vault.create_secret(_secret, 'email_hmac_secret', 'HMAC signing key for outbound email webhooks') INTO _id;
  RETURN _secret;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_email_hmac_secret() FROM public, anon, authenticated;

-- ── 2. Sign payload (HMAC SHA-256) ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sign_email_payload(_payload jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _secret text;
  _sig text;
BEGIN
  _secret := public.get_or_create_email_hmac_secret();
  _sig := encode(
    extensions.hmac(_payload::text::bytea, _secret::bytea, 'sha256'),
    'hex'
  );
  RETURN 'sha256=' || _sig;
END;
$$;

REVOKE ALL ON FUNCTION public.sign_email_payload(jsonb) FROM public, anon, authenticated;

-- ── 3. SSRF guard : allowlist hôtes autorisés pour net.http_post sortant ─────
CREATE OR REPLACE FUNCTION public.is_url_allowed(_url text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  _host text;
BEGIN
  IF _url IS NULL OR _url = '' THEN RETURN false; END IF;
  IF _url !~ '^https://' THEN RETURN false; END IF;

  _host := regexp_replace(_url, '^https://([^/:]+).*$', '\1');

  -- Block private/loopback/metadata IP ranges (textual heuristic)
  IF _host ~ '^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[01])\.|0\.|::1|localhost$)' THEN
    RETURN false;
  END IF;

  -- Allowlist : Supabase functions endpoint of this project + future custom domains
  IF _host = 'yucwxukikfianvaokebs.supabase.co' THEN RETURN true; END IF;
  IF _host LIKE '%.lovable.app' THEN RETURN true; END IF;
  IF _host LIKE '%.growthinnov.com' THEN RETURN true; END IF;
  IF _host = 'heeplab.com' OR _host LIKE '%.heeplab.com' THEN RETURN true; END IF;

  RETURN false;
END;
$$;

-- ── 4. Refactor dispatch_email_event : net.http_post async + HMAC + idempotency ─
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
SET search_path = public, extensions, net
AS $$
DECLARE
  _url text := 'https://yucwxukikfianvaokebs.supabase.co/functions/v1/trigger-email';
  _anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1Y3d4dWtpa2ZpYW52YW9rZWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDk3NTcsImV4cCI6MjA4ODU4NTc1N30.F28P1HlX6nF7xNOStb4YabS8SEKddru5RegUR2m0sFQ';
  _body jsonb;
  _signature text;
  _idem_key text;
BEGIN
  IF _recipient_email IS NULL OR _recipient_email = '' THEN RETURN; END IF;
  IF NOT public.is_url_allowed(_url) THEN
    RAISE WARNING '[dispatch_email_event] SSRF blocked: %', _url;
    RETURN;
  END IF;

  _body := jsonb_build_object(
    'event', _event,
    'organization_id', _organization_id,
    'recipient_email', _recipient_email,
    'recipient_user_id', _recipient_user_id,
    'entity_id', _entity_id,
    'payload', COALESCE(_payload, '{}'::jsonb)
  );

  _signature := public.sign_email_payload(_body);
  _idem_key := encode(extensions.digest(
    concat_ws('|', _event, COALESCE(_entity_id, ''), _recipient_email, COALESCE(_organization_id::text, '')),
    'sha256'
  ), 'hex');

  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon,
      'X-Event-Signature', _signature,
      'X-Idempotency-Key', _idem_key
    ),
    body := _body,
    timeout_milliseconds := 8000
  );
EXCEPTION WHEN OTHERS THEN
  -- Never block business operations on email dispatch failure
  RAISE WARNING '[dispatch_email_event] failed: %', SQLERRM;
END;
$$;

-- ── 5. Bootstrap : génère le secret HMAC immédiatement ───────────────────────
SELECT public.get_or_create_email_hmac_secret();
