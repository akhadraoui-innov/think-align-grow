
-- D1: Email Preferences Center & Unsubscribe System

-- Categories (seed)
CREATE TABLE IF NOT EXISTS public.email_categories (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_required boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.email_categories (code, name, description, is_required, sort_order) VALUES
  ('transactional', 'Emails transactionnels', 'Confirmations, reçus, sécurité du compte. Obligatoires.', true, 1),
  ('product', 'Mises à jour produit', 'Nouvelles fonctionnalités et améliorations.', false, 2),
  ('academy', 'Academy & formations', 'Rappels de cours, certificats, suivi pédagogique.', false, 3),
  ('marketing', 'Marketing & événements', 'Newsletters, webinaires, offres commerciales.', false, 4),
  ('digest', 'Synthèses hebdomadaires', 'Résumés d''activité de votre organisation.', false, 5)
ON CONFLICT (code) DO NOTHING;

-- Per-recipient preferences (keyed by email, optional user link)
CREATE TABLE IF NOT EXISTS public.email_subscriber_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_code text NOT NULL REFERENCES public.email_categories(code) ON DELETE CASCADE,
  subscribed boolean NOT NULL DEFAULT true,
  double_opt_in_confirmed_at timestamptz,
  source text DEFAULT 'signup',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, organization_id, category_code)
);

CREATE INDEX IF NOT EXISTS idx_email_pref_email ON public.email_subscriber_preferences(email);
CREATE INDEX IF NOT EXISTS idx_email_pref_user ON public.email_subscriber_preferences(user_id);

-- Unsubscribe tokens (one-click compliant)
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  token text PRIMARY KEY,
  email text NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_code text REFERENCES public.email_categories(code) ON DELETE CASCADE,
  template_code text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '180 days'),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unsub_email ON public.email_unsubscribe_tokens(email);

-- Double opt-in confirmation tokens
CREATE TABLE IF NOT EXISTS public.email_confirmation_tokens (
  token text PRIMARY KEY,
  email text NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_code text NOT NULL REFERENCES public.email_categories(code) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_confirm_email ON public.email_confirmation_tokens(email);

-- Enable RLS
ALTER TABLE public.email_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_subscriber_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_confirmation_tokens ENABLE ROW LEVEL SECURITY;

-- Policies: categories readable by everyone (public reference data)
CREATE POLICY "Categories readable by all"
  ON public.email_categories FOR SELECT
  USING (true);

CREATE POLICY "Only super admins manage categories"
  ON public.email_categories FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Preferences: a logged-in user reads & updates their own (by email match or user_id)
CREATE POLICY "Users see own preferences"
  ON public.email_subscriber_preferences FOR SELECT
  USING (
    user_id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Users update own preferences"
  ON public.email_subscriber_preferences FOR UPDATE
  USING (
    user_id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users insert own preferences"
  ON public.email_subscriber_preferences FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins manage all preferences"
  ON public.email_subscriber_preferences FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Tokens: read accessible to anyone with the token (validated app-side); writes restricted
CREATE POLICY "Tokens readable for validation"
  ON public.email_unsubscribe_tokens FOR SELECT
  USING (true);

CREATE POLICY "Tokens updatable for one-click consume"
  ON public.email_unsubscribe_tokens FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Confirmation tokens readable"
  ON public.email_confirmation_tokens FOR SELECT
  USING (true);

CREATE POLICY "Confirmation tokens updatable"
  ON public.email_confirmation_tokens FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Helper: SECURITY DEFINER function to consume an unsubscribe token atomically
CREATE OR REPLACE FUNCTION public.consume_unsubscribe_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _record record;
BEGIN
  SELECT * INTO _record FROM public.email_unsubscribe_tokens
    WHERE token = _token AND used_at IS NULL AND expires_at > now()
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_or_expired');
  END IF;

  -- Apply unsubscribe: if category specified, just that one; else all non-required
  IF _record.category_code IS NOT NULL THEN
    INSERT INTO public.email_subscriber_preferences (email, organization_id, category_code, subscribed, source)
    VALUES (_record.email, _record.organization_id, _record.category_code, false, 'unsubscribe_link')
    ON CONFLICT (email, organization_id, category_code) DO UPDATE
      SET subscribed = false, updated_at = now(), source = 'unsubscribe_link';
  ELSE
    INSERT INTO public.email_subscriber_preferences (email, organization_id, category_code, subscribed, source)
    SELECT _record.email, _record.organization_id, code, false, 'unsubscribe_link_all'
    FROM public.email_categories
    WHERE is_required = false
    ON CONFLICT (email, organization_id, category_code) DO UPDATE
      SET subscribed = false, updated_at = now(), source = 'unsubscribe_link_all';
  END IF;

  UPDATE public.email_unsubscribe_tokens SET used_at = now() WHERE token = _token;

  -- Add suppression entry for marketing/all
  IF _record.category_code IS NULL OR _record.category_code IN ('marketing','digest') THEN
    INSERT INTO public.email_suppressions (email, organization_id, reason, source_provider, is_active)
    VALUES (_record.email, _record.organization_id, 'unsubscribe', 'user_action', true)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object('ok', true, 'email', _record.email, 'category', _record.category_code);
END;
$$;

-- Helper: confirm double opt-in
CREATE OR REPLACE FUNCTION public.confirm_email_opt_in(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _record record;
BEGIN
  SELECT * INTO _record FROM public.email_confirmation_tokens
    WHERE token = _token AND confirmed_at IS NULL AND expires_at > now()
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_or_expired');
  END IF;

  INSERT INTO public.email_subscriber_preferences (email, organization_id, category_code, subscribed, double_opt_in_confirmed_at, source)
  VALUES (_record.email, _record.organization_id, _record.category_code, true, now(), 'double_opt_in')
  ON CONFLICT (email, organization_id, category_code) DO UPDATE
    SET subscribed = true, double_opt_in_confirmed_at = now(), updated_at = now();

  UPDATE public.email_confirmation_tokens SET confirmed_at = now() WHERE token = _token;

  RETURN jsonb_build_object('ok', true, 'email', _record.email, 'category', _record.category_code);
END;
$$;

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_email_pref_updated ON public.email_subscriber_preferences;
CREATE TRIGGER trg_email_pref_updated
  BEFORE UPDATE ON public.email_subscriber_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
