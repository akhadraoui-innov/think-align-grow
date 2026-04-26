
-- =========================================================================
-- Correctif 1 — has_academy_access basé sur enrollments réels
-- =========================================================================
CREATE OR REPLACE FUNCTION public.has_academy_access(_user_id uuid, _module_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_saas_team(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.academy_enrollments e
      JOIN public.academy_path_modules pm ON pm.path_id = e.path_id
      WHERE e.user_id = _user_id
        AND pm.module_id = _module_id
    )
$$;

-- Restreindre INSERT sur academy_progress : seulement si l'utilisateur a un enrollment couvrant ce module
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS users_manage_own_progress ON public.academy_progress';
END $$;

CREATE POLICY progress_select_own
  ON public.academy_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_saas_team(auth.uid()));

CREATE POLICY progress_insert_enrolled
  ON public.academy_progress FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.academy_enrollments e
      JOIN public.academy_path_modules pm ON pm.path_id = e.path_id
      WHERE e.user_id = auth.uid() AND pm.module_id = academy_progress.module_id
    )
  );

CREATE POLICY progress_update_own
  ON public.academy_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY progress_saas_all
  ON public.academy_progress FOR ALL TO authenticated
  USING (public.is_saas_team(auth.uid()))
  WITH CHECK (public.is_saas_team(auth.uid()));

-- =========================================================================
-- Correctif 2 — Storage academy-assets : retirer policies permissives héritées
-- =========================================================================
DROP POLICY IF EXISTS "Authenticated users can upload academy assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update academy assets" ON storage.objects;

-- =========================================================================
-- Correctif 3 — Certificats publics : vue safe
-- =========================================================================
CREATE OR REPLACE VIEW public.academy_certificates_public
WITH (security_invoker = true)
AS
  SELECT
    id,
    path_id,
    issued_at,
    public_share_enabled,
    -- Expose uniquement le titre/description du certificat, pas les achievements perso
    jsonb_build_object(
      'title', certificate_data->>'title',
      'path_name', certificate_data->>'path_name',
      'issued_to_display_name', certificate_data->>'display_name'
    ) AS certificate_summary
  FROM public.academy_certificates
  WHERE public_share_enabled = true;

GRANT SELECT ON public.academy_certificates_public TO anon, authenticated;

COMMENT ON VIEW public.academy_certificates_public IS
  'Vue de vérification publique des certificats. Pas de user_id ni de données perso brutes.';
