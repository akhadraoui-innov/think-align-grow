import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Plus, X, Check, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Constants } from "@/integrations/supabase/types";
import {
  getPermissionsForRoleFromDB, useRolePermissionsFromDB,
  PERMISSION_DOMAINS, getDomainCoverage,
  type PermissionDomain,
} from "@/hooks/usePermissions";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

const ALL_ROLES = Constants.public.Enums.app_role;
const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-500/10 text-red-600 border-red-500/30",
  customer_lead: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  innovation_lead: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  performance_lead: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  product_actor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  owner: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  admin: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  lead: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
  facilitator: "bg-pink-500/10 text-pink-600 border-pink-500/30",
  manager: "bg-teal-500/10 text-teal-600 border-teal-500/30",
};

interface Props {
  roles: string[];
  onAddRole: (role: string) => Promise<void>;
  onRemoveRole: (role: string) => Promise<void>;
}

function DomainSummary({ role, domain }: { role: string; domain: PermissionDomain }) {
  const { granted, total } = getDomainCoverage(role, domain.key);
  if (granted === 0) return null;
  const pct = total > 0 ? Math.round((granted / total) * 100) : 0;
  const rolePerms = getPermissionsForRole(role);
  const domainPerms = domain.permissions.filter(p => rolePerms.includes(p.key));

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-foreground">{domain.label}</span>
        <span className="text-[9px] text-muted-foreground">{granted}/{total}</span>
        <Progress value={pct} className="h-1 w-12" />
      </div>
      <div className="flex flex-wrap gap-1">
        {domainPerms.map(p => (
          <span key={p.key} className="inline-flex items-center gap-0.5 text-[9px] font-medium bg-primary/8 text-primary border border-primary/15 rounded px-1.5 py-0.5">
            <Check className="h-2 w-2" /> {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function RolePermissionBreakdown({ role }: { role: string }) {
  const [expanded, setExpanded] = useState(false);
  const perms = getPermissionsForRole(role);
  const totalPermsCount = PERMISSION_DOMAINS.reduce((s, d) => s + d.permissions.length, 0);
  const pct = Math.round((perms.length / totalPermsCount) * 100);
  const domainsWithPerms = PERMISSION_DOMAINS.filter(d => {
    const { granted } = getDomainCoverage(role, d.key);
    return granted > 0;
  });

  if (perms.length === 0) {
    return <span className="text-[10px] text-muted-foreground italic ml-1">Aucune permission</span>;
  }

  return (
    <div className="ml-1 space-y-1.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className="font-medium">{perms.length} permissions</span>
        <span>· {domainsWithPerms.length} domaines</span>
        <Progress value={pct} className="h-1 w-16" />
        <span className="font-bold">{pct}%</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-2 pl-2 border-l-2 border-primary/10"
          >
            {domainsWithPerms.map(d => (
              <DomainSummary key={d.key} role={role} domain={d} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function UserRolesTab({ roles, onAddRole, onRemoveRole }: Props) {
  const [newRole, setNewRole] = useState("");
  const availableRoles = ALL_ROLES.filter((r) => !roles.includes(r));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Rôles plateforme
        </h3>

        <div className="space-y-4">
          {roles.length === 0 && <p className="text-sm text-muted-foreground italic">Aucun rôle attribué</p>}
          {roles.map((role) => (
            <div key={role} className="space-y-1.5 rounded-lg border border-border/30 p-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs gap-1.5 py-1.5 px-3 ${ROLE_COLORS[role] || "bg-muted text-muted-foreground border-border"}`}>
                  {role.replace(/_/g, " ")}
                  <button onClick={() => onRemoveRole(role)} className="hover:text-destructive ml-1"><X className="h-3 w-3" /></button>
                </Badge>
              </div>
              <RolePermissionBreakdown role={role} />
            </div>
          ))}
        </div>

        {availableRoles.length > 0 && (
          <div className="pt-3 border-t border-border/50 space-y-3">
            <div className="flex items-center gap-2">
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="w-[220px] h-9 text-xs"><SelectValue placeholder="Ajouter un rôle…" /></SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      <span className="flex items-center gap-2">
                        {r.replace(/_/g, " ")}
                        <span className="text-[10px] text-muted-foreground">
                          ({getPermissionsForRole(r).length} perms)
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={async () => { if (newRole) { await onAddRole(newRole); setNewRole(""); } }} className="gap-1 text-xs">
                <Plus className="h-3 w-3" /> Ajouter
              </Button>
            </div>

            {/* Preview permissions for selected role */}
            {newRole && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3"
              >
                <p className="text-[10px] font-bold text-primary mb-2">
                  Aperçu — permissions de « {newRole.replace(/_/g, " ")} »
                </p>
                <RolePermissionBreakdown role={newRole} />
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
