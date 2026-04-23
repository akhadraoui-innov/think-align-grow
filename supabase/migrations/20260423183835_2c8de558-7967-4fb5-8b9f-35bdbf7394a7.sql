-- Add is_active and match_suffix columns to webhook_allowlist_domains
ALTER TABLE public.webhook_allowlist_domains
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS match_suffix boolean NOT NULL DEFAULT true;

-- Update is_url_allowed to consider is_active and match_suffix
CREATE OR REPLACE FUNCTION public.is_url_allowed(_url text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _host text;
  _allowed boolean := false;
BEGIN
  IF _url IS NULL OR length(_url) = 0 THEN
    RETURN false;
  END IF;

  -- Extract host from URL (strip scheme + path + port)
  _host := lower(regexp_replace(_url, '^https?://([^/:?#]+).*$', '\1'));

  IF _host IS NULL OR _host = '' OR _host = _url THEN
    RETURN false;
  END IF;

  -- Block localhost
  IF _host IN ('localhost', '127.0.0.1', '::1', '0.0.0.0') THEN
    RETURN false;
  END IF;

  -- Block private IPv4 ranges (10/8, 172.16/12, 192.168/16, 169.254/16, 127/8)
  IF _host ~ '^10\.' OR
     _host ~ '^192\.168\.' OR
     _host ~ '^127\.' OR
     _host ~ '^169\.254\.' OR
     _host ~ '^172\.(1[6-9]|2[0-9]|3[0-1])\.' THEN
    RETURN false;
  END IF;

  -- Block link-local IPv6 (fe80::/10) and unique-local (fc00::/7)
  IF _host ~ '^fe[89ab]' OR _host ~ '^f[cd]' THEN
    RETURN false;
  END IF;

  -- Check active allowlist: exact match OR suffix match
  SELECT EXISTS (
    SELECT 1 FROM public.webhook_allowlist_domains
    WHERE is_active = true
      AND (
        (match_suffix = false AND domain = _host)
        OR
        (match_suffix = true AND (_host = domain OR _host LIKE '%.' || domain))
      )
  ) INTO _allowed;

  RETURN _allowed;
END;
$$;