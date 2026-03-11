import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Plus, X } from "lucide-react";
import { useState } from "react";
import { Constants } from "@/integrations/supabase/types";

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

export function UserRolesTab({ roles, onAddRole, onRemoveRole }: Props) {
  const [newRole, setNewRole] = useState("");
  const availableRoles = ALL_ROLES.filter((r) => !roles.includes(r));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Rôles plateforme
        </h3>
        <div className="flex flex-wrap gap-2">
          {roles.length === 0 && <p className="text-sm text-muted-foreground italic">Aucun rôle attribué</p>}
          {roles.map((role) => (
            <Badge key={role} variant="outline" className={`text-xs gap-1.5 py-1.5 px-3 ${ROLE_COLORS[role] || "bg-muted text-muted-foreground border-border"}`}>
              {role.replace(/_/g, " ")}
              <button onClick={() => onRemoveRole(role)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
        {availableRoles.length > 0 && (
          <div className="flex items-center gap-2 pt-3 border-t border-border/50">
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
        )}
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Légende des rôles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
          <p><strong className="text-foreground">super_admin</strong> — Accès total, gestion plateforme</p>
          <p><strong className="text-foreground">customer_lead</strong> — Gestion clients & organisations</p>
          <p><strong className="text-foreground">innovation_lead</strong> — Gestion toolkits & design</p>
          <p><strong className="text-foreground">performance_lead</strong> — Facturation & performance</p>
          <p><strong className="text-foreground">product_actor</strong> — Contribution produit</p>
          <p><strong className="text-foreground">owner</strong> — Propriétaire d'une organisation</p>
          <p><strong className="text-foreground">admin</strong> — Admin d'une organisation</p>
          <p><strong className="text-foreground">member</strong> — Membre standard</p>
          <p><strong className="text-foreground">facilitator</strong> — Animation de workshops</p>
          <p><strong className="text-foreground">manager</strong> — Gestionnaire d'équipe</p>
          <p><strong className="text-foreground">lead</strong> — Chef de projet</p>
          <p><strong className="text-foreground">guest</strong> — Accès invité limité</p>
        </div>
      </div>
    </div>
  );
}
