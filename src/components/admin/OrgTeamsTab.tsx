import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Plus, Users, Loader2, Trash2, Settings2 } from "lucide-react";
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
  const [manageTeam, setManageTeam] = useState<Team | null>(null);

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
    if (!confirm("Supprimer cette équipe ? Cette action est définitive.")) return;
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
            <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <GradientIcon icon={Users} gradient="team" size="sm" />
                <div>
                  <h2 className="text-lg font-display font-bold text-foreground">Créer une équipe</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Ajoutez une nouvelle équipe à l'organisation</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Nom de l'équipe</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Équipe Produit" />
              </div>
            </div>
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
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setManageTeam(t)}>
                <Settings2 className="h-3.5 w-3.5" /> Membres
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(t.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {manageTeam && (
        <ManageTeamMembersDialog
          team={manageTeam}
          organizationId={organizationId}
          onClose={() => setManageTeam(null)}
        />
      )}
    </div>
  );
}

function ManageTeamMembersDialog({
  team,
  organizationId,
  onClose,
}: {
  team: Team;
  organizationId: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [leadUserId, setLeadUserId] = useState<string>(team.lead_user_id ?? "__none__");
  const [saving, setSaving] = useState(false);

  // Membres de l'organisation
  const { data: orgMembers, isLoading: loadingOrg } = useQuery({
    queryKey: ["org-members-for-team", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members")
        .select("user_id, profile:profiles!organization_members_user_id_fkey(display_name)")
        .eq("organization_id", organizationId);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // Membres actuels de l'équipe
  const { data: teamMembers, isLoading: loadingTeam } = useQuery({
    queryKey: ["team-members", team.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", team.id);
      if (error) throw error;
      return (data ?? []) as { user_id: string }[];
    },
  });

  useEffect(() => {
    if (teamMembers) setSelected(new Set(teamMembers.map((m) => m.user_id)));
  }, [teamMembers]);

  const toggle = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const current = new Set(teamMembers?.map((m) => m.user_id) ?? []);
      const toAdd = [...selected].filter((id) => !current.has(id));
      const toRemove = [...current].filter((id) => !selected.has(id));

      if (toAdd.length > 0) {
        const { error } = await supabase.from("team_members").insert(
          toAdd.map((user_id) => ({ team_id: team.id, user_id }))
        );
        if (error) throw error;
      }
      if (toRemove.length > 0) {
        const { error } = await supabase
          .from("team_members")
          .delete()
          .eq("team_id", team.id)
          .in("user_id", toRemove);
        if (error) throw error;
      }

      const newLead = leadUserId === "__none__" ? null : leadUserId;
      if (newLead !== team.lead_user_id) {
        const { error } = await supabase
          .from("teams")
          .update({ lead_user_id: newLead })
          .eq("id", team.id);
        if (error) throw error;
      }

      toast({ title: "Équipe mise à jour" });
      queryClient.invalidateQueries({ queryKey: ["admin-org-teams", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["team-members", team.id] });
      onClose();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const loading = loadingOrg || loadingTeam;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Membres de « {team.name} »</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Lead d'équipe</label>
            <Select value={leadUserId} onValueChange={setLeadUserId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Aucun</SelectItem>
                {(orgMembers ?? [])
                  .filter((m) => selected.has(m.user_id))
                  .map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profile?.display_name ?? m.user_id.slice(0, 8)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Le lead doit être membre de l'équipe.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Membres de l'équipe ({selected.size})</label>
            <ScrollArea className="h-72 rounded-lg border border-border/50">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (orgMembers ?? []).length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">Aucun membre dans cette organisation.</p>
              ) : (
                <div className="divide-y divide-border/30">
                  {(orgMembers ?? []).map((m) => (
                    <label
                      key={m.user_id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 cursor-pointer"
                    >
                      <Checkbox checked={selected.has(m.user_id)} onCheckedChange={() => toggle(m.user_id)} />
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                          {(m.profile?.display_name ?? m.user_id)[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{m.profile?.display_name ?? m.user_id.slice(0, 12)}</span>
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
