
-- 1. Recréer la vue avec security_invoker
DROP VIEW IF EXISTS public.v_email_stats;
CREATE VIEW public.v_email_stats
WITH (security_invoker = true) AS
SELECT
  date_trunc('day', created_at)::date AS day,
  organization_id,
  template_code,
  trigger_event,
  provider_used,
  COUNT(*) FILTER (WHERE status = 'sent') AS sent_count,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
  COUNT(*) FILTER (WHERE status = 'scheduled') AS scheduled_count,
  COUNT(*) FILTER (WHERE opened_at IS NOT NULL) AS opened_count,
  COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) AS clicked_count,
  COUNT(*) AS total_count
FROM public.email_automation_runs
GROUP BY 1, 2, 3, 4, 5;

-- 2. search_path explicite sur toutes les fonctions email (déjà présent mais on confirme)
ALTER FUNCTION public.capture_email_template_version() SET search_path = public;
ALTER FUNCTION public.trg_log_email_template() SET search_path = public;
ALTER FUNCTION public.trg_log_email_automation() SET search_path = public;
ALTER FUNCTION public.trg_log_role_permissions() SET search_path = public;
