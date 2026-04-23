
-- ───────────────────────────────────────────────────────────────────
-- B.1  WORKSHOPS — supprime policy laxe + RPC find_by_code
-- ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can find workshop by code" ON public.workshops;

-- Existing policies kept: Host, Participants, Saas team
-- Provide RPC for join-by-code flow
CREATE OR REPLACE FUNCTION public.find_workshop_by_code(_code text)
RETURNS TABLE(id uuid, code text, name text, status workshop_status, host_id uuid, max_participants int, scheduled_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, code, name, status, host_id, max_participants, scheduled_at
  FROM public.workshops
  WHERE code = _code
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.find_workshop_by_code(text) TO authenticated;

-- ───────────────────────────────────────────────────────────────────
-- B.2  PRACTICES STANDALONE — corrige fuite
-- ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "view_standalone_practices" ON public.academy_practices;

CREATE POLICY "view_standalone_practices_safe" ON public.academy_practices
  FOR SELECT TO authenticated
  USING (
    module_id IS NULL
    AND (
      is_public
      OR public.is_saas_team(auth.uid())
      OR (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id))
    )
  );

-- ───────────────────────────────────────────────────────────────────
-- B.3  PRACTICE VARIANTS — restreint lecture + masque system_prompt
-- ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "view_practice_variants" ON public.practice_variants;

CREATE POLICY "view_practice_variants_scoped" ON public.practice_variants
  FOR SELECT TO authenticated
  USING (
    public.is_saas_team(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.academy_practices p
      WHERE p.id = practice_variants.practice_id
        AND (
          p.is_public
          OR (p.organization_id IS NOT NULL AND public.is_org_member(auth.uid(), p.organization_id))
        )
    )
  );

-- Public-safe view (no system_prompt)
CREATE OR REPLACE VIEW public.v_practice_variants_public
WITH (security_invoker = on) AS
SELECT id, practice_id, variant_label, weight, is_active, created_at
FROM public.practice_variants;

GRANT SELECT ON public.v_practice_variants_public TO authenticated;

-- ───────────────────────────────────────────────────────────────────
-- B.4  QUIZ QUESTIONS — vue publique sans correct_answer
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_academy_quiz_questions_public
WITH (security_invoker = on) AS
SELECT id, quiz_id, question, question_type, options, sort_order, points, explanation
FROM public.academy_quiz_questions;

GRANT SELECT ON public.v_academy_quiz_questions_public TO authenticated;

-- ───────────────────────────────────────────────────────────────────
-- B.5  STORAGE ucm-exports — path-based ownership
-- ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can read exports" ON storage.objects;

CREATE POLICY "ucm_exports_read_owner_org" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'ucm-exports'
    AND (
      public.is_saas_team(auth.uid())
      OR (
        (storage.foldername(name))[1] IS NOT NULL
        AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
      )
    )
  );

CREATE POLICY "ucm_exports_write_org" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ucm-exports'
    AND (
      public.is_saas_team(auth.uid())
      OR (
        (storage.foldername(name))[1] IS NOT NULL
        AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
      )
    )
  );
