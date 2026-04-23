import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { UserPlus, Shield, MoreVertical, Mail, Loader2, X, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useInvitations } from "@/hooks/useInvitations";

interface MemberWithProfile {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  created_at: string;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    xp: number;
    status?: string;
    last_seen_at?: string | null;
  } | null;
}

interface Props {
  members: MemberWithProfile[];
  organizationId: string;
}

const roleColors: Record<string, string> = {
  owner: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  admin: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  member: "bg-secondary text-secondary-foreground border-border",
  lead: "bg-pillar-business/10 text-pillar-business border-pillar-business/30",
  facilitator: "bg-pillar-innovation/10 text-pillar-innovation border-pillar-innovation/30",
  manager: "bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30",
  guest: "bg-muted text-muted-foreground border-border",
};

const roleLabels: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Admin",
  member: "Membre",
  lead: "Lead",
  facilitator: "Facilitateur",
  manager: "Manager",
  guest: "Invité",
};

const ALL_ROLES = ["owner", "admin", "member", "lead", "facilitator", "manager", "guest"];

function isOnline(lastSeen?: string | null) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

export function OrgMembersTab({ members, organizationId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const { invitations, send, revoke, resend } = useInvitations(organizationId);

  const pendingInvitations = invitations.filter((i) => !i.accepted_at && !i.revoked_at && new Date(i.expires_at) > new Date());

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const { error } = await supabase
      .from("organization_members")
      .update({ role: newRole as any })
      .eq("id", memberId);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rôle mis à jour" });
      queryClient.invalidateQueries({ queryKey: ["admin-org-members", organizationId] });
    }
  };

  const handleRemove = async (memberId: string) => {
    const { error } = await supabase.from("organization_members").delete().eq("id", memberId);
    if (error) {
      toast({ title: "Impossible de retirer", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Membre retiré" });
      queryClient.invalidateQueries({ queryKey: ["admin-org-members", organizationId] });
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const result: any = await send.mutateAsync({ email: inviteEmail.trim(), role: inviteRole });
      toast({
        title: "Invitation envoyée",
        description: result?.email_sent
          ? `Email envoyé à ${inviteEmail}`
          : `Lien généré : ${result?.accept_url ?? "voir liste"}`,
      });
      setInviteEmail("");
      setInviteRole("member");
      setInviteOpen(false);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message ?? "Échec de l'envoi", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{members.length} membre{members.length > 1 ? "s" : ""}</span>
          <span>·</span>
          <span>{members.filter((m) => m.role === "owner" || m.role === "admin").length} admin{members.filter((m) => m.role === "owner" || m.role === "admin").length > 1 ? "s" : ""}</span>
          {pendingInvitations.length > 0 && (
            <>
              <span>·</span>
              <span>{pendingInvitations.length} invitation{pendingInvitations.length > 1 ? "s" : ""} en attente</span>
            </>
          )}
        </div>
        <Button size="sm" variant="default" className="gap-2" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Inviter
        </Button>
      </div>

      {/* Members list */}
      <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/30">
        {members.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Aucun membre dans cette organisation.
          </div>
        ) : (
          members.map((m) => {
            const online = isOnline(m.profile?.last_seen_at);
            return (
              <div key={m.id} className="flex items-center gap-4 px-4 py-3">
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {(m.profile?.display_name || m.user_id)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {online && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" title="En ligne" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {m.profile?.display_name || m.user_id.slice(0, 12) + "..."}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{m.profile?.xp ?? 0} XP</span>
                    <span>·</span>
                    <span>Depuis {format(new Date(m.created_at), "dd MMM yyyy", { locale: fr })}</span>
                    {online ? (
                      <>
                        <span>·</span>
                        <span className="text-emerald-600 font-medium">En ligne</span>
                      </>
                    ) : m.profile?.last_seen_at ? (
                      <>
                        <span>·</span>
                        <span>Vu {format(new Date(m.profile.last_seen_at), "dd MMM HH:mm", { locale: fr })}</span>
                      </>
                    ) : null}
                  </div>
                </div>
                <Badge variant="outline" className={`text-xs ${roleColors[m.role] || ""}`}>
                  {roleLabels[m.role] || m.role}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {ALL_ROLES.filter((r) => r !== m.role).map((r) => (
                      <DropdownMenuItem key={r} onClick={() => handleRoleChange(m.id, r)}>
                        <Shield className="h-3.5 w-3.5 mr-2" /> Passer {roleLabels[r]}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleRemove(m.id)} className="text-destructive">
                      <X className="h-3.5 w-3.5 mr-2" /> Retirer de l'organisation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}
      </div>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invitations en attente</h4>
          <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/30">
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-2.5">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{inv.email}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {roleLabels[inv.role] ?? inv.role} · expire le {format(new Date(inv.expires_at), "dd MMM", { locale: fr })}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => resend.mutate(inv)} disabled={resend.isPending}>
                  <RefreshCw className="h-3 w-3" /> Renvoyer
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => revoke.mutate(inv.id)} disabled={revoke.isPending}>
                  Révoquer
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invitation dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Inviter un membre</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Email</label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="utilisateur@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Rôle</label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Un email d'invitation sera envoyé. Le lien expire dans 7 jours.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Annuler</Button>
            <Button onClick={handleSendInvitation} disabled={!inviteEmail.trim() || send.isPending}>
              {send.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
