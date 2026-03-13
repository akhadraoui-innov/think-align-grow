import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Permissions {
  isSuperAdmin: boolean;
  isSaasTeam: boolean;
  canManageOrgs: boolean;
  canManageUsers: boolean;
  canManageToolkits: boolean;
  canManageWorkshops: boolean;
  canViewBilling: boolean;
  canViewLogs: boolean;
  canManageSettings: boolean;
  canManageDesignInnovation: boolean;
  canEditPlatformOwner: boolean;
  roles: string[];
  loading: boolean;
}

export const PERMISSION_LABELS: Record<string, string> = {
  isSaasTeam: "Équipe SaaS",
  canManageOrgs: "Gestion Organisations",
  canManageUsers: "Gestion Utilisateurs",
  canManageToolkits: "Gestion Toolkits",
  canManageWorkshops: "Gestion Workshops",
  canViewBilling: "Facturation",
  canViewLogs: "Logs d'activité",
  canManageSettings: "Paramètres",
  canManageDesignInnovation: "Design Innovation",
  canEditPlatformOwner: "Platform Owner",
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS);

export const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  super_admin: [...ALL_PERMISSIONS],
  customer_lead: ["isSaasTeam", "canManageOrgs", "canManageUsers", "canManageWorkshops"],
  innovation_lead: ["isSaasTeam", "canManageOrgs", "canManageToolkits", "canManageWorkshops", "canManageDesignInnovation"],
  performance_lead: ["isSaasTeam", "canManageOrgs", "canManageWorkshops", "canViewBilling"],
  product_actor: ["isSaasTeam", "canManageOrgs", "canManageToolkits", "canManageWorkshops"],
  owner: [],
  admin: [],
  member: [],
  lead: [],
  facilitator: [],
  manager: [],
  guest: [],
};

export function getPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSION_MAP[role] || [];
}

export function getPermissionsForRoles(roles: string[]): string[] {
  const perms = new Set<string>();
  roles.forEach(r => getPermissionsForRole(r).forEach(p => perms.add(p)));
  return Array.from(perms);
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
