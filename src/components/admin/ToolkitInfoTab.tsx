import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  toolkit: Tables<"toolkits">;
  onUpdate: () => void;
}

export function ToolkitInfoTab({ toolkit, onUpdate }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: toolkit.name,
    slug: toolkit.slug,
    description: toolkit.description || "",
    icon_emoji: toolkit.icon_emoji || "🚀",
    status: toolkit.status,
  });

  useEffect(() => {
    setForm({
      name: toolkit.name,
      slug: toolkit.slug,
      description: toolkit.description || "",
      icon_emoji: toolkit.icon_emoji || "🚀",
      status: toolkit.status,
    });
  }, [toolkit]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("toolkits").update(form).eq("id", toolkit.id);
      if (error) throw error;
      toast({ title: "Toolkit mis à jour" });
      onUpdate();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Informations générales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Emoji</Label>
            <Input value={form.icon_emoji} onChange={(e) => setForm((f) => ({ ...f, icon_emoji: e.target.value }))} className="w-20 text-center text-lg" />
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={form.status} onValueChange={(v: any) => setForm((f) => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} />
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-2">
        <h3 className="font-semibold text-foreground">Métadonnées</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">ID</span><p className="font-mono text-xs text-foreground mt-0.5">{toolkit.id}</p></div>
          <div><span className="text-muted-foreground">Créé le</span><p className="text-foreground mt-0.5">{format(new Date(toolkit.created_at), "dd MMM yyyy HH:mm", { locale: fr })}</p></div>
          <div><span className="text-muted-foreground">Mis à jour</span><p className="text-foreground mt-0.5">{format(new Date(toolkit.updated_at), "dd MMM yyyy HH:mm", { locale: fr })}</p></div>
        </div>
      </div>
    </div>
  );
}
