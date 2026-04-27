-- Table de rate limiting (service_role only)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_key text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_user_action_window
  ON public.rate_limits (user_id, action_key, window_start);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON public.rate_limits (user_id, action_key, window_start DESC);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Aucune policy : table strictement service_role.

-- Fonction atomique check + increment
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _action_key text,
  _max_calls integer DEFAULT 5,
  _window_minutes integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_window timestamptz;
  _current_count integer;
BEGIN
  -- Fenêtre alignée pour permettre une clé unique (bucket de _window_minutes)
  _current_window := date_trunc('minute', now())
    - (extract(minute from now())::int % _window_minutes) * interval '1 minute';

  INSERT INTO public.rate_limits (user_id, action_key, window_start, count)
  VALUES (_user_id, _action_key, _current_window, 1)
  ON CONFLICT (user_id, action_key, window_start)
  DO UPDATE SET
    count = public.rate_limits.count + 1,
    updated_at = now()
  RETURNING count INTO _current_count;

  IF _current_count > _max_calls THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'count', _current_count,
      'limit', _max_calls,
      'window_minutes', _window_minutes,
      'reset_at', _current_window + (_window_minutes || ' minutes')::interval
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'count', _current_count,
    'limit', _max_calls,
    'remaining', _max_calls - _current_count
  );
END;
$$;

-- Verrouillage strict : aucun GRANT à anon/authenticated (service_role only)
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;

-- Cleanup périodique (TTL 24h)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits WHERE created_at < now() - interval '24 hours';
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC, anon, authenticated;