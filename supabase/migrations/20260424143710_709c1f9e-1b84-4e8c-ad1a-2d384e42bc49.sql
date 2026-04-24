CREATE OR REPLACE FUNCTION public.count_users_by_role(_role public.app_role)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT user_id)::int
  FROM public.user_roles
  WHERE role = _role;
$$;

REVOKE ALL ON FUNCTION public.count_users_by_role(public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_users_by_role(public.app_role) TO authenticated;