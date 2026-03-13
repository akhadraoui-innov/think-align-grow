import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  PERMISSION_DOMAINS, ROLE_PERMISSION_MAP, getPermissionsForRole, getDomainCoverage,
  type PermissionDomain,
} from "@/hooks/usePermissions";
import { Constants } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Check, X, Users, ChevronRight, ChevronDown, Loader2, Search,
  LayoutDashboard, Building2, Layers, Presentation, Lightbulb,
  CreditCard, ScrollText, Settings, Compass, Gamepad2, Sparkles, User, Map,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const ALL_ROLES = Constants.public.Enums.app_role;
const SAAS_ROLES = ["super_admin", "customer_lead", "innovation_lead", "performance_lead", "product_actor"];
const CLIENT_ROLES = ALL_ROLES.filter(r => !SAAS_ROLES.includes(r));

const ICON_MAP: Record<string, any> = {
  LayoutDashboard, Building2, Users, Layers, Presentation, Lightbulb,
  CreditCard, ScrollText, Settings, Compass, Gamepad2, Sparkles, User, Map,
};

const ROLE_META: Record<string, { color: string; bgColor: string; description: string }> = {
  super_admin: { color: "text-red-500", bgColor: "bg-red-500/10 border-red-500/20", description: "Accès total à la plateforme" },
  customer_lead: { color: "text-blue-500", bgColor: "bg-blue-500/10 border-blue-500/20", description: "Gestion clients et organisations" },
  innovation_lead: { color: "text-violet-500", bgColor: "bg-violet-500/10 border-violet-500/20", description: "Contenu, toolkits et innovation" },
  performance_lead: { color: "text-amber-500", bgColor: "bg-amber-500/10 border-amber-500/20", description: "Data, billing et performance" },
  product_actor: { color: "text-emerald-500", bgColor: "bg-emerald-500/10 border-emerald-500/20", description: "UX, cartes et parcours" },
  owner: { color: "text-orange-500", bgColor: "bg-orange-500/10 border-orange-500/20", description: "Propriétaire d'organisation" },
  admin: { color: "text-sky-500", bgColor: "bg-sky-500/10 border-sky-500/20", description: "Administrateur d'organisation" },
  lead: { color: "text-indigo-500", bgColor: "bg-indigo-500/10 border-indigo-500/20", description: "Chef d'équipe" },
  facilitator: { color: "text-pink-500", bgColor: "bg-pink-500/10 border-pink-500/20", description: "Animateur de sessions" },
  manager: { color: "text-teal-500", bgColor: "bg-teal-500/10 border-teal-500/20", description: "Responsable fonctionnel" },
  member: { color: "text-muted-foreground", bgColor: "bg-secondary border-border/50", description: "Membre standard" },
  guest: { color: "text-muted-foreground", bgColor: "bg-secondary border-border/50", description: "Accès limité en lecture" },
};

export function RolesPermissionsTab() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set(PERMISSION_DOMAINS.map(d => d.key)));
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "saas" | "client">("all");

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
        .select("user_id, display_name, email, job_title, avatar_url")
        .in("user_id", userIds);
      return profiles || [];
    },
  });

  const toggleDomain = (key: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const displayRoles = useMemo(() => {
    if (filterType === "saas") return SAAS_ROLES;
    if (filterType === "client") return CLIENT_ROLES;
    return ALL_ROLES as unknown as string[];
  }, [filterType]);

  const filteredDomains = useMemo(() => {
    if (!searchQuery.trim()) return PERMISSION_DOMAINS;
    const q = searchQuery.toLowerCase();
    return PERMISSION_DOMAINS.map(d => ({
      ...d,
      permissions: d.permissions.filter(p =>
        p.label.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q)
      ),
    })).filter(d => d.permissions.length > 0);
  }, [searchQuery]);

  const selectedRoleMeta = selectedRole ? ROLE_META[selectedRole] : null;
  const selectedRolePerms = selectedRole ? getPermissionsForRole(selectedRole) : [];

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une permission…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-sm bg-card"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "saas", "client"] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                filterType === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {type === "all" ? "Tous" : type === "saas" ? "Équipe SaaS" : "Rôles Client"}
            </button>
          ))}
        </div>
      </div>

      {/* Role cards row */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {displayRoles.map(role => {
          const meta = ROLE_META[role] || ROLE_META.member;
          const count = roleCounts?.[role] ?? 0;
          const isSelected = selectedRole === role;
          const permCount = getPermissionsForRole(role).length;
          const totalPerms = Object.keys(PERMISSION_DOMAINS.flatMap(d => d.permissions)).length;

          return (
            <button
              key={role}
              onClick={() => setSelectedRole(isSelected ? null : role)}
              className={`shrink-0 rounded-xl border p-3 min-w-[140px] text-left transition-all ${
                isSelected
                  ? `${meta.bgColor} ring-2 ring-offset-2 ring-offset-background ring-current ${meta.color}`
                  : `border-border/50 bg-card hover:bg-secondary/50`
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-bold ${meta.color}`}>
                  {role.replace(/_/g, " ")}
                </span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                  <Users className="h-2.5 w-2.5 mr-0.5" />{count}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight mb-2">{meta.description}</p>
              <div className="flex items-center gap-2">
                <Progress value={(permCount / ALL_ROLES.length) * 100} className="h-1 flex-1" />
                <span className="text-[9px] font-bold text-muted-foreground">{permCount}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected role user list */}
      <AnimatePresence>
        {selectedRole && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border/50 bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className={`h-4 w-4 ${selectedRoleMeta?.color}`} />
                <h3 className="text-sm font-bold text-foreground">
                  Utilisateurs — <span className={selectedRoleMeta?.color}>{selectedRole.replace(/_/g, " ")}</span>
                </h3>
                <Badge variant="secondary" className="text-[10px]">{roleUsers?.length ?? 0}</Badge>
              </div>
              {usersLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" />
              ) : roleUsers && roleUsers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {roleUsers.map((u: any) => (
                    <button
                      key={u.user_id}
                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${u.user_id}`); }}
                      className="flex items-center gap-3 rounded-lg p-2.5 text-left hover:bg-secondary/50 transition-colors border border-border/30"
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedRoleMeta?.bgColor} ${selectedRoleMeta?.color}`}>
                        {(u.display_name || "?")[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">{u.display_name || "—"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{u.email || u.job_title || "—"}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Aucun utilisateur avec ce rôle</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission matrix by domain */}
      <div className="space-y-2">
        {filteredDomains.map(domain => {
          const isExpanded = expandedDomains.has(domain.key);
          const IconComp = ICON_MAP[domain.icon] || Layers;

          return (
            <div key={domain.key} className="rounded-xl border border-border/50 bg-card overflow-hidden">
              {/* Domain header */}
              <button
                onClick={() => toggleDomain(domain.key)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
              >
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <IconComp className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-foreground">{domain.label}</p>
                  <p className="text-[10px] text-muted-foreground">{domain.permissions.length} permissions</p>
                </div>
                {/* Mini coverage indicators for displayed roles */}
                <div className="hidden lg:flex items-center gap-1.5 mr-2">
                  {displayRoles.slice(0, 6).map(role => {
                    const { granted, total } = getDomainCoverage(role, domain.key);
                    const pct = total > 0 ? (granted / total) * 100 : 0;
                    const meta = ROLE_META[role] || ROLE_META.member;
                    return (
                      <div
                        key={role}
                        title={`${role.replace(/_/g, " ")}: ${granted}/${total}`}
                        className={`h-2 w-2 rounded-full ${pct === 100 ? "bg-green-500" : pct > 0 ? "bg-amber-400" : "bg-muted"}`}
                      />
                    );
                  })}
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Domain permissions table */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="overflow-x-auto border-t border-border/30">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-secondary/20">
                            <th className="text-left py-2 px-4 font-bold text-muted-foreground min-w-[220px] sticky left-0 bg-secondary/20 z-10">
                              Permission
                            </th>
                            {displayRoles.map(role => {
                              const meta = ROLE_META[role] || ROLE_META.member;
                              return (
                                <th key={role} className="py-2 px-1.5 text-center min-w-[60px]">
                                  <span className={`text-[9px] font-bold uppercase tracking-wider ${meta.color} whitespace-nowrap`}>
                                    {role.replace(/_/g, " ").split(" ").map(w => w[0]).join("")}
                                  </span>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {domain.permissions.map((perm, pi) => (
                            <tr key={perm.key} className={`border-t border-border/20 ${pi % 2 === 0 ? "" : "bg-secondary/5"}`}>
                              <td className="py-2 px-4 sticky left-0 bg-card z-10">
                                <div>
                                  <p className="font-medium text-foreground text-xs">{perm.label}</p>
                                  <p className="text-[10px] text-muted-foreground leading-tight">{perm.description}</p>
                                </div>
                              </td>
                              {displayRoles.map(role => {
                                const hasIt = getPermissionsForRole(role).includes(perm.key);
                                return (
                                  <td key={role} className="py-2 px-1.5 text-center">
                                    {hasIt ? (
                                      <div className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-green-500/10">
                                        <Check className="h-3 w-3 text-green-500" />
                                      </div>
                                    ) : (
                                      <div className="inline-flex items-center justify-center h-5 w-5 rounded-md">
                                        <X className="h-3 w-3 text-muted/30" />
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Stats footer */}
      <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-display font-bold text-xl text-foreground">{ALL_ROLES.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rôles</p>
          </div>
          <div>
            <p className="font-display font-bold text-xl text-foreground">{PERMISSION_DOMAINS.reduce((s, d) => s + d.permissions.length, 0)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Permissions</p>
          </div>
          <div>
            <p className="font-display font-bold text-xl text-foreground">{PERMISSION_DOMAINS.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Domaines</p>
          </div>
        </div>
      </div>
    </div>
  );
}
