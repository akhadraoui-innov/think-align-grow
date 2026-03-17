import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Settings, Database, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Props {
  template: Tables<"challenge_templates"> & { toolkits?: any; pillars?: any };
  toolkits: { id: string; name: string; icon_emoji: string | null }[];
  pillars: { id: string; name: string }[];
  onUpdate: () => void;
}

export function ChallengeInfoTab({ template, toolkits, pillars, onUpdate }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const lastSavedRef = useRef(false);

  const [form, setForm] = useState({
    name: template.name,
    description: template.description || "",
    difficulty: template.difficulty || "intermediate",
    toolkit_id: template.toolkit_id,
    pillar_id: template.pillar_id || "",
  });

  // Fetch linked toolkits from junction table
  const { data: linkedToolkits } = useQuery({
    queryKey: ["challenge-template-toolkits", template.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_template_toolkits")
        .select("toolkit_id")
        .eq("template_id", template.id);
      if (error) throw error;
      return data.map(d => d.toolkit_id);
    },
  });

  const [selectedToolkitIds, setSelectedToolkitIds] = useState<string[]>([]);

  // Sync linked toolkits from DB only when template changes (not after save)
  useEffect(() => {
    if (lastSavedRef.current) {
      lastSavedRef.current = false;
      return;
    }
    setForm({
      name: template.name,
      description: template.description || "",
      difficulty: template.difficulty || "intermediate",
      toolkit_id: template.toolkit_id,
      pillar_id: template.pillar_id || "",
    });
  }, [template.id, template.name, template.description, template.difficulty, template.toolkit_id, template.pillar_id]);

  useEffect(() => {
    if (linkedToolkits && !lastSavedRef.current) {
      setSelectedToolkitIds(linkedToolkits);
    }
  }, [linkedToolkits]);

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const toggleToolkit = (toolkitId: string) => {
    setSelectedToolkitIds(prev => {
      if (prev.includes(toolkitId)) {
        return prev.filter(id => id !== toolkitId);
      }
      return [...prev, toolkitId];
    });
  };

  const handleSave = async () => {
    if (selectedToolkitIds.length === 0) {
      toast({ title: "Erreur", description: "Sélectionnez au moins un toolkit", variant: "destructive" });
      return;
    }
    setSaving(true);
    lastSavedRef.current = true;
    try {
      // Update template (keep toolkit_id as primary = first selected)
      const primaryToolkitId = selectedToolkitIds[0];
      const { error } = await supabase.from("challenge_templates").update({
        name: form.name,
        description: form.description || null,
        difficulty: form.difficulty,
        toolkit_id: primaryToolkitId,
        pillar_id: form.pillar_id || null,
      }).eq("id", template.id);
      if (error) throw error;

      // Sync junction table: delete all then re-insert
      const { error: delErr } = await supabase
        .from("challenge_template_toolkits")
        .delete()
        .eq("template_id", template.id);
      if (delErr) throw delErr;

      if (selectedToolkitIds.length > 0) {
        const { error: insErr } = await supabase
          .from("challenge_template_toolkits")
          .insert(selectedToolkitIds.map(tkId => ({
            template_id: template.id,
            toolkit_id: tkId,
          })));
        if (insErr) throw insErr;
      }

      toast({ title: "Template mis à jour" });
      qc.invalidateQueries({ queryKey: ["challenge-template-toolkits", template.id] });
      onUpdate();
    } catch (e: any) {
      lastSavedRef.current = false;
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

          {/* Multi-toolkit selection */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Toolkits associés</Label>
            {selectedToolkitIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedToolkitIds.map(tkId => {
                  const tk = toolkits.find(t => t.id === tkId);
                  if (!tk) return null;
                  return (
                    <Badge key={tkId} variant="secondary" className="gap-1 pr-1">
                      {tk.icon_emoji || "🚀"} {tk.name}
                      <button
                        onClick={() => toggleToolkit(tkId)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
            <div className="rounded-lg border border-border/50 bg-muted/20 max-h-40 overflow-y-auto">
              {toolkits.map(tk => (
                <label
                  key={tk.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted/40 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedToolkitIds.includes(tk.id)}
                    onCheckedChange={() => toggleToolkit(tk.id)}
                  />
                  <span className="text-sm">{tk.icon_emoji || "🚀"} {tk.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Pilier (optionnel)</Label>
            <Select value={form.pillar_id || "none"} onValueChange={(v) => set("pillar_id", v === "none" ? "" : v)}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Aucun" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {pillars.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
