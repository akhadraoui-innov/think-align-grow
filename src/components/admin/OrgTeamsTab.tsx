import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Team {
  id: string;
  name: string;
  organization_id: string;
  lead_user_id: string | null;
  created_at: string;
  member_count: number;
}

interface Props {
  teams: Team[];
  organizationId: string;
}

export function OrgTeamsTab({ teams, organizationId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("teams").insert({
      name: name.trim(),
      organization_id: organizationId,
    });
    setCreating(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Équipe créée" });
      setName("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-org-teams", organizationId] });
    }
  };

  const handleDelete = async (teamId: string) => {
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Équipe supprimée" });
      queryClient.invalidateQueries({ queryKey: ["admin-org-teams", organizationId] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{teams.length} équipe{teams.length > 1 ? "s" : ""}</p>
        <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle équipe
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="p-0 gap-0 rounded-2xl overflow-hidden border-border/50 shadow-[var(--shadow-elevated)] max-w-md">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <GradientIcon icon={Users} gradient="team" size="sm" />
                <div>
                  <h2 className="text-lg font-display font-bold text-foreground">Créer une équipe</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Ajoutez une nouvelle équipe à l'organisation</p>
                </div>
              </div>
            </div>
            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Nom de l'équipe</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Équipe Produit" />
              </div>
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/50 bg-muted/30 flex justify-end">
              <Button onClick={handleCreate} disabled={creating || !name.trim()} className="gap-1.5 min-w-[100px]">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Créer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/30">
        {teams.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Aucune équipe créée.
          </div>
        ) : (
          teams.map((t) => (
            <div key={t.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                <Users className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t.member_count} membre{t.member_count > 1 ? "s" : ""} · créée le {format(new Date(t.created_at), "dd MMM yyyy", { locale: fr })}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(t.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
