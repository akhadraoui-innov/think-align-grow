-- Lot 7 — Hardening EXECUTE permissions sur SECURITY DEFINER functions

-- Étape 1 : REVOKE EXECUTE FROM PUBLIC, anon, authenticated sur TOUTES les fonctions SECURITY DEFINER
DO $$
DECLARE r record;
BEGIN
  FOR r IN 
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p 
    JOIN pg_namespace n ON n.oid = p.pronamespace 
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated', r.proname, r.args);
  END LOOP;
END $$;

-- Étape 2 : GRANT EXECUTE TO anon UNIQUEMENT sur les fonctions publiques légitimes
GRANT EXECUTE ON FUNCTION public.validate_confirmation_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_unsubscribe_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_unsubscribe_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_workshop_by_code(text) TO anon, authenticated;

-- Étape 3 : GRANT EXECUTE TO authenticated sur les fonctions client connecté
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_saas_team(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workshop_host(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workshop_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_academy_access(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.requires_2fa(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_url_allowed(text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.accept_invitation(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read(uuid[]) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_org_effective_features(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_ucm_quota(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_quota(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ucm_global_prompt(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ucm_section_prompt(uuid, text, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.export_user_email_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.erase_user_email_data(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.confirm_email_opt_in(text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.verify_audit_chain_integrity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_users_by_role(app_role) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_email_cron_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_provider_health(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_quota_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_edge_function_metrics(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_priority_lane_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_health() TO authenticated;

GRANT EXECUTE ON FUNCTION public.review_email_security_flag(uuid, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.replay_dlq_message(text) TO authenticated;
