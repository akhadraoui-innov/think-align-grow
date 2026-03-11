import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { UserPlus, Mail, Shield, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  owner: "bg-primary/10 text-primary border-primary/30",
  admin: "bg-accent/10 text-accent border-accent/30",
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

export function OrgMembersTab({ members, organizationId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{members.length} membre{members.length > 1 ? "s" : ""}</span>
          <span>·</span>
          <span>{members.filter((m) => m.role === "owner" || m.role === "admin").length} admin{members.filter((m) => m.role === "owner" || m.role === "admin").length > 1 ? "s" : ""}</span>
        </div>
        <Button size="sm" variant="outline" className="gap-2" disabled>
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
          members.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-4 py-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {(m.profile?.display_name || m.user_id)[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {m.profile?.display_name || m.user_id.slice(0, 12) + "..."}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{m.profile?.xp ?? 0} XP</span>
                  <span>·</span>
                  <span>Depuis {format(new Date(m.created_at), "dd MMM yyyy", { locale: fr })}</span>
                  {m.profile?.last_seen_at && (
                    <>
                      <span>·</span>
                      <span>Vu {format(new Date(m.profile.last_seen_at), "dd MMM HH:mm", { locale: fr })}</span>
                    </>
                  )}
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
                  <DropdownMenuItem onClick={() => handleRoleChange(m.id, "admin")}>
                    <Shield className="h-3.5 w-3.5 mr-2" /> Passer Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleChange(m.id, "member")}>
                    Passer Membre
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleChange(m.id, "lead")}>
                    Passer Lead
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleChange(m.id, "facilitator")}>
                    Passer Facilitateur
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleChange(m.id, "manager")}>
                    Passer Manager
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
