
-- =========================================================================
-- LOT 6 — HARDENING SÉCURITÉ (Briques 2, 5, 4)
-- =========================================================================

-- =========================================================================
-- BRIQUE 2 — Tokens email & catégories
-- =========================================================================

-- 2.1 — email_confirmation_tokens : retirer SELECT public, créer RPC validation
DROP POLICY IF EXISTS "Confirmation tokens readable" ON public.email_confirmation_tokens;

CREATE OR REPLACE FUNCTION public.validate_confirmation_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rec record;
BEGIN
  SELECT token, email, organization_id, category_code, expires_at, confirmed_at
    INTO _rec
  FROM public.email_confirmation_tokens
  WHERE token = _token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  IF _rec.confirmed_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_used');
  END IF;

  IF _rec.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'email', _rec.email,
    'organization_id', _rec.organization_id,
    'category_code', _rec.category_code
  );
END;
$$;

REVOKE ALL ON FUNCTION public.validate_confirmation_token(text) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_confirmation_token(text) TO anon, authenticated, service_role;

-- 2.2 — email_unsubscribe_tokens : retirer SELECT public
DROP POLICY IF EXISTS "Tokens readable for validation" ON public.email_unsubscribe_tokens;

CREATE OR REPLACE FUNCTION public.validate_unsubscribe_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rec record;
BEGIN
  SELECT token, email, organization_id, category_code, expires_at, used_at
    INTO _rec
  FROM public.email_unsubscribe_tokens
  WHERE token = _token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  IF _rec.used_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_used');
  END IF;

  IF _rec.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'email', _rec.email,
    'organization_id', _rec.organization_id,
    'category_code', _rec.category_code
  );
END;
$$;

REVOKE ALL ON FUNCTION public.validate_unsubscribe_token(text) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_unsubscribe_token(text) TO anon, authenticated, service_role;

-- 2.3 — email_categories : restreindre à authenticated
DROP POLICY IF EXISTS "Categories readable by all" ON public.email_categories;
CREATE POLICY "categories_readable_authenticated"
  ON public.email_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- 2.4 — Templates et automations globaux : restreindre à SaaS team
-- (les rows org-scoped restent accessibles via leurs policies existantes)
DROP POLICY IF EXISTS email_templates_read_global ON public.email_templates;
CREATE POLICY email_templates_read_global_saas
  ON public.email_templates
  FOR SELECT
  TO authenticated
  USING (organization_id IS NULL AND public.is_saas_team(auth.uid()));

DROP POLICY IF EXISTS email_automations_read_global ON public.email_automations;
CREATE POLICY email_automations_read_global_saas
  ON public.email_automations
  FOR SELECT
  TO authenticated
  USING (organization_id IS NULL AND public.is_saas_team(auth.uid()));

-- =========================================================================
-- BRIQUE 5 — Storage hardening
-- =========================================================================

-- 5.1 — academy-assets : write SaaS team only
DO $$
BEGIN
  -- Drop legacy permissive policies (idempotent — on ignore si absentes)
  EXECUTE 'DROP POLICY IF EXISTS "academy_assets_insert_authenticated" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "academy_assets_update_authenticated" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated can upload academy assets" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated can update academy assets" ON storage.objects';
END $$;

CREATE POLICY "academy_assets_insert_saas_only"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'academy-assets' AND public.is_saas_team(auth.uid()));

CREATE POLICY "academy_assets_update_saas_only"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'academy-assets' AND public.is_saas_team(auth.uid()))
  WITH CHECK (bucket_id = 'academy-assets' AND public.is_saas_team(auth.uid()));

CREATE POLICY "academy_assets_delete_saas_only"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'academy-assets' AND public.is_saas_team(auth.uid()));

-- 5.2 — ucm-exports : ajouter DELETE pour org admins de l'org concernée (path = {org_id}/...)
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "ucm_exports_delete_org_admin" ON storage.objects';
END $$;

CREATE POLICY "ucm_exports_delete_org_admin"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'ucm-exports'
    AND (
      public.is_saas_team(auth.uid())
      OR public.is_org_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

-- =========================================================================
-- BRIQUE 4 — Academy access control
-- =========================================================================

-- 4.1 — Helper : un user a accès à un module s'il est inscrit à un parcours qui le contient
--        ou s'il est SaaS team. On utilise academy_progress (preuve d'inscription effective).
CREATE OR REPLACE FUNCTION public.has_academy_access(_user_id uuid, _module_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_saas_team(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.academy_progress p
      WHERE p.user_id = _user_id AND p.module_id = _module_id
    )
$$;

REVOKE ALL ON FUNCTION public.has_academy_access(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.has_academy_access(uuid, uuid) TO authenticated, service_role;

-- 4.2 — academy_contents
DROP POLICY IF EXISTS view_contents ON public.academy_contents;
CREATE POLICY view_contents_enrolled
  ON public.academy_contents FOR SELECT TO authenticated
  USING (public.has_academy_access(auth.uid(), module_id));

-- 4.3 — academy_exercises
DROP POLICY IF EXISTS view_exercises ON public.academy_exercises;
CREATE POLICY view_exercises_enrolled
  ON public.academy_exercises FOR SELECT TO authenticated
  USING (public.has_academy_access(auth.uid(), module_id));

-- 4.4 — academy_practices : préserver les 2 policies extended/standalone, restreindre la basique
DROP POLICY IF EXISTS view_practices ON public.academy_practices;
CREATE POLICY view_practices_enrolled
  ON public.academy_practices FOR SELECT TO authenticated
  USING (module_id IS NOT NULL AND public.has_academy_access(auth.uid(), module_id));

-- 4.5 — academy_quizzes
DROP POLICY IF EXISTS view_quizzes ON public.academy_quizzes;
CREATE POLICY view_quizzes_enrolled
  ON public.academy_quizzes FOR SELECT TO authenticated
  USING (public.has_academy_access(auth.uid(), module_id));

-- 4.6 — academy_quiz_questions : enrolled uniquement, et masquer correct_answer/explanation
--        via une vue "safe" + policy stricte sur la table source.
DROP POLICY IF EXISTS view_quiz_q ON public.academy_quiz_questions;
CREATE POLICY view_quiz_q_enrolled
  ON public.academy_quiz_questions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_quizzes q
      WHERE q.id = academy_quiz_questions.quiz_id
        AND public.has_academy_access(auth.uid(), q.module_id)
    )
  );

-- Vue safe pour client : expose la question SANS correct_answer/explanation
-- (les bonnes réponses sont retournées par les fonctions de scoring côté serveur uniquement)
CREATE OR REPLACE VIEW public.academy_quiz_questions_safe
WITH (security_invoker = true)
AS
  SELECT
    id, quiz_id, question, question_type, options,
    sort_order, points
  FROM public.academy_quiz_questions;

GRANT SELECT ON public.academy_quiz_questions_safe TO authenticated, service_role;

COMMENT ON VIEW public.academy_quiz_questions_safe IS
  'Vue sans correct_answer ni explanation. À utiliser côté client.';
