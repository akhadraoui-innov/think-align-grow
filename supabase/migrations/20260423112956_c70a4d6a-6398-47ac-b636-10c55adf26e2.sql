-- Admin-callable wrapper. Uses a fixed key (must match EMAIL_CREDENTIALS_KEY in edge fn).
-- The key is intentionally hard-coded here to mirror the edge function default;
-- production deployments should set EMAIL_CREDENTIALS_KEY env var AND replace the key below
-- via a follow-up migration if rotated.
CREATE OR REPLACE FUNCTION public.encrypt_email_credentials_admin(_plain jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _key text := 'growthinnov_default_key_v1';
BEGIN
  -- Only SaaS team members can encrypt provider credentials
  IF NOT public.is_saas_team(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: SaaS team only';
  END IF;
  IF _plain IS NULL THEN RETURN NULL; END IF;
  RETURN encode(extensions.pgp_sym_encrypt(_plain::text, _key), 'base64');
END;
$$;

REVOKE ALL ON FUNCTION public.encrypt_email_credentials_admin(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.encrypt_email_credentials_admin(jsonb) TO authenticated;