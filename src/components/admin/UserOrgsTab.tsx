import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrgMembership {
  id: string;
  organization_id: string;
  role: string;
  created_at: string;
  organizations: { id: string; name: string; slug: string; primary_color: string | null; logo_url: string | null } | null;
}

interface Props {
  organizations: OrgMembership[];
  onAdd: (organizationId: string, role: string) => Promise<void>;
  onRemove: (membershipId: string) => Promise<void>;
}

const ROLES = ["member", "admin", "owner", "lead", "manager", "facilitator", "guest"];

export function UserOrgsTab({ organizations, onAdd, onRemove }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [allOrgs, setAllOrgs] = useState<{ id: string; name: string }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const existingOrgIds = organizations.map((o) => o.organization_id);

  useEffect(() => {
    if (open) {
      supabase
        .from("organizations")
        .select("id, name")
        .order("name")
        .then(({ data }) => setAllOrgs(data || []));
    }
  }, [open]);

  const availableOrgs = allOrgs.filter((o) => !existingOrgIds.includes(o.id));

  const handleAdd = async () => {
    if (!selectedOrg) return;
    setAdding(true);
    try {
      await onAdd(selectedOrg, selectedRole);
      setOpen(false);
      setSelectedOrg("");
      setSelectedRole("member");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent, membershipId: string) => {
    e.stopPropagation();
    setRemoving(membershipId);
    try {
      await onRemove(membershipId);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Organisations ({organizations.length})
          </h3>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter à une organisation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Organisation</label>
                  <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une organisation…" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOrgs.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Aucune organisation disponible</div>
                      ) : (
                        availableOrgs.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Rôle</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAdd} disabled={!selectedOrg || adding} className="w-full">
                  {adding ? "Ajout…" : "Ajouter"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {organizations.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Cet utilisateur n'appartient à aucune organisation.</p>
        ) : (
          <div className="space-y-3">
            {organizations.map((om) => {
              const org = om.organizations;
              return (
                <div
                  key={om.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => org && navigate(`/admin/organizations/${org.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: org?.primary_color || "#E8552D" }}
                    >
                      {org?.logo_url ? (
                        <img src={org.logo_url} alt="" className="h-7 w-7 rounded object-contain" />
                      ) : (
                        org?.name?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{org?.name || "—"}</p>
                      <p className="text-[11px] text-muted-foreground">/{org?.slug} · membre depuis {new Date(om.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{om.role.replace(/_/g, " ")}</Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      disabled={removing === om.id}
                      onClick={(e) => handleRemove(e, om.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
