-- ============================================================================
-- Lot E1 — Sécurité & Compliance Enterprise
-- ============================================================================

-- 1) Hash-chain BEFORE INSERT trigger
CREATE OR REPLACE FUNCTION public.audit_logs_immutable_compute_hash()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _last_hash text;
  _serialized text;
BEGIN
  SELECT current_hash INTO _last_hash
  FROM public.audit_logs_immutable
  ORDER BY id DESC
  LIMIT 1;

  NEW.prev_hash := COALESCE(_last_hash, 'GENESIS');

  _serialized := concat_ws('|',
    NEW.prev_hash,
    COALESCE(NEW.actor_id::text, ''),
    COALESCE(NEW.actor_email, ''),
    COALESCE(NEW.organization_id::text, ''),
    NEW.action,
    COALESCE(NEW.entity_type, ''),
    COALESCE(NEW.entity_id, ''),
    COALESCE(NEW.payload::text, '{}'),
    COALESCE(NEW.occurred_at::text, now()::text)
  );

  NEW.current_hash := encode(extensions.digest(_serialized, 'sha256'), 'hex');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_imm_compute_hash ON public.audit_logs_immutable;
CREATE TRIGGER audit_imm_compute_hash
  BEFORE INSERT ON public.audit_logs_immutable
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_logs_immutable_compute_hash();

-- 2) Chain integrity verification
CREATE OR REPLACE FUNCTION public.verify_audit_chain_integrity()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _row record;
  _expected_prev text := 'GENESIS';
  _recomputed text;
  _serialized text;
  _broken_id bigint;
  _count bigint := 0;
BEGIN
  IF NOT public.is_saas_team(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR _row IN
    SELECT id, prev_hash, current_hash, actor_id, actor_email,
           organization_id, action, entity_type, entity_id, payload, occurred_at
    FROM public.audit_logs_immutable
    ORDER BY id ASC
  LOOP
    _count := _count + 1;
    IF _row.prev_hash IS DISTINCT FROM _expected_prev THEN
      _broken_id := _row.id;
      EXIT;
    END IF;

    _serialized := concat_ws('|',
      _row.prev_hash,
      COALESCE(_row.actor_id::text, ''),
      COALESCE(_row.actor_email, ''),
      COALESCE(_row.organization_id::text, ''),
      _row.action,
      COALESCE(_row.entity_type, ''),
      COALESCE(_row.entity_id, ''),
      COALESCE(_row.payload::text, '{}'),
      COALESCE(_row.occurred_at::text, '')
    );
    _recomputed := encode(extensions.digest(_serialized, 'sha256'), 'hex');

    IF _recomputed IS DISTINCT FROM _row.current_hash THEN
      _broken_id := _row.id;
      EXIT;
    END IF;

    _expected_prev := _row.current_hash;
  END LOOP;

  RETURN jsonb_build_object(
    'valid', _broken_id IS NULL,
    'broken_at_id', _broken_id,
    'total_rows', _count,
    'verified_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_audit_chain_integrity() TO authenticated;

-- 3) Helper RPC to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _entity_type text DEFAULT NULL,
  _entity_id text DEFAULT NULL,
  _organization_id uuid DEFAULT NULL,
  _payload jsonb DEFAULT '{}'::jsonb
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id bigint;
  _email text;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.audit_logs_immutable(
    actor_id, actor_email, organization_id, action, entity_type, entity_id, payload
  ) VALUES (
    auth.uid(), _email, _organization_id, _action, _entity_type, _entity_id, COALESCE(_payload, '{}'::jsonb)
  )
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_audit_event(text, text, text, uuid, jsonb) TO authenticated;

-- 4) Dynamic webhook allowlist
CREATE TABLE IF NOT EXISTS public.webhook_allowlist_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  description text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_allowlist_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wad_view_saas" ON public.webhook_allowlist_domains;
CREATE POLICY "wad_view_saas" ON public.webhook_allowlist_domains
  FOR SELECT TO authenticated USING (public.is_saas_team(auth.uid()));

DROP POLICY IF EXISTS "wad_manage_super_admin" ON public.webhook_allowlist_domains;
CREATE POLICY "wad_manage_super_admin" ON public.webhook_allowlist_domains
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

INSERT INTO public.webhook_allowlist_domains(domain, description) VALUES
  ('yucwxukikfianvaokebs.supabase.co', 'Project Supabase functions endpoint'),
  ('lovable.app', 'Lovable preview/published apps (suffix match)'),
  ('growthinnov.com', 'Growthinnov production domain (suffix match)'),
  ('heeplab.com', 'Heeplab production domain (suffix match)'),
  ('api.resend.com', 'Resend email API'),
  ('api.sendgrid.com', 'SendGrid email API')
ON CONFLICT (domain) DO NOTHING;

-- 5) Upgrade is_url_allowed to use dynamic allowlist
CREATE OR REPLACE FUNCTION public.is_url_allowed(_url text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  _host text;
  _allowed boolean := false;
BEGIN
  IF _url IS NULL OR _url = '' THEN RETURN false; END IF;
  IF _url !~ '^https://' THEN RETURN false; END IF;

  _host := regexp_replace(_url, '^https://([^/:]+).*$', '\1');

  IF _host ~ '^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[01])\.|0\.|::1|localhost$)' THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.webhook_allowlist_domains
    WHERE _host = domain OR _host LIKE '%.' || domain
  ) INTO _allowed;

  RETURN _allowed;
END;
$$;

-- 6) Email security flags
CREATE TABLE IF NOT EXISTS public.email_security_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  template_id uuid,
  recipient_email text,
  flag_type text NOT NULL,
  severity text NOT NULL DEFAULT 'high',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_html text,
  status text NOT NULL DEFAULT 'blocked',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_esf_org ON public.email_security_flags(organization_id);
CREATE INDEX IF NOT EXISTS idx_esf_status ON public.email_security_flags(status);
CREATE INDEX IF NOT EXISTS idx_esf_created ON public.email_security_flags(created_at DESC);

ALTER TABLE public.email_security_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "esf_view_saas" ON public.email_security_flags;
CREATE POLICY "esf_view_saas" ON public.email_security_flags
  FOR SELECT TO authenticated
  USING (public.is_saas_team(auth.uid()));

DROP POLICY IF EXISTS "esf_manage_saas" ON public.email_security_flags;
CREATE POLICY "esf_manage_saas" ON public.email_security_flags
  FOR ALL TO authenticated
  USING (public.is_saas_team(auth.uid()))
  WITH CHECK (public.is_saas_team(auth.uid()));

DROP POLICY IF EXISTS "esf_service_insert" ON public.email_security_flags;
CREATE POLICY "esf_service_insert" ON public.email_security_flags
  FOR INSERT TO service_role WITH CHECK (true);

-- 7) Review helper
CREATE OR REPLACE FUNCTION public.review_email_security_flag(
  _flag_id uuid,
  _decision text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_saas_team(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid decision';
  END IF;

  UPDATE public.email_security_flags
  SET status = _decision,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = _flag_id AND status = 'blocked';

  PERFORM public.log_audit_event(
    'email.security_flag.reviewed',
    'email_security_flag',
    _flag_id::text,
    NULL,
    jsonb_build_object('decision', _decision)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_email_security_flag(uuid, text) TO authenticated;