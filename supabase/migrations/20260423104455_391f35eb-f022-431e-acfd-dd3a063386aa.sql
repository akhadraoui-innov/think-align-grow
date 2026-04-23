-- Attach missing triggers for activity logging + owner protection
-- (Functions already exist; only trigger bindings were missing)

-- Drop if exist (idempotent)
DROP TRIGGER IF EXISTS trg_organizations_log ON public.organizations;
DROP TRIGGER IF EXISTS trg_org_members_log ON public.organization_members;
DROP TRIGGER IF EXISTS trg_user_roles_log ON public.user_roles;
DROP TRIGGER IF EXISTS trg_teams_log ON public.teams;
DROP TRIGGER IF EXISTS trg_team_members_log ON public.team_members;
DROP TRIGGER IF EXISTS trg_credit_transactions_log ON public.credit_transactions;
DROP TRIGGER IF EXISTS trg_role_permissions_log ON public.role_permissions;
DROP TRIGGER IF EXISTS trg_profiles_status_log ON public.profiles;
DROP TRIGGER IF EXISTS trg_protect_last_owner ON public.organization_members;

-- Activity log triggers
CREATE TRIGGER trg_organizations_log
  AFTER INSERT OR UPDATE OR DELETE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_organizations();

CREATE TRIGGER trg_org_members_log
  AFTER INSERT OR UPDATE OR DELETE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_org_members();

CREATE TRIGGER trg_user_roles_log
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_user_roles();

CREATE TRIGGER trg_teams_log
  AFTER INSERT OR UPDATE OR DELETE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_teams();

CREATE TRIGGER trg_team_members_log
  AFTER INSERT OR DELETE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_team_members();

CREATE TRIGGER trg_credit_transactions_log
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_credit_transactions();

CREATE TRIGGER trg_role_permissions_log
  AFTER INSERT OR DELETE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_role_permissions();

CREATE TRIGGER trg_profiles_status_log
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_profile_status();

-- Last owner protection
CREATE TRIGGER trg_protect_last_owner
  BEFORE UPDATE OR DELETE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.protect_last_owner();