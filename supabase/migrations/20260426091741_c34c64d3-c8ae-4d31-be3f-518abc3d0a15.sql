-- Fonction utilitaire : un user de la SaaS Team a-t-il besoin d'activer la 2FA ?
-- Retourne TRUE si :
--   - L'utilisateur appartient à la SaaS Team (rôles privilégiés)
--   - ET il n'a aucun facteur MFA TOTP au statut 'verified' dans auth.mfa_factors
CREATE OR REPLACE FUNCTION public.requires_2fa(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_saas_team(_user_id)
    AND NOT EXISTS (
      SELECT 1
      FROM auth.mfa_factors f
      WHERE f.user_id = _user_id
        AND f.status = 'verified'
        AND f.factor_type = 'totp'
    );
$$;

GRANT EXECUTE ON FUNCTION public.requires_2fa(uuid) TO authenticated;