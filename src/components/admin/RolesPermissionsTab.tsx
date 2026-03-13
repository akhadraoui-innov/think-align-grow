import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_PERMISSION_MAP, PERMISSION_LABELS, getPermissionsForRole } from "@/hooks/usePermissions";
import { Constants } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Check, Users, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ALL_ROLES = Constants.public.Enums.app_role;
const SAAS_ROLES = ["super_admin", "customer_lead", "innovation_lead", "performance_lead", "product_actor"];
const CLIENT_ROLES = ALL_ROLES.filter(r => !SAAS_ROLES.includes(r));
const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS);

const ROLE_COLORS: Record<string, string> = {
  super_admin: "text-red-600",
  customer_lead: "text-blue-600",
  innovation_lead: "text-violet-600",
  performance_lead: "text-amber-600",
  product_actor: "text-emerald-600",
  owner: "text-orange-600",
  admin: "text-sky-600",
  member: "text-muted-foreground",
  lead: "text-indigo-600",
  facilitator: "text-pink-600",
  manager: "text-teal-600",
  guest: "text-muted-foreground",
};

export function RolesPermissionsTab() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Role counts
  const { data: roleCounts } = useQuery({
    queryKey: ["admin-role-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role");
      const counts: Record<string, number> = {};
      ALL_ROLES.forEach(r => (counts[r] = 0));
      (data || []).forEach((r: any) => { counts[r.role] = (counts[r.role] || 0) + 1; });
      return counts;
    },
  });

  // Users for selected role
  const { data: roleUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-role-users", selectedRole],
    enabled: !!selectedRole,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", selectedRole as any);
      if (!data || data.length === 0) return [];
      const userIds = data.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, email, job_title")
        .in("user_id", userIds);
      return profiles || [];
    },
  });

  const renderRoleRow = (role: string) => {
    const perms = getPermissionsForRole(role);
    const count = roleCounts?.[role] ?? 0;
    const isSelected = selectedRole === role;

    return (
      <tr
        key={role}
        className={`border-b border-border/30 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-secondary/30"}`}
        onClick={() => setSelectedRole(isSelected ? null : role)}
      >
        <td className="py-2.5 px-3 sticky left-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${ROLE_COLORS[role] || "text-foreground"}`}>
              {role.replace(/_/g, " ")}
            </span>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{count}</Badge>
            <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${isSelected ? "rotate-90" : ""}`} />
          </div>
        </td>
        {PERMISSION_KEYS.map(perm => (
          <td key={perm} className="py-2.5 px-2 text-center">
            {perms.includes(perm) ? (
              <Check className="h-3.5 w-3.5 text-green-500 mx-auto" />
            ) : (
              <span className="block h-3.5 w-3.5 mx-auto" />
            )}
          </td>
        ))}
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {/* Matrix */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left py-2.5 px-3 font-bold text-muted-foreground uppercase tracking-wider sticky left-0 bg-secondary/30 z-10 min-w-[140px]">
                  Rôle
                </th>
                {PERMISSION_KEYS.map(perm => (
                  <th key={perm} className="py-2.5 px-2 font-bold text-muted-foreground text-center min-w-[80px]">
                    <span className="writing-mode-vertical text-[9px] uppercase tracking-wider">
                      {PERMISSION_LABELS[perm]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* SaaS roles */}
              <tr>
                <td colSpan={PERMISSION_KEYS.length + 1} className="bg-red-500/5 px-3 py-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-500/70">Équipe SaaS</span>
                </td>
              </tr>
              {SAAS_ROLES.map(renderRoleRow)}
              {/* Client roles */}
              <tr>
                <td colSpan={PERMISSION_KEYS.length + 1} className="bg-blue-500/5 px-3 py-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500/70">Rôles Client</span>
                </td>
              </tr>
              {CLIENT_ROLES.map(renderRoleRow)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected role user list */}
      {selectedRole && (
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Utilisateurs avec le rôle <span className={ROLE_COLORS[selectedRole]}>{selectedRole.replace(/_/g, " ")}</span>
            </h3>
            <Badge variant="secondary" className="text-[10px]">{roleUsers?.length ?? 0}</Badge>
          </div>
          {usersLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" />
          ) : roleUsers && roleUsers.length > 0 ? (
            <div className="space-y-2">
              {roleUsers.map((u: any) => (
                <button
                  key={u.user_id}
                  onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${u.user_id}`); }}
                  className="w-full flex items-center gap-3 rounded-lg p-2.5 text-left hover:bg-secondary/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {(u.display_name || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{u.display_name || "—"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{u.email || u.job_title || "—"}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Aucun utilisateur avec ce rôle</p>
          )}
        </div>
      )}
    </div>
  );
}
