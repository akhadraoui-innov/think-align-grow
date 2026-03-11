import { useState } from "react";
import { Organization } from "@/hooks/useOrganizations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Users, UsersRound, Presentation, Layers, CreditCard, Trash2, Copy, ExternalLink } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface OrgStats {
  memberCount: number;
  teamCount: number;
  workshopCount: number;
  toolkitCount: number;
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
}

interface Props {
  organization: Organization;
  stats: OrgStats;
}

export function OrgInfoTab({ organization, stats }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: organization.name,
    slug: organization.slug,
    primary_color: organization.primary_color || "#E8552D",
    logo_url: organization.logo_url || "",
  });

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        name: form.name,
        slug: form.slug,
        primary_color: form.primary_color,
        logo_url: form.logo_url || null,
      })
      .eq("id", organization.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Organisation mise à jour" });
      queryClient.invalidateQueries({ queryKey: ["admin-organization", organization.id] });
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(organization.id);
    toast({ title: "ID copié" });
  };

  const statusLabel = stats.subscriptionStatus === "active" ? "Actif" : stats.subscriptionStatus === "trial" ? "Essai" : stats.subscriptionStatus || "Aucun";
  const statusColor = stats.subscriptionStatus === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : stats.subscriptionStatus === "trial" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : "bg-muted text-muted-foreground border-border";

  const createdAgo = formatDistanceToNow(new Date(organization.created_at), { addSuffix: true, locale: fr });

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Users, label: "Membres", value: stats.memberCount, color: "text-blue-500" },
          { icon: UsersRound, label: "Équipes", value: stats.teamCount, color: "text-violet-500" },
          { icon: Presentation, label: "Workshops", value: stats.workshopCount, color: "text-orange-500" },
          { icon: Layers, label: "Toolkits", value: stats.toolkitCount, color: "text-emerald-500" },
          { icon: CreditCard, label: "Plan", value: stats.subscriptionPlan || "—", color: "text-primary", isBadge: true },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/50 bg-card p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
            </div>
            {(s as any).isBadge ? (
              <Badge variant="outline" className={`w-fit text-xs mt-1 ${statusColor}`}>{typeof s.value === "string" ? s.value : statusLabel}</Badge>
            ) : (
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Branding preview */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Aperçu du branding</h3>
        <div className="flex items-center gap-6">
          <div
            className="h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg"
            style={{ backgroundColor: form.primary_color }}
          >
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="h-14 w-14 rounded-xl object-contain" />
            ) : (
              form.name[0]?.toUpperCase()
            )}
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-foreground">{form.name}</p>
            <p className="text-sm text-muted-foreground">/{form.slug}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-5 w-5 rounded-md border border-border" style={{ backgroundColor: form.primary_color }} />
              <span className="text-xs font-mono text-muted-foreground">{form.primary_color}</span>
            </div>
          </div>
          <div className="ml-auto hidden md:flex flex-col gap-1">
            <div className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: form.primary_color }}>
              Bouton primaire
            </div>
            <div className="rounded-lg px-4 py-2 text-sm font-medium border" style={{ borderColor: form.primary_color, color: form.primary_color }}>
              Bouton secondaire
            </div>
          </div>
        </div>
      </div>

      {/* Editable form */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Informations générales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Nom de l'organisation</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Slug (URL)</Label>
            <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Couleur principale</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
                className="h-9 w-9 rounded-lg border border-border cursor-pointer"
              />
              <Input value={form.primary_color} onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))} className="flex-1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">URL du logo</Label>
            <Input value={form.logo_url} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Métadonnées</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">ID</p>
            <div className="flex items-center gap-1">
              <p className="text-xs font-mono text-foreground truncate max-w-[140px]">{organization.id}</p>
              <button onClick={handleCopyId} className="text-muted-foreground hover:text-foreground transition-colors">
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Créée le</p>
            <p className="text-sm text-foreground">{format(new Date(organization.created_at), "dd MMM yyyy", { locale: fr })}</p>
            <p className="text-[10px] text-muted-foreground">{createdAgo}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Dernière modification</p>
            <p className="text-sm text-foreground">{format(new Date(organization.updated_at), "dd MMM yyyy à HH:mm", { locale: fr })}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Statut abonnement</p>
            <Badge variant="outline" className={`text-xs ${statusColor}`}>{statusLabel}</Badge>
            {stats.subscriptionPlan && (
              <p className="text-[10px] text-muted-foreground mt-1">Plan : {stats.subscriptionPlan}</p>
            )}
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h3 className="text-sm font-semibold text-destructive mb-2">Zone de danger</h3>
        <p className="text-xs text-muted-foreground mb-4">
          La suppression d'une organisation est irréversible. Toutes les données associées (membres, équipes, workshops) seront perdues.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-2">
              <Trash2 className="h-4 w-4" /> Supprimer l'organisation
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer « {organization.name} » ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Toutes les données de l'organisation seront définitivement supprimées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  const { error } = await supabase.from("organizations").delete().eq("id", organization.id);
                  if (error) {
                    toast({ title: "Erreur", description: error.message, variant: "destructive" });
                  } else {
                    toast({ title: "Organisation supprimée" });
                    window.location.href = "/admin/organizations";
                  }
                }}
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
