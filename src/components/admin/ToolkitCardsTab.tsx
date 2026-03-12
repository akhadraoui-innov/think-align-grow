import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, Save, Trash2, X, Tag, Settings2, FileText, Layers, LayoutGrid, List } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { ToolkitCardsBrowser } from "./ToolkitCardsBrowser";

const PHASE_LABELS: Record<string, string> = {
  foundations: "Fondations", model: "Modèle", growth: "Croissance", execution: "Exécution",
};

const PHASE_COLORS: Record<string, string> = {
  foundations: "bg-blue-500", model: "bg-violet-500", growth: "bg-emerald-500", execution: "bg-amber-500",
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
  const [viewMode, setViewMode] = useState<"table" | "visual">("table");
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
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
          <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("table")} className="gap-1.5 text-xs h-8">
            <List className="h-3.5 w-3.5" /> Tableau
          </Button>
          <Button variant={viewMode === "visual" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("visual")} className="gap-1.5 text-xs h-8">
            <LayoutGrid className="h-3.5 w-3.5" /> Visuel
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleImport} disabled={importing} className="gap-2">
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Importer des cartes
        </Button>
      </div>

      {viewMode === "visual" ? (
        <ToolkitCardsBrowser cards={cards} pillars={pillars} />
      ) : (
        <>
          {grouped.map(({ pillar, cards: pillarCards }) => (
        <div key={pillar.id} className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-muted/30 backdrop-blur-sm border-b border-border/40 flex items-center gap-3">
            <div className="h-3 w-3 rounded-full ring-2 ring-background shadow-sm" style={{ backgroundColor: pillar.color || "#ccc" }} />
            <h4 className="font-semibold text-sm text-foreground tracking-tight">{pillar.name}</h4>
            <Badge variant="outline" className="text-[10px] ml-auto font-mono">{pillarCards.length} cartes</Badge>
          </div>
          {pillarCards.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground/60">Aucune carte</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 border-b border-border/30">
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70 py-2.5 w-12">#</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70 py-2.5">Titre</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70 py-2.5">Phase</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70 py-2.5">Qualification</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70 py-2.5 text-right">Points</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70 py-2.5 text-right">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pillarCards.map((c, i) => {
                  const cAny = c as any;
                  return (
                    <TableRow
                      key={c.id}
                      className={`cursor-pointer transition-colors hover:bg-primary/5 border-b border-border/15 ${i % 2 === 1 ? "bg-muted/5" : ""}`}
                      onClick={() => openEdit(c)}
                    >
                      <TableCell className="text-muted-foreground/50 text-xs font-mono py-2.5">{c.sort_order}</TableCell>
                      <TableCell className="py-2.5">
                        <p className="font-medium text-sm text-foreground leading-tight">{c.title}</p>
                        {c.subtitle && <p className="text-xs text-muted-foreground/60 mt-0.5">{c.subtitle}</p>}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${PHASE_COLORS[c.phase] || "bg-muted"}`} />
                          <span className="text-xs text-muted-foreground">{PHASE_LABELS[c.phase] || c.phase}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs py-2.5">{cAny.qualification || "—"}</TableCell>
                      <TableCell className="text-right py-2.5">
                        <span className="text-xs font-mono text-muted-foreground">{cAny.valorization || 0}</span>
                      </TableCell>
                      <TableCell className="text-right py-2.5">
                        <Badge
                          variant={cAny.status === "active" ? "default" : "secondary"}
                          className="text-[10px] font-medium"
                        >
                          {cAny.status || "active"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      ))}

      {grouped.length === 0 && (
        <div className="rounded-xl border border-border/40 bg-card p-12 text-center text-muted-foreground/60 text-sm">
          Créez d'abord des piliers pour organiser les cartes.
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editCard} onOpenChange={(open) => !open && setEditCard(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">Éditer la carte</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-6 pt-2">
              {/* Section: Identité */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Layers className="h-4 w-4 text-primary" />
                  Identité
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Titre</Label>
                    <Input value={form.title} onChange={(e) => set("title", e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Sous-titre</Label>
                    <Input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Phase</Label>
                    <Select value={form.phase} onValueChange={(v: any) => set("phase", v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="foundations">Fondations</SelectItem>
                        <SelectItem value="model">Modèle</SelectItem>
                        <SelectItem value="growth">Croissance</SelectItem>
                        <SelectItem value="execution">Exécution</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Pilier</Label>
                    <Select value={form.pillar_id} onValueChange={(v) => set("pillar_id", v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {pillars.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Step name</Label>
                    <Input value={form.step_name} onChange={(e) => set("step_name", e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Icône</Label>
                    <Input value={form.icon_name} onChange={(e) => set("icon_name", e.target.value)} placeholder="Ex: Target" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Ordre</Label>
                    <Input type="number" value={form.sort_order} onChange={(e) => set("sort_order", parseInt(e.target.value) || 0)} className="h-9" />
                  </div>
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Section: Contenu */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  Contenu
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Objectif</Label>
                    <Textarea value={form.objective} onChange={(e) => set("objective", e.target.value)} rows={2} className="resize-none" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">KPI</Label>
                    <Input value={form.kpi} onChange={(e) => set("kpi", e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Action</Label>
                    <Textarea value={form.action} onChange={(e) => set("action", e.target.value)} rows={2} className="resize-none" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Définition</Label>
                    <Textarea value={form.definition} onChange={(e) => set("definition", e.target.value)} rows={2} className="resize-none" />
                  </div>
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Section: Paramètres */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Settings2 className="h-4 w-4 text-primary" />
                  Paramètres
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Qualification</Label>
                    <Input value={form.qualification} onChange={(e) => set("qualification", e.target.value)} placeholder="Ex: Stratégique" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Valorisation (pts)</Label>
                    <Input type="number" value={form.valorization} onChange={(e) => set("valorization", parseInt(e.target.value) || 0)} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Difficulté</Label>
                    <Select value={form.difficulty} onValueChange={(v) => set("difficulty", v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facile">Facile</SelectItem>
                        <SelectItem value="moyen">Moyen</SelectItem>
                        <SelectItem value="avance">Avancé</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Durée (min)</Label>
                    <Input type="number" value={form.duration_minutes ?? ""} onChange={(e) => set("duration_minutes", e.target.value ? parseInt(e.target.value) : null)} className="h-9" />
                  </div>
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Section: Tags & Statut */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Tag className="h-4 w-4 text-primary" />
                  Tags & Statut
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Statut</Label>
                    <Select value={form.status} onValueChange={(v) => set("status", v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Tags</Label>
                  <div className="flex gap-2">
                    <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Ajouter un tag..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} className="max-w-xs h-9" />
                    <Button variant="outline" size="sm" onClick={addTag} type="button" className="h-9 px-3">+</Button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                          {tag}
                          <button onClick={() => set("tags", form.tags.filter((t) => t !== tag))} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-border/30 sticky bottom-0 bg-background/95 backdrop-blur-sm -mx-6 px-6 pb-1">
                <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Enregistrer
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive gap-1.5 ml-auto">
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
