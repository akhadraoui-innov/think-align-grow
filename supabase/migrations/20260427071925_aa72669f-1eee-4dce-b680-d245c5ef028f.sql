CREATE OR REPLACE FUNCTION public.purge_expired_email_tokens()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _unsub int;
  _confirm int;
BEGIN
  -- email_unsubscribe_tokens n'a pas de expires_at (tokens permanents jusqu'à usage).
  -- Purge :
  --   - utilisés depuis > 30 jours
  --   - jamais utilisés et créés depuis > 90 jours (rotation préventive)
  DELETE FROM public.email_unsubscribe_tokens
  WHERE (used_at IS NOT NULL AND used_at < now() - interval '30 days')
     OR (used_at IS NULL AND created_at < now() - interval '90 days');
  GET DIAGNOSTICS _unsub = ROW_COUNT;

  -- email_confirmation_tokens a bien expires_at.
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
$function$;

REVOKE EXECUTE ON FUNCTION public.purge_expired_email_tokens() FROM PUBLIC, anon, authenticated;