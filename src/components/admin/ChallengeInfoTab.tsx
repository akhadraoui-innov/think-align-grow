import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Settings, Database } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  template: Tables<"challenge_templates"> & { toolkits?: any; pillars?: any };
  toolkits: { id: string; name: string; icon_emoji: string | null }[];
  pillars: { id: string; name: string }[];
  onUpdate: () => void;
}

export function ChallengeInfoTab({ template, toolkits, pillars, onUpdate }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: template.name,
    description: template.description || "",
    difficulty: template.difficulty || "intermediate",
    toolkit_id: template.toolkit_id,
    pillar_id: template.pillar_id || "",
  });

  useEffect(() => {
    setForm({
      name: template.name,
      description: template.description || "",
      difficulty: template.difficulty || "intermediate",
      toolkit_id: template.toolkit_id,
      pillar_id: template.pillar_id || "",
    });
  }, [template]);

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("challenge_templates").update({
        name: form.name,
        description: form.description || null,
        difficulty: form.difficulty,
        toolkit_id: form.toolkit_id,
        pillar_id: form.pillar_id || null,
      }).eq("id", template.id);
      if (error) throw error;
      toast({ title: "Template mis à jour" });
      onUpdate();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
          <Settings className="h-4 w-4 text-primary" />
          <div>
            <h3 className="font-semibold text-sm text-foreground tracking-tight">Identité</h3>
            <p className="text-[11px] text-muted-foreground/60">Informations principales du template</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nom</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Difficulté</Label>
              <Select value={form.difficulty} onValueChange={(v) => set("difficulty", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Débutant</SelectItem>
                  <SelectItem value="intermediate">Intermédiaire</SelectItem>
                  <SelectItem value="advanced">Avancé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Toolkit</Label>
              <Select value={form.toolkit_id} onValueChange={(v) => set("toolkit_id", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {toolkits.map((tk) => (
                    <SelectItem key={tk.id} value={tk.id}>
                      {tk.icon_emoji || "🚀"} {tk.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Pilier (optionnel)</Label>
              <Select value={form.pillar_id} onValueChange={(v) => set("pillar_id", v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Aucun" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {pillars.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="resize-none" />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-1 px-1 py-3 bg-background/80 backdrop-blur-sm border-t border-border/20">
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2 shadow-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
          <Database className="h-4 w-4 text-primary" />
          <div>
            <h3 className="font-semibold text-sm text-foreground tracking-tight">Métadonnées</h3>
            <p className="text-[11px] text-muted-foreground/60">Informations système</p>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">ID</span>
              <p className="font-mono text-xs text-foreground mt-1">{template.id}</p>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Créé le</span>
              <p className="text-xs text-foreground mt-1">{format(new Date(template.created_at), "dd MMM yyyy HH:mm", { locale: fr })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
