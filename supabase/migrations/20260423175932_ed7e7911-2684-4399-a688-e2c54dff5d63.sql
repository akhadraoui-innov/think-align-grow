-- ============================================================
-- LOT D4a — Compliance email
-- ============================================================

-- 1. Export RGPD : récupère toutes les données email d'un utilisateur
CREATE OR REPLACE FUNCTION public.export_user_email_data(_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target_user uuid;
  _target_email text;
  _result jsonb;
BEGIN
  _target_user := COALESCE(_user_id, auth.uid());
  IF _target_user IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  -- Seul le user lui-même OU un super_admin peut exporter
  IF _target_user <> auth.uid() AND NOT public.has_role(auth.uid(), 'super_admin') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  SELECT email INTO _target_email FROM auth.users WHERE id = _target_user;
  IF _target_email IS NULL THEN
    RETURN jsonb_build_object('error', 'user_not_found');
  END IF;

  SELECT jsonb_build_object(
    'exported_at', now(),
    'user_id', _target_user,
    'email', _target_email,
    'preferences', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'category_code', category_code,
        'subscribed', subscribed,
        'organization_id', organization_id,
        'double_opt_in_confirmed_at', double_opt_in_confirmed_at,
        'source', source,
        'updated_at', updated_at
      )) FROM public.email_subscriber_preferences WHERE email = _target_email
    ), '[]'::jsonb),
    'send_history', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'message_id', message_id,
        'template_name', template_name,
        'status', status,
        'created_at', created_at,
        'error_message', error_message
      ) ORDER BY created_at DESC) FROM public.email_send_log WHERE recipient_email = _target_email
    ), '[]'::jsonb),
    'suppressions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'reason', reason,
        'organization_id', organization_id,
        'suppressed_at', suppressed_at,
        'is_active', is_active
      )) FROM public.email_suppressions WHERE email = _target_email
    ), '[]'::jsonb),
    'unsubscribe_tokens_count', (
      SELECT COUNT(*) FROM public.email_unsubscribe_tokens WHERE email = _target_email
    ),
    'confirmation_tokens_count', (
      SELECT COUNT(*) FROM public.email_confirmation_tokens WHERE email = _target_email
    )
  ) INTO _result;

  PERFORM public.log_activity(
    'rgpd.email.exported', 'user', _target_user::text, NULL,
    jsonb_build_object('email', _target_email)
  );

  RETURN _result;
END;
$$;

-- 2. Droit à l'oubli email
CREATE OR REPLACE FUNCTION public.erase_user_email_data(_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target_user uuid;
  _target_email text;
  _logs_anonymized int;
  _prefs_deleted int;
  _tokens_deleted int;
BEGIN
  _target_user := COALESCE(_user_id, auth.uid());
  IF _target_user IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  IF _target_user <> auth.uid() AND NOT public.has_role(auth.uid(), 'super_admin') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  SELECT email INTO _target_email FROM auth.users WHERE id = _target_user;
  IF _target_email IS NULL THEN
    RETURN jsonb_build_object('error', 'user_not_found');
  END IF;

  -- Anonymiser logs (préserver agrégats analytics, masquer PII)
  UPDATE public.email_send_log
  SET recipient_email = 'anonymized+' || encode(extensions.digest(_target_email, 'sha256'), 'hex') || '@anon.local',
      metadata = metadata - 'recipient_name' - 'firstName' - 'displayName'
  WHERE recipient_email = _target_email;
  GET DIAGNOSTICS _logs_anonymized = ROW_COUNT;

  -- Supprimer préférences
  DELETE FROM public.email_subscriber_preferences WHERE email = _target_email;
  GET DIAGNOSTICS _prefs_deleted = ROW_COUNT;

  -- Supprimer tokens en attente
  DELETE FROM public.email_unsubscribe_tokens WHERE email = _target_email;
  DELETE FROM public.email_confirmation_tokens WHERE email = _target_email;
  GET DIAGNOSTICS _tokens_deleted = ROW_COUNT;

  -- Ajouter suppression définitive
  INSERT INTO public.email_suppressions (email, organization_id, reason, source_provider, is_active, metadata)
  VALUES (_target_email, NULL, 'manual', 'rgpd_erasure',
          true, jsonb_build_object('rgpd_erasure_at', now(), 'requested_by', auth.uid()))
  ON CONFLICT DO NOTHING;

  PERFORM public.log_activity(
    'rgpd.email.erased', 'user', _target_user::text, NULL,
    jsonb_build_object(
      'logs_anonymized', _logs_anonymized,
      'preferences_deleted', _prefs_deleted,
      'tokens_deleted', _tokens_deleted
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'logs_anonymized', _logs_anonymized,
    'preferences_deleted', _prefs_deleted,
    'tokens_deleted', _tokens_deleted
  );
END;
$$;

-- 3. Purge périodique des tokens expirés
CREATE OR REPLACE FUNCTION public.purge_expired_email_tokens()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _unsub int;
  _confirm int;
BEGIN
  DELETE FROM public.email_unsubscribe_tokens
  WHERE (used_at IS NOT NULL AND used_at < now() - interval '30 days')
     OR (used_at IS NULL AND expires_at < now() - interval '7 days');
  GET DIAGNOSTICS _unsub = ROW_COUNT;

  DELETE FROM public.email_confirmation_tokens
  WHERE (confirmed_at IS NOT NULL AND confirmed_at < now() - interval '30 days')
     OR (confirmed_at IS NULL AND expires_at < now() - interval '1 day');
  GET DIAGNOSTICS _confirm = ROW_COUNT;

  RETURN jsonb_build_object(
    'unsubscribe_tokens_purged', _unsub,
    'confirmation_tokens_purged', _confirm,
    'purged_at', now()
  );
END;
$$;

-- 4. Cron quotidien (purge tokens à 3h UTC)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge_expired_email_tokens_daily') THEN
    PERFORM cron.schedule(
      'purge_expired_email_tokens_daily',
      '0 3 * * *',
      $cron$ SELECT public.purge_expired_email_tokens(); $cron$
    );
  END IF;
END $$;

-- 5. Vue admin : santé des cron jobs email
CREATE OR REPLACE VIEW public.email_cron_health AS
SELECT
  j.jobname,
  j.schedule,
  j.active,
  jr.status AS last_status,
  jr.start_time AS last_start,
  jr.end_time AS last_end,
  jr.return_message AS last_message
FROM cron.job j
LEFT JOIN LATERAL (
  SELECT * FROM cron.job_run_details d
  WHERE d.jobid = j.jobid
  ORDER BY d.start_time DESC LIMIT 1
) jr ON true
WHERE j.jobname IN (
  'purge_expired_email_tokens_daily',
  'process-email-queue',
  'cron_dispatch_login_reminders'
);

GRANT SELECT ON public.email_cron_health TO authenticated;