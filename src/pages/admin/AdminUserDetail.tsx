import { useParams, useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  ArrowLeft, Loader2, Shield, Building2, Coins, Plus, X, CreditCard,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
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

export default function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { users, isLoading, addRole, removeRole, adjustCredits } = useAdminUsers();
  const permissions = usePermissions();

  const [newRole, setNewRole] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDesc, setCreditDesc] = useState("");

  const user = users.find((u) => u.user_id === userId);

  if (isLoading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AdminShell>
    );
  }

  if (!user) {
    return (
      <AdminShell>
        <div className="p-6">
          <p className="text-muted-foreground">Utilisateur introuvable.</p>
        </div>
      </AdminShell>
    );
  }

  const availableRoles = ALL_ROLES.filter((r) => !user.roles.includes(r));

  const handleAddRole = async () => {
    if (!newRole) return;
    try {
      await addRole.mutateAsync({ userId: user.user_id, role: newRole });
      toast({ title: `Rôle "${newRole.replace(/_/g, " ")}" ajouté` });
      setNewRole("");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const handleRemoveRole = async (role: string) => {
    try {
      await removeRole.mutateAsync({ userId: user.user_id, role });
      toast({ title: `Rôle "${role.replace(/_/g, " ")}" retiré` });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const handleAdjustCredits = async () => {
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount === 0 || !creditDesc) return;
    try {
      await adjustCredits.mutateAsync({ userId: user.user_id, amount, description: creditDesc });
      toast({ title: `${amount > 0 ? "+" : ""}${amount} crédits` });
      setCreditAmount("");
      setCreditDesc("");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const createdAgo = formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: fr });

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
              {(user.display_name || "?")[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">{user.display_name || "Sans nom"}</h1>
            <p className="text-xs text-muted-foreground">
              Inscrit {createdAgo} · {user.xp} XP · {user.credit_balance} crédits
            </p>
          </div>
          <Badge variant="outline" className={`ml-auto text-xs ${user.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : ""}`}>
            {user.status === "active" ? "Actif" : user.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profil */}
          <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Profil
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">User ID</p>
                <p className="font-mono text-xs text-foreground break-all">{user.user_id}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Statut</p>
                <p className="text-foreground">{user.status}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Inscription</p>
                <p className="text-foreground">{format(new Date(user.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Dernière connexion</p>
                <p className="text-foreground">
                  {user.last_seen_at ? format(new Date(user.last_seen_at), "dd MMM yyyy à HH:mm", { locale: fr }) : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">XP</p>
                <p className="text-foreground font-mono">{user.xp}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Crédits</p>
                <p className="text-foreground font-mono">{user.credit_balance}</p>
              </div>
            </div>
          </div>

          {/* Rôles */}
          <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Rôles plateforme
            </h3>
            <div className="flex flex-wrap gap-2">
              {user.roles.length === 0 && <p className="text-sm text-muted-foreground italic">Aucun rôle attribué</p>}
              {user.roles.map((role) => (
                <Badge key={role} variant="outline" className={`text-xs gap-1 ${ROLE_COLORS[role] || "bg-muted text-muted-foreground border-border"}`}>
                  {role.replace(/_/g, " ")}
                  {permissions.canManageUsers && (
                    <button onClick={() => handleRemoveRole(role)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {permissions.canManageUsers && availableRoles.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder="Ajouter un rôle…" /></SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((r) => (
                      <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={handleAddRole} disabled={!newRole || addRole.isPending} className="h-8 gap-1 text-xs">
                  <Plus className="h-3 w-3" /> Ajouter
                </Button>
              </div>
            )}
          </div>

          {/* Organisations */}
          <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Organisations
            </h3>
            {user.organizations.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Aucune organisation</p>
            ) : (
              <div className="space-y-2">
                {user.organizations.map((org) => (
                  <div key={org.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{org.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{org.id}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{org.role.replace(/_/g, " ")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Crédits */}
          <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" /> Ajuster les crédits
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border/50 px-4 py-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-foreground">{user.credit_balance}</span>
                <span className="text-xs text-muted-foreground">crédits</span>
              </div>
            </div>
            {permissions.canManageUsers && (
              <div className="space-y-3 pt-2 border-t border-border/50">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Montant (+/-)</Label>
                    <Input value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="Ex: 50 ou -10" type="number" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Raison</Label>
                    <Input value={creditDesc} onChange={(e) => setCreditDesc(e.target.value)} placeholder="Bonus, correction…" className="h-8 text-sm" />
                  </div>
                </div>
                <Button size="sm" onClick={handleAdjustCredits} disabled={adjustCredits.isPending} className="gap-2 text-xs">
                  {adjustCredits.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Appliquer
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
