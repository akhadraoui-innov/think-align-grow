
DROP VIEW IF EXISTS public.v_audit_log_integrity;
CREATE VIEW public.v_audit_log_integrity
WITH (security_invoker = on) AS
WITH ordered AS (
  SELECT id, prev_hash, current_hash,
         LAG(current_hash) OVER (ORDER BY id) AS computed_prev
  FROM public.audit_logs_immutable
)
SELECT id, prev_hash, computed_prev,
       (prev_hash IS NOT DISTINCT FROM computed_prev) AS chain_ok
FROM ordered;

GRANT SELECT ON public.v_audit_log_integrity TO authenticated;

CREATE OR REPLACE FUNCTION public.audit_logs_immutable_block()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs_immutable is append-only (use append_audit_log RPC)';
END;
$$;
