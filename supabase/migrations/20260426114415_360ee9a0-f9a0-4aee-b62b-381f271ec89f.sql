
-- =========================================================================
-- BRIQUE 1 — Realtime RLS
-- =========================================================================
-- realtime.messages : table support des canaux Broadcast/Presence.
-- Notre code n'utilise QUE Postgres Changes (filtré par les RLS sur les tables sources).
-- On verrouille donc explicitement Broadcast/Presence au service_role.

DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS realtime_messages_service_only ON realtime.messages';
EXCEPTION WHEN insufficient_privilege THEN
  -- Si on n'a pas le droit sur realtime, on remonte une erreur claire
  RAISE NOTICE 'Cannot drop realtime.messages policy (insufficient privilege)';
END $$;

DO $$
BEGIN
  EXECUTE $POL$
    CREATE POLICY realtime_messages_service_only
      ON realtime.messages
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true)
  $POL$;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Cannot create realtime.messages policy (insufficient privilege)';
WHEN duplicate_object THEN
  NULL;
END $$;

-- =========================================================================
-- Finalisation B2 — Policies explicites service_role pour les tokens
-- (on a retiré la policy publique, on documente l'intention)
-- =========================================================================

CREATE POLICY confirmation_tokens_service_only
  ON public.email_confirmation_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
