import { useState } from "react";
import { Organization } from "@/hooks/useOrganizations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Upload } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  organization: Organization;
}

export function OrgInfoTab({ organization }: Props) {
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

  return (
    <div className="space-y-6">
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
            <p className="text-xs font-mono text-foreground break-all">{organization.id}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Créée le</p>
            <p className="text-sm text-foreground">{format(new Date(organization.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Mise à jour</p>
            <p className="text-sm text-foreground">{format(new Date(organization.updated_at), "dd MMM yyyy à HH:mm", { locale: fr })}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Branding</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-6 w-6 rounded-md shadow-sm" style={{ backgroundColor: organization.primary_color || "#E8552D" }} />
              {organization.logo_url ? (
                <img src={organization.logo_url} alt="Logo" className="h-6 w-6 rounded object-contain" />
              ) : (
                <span className="text-xs text-muted-foreground">Pas de logo</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
