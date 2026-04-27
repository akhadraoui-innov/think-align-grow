-- ============================================================
-- LOT 9.3 — Vault pgsodium pour secrets sensibles
-- ============================================================

-- 1. Activer Vault (extension Supabase native, basée sur pgsodium)
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault CASCADE;

-- 2. Helper: récupérer un secret déchiffré + audit log
CREATE OR REPLACE FUNCTION public.app_get_secret(_secret_id uuid, _context text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret text;
BEGIN
  IF _secret_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE id = _secret_id;

  -- Audit best-effort (ne bloque jamais)
  BEGIN
    INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata, created_at)
    VALUES (
      auth.uid(),
      'vault.secret_accessed',
      'vault_secret',
      _secret_id::text,
      jsonb_build_object('context', _context, 'found', v_secret IS NOT NULL),
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN v_secret;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.app_get_secret(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.app_get_secret(uuid, text) TO service_role;

-- 3. Helper: stocker/mettre à jour un secret en Vault, retourner son id
CREATE OR REPLACE FUNCTION public.app_store_secret(_value text, _name text DEFAULT NULL, _existing_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_id uuid;
  v_name text;
BEGIN
  IF _value IS NULL OR _value = '' THEN
    RETURN _existing_id;
  END IF;

  v_name := COALESCE(_name, 'app_secret_' || gen_random_uuid()::text);

  IF _existing_id IS NOT NULL THEN
    -- Update existing secret
    UPDATE vault.secrets
    SET secret = _value, updated_at = now()
    WHERE id = _existing_id
    RETURNING id INTO v_id;
    IF v_id IS NOT NULL THEN
      RETURN v_id;
    END IF;
  END IF;

  -- Create new secret
  v_id := vault.create_secret(_value, v_name);
  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.app_store_secret(text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.app_store_secret(text, text, uuid) TO service_role;

-- 4. Ajouter colonnes secret_id (rétro-compatibles)
ALTER TABLE public.ai_configurations
  ADD COLUMN IF NOT EXISTS api_key_secret_id uuid;

ALTER TABLE public.email_provider_configs
  ADD COLUMN IF NOT EXISTS credentials_secret_id uuid;

ALTER TABLE public.email_webhook_secrets
  ADD COLUMN IF NOT EXISTS secret_secret_id uuid;

-- 5. Triggers d'auto-chiffrement : toute nouvelle valeur en clair → Vault
CREATE OR REPLACE FUNCTION public.tg_encrypt_ai_api_key()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
BEGIN
  IF NEW.api_key IS NOT NULL AND NEW.api_key <> '' THEN
    NEW.api_key_secret_id := public.app_store_secret(
      NEW.api_key,
      'ai_config_' || COALESCE(NEW.id::text, 'new'),
      NEW.api_key_secret_id
    );
    NEW.api_key := NULL;  -- vider la colonne legacy
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS encrypt_ai_api_key ON public.ai_configurations;
CREATE TRIGGER encrypt_ai_api_key
  BEFORE INSERT OR UPDATE OF api_key ON public.ai_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_encrypt_ai_api_key();

CREATE OR REPLACE FUNCTION public.tg_encrypt_email_provider_credentials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
BEGIN
  IF NEW.credentials IS NOT NULL AND NEW.credentials::text NOT IN ('{}', 'null') THEN
    NEW.credentials_secret_id := public.app_store_secret(
      NEW.credentials::text,
      'email_provider_' || COALESCE(NEW.id::text, 'new'),
      NEW.credentials_secret_id
    );
    NEW.credentials := '{}'::jsonb;  -- vider la colonne legacy
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS encrypt_email_provider_credentials ON public.email_provider_configs;
CREATE TRIGGER encrypt_email_provider_credentials
  BEFORE INSERT OR UPDATE OF credentials ON public.email_provider_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_encrypt_email_provider_credentials();

CREATE OR REPLACE FUNCTION public.tg_encrypt_webhook_secret()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
BEGIN
  IF NEW.secret IS NOT NULL AND NEW.secret <> '' THEN
    NEW.secret_secret_id := public.app_store_secret(
      NEW.secret,
      'webhook_' || COALESCE(NEW.provider_code, 'unknown') || '_' || COALESCE(NEW.id::text, 'new'),
      NEW.secret_secret_id
    );
    NEW.secret := NULL;  -- vider la colonne legacy
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS encrypt_webhook_secret ON public.email_webhook_secrets;
CREATE TRIGGER encrypt_webhook_secret
  BEFORE INSERT OR UPDATE OF secret ON public.email_webhook_secrets
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_encrypt_webhook_secret();

-- 6. RPC pour les EFs : récupérer api_key déchiffrée d'une config IA
CREATE OR REPLACE FUNCTION public.get_ai_api_key(_config_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret_id uuid;
  v_legacy text;
BEGIN
  SELECT api_key_secret_id, api_key
  INTO v_secret_id, v_legacy
  FROM public.ai_configurations
  WHERE id = _config_id;

  IF v_secret_id IS NOT NULL THEN
    RETURN public.app_get_secret(v_secret_id, 'ai_config:' || _config_id::text);
  END IF;

  RETURN v_legacy;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_ai_api_key(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_api_key(uuid) TO service_role;

-- 7. RPC : récupérer credentials JSONB déchiffrés d'un provider email
CREATE OR REPLACE FUNCTION public.get_email_provider_credentials(_config_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret_id uuid;
  v_legacy jsonb;
  v_decrypted text;
BEGIN
  SELECT credentials_secret_id, credentials
  INTO v_secret_id, v_legacy
  FROM public.email_provider_configs
  WHERE id = _config_id;

  IF v_secret_id IS NOT NULL THEN
    v_decrypted := public.app_get_secret(v_secret_id, 'email_provider:' || _config_id::text);
    IF v_decrypted IS NOT NULL THEN
      RETURN v_decrypted::jsonb;
    END IF;
  END IF;

  RETURN COALESCE(v_legacy, '{}'::jsonb);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_email_provider_credentials(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_provider_credentials(uuid) TO service_role;

-- 8. RPC : récupérer secret webhook déchiffré
CREATE OR REPLACE FUNCTION public.get_email_webhook_secret(_provider_code text, _organization_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret_id uuid;
  v_legacy text;
BEGIN
  SELECT secret_secret_id, secret
  INTO v_secret_id, v_legacy
  FROM public.email_webhook_secrets
  WHERE provider_code = _provider_code
    AND (organization_id = _organization_id OR (organization_id IS NULL AND _organization_id IS NULL))
  LIMIT 1;

  IF v_secret_id IS NOT NULL THEN
    RETURN public.app_get_secret(v_secret_id, 'webhook:' || _provider_code);
  END IF;

  RETURN v_legacy;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_email_webhook_secret(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_webhook_secret(text, uuid) TO service_role;