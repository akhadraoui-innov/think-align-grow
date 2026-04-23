
-- Fix 1: search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Fix 2 & 3: tighten token UPDATE policies — only allow marking as used/confirmed via DEFINER fns
DROP POLICY IF EXISTS "Tokens updatable for one-click consume" ON public.email_unsubscribe_tokens;
DROP POLICY IF EXISTS "Confirmation tokens updatable" ON public.email_confirmation_tokens;

-- No UPDATE policy = only SECURITY DEFINER functions can update (they bypass RLS).
-- Public anon clients call consume_unsubscribe_token / confirm_email_opt_in via RPC.
