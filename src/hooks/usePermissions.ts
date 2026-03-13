import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/* ─────────────────────────────────────────────
 * GRANULAR PERMISSION SYSTEM — 100% DB-driven
 * Tables: permission_domains, permission_definitions, role_permissions
 * Zero hardcode. The DB is the single source of truth.
 * ───────────────────────────────────────────── */

export interface PermissionDef {
  key: string;
  label: string;
  description: string;
  domain: string;
}

export interface PermissionDomain {
  key: string;
  label: string;
  icon: string; // lucide icon name
  permissions: PermissionDef[];
}

// ── HOOK: Permission Registry from DB ────────

/**
 * Loads permission_domains + permission_definitions from DB.
 * Reconstructs the PermissionDomain[] structure.
 */
export function usePermissionRegistry() {
  return useQuery({
    queryKey: ["permission-registry-db"],
    staleTime: 5 * 60_000, // 5 min cache
    queryFn: async () => {
      const [domainsRes, defsRes] = await Promise.all([
        supabase
          .from("permission_domains")
          .select("key, label, icon, sort_order")
          .order("sort_order"),
        supabase
          .from("permission_definitions")
          .select("key, label, description, domain_key, sort_order")
          .order("sort_order"),
      ]);

      if (domainsRes.error) throw domainsRes.error;
      if (defsRes.error) throw defsRes.error;

      const domains: PermissionDomain[] = (domainsRes.data || []).map((d: any) => ({
        key: d.key,
        label: d.label,
        icon: d.icon,
        permissions: (defsRes.data || [])
          .filter((p: any) => p.domain_key === d.key)
          .map((p: any) => ({
            key: p.key,
            label: p.label,
            description: p.description,
            domain: d.key,
          })),
      }));

      // Build flat lookups
      const allKeys: string[] = [];
      const labels: Record<string, string> = {};
      const registry: Record<string, PermissionDef> = {};
      domains.forEach(d =>
        d.permissions.forEach(p => {
          allKeys.push(p.key);
          labels[p.key] = p.label;
          registry[p.key] = p;
        }),
      );

      return { domains, allKeys, labels, registry };
    },
  });
}

// ── HOOK: DB-backed role permissions ─────────

/**
 * Fetches all role_permissions rows from the DB.
 * Used by usePermissions for the current user and by the admin UI.
 */
export function useRolePermissionsFromDB() {
  return useQuery({
    queryKey: ["role-permissions-db"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("role, permission_key");
      if (error) throw error;
      const map: Record<string, string[]> = {};
      (data || []).forEach((row: any) => {
        if (!map[row.role]) map[row.role] = [];
        map[row.role].push(row.permission_key);
      });
      return map;
    },
  });
}

// ── HELPERS ──────────────────────────────────

function getPermsFromMap(
  dbMap: Record<string, string[]> | undefined,
  roles: string[],
): string[] {
  if (!dbMap) return [];
  const perms = new Set<string>();
  roles.forEach(r => (dbMap[r] || []).forEach(p => perms.add(p)));
  return Array.from(perms);
}

export function getPermissionsForRoleFromDB(
  dbMap: Record<string, string[]> | undefined,
  role: string,
): string[] {
  if (!dbMap) return [];
  return dbMap[role] || [];
}

export function getDomainCoverage(
  domains: PermissionDomain[],
  dbMap: Record<string, string[]> | undefined,
  role: string,
  domainKey: string,
): { granted: number; total: number } {
  const domain = domains.find(d => d.key === domainKey);
  if (!domain) return { granted: 0, total: 0 };
  const rolePerms = getPermissionsForRoleFromDB(dbMap, role);
  const granted = domain.permissions.filter(p => rolePerms.includes(p.key)).length;
  return { granted, total: domain.permissions.length };
}

// ── SAAS ROLE LIST ──
const SAAS_ROLES = ["super_admin", "customer_lead", "innovation_lead", "performance_lead", "product_actor"];

// ── HOOK ─────────────────────────────────────

export interface Permissions {
  isSuperAdmin: boolean;
  isSaasTeam: boolean;
  canAccessAdmin: boolean;
  roles: string[];
  permissions: string[];
  has: (perm: string) => boolean;
  hasAny: (...perms: string[]) => boolean;
  loading: boolean;
  // Legacy compat — derived from granular
  canManageOrgs: boolean;
  canManageUsers: boolean;
  canManageToolkits: boolean;
  canManageWorkshops: boolean;
  canViewBilling: boolean;
  canViewLogs: boolean;
  canManageSettings: boolean;
  canManageDesignInnovation: boolean;
  canEditPlatformOwner: boolean;
}

export function usePermissions(): Permissions {
  const { user, loading: authLoading } = useAuth();

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
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

  const { data: dbMap, isLoading: dbLoading } = useRolePermissionsFromDB();

  const allPerms = getPermsFromMap(dbMap, roles as string[]);
  const has = (perm: string) => allPerms.includes(perm);
  const hasAnyFn = (...perms: string[]) => perms.some(p => allPerms.includes(p));

  const isSuperAdmin = roles.includes("super_admin" as any);
  const isSaasTeam = roles.some(r => SAAS_ROLES.includes(r as string));

  return {
    isSuperAdmin,
    isSaasTeam,
    canAccessAdmin: isSaasTeam,
    roles: roles as string[],
    permissions: allPerms,
    has,
    hasAny: hasAnyFn,
    loading: authLoading || rolesLoading || dbLoading,
    // Legacy compat
    canManageOrgs: has("admin.orgs.view"),
    canManageUsers: has("admin.users.view"),
    canManageToolkits: has("admin.toolkits.view"),
    canManageWorkshops: has("admin.workshops.view"),
    canViewBilling: has("admin.billing.view"),
    canViewLogs: has("admin.logs.view"),
    canManageSettings: has("admin.settings.roles") || has("admin.settings.ai"),
    canManageDesignInnovation: has("admin.challenges.view"),
    canEditPlatformOwner: isSuperAdmin,
  };
}
