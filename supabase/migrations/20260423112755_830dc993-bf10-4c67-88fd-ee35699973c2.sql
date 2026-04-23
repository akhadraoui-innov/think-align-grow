-- Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Encrypt JSON credentials with a server-managed key
CREATE OR REPLACE FUNCTION public.encrypt_email_credentials(_plain jsonb, _key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF _plain IS NULL THEN RETURN NULL; END IF;
  RETURN encode(
    extensions.pgp_sym_encrypt(_plain::text, _key),
    'base64'
  );
END;
$$;

-- Decrypt back to JSON text
CREATE OR REPLACE FUNCTION public.decrypt_email_credentials(_encrypted text, _key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF _encrypted IS NULL OR _encrypted = '' THEN RETURN NULL; END IF;
  RETURN extensions.pgp_sym_decrypt(decode(_encrypted, 'base64'), _key);
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- Restrict execution: only service_role (used by edge functions) can call
REVOKE ALL ON FUNCTION public.encrypt_email_credentials(jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.decrypt_email_credentials(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_email_credentials(jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_email_credentials(text, text) TO service_role;