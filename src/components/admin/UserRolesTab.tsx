import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Plus, X, Check } from "lucide-react";
import { useState } from "react";
import { Constants } from "@/integrations/supabase/types";
import { getPermissionsForRole, PERMISSION_LABELS } from "@/hooks/usePermissions";

const ALL_ROLES = Constants.public.Enums.app_role;
const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-500/10 text-red-600 border-red-500/30",
  customer_lead: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  innovation_lead: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  performance_lead: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  product_actor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  owner: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  admin: "bg-sky-500/10 text-sky-600 border-sky-500/30",
};

interface Props {
  roles: string[];
  onAddRole: (role: string) => Promise<void>;
  onRemoveRole: (role: string) => Promise<void>;
}

function PermissionChips({ permissions, className = "" }: { permissions: string[]; className?: string }) {
  if (permissions.length === 0) return <span className={`text-[10px] text-muted-foreground italic ${className}`}>Aucune permission spéciale</span>;
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {permissions.map(p => (
        <span key={p} className="inline-flex items-center gap-0.5 text-[9px] font-medium bg-primary/8 text-primary border border-primary/15 rounded px-1.5 py-0.5">
          <Check className="h-2 w-2" /> {PERMISSION_LABELS[p] || p}
        </span>
      ))}
    </div>
  );
}

export function UserRolesTab({ roles, onAddRole, onRemoveRole }: Props) {
  const [newRole, setNewRole] = useState("");
  const availableRoles = ALL_ROLES.filter((r) => !roles.includes(r));
  const previewPerms = newRole ? getPermissionsForRole(newRole) : [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Rôles plateforme
        </h3>
        <div className="space-y-3">
          {roles.length === 0 && <p className="text-sm text-muted-foreground italic">Aucun rôle attribué</p>}
          {roles.map((role) => {
            const perms = getPermissionsForRole(role);
            return (
              <div key={role} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs gap-1.5 py-1.5 px-3 ${ROLE_COLORS[role] || "bg-muted text-muted-foreground border-border"}`}>
                    {role.replace(/_/g, " ")}
                    <button onClick={() => onRemoveRole(role)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                </div>
                <PermissionChips permissions={perms} className="ml-1" />
              </div>
            );
          })}
        </div>
        {availableRoles.length > 0 && (
          <div className="pt-3 border-t border-border/50 space-y-2">
            <div className="flex items-center gap-2">
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="w-[220px] h-9 text-xs"><SelectValue placeholder="Ajouter un rôle…" /></SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={async () => { if (newRole) { await onAddRole(newRole); setNewRole(""); } }} className="gap-1 text-xs">
                <Plus className="h-3 w-3" /> Ajouter
              </Button>
            </div>
            {newRole && previewPerms.length > 0 && (
              <div className="ml-1">
                <p className="text-[10px] text-muted-foreground mb-1 italic">Permissions déverrouillées :</p>
                <PermissionChips permissions={previewPerms} className="opacity-60" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
