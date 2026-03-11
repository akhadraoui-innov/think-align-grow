import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, Save, Trash2, X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const PHASE_LABELS: Record<string, string> = {
  foundations: "Fondations", model: "Modèle", growth: "Croissance", execution: "Exécution",
};

interface Props {
  cards: Tables<"cards">[];
  pillars: Tables<"pillars">[];
  toolkitId: string;
  onUpdate: () => void;
}

function buildCardForm(c: Tables<"cards">) {
  const cAny = c as any;
  return {
    title: c.title, subtitle: c.subtitle || "", phase: c.phase, step_name: c.step_name || "",
    icon_name: c.icon_name || "", sort_order: c.sort_order, pillar_id: c.pillar_id,
    objective: c.objective || "", kpi: c.kpi || "", action: c.action || "", definition: c.definition || "",
    qualification: cAny.qualification || "", valorization: cAny.valorization ?? 0,
    difficulty: cAny.difficulty || "", duration_minutes: cAny.duration_minutes ?? null,
    tags: Array.isArray(cAny.tags) ? cAny.tags as string[] : [],
    status: cAny.status || "active",
  };
}

export function ToolkitCardsTab({ cards, pillars, toolkitId, onUpdate }: Props) {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [editCard, setEditCard] = useState<Tables<"cards"> | null>(null);
  const [form, setForm] = useState<ReturnType<typeof buildCardForm> | null>(null);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const grouped = pillars.map((p) => ({
    pillar: p,
    cards: cards.filter((c) => c.pillar_id === p.id),
  }));

  const openEdit = (c: Tables<"cards">) => {
    setEditCard(c);
    setForm(buildCardForm(c));
    setTagInput("");
  };

  const set = (key: string, value: any) => setForm((f) => f ? { ...f, [key]: value } : f);

  const handleSave = async () => {
    if (!editCard || !form) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("cards").update(form as any).eq("id", editCard.id);
      if (error) throw error;
      toast({ title: "Carte mise à jour" });
      setEditCard(null);
      onUpdate();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!editCard) return;
    const { error } = await supabase.from("cards").delete().eq("id", editCard.id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Carte supprimée" }); setEditCard(null); onUpdate(); }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-toolkit-cards", { body: { toolkit_id: toolkitId } });
      if (error) throw error;
      toast({ title: "Import terminé", description: `${data?.imported ?? 0} cartes importées` });
      onUpdate();
    } catch (e: any) {
      toast({ title: "Erreur d'import", description: e.message, variant: "destructive" });
    } finally { setImporting(false); }
  };

  const addTag = () => {
    if (!form) return;
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) { set("tags", [...form.tags, t]); setTagInput(""); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleImport} disabled={importing} className="gap-2">
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Importer des cartes
        </Button>
      </div>

      {grouped.map(({ pillar, cards: pillarCards }) => (
        <div key={pillar.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b border-border/50 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: pillar.color || "#ccc" }} />
            <h4 className="font-medium text-sm text-foreground">{pillar.name}</h4>
            <Badge variant="outline" className="text-[10px] ml-auto">{pillarCards.length} cartes</Badge>
          </div>
          {pillarCards.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Aucune carte</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">#</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Titre</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Phase</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Qualification</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Points</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Statut</th>
                </tr>
              </thead>
              <tbody>
                {pillarCards.map((c) => {
                  const cAny = c as any;
                  return (
                    <tr key={c.id} className="border-b border-border/20 cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => openEdit(c)}>
                      <td className="px-4 py-2 text-muted-foreground">{c.sort_order}</td>
                      <td className="px-4 py-2">
                        <p className="font-medium text-foreground">{c.title}</p>
                        {c.subtitle && <p className="text-xs text-muted-foreground">{c.subtitle}</p>}
                      </td>
                      <td className="px-4 py-2"><Badge variant="outline" className="text-[10px]">{PHASE_LABELS[c.phase] || c.phase}</Badge></td>
                      <td className="px-4 py-2 text-muted-foreground text-xs">{cAny.qualification || "—"}</td>
                      <td className="px-4 py-2 text-muted-foreground text-xs">{cAny.valorization || 0}</td>
                      <td className="px-4 py-2">
                        <Badge variant={cAny.status === "active" ? "default" : "secondary"} className="text-[10px]">
                          {cAny.status || "active"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {grouped.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
          Créez d'abord des piliers pour organiser les cartes.
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editCard} onOpenChange={(open) => !open && setEditCard(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Éditer la carte</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              {/* Identity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sous-titre</Label>
                  <Input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phase</Label>
                  <Select value={form.phase} onValueChange={(v: any) => set("phase", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="foundations">Fondations</SelectItem>
                      <SelectItem value="model">Modèle</SelectItem>
                      <SelectItem value="growth">Croissance</SelectItem>
                      <SelectItem value="execution">Exécution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pilier</Label>
                  <Select value={form.pillar_id} onValueChange={(v) => set("pillar_id", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {pillars.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Step name</Label>
                  <Input value={form.step_name} onChange={(e) => set("step_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Icône</Label>
                  <Input value={form.icon_name} onChange={(e) => set("icon_name", e.target.value)} placeholder="Ex: Target" />
                </div>
                <div className="space-y-2">
                  <Label>Ordre</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => set("sort_order", parseInt(e.target.value) || 0)} />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label>Objectif</Label>
                <Textarea value={form.objective} onChange={(e) => set("objective", e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>KPI</Label>
                <Input value={form.kpi} onChange={(e) => set("kpi", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Action</Label>
                <Textarea value={form.action} onChange={(e) => set("action", e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Définition</Label>
                <Textarea value={form.definition} onChange={(e) => set("definition", e.target.value)} rows={2} />
              </div>

              {/* Qualification & Valorisation */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Qualification</Label>
                  <Input value={form.qualification} onChange={(e) => set("qualification", e.target.value)} placeholder="Ex: Stratégique" />
                </div>
                <div className="space-y-2">
                  <Label>Valorisation (pts)</Label>
                  <Input type="number" value={form.valorization} onChange={(e) => set("valorization", parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Difficulté</Label>
                  <Select value={form.difficulty} onValueChange={(v) => set("difficulty", v)}>
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facile">Facile</SelectItem>
                      <SelectItem value="moyen">Moyen</SelectItem>
                      <SelectItem value="avance">Avancé</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Durée (min)</Label>
                  <Input type="number" value={form.duration_minutes ?? ""} onChange={(e) => set("duration_minutes", e.target.value ? parseInt(e.target.value) : null)} />
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={form.status} onValueChange={(v) => set("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Ajouter un tag..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} className="max-w-xs" />
                  <Button variant="outline" size="sm" onClick={addTag} type="button">+</Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {form.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                        {tag}
                        <button onClick={() => set("tags", form.tags.filter((t) => t !== tag))} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Enregistrer
                </Button>
                <Button variant="ghost" onClick={handleDelete} className="text-destructive hover:text-destructive gap-1.5 ml-auto">
                  <Trash2 className="h-4 w-4" /> Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
