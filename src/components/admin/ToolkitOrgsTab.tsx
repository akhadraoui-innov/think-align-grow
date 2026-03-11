import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, ExternalLink, Building2 } from "lucide-react";

interface Props {
  orgToolkits: any[];
  toolkitId: string;
  onUpdate: () => void;
}

export function ToolkitOrgsTab({ orgToolkits, toolkitId, onUpdate }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [adding, setAdding] = useState(false);

  const existingOrgIds = orgToolkits.map((ot) => ot.organization_id);

  const { data: allOrgs } = useQuery({
    queryKey: ["admin-all-orgs-for-toolkit"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("id, name, slug, primary_color").order("name");
      if (error) throw error;
      return data;
    },
  });

  const availableOrgs = (allOrgs || []).filter((o) => !existingOrgIds.includes(o.id));

  const handleAdd = async () => {
    if (!selectedOrg) return;
    setAdding(true);
    try {
      const { error } = await supabase.from("organization_toolkits").insert({ toolkit_id: toolkitId, organization_id: selectedOrg });
      if (error) throw error;
      toast({ title: "Organisation ajoutée" });
      setOpen(false);
      setSelectedOrg("");
      onUpdate();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("organization_toolkits").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Accès retiré" });
      onUpdate();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Ajouter une organisation
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="p-0 gap-0 rounded-2xl overflow-hidden border-border/50 shadow-[var(--shadow-elevated)] max-w-md">
            <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <GradientIcon icon={Building2} gradient="business" size="sm" />
                <div>
                  <h2 className="text-lg font-display font-bold text-foreground">Donner accès au toolkit</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Sélectionnez une organisation</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Organisation</label>
                <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                  <SelectTrigger><SelectValue placeholder="Choisir une organisation" /></SelectTrigger>
                  <SelectContent>
                    {availableOrgs.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border/50 bg-muted/30 flex justify-end">
              <Button onClick={handleAdd} disabled={adding || !selectedOrg} className="gap-1.5 min-w-[100px]">
                {adding && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Ajouter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Organisation</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {orgToolkits.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Aucune organisation n'a accès à ce toolkit.</td></tr>
            ) : (
              orgToolkits.map((ot) => {
                const org = ot.organizations;
                return (
                  <tr key={ot.id} className="border-b border-border/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: org?.primary_color || "#E8552D" }}>
                          {org?.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{org?.name}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => navigate(`/admin/organizations/${org?.id}`)}>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${ot.is_active ? "bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30" : "bg-muted text-muted-foreground"}`}>
                        {ot.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(ot.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
