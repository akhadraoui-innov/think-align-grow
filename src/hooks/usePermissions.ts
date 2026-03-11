import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Permissions {
  // Global
  isSuperAdmin: boolean;
  isSaasTeam: boolean;
  // Modules
  canManageOrgs: boolean;
  canManageUsers: boolean;
  canManageToolkits: boolean;
  canManageWorkshops: boolean;
  canViewBilling: boolean;
  canViewLogs: boolean;
  canManageSettings: boolean;
  canManageDesignInnovation: boolean;
  // Org-level
  canEditPlatformOwner: boolean;
  // Roles list
  roles: string[];
  loading: boolean;
}

const SAAS_ROLES = ["super_admin", "customer_lead", "innovation_lead", "performance_lead", "product_actor"];

export function usePermissions(): Permissions {
  const { user, loading: authLoading } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["user-roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data.map((r) => r.role);
    },
  });

  const has = (role: string) => roles.includes(role as any);
  const hasAny = (...r: string[]) => r.some(has);

  const isSuperAdmin = has("super_admin");
  const isSaasTeam = hasAny(...SAAS_ROLES);

  return {
    isSuperAdmin,
    isSaasTeam,
    canManageOrgs: isSaasTeam,
    canManageUsers: isSuperAdmin || has("customer_lead"),
    canManageToolkits: isSuperAdmin || has("innovation_lead") || has("product_actor"),
    canManageWorkshops: isSaasTeam,
    canViewBilling: isSuperAdmin || has("performance_lead"),
    canViewLogs: isSuperAdmin,
    canManageSettings: isSuperAdmin,
    canManageDesignInnovation: isSuperAdmin || has("innovation_lead"),
    canEditPlatformOwner: isSuperAdmin,
    roles,
    loading: authLoading || isLoading,
  };
}
