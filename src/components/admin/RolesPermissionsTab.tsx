import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  getPermissionsForRoleFromDB,
  useRolePermissionsFromDB,
  usePermissionRegistry,
  type PermissionDomain,
} from "@/hooks/usePermissions";
import { usePermissions } from "@/hooks/usePermissions";
import { Constants } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Check, X, Users, ChevronRight, ChevronDown, Loader2, Search,
  LayoutDashboard, Building2, Layers, Presentation, Lightbulb,
  CreditCard, ScrollText, Settings, Compass, Gamepad2, Sparkles, User, Map,
  Eye, GitCompare, Shield, ShieldAlert,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ALL_ROLES = Constants.public.Enums.app_role;
const SAAS_ROLES = ["super_admin", "customer_lead", "innovation_lead", "performance_lead", "product_actor"];
const CLIENT_ROLES = ALL_ROLES.filter(r => !SAAS_ROLES.includes(r));

const ICON_MAP: Record<string, any> = {
  LayoutDashboard, Building2, Users, Layers, Presentation, Lightbulb,
  CreditCard, ScrollText, Settings, Compass, Gamepad2, Sparkles, User, Map,
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  customer_lead: "Customer Lead",
  innovation_lead: "Innovation Lead",
  performance_lead: "Performance Lead",
  product_actor: "Product Actor",
  owner: "Owner",
  admin: "Admin",
  lead: "Lead",
  facilitator: "Facilitateur",
  manager: "Manager",
  member: "Membre",
  guest: "Guest",
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
  const queryClient = useQueryClient();
  const perms = usePermissions();
  const canEdit = perms.isSuperAdmin;

  // DB-backed data
  const { data: registryData, isLoading: registryLoading } = usePermissionRegistry();
  const { data: dbMap, isLoading: dbLoading } = useRolePermissionsFromDB();

  const DOMAINS = registryData?.domains ?? [];
  const TOTAL_PERMS = DOMAINS.reduce((s, d) => s + d.permissions.length, 0);

  const [selectedRole, setSelectedRole] = useState<string>("super_admin");
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [compareRoles, setCompareRoles] = useState<string[]>([]);

  // Auto-expand all domains when registry loads
  useMemo(() => {
    if (DOMAINS.length > 0 && expandedDomains.size === 0) {
      setExpandedDomains(new Set(DOMAINS.map(d => d.key)));
    }
  }, [DOMAINS.length]);

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
      const { data } = await supabase.from("user_roles").select("user_id").eq("role", selectedRole as any);
      if (!data || data.length === 0) return [];
      const userIds = data.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, email, job_title, avatar_url")
        .in("user_id", userIds);
      return profiles || [];
    },
  });

  const rolePerms = useMemo(
    () => getPermissionsForRoleFromDB(dbMap, selectedRole),
    [dbMap, selectedRole],
  );

  const toggleDomain = (key: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const filteredDomains = useMemo(() => {
    if (!searchQuery.trim()) return DOMAINS;
    const q = searchQuery.toLowerCase();
    return DOMAINS.map(d => ({
      ...d,
      permissions: d.permissions.filter(p =>
        p.label.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q)
      ),
    })).filter(d => d.permissions.length > 0);
  }, [searchQuery, DOMAINS]);

  // Confirmation dialog state for mass permission revocations
  const [confirmRevoke, setConfirmRevoke] = useState<{
    permKey: string;
    permLabel: string;
    impactedCount: number;
  } | null>(null);

  // Apply the actual mutation (no checks)
  const applyTogglePermission = async (permKey: string, currentlyGranted: boolean) => {
    try {
      if (currentlyGranted) {
        await supabase
          .from("role_permissions")
          .delete()
          .eq("role", selectedRole as any)
          .eq("permission_key", permKey);
      } else {
        await supabase
          .from("role_permissions")
          .insert({ role: selectedRole as any, permission_key: permKey });
      }
      queryClient.invalidateQueries({ queryKey: ["role-permissions-db"] });
      const impacted = roleCounts?.[selectedRole] ?? 0;
      toast.success(
        currentlyGranted
          ? `Permission retirée${impacted > 0 ? ` (${impacted} utilisateur${impacted > 1 ? "s" : ""} impacté${impacted > 1 ? "s" : ""})` : ""}`
          : `Permission ajoutée${impacted > 0 ? ` (${impacted} utilisateur${impacted > 1 ? "s" : ""})` : ""}`,
      );
    } catch (e: any) {
      toast.error("Erreur lors de la modification");
    }
  };

  // Toggle a permission for the selected role — with safeguard for mass revocations
  const togglePermission = async (permKey: string, currentlyGranted: boolean, permLabel: string) => {
    if (!canEdit) return;
    const impacted = roleCounts?.[selectedRole] ?? 0;
    // Safeguard: confirm when REMOVING a permission for >5 users
    if (currentlyGranted && impacted > 5) {
      setConfirmRevoke({ permKey, permLabel, impactedCount: impacted });
      return;
    }
    await applyTogglePermission(permKey, currentlyGranted);
  };


  const toggleCompareRole = (role: string) => {
    setCompareRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : prev.length >= 4 ? prev : [...prev, role],
    );
  };

  const isLoading = registryLoading || dbLoading;

  const meta = ROLE_META[selectedRole] || ROLE_META.member;
  const permCount = rolePerms.length;
  const coveragePct = TOTAL_PERMS > 0 ? Math.round((permCount / TOTAL_PERMS) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="detail" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="detail" className="gap-2 text-xs">
            <Eye className="h-3.5 w-3.5" /> Vue Détail
          </TabsTrigger>
          <TabsTrigger value="compare" className="gap-2 text-xs">
            <GitCompare className="h-3.5 w-3.5" /> Comparaison
          </TabsTrigger>
        </TabsList>

        {/* ══════════ DETAIL VIEW ══════════ */}
        <TabsContent value="detail" className="space-y-5">
          {/* Role selector cards */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Équipe SaaS</p>
            <div className="flex gap-2 flex-wrap mb-3">
              {SAAS_ROLES.map(role => {
                const m = ROLE_META[role] || ROLE_META.member;
                const isSelected = selectedRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`rounded-xl border p-3 min-w-[130px] text-left transition-all ${
                      isSelected
                        ? `${m.bgColor} ring-2 ring-offset-2 ring-offset-background ring-current ${m.color}`
                        : "border-border/50 bg-card hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${m.color}`}>{ROLE_LABELS[role]}</span>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                        <Users className="h-2.5 w-2.5 mr-0.5" />{roleCounts?.[role] ?? 0}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">{m.description}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Rôles Client</p>
            <div className="flex gap-2 flex-wrap">
              {CLIENT_ROLES.map(role => {
                const m = ROLE_META[role] || ROLE_META.member;
                const isSelected = selectedRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`rounded-xl border p-2.5 min-w-[110px] text-left transition-all ${
                      isSelected
                        ? `${m.bgColor} ring-2 ring-offset-2 ring-offset-background ring-current ${m.color}`
                        : "border-border/50 bg-card hover:bg-secondary/50"
                    }`}
                  >
                    <span className={`text-xs font-bold ${m.color}`}>{ROLE_LABELS[role]}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Users className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground">{roleCounts?.[role] ?? 0}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role detail header */}
          <div className={`rounded-xl border ${meta.bgColor} p-5`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${meta.bgColor} ${meta.color}`}>
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className={`text-lg font-bold ${meta.color}`}>{ROLE_LABELS[selectedRole]}</h2>
                <p className="text-xs text-muted-foreground">{meta.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{permCount}</p>
                <p className="text-[10px] text-muted-foreground">permissions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={coveragePct} className="h-2 flex-1" />
              <span className="text-sm font-bold text-foreground">{coveragePct}%</span>
              <span className="text-[10px] text-muted-foreground">de couverture</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une permission…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm bg-card"
            />
          </div>

          {/* Domains with switches */}
          <div className="space-y-2">
            {filteredDomains.map(domain => {
              const isExpanded = expandedDomains.has(domain.key);
              const IconComp = ICON_MAP[domain.icon] || Layers;
              const granted = domain.permissions.filter(p => rolePerms.includes(p.key)).length;
              const total = domain.permissions.length;
              const domainPct = total > 0 ? Math.round((granted / total) * 100) : 0;

              return (
                <div key={domain.key} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                  <button
                    onClick={() => toggleDomain(domain.key)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <IconComp className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-foreground">{domain.label}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      {granted}/{total}
                    </Badge>
                    <Progress value={domainPct} className="h-1.5 w-16 hidden sm:block" />
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/30 divide-y divide-border/20">
                          {domain.permissions.map(perm => {
                            const hasIt = rolePerms.includes(perm.key);
                            return (
                              <div
                                key={perm.key}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors"
                              >
                                <Switch
                                  checked={hasIt}
                                  onCheckedChange={() => togglePermission(perm.key, hasIt, perm.label)}
                                  disabled={!canEdit}
                                  className="shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground">{perm.label}</p>
                                  <p className="text-xs text-muted-foreground leading-tight">{perm.description}</p>
                                </div>
                                <code className="text-[9px] text-muted-foreground/50 hidden lg:block font-mono">
                                  {perm.key}
                                </code>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Users with this role */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className={`h-4 w-4 ${meta.color}`} />
              <h3 className="text-sm font-bold text-foreground">
                Utilisateurs — <span className={meta.color}>{ROLE_LABELS[selectedRole]}</span>
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
                    onClick={() => navigate(`/admin/users/${u.user_id}`)}
                    className="flex items-center gap-3 rounded-lg p-2.5 text-left hover:bg-secondary/50 transition-colors border border-border/30"
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${meta.bgColor} ${meta.color}`}>
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

          {!canEdit && (
            <p className="text-xs text-muted-foreground italic text-center">
              Seul un Super Admin peut modifier les permissions des rôles.
            </p>
          )}
        </TabsContent>

        {/* ══════════ COMPARE VIEW ══════════ */}
        <TabsContent value="compare" className="space-y-5">
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <p className="text-sm font-bold text-foreground mb-3">Sélectionner 2 à 4 rôles à comparer</p>
            <div className="flex gap-2 flex-wrap">
              {(ALL_ROLES as unknown as string[]).map(role => {
                const m = ROLE_META[role] || ROLE_META.member;
                const checked = compareRoles.includes(role);
                return (
                  <label
                    key={role}
                    className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-all ${
                      checked ? `${m.bgColor} ${m.color}` : "border-border/50 bg-card hover:bg-secondary/50"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleCompareRole(role)}
                      disabled={!checked && compareRoles.length >= 4}
                    />
                    <span className="text-xs font-bold">{ROLE_LABELS[role]}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {compareRoles.length >= 2 ? (
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-secondary/30">
                      <th className="text-left py-3 px-4 font-bold text-muted-foreground min-w-[240px] sticky left-0 bg-secondary/30 z-10">
                        Permission
                      </th>
                      {compareRoles.map(role => {
                        const m = ROLE_META[role] || ROLE_META.member;
                        return (
                          <th key={role} className="py-3 px-4 text-center min-w-[120px]">
                            <span className={`text-xs font-bold ${m.color}`}>{ROLE_LABELS[role]}</span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {DOMAINS.map(domain => {
                      const IconComp = ICON_MAP[domain.icon] || Layers;
                      return (
                        <>
                          <tr key={`h-${domain.key}`} className="bg-secondary/10">
                            <td colSpan={compareRoles.length + 1} className="py-2 px-4 sticky left-0 bg-secondary/10 z-10">
                              <div className="flex items-center gap-2">
                                <IconComp className="h-3.5 w-3.5 text-primary" />
                                <span className="text-xs font-bold text-foreground">{domain.label}</span>
                              </div>
                            </td>
                          </tr>
                          {domain.permissions.map((perm, pi) => (
                            <tr key={perm.key} className={`border-t border-border/10 ${pi % 2 === 0 ? "" : "bg-secondary/5"}`}>
                              <td className="py-2.5 px-4 sticky left-0 bg-card z-10">
                                <p className="font-medium text-foreground">{perm.label}</p>
                                <p className="text-[10px] text-muted-foreground">{perm.description}</p>
                              </td>
                              {compareRoles.map(role => {
                                const rp = getPermissionsForRoleFromDB(dbMap, role);
                                const hasIt = rp.includes(perm.key);
                                return (
                                  <td key={role} className="py-2.5 px-4 text-center">
                                    {hasIt ? (
                                      <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-500/10">
                                        <Check className="h-3.5 w-3.5 text-green-500" />
                                      </div>
                                    ) : (
                                      <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted/20">
                                        <X className="h-3.5 w-3.5 text-muted-foreground/30" />
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <GitCompare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Sélectionnez au moins 2 rôles pour comparer</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stats footer */}
      <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-bold text-xl text-foreground">{ALL_ROLES.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rôles</p>
          </div>
          <div>
            <p className="font-bold text-xl text-foreground">{TOTAL_PERMS}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Permissions</p>
          </div>
          <div>
            <p className="font-bold text-xl text-foreground">{DOMAINS.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Domaines</p>
          </div>
        </div>
      </div>
    </div>
  );
}
