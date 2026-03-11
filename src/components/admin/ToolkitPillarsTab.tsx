import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Trash2, Save, ChevronDown, X, Palette, GraduationCap, LayoutGrid } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  pillars: Tables<"pillars">[];
  toolkitId: string;
  onUpdate: () => void;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "Actif", variant: "default" },
  draft: { label: "Brouillon", variant: "secondary" },
  archived: { label: "Archivé", variant: "outline" },
};

export function ToolkitPillarsTab({ pillars, toolkitId, onUpdate }: Props) {
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editForms, setEditForms] = useState<Record<string, any>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newPillar, setNewPillar] = useState({ name: "", slug: "", color: "#3b82f6", icon_name: "", sort_order: pillars.length });
  const [outcomeInput, setOutcomeInput] = useState<Record<string, string>>({});

  const getEditForm = (p: Tables<"pillars">) => {
    if (editForms[p.id]) return editForms[p.id];
    const pAny = p as any;
    return {
      name: p.name, slug: p.slug, description: p.description || "", color: p.color || "#3b82f6",
      icon_name: p.icon_name || "", sort_order: p.sort_order,
      subtitle: pAny.subtitle || "", target_audience: pAny.target_audience || "",
      learning_outcomes: Array.isArray(pAny.learning_outcomes) ? pAny.learning_outcomes : [],
      weight: pAny.weight ?? 1, status: pAny.status || "active",
    };
  };

  const setEditField = (id: string, key: string, value: any) => {
    setEditForms((prev) => ({
      ...prev,
      [id]: { ...getEditForm(pillars.find((p) => p.id === id)!), ...prev[id], [key]: value },
    }));
  };

  const toggleOpen = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  const handleSavePillar = async (p: Tables<"pillars">) => {
    setSavingId(p.id);
    try {
      const form = getEditForm(p);
      const { error } = await supabase.from("pillars").update(form as any).eq("id", p.id);
      if (error) throw error;
      toast({ title: "Pilier mis à jour" });
      setEditForms((prev) => { const n = { ...prev }; delete n[p.id]; return n; });
      onUpdate();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setSavingId(null); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("pillars").delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Pilier supprimé" }); onUpdate(); }
  };

  const handleAdd = async () => {
    if (!newPillar.name || !newPillar.slug) return;
    setAdding(true);
    try {
      const { error } = await supabase.from("pillars").insert({ ...newPillar, toolkit_id: toolkitId });
      if (error) throw error;
      toast({ title: "Pilier ajouté" });
      setNewPillar({ name: "", slug: "", color: "#3b82f6", icon_name: "", sort_order: pillars.length + 1 });
      onUpdate();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setAdding(false); }
  };

  const addOutcome = (pillarId: string) => {
    const val = (outcomeInput[pillarId] || "").trim();
    if (!val) return;
    const form = getEditForm(pillars.find((p) => p.id === pillarId)!);
    const current = editForms[pillarId] || form;
    setEditForms((prev) => ({
      ...prev,
      [pillarId]: { ...current, learning_outcomes: [...(current.learning_outcomes || []), val] },
    }));
    setOutcomeInput((prev) => ({ ...prev, [pillarId]: "" }));
  };

  const removeOutcome = (pillarId: string, idx: number) => {
    const form = getEditForm(pillars.find((p) => p.id === pillarId)!);
    const current = editForms[pillarId] || form;
    setEditForms((prev) => ({
      ...prev,
      [pillarId]: { ...current, learning_outcomes: current.learning_outcomes.filter((_: any, i: number) => i !== idx) },
    }));
  };

  return (
    <div className="space-y-4">
      {pillars.map((p) => {
        const form = getEditForm(p);
        const isOpen = openId === p.id;
        const statusInfo = STATUS_MAP[form.status] || STATUS_MAP.active;
        return (
          <Collapsible key={p.id} open={isOpen} onOpenChange={() => toggleOpen(p.id)}>
            <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm transition-shadow hover:shadow-md">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 transition-all text-left group">
                  <div className="h-3.5 w-3.5 rounded-full ring-2 ring-background shadow-sm shrink-0" style={{ backgroundColor: p.color || "#ccc" }} />
                  <span className="font-semibold text-sm text-foreground flex-1 tracking-tight">{p.name}</span>
                  <Badge variant={statusInfo.variant} className="text-[10px] font-medium">{statusInfo.label}</Badge>
                  <span className="text-[11px] text-muted-foreground/50 font-mono">{p.slug}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">#{p.sort_order}</Badge>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground/40 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} group-hover:text-muted-foreground`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border/30 p-5 space-y-5 bg-muted/5">
                  {/* Section: Identité */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <LayoutGrid className="h-3.5 w-3.5" />
                      Identité
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Nom</Label>
                        <Input value={form.name} onChange={(e) => setEditField(p.id, "name", e.target.value)} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Slug</Label>
                        <Input value={form.slug} onChange={(e) => setEditField(p.id, "slug", e.target.value)} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Sous-titre</Label>
                        <Input value={form.subtitle} onChange={(e) => setEditField(p.id, "subtitle", e.target.value)} className="h-9" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <Textarea value={form.description} onChange={(e) => setEditField(p.id, "description", e.target.value)} rows={2} className="resize-none" />
                    </div>
                  </div>

                  <Separator className="bg-border/20" />

                  {/* Section: Apparence */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Palette className="h-3.5 w-3.5" />
                      Apparence & Ordre
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Couleur</Label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={form.color} onChange={(e) => setEditField(p.id, "color", e.target.value)} className="h-9 w-12 rounded-md border border-input cursor-pointer" />
                          <span className="text-xs font-mono text-muted-foreground">{form.color}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Icône</Label>
                        <Input value={form.icon_name} onChange={(e) => setEditField(p.id, "icon_name", e.target.value)} placeholder="Ex: Brain" className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Ordre</Label>
                        <Input type="number" value={form.sort_order} onChange={(e) => setEditField(p.id, "sort_order", parseInt(e.target.value) || 0)} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Pondération</Label>
                        <Input type="number" value={form.weight} onChange={(e) => setEditField(p.id, "weight", parseInt(e.target.value) || 1)} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Statut</Label>
                        <Select value={form.status} onValueChange={(v) => setEditField(p.id, "status", v)}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="draft">Brouillon</SelectItem>
                            <SelectItem value="archived">Archivé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-border/20" />

                  {/* Section: Pédagogie */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <GraduationCap className="h-3.5 w-3.5" />
                      Pédagogie
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Public cible</Label>
                      <Textarea value={form.target_audience} onChange={(e) => setEditField(p.id, "target_audience", e.target.value)} rows={2} placeholder="À qui s'adresse ce pilier..." className="resize-none" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Acquis pédagogiques</Label>
                      <div className="flex gap-2">
                        <Input value={outcomeInput[p.id] || ""} onChange={(e) => setOutcomeInput((prev) => ({ ...prev, [p.id]: e.target.value }))} placeholder="Ajouter un acquis..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOutcome(p.id))} className="max-w-xs h-9" />
                        <Button variant="outline" size="sm" onClick={() => addOutcome(p.id)} type="button" className="h-9 px-3">+</Button>
                      </div>
                      {form.learning_outcomes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {form.learning_outcomes.map((o: string, i: number) => (
                            <Badge key={i} variant="secondary" className="gap-1 text-xs">
                              {o}
                              <button onClick={() => removeOutcome(p.id, i)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border/20">
                    <Button size="sm" onClick={() => handleSavePillar(p)} disabled={savingId === p.id} className="gap-1.5 h-8">
                      {savingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Enregistrer
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive gap-1.5 h-8 ml-auto">
                      <Trash2 className="h-3.5 w-3.5" /> Supprimer
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}

      {pillars.length === 0 && (
        <div className="rounded-xl border border-border/40 bg-card p-12 text-center text-muted-foreground/60 text-sm">Aucun pilier</div>
      )}

      <div className="rounded-xl border border-dashed border-border/40 bg-muted/5 p-5">
        <h4 className="text-sm font-semibold text-foreground mb-3 tracking-tight">Ajouter un pilier</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Input placeholder="Nom" value={newPillar.name} onChange={(e) => setNewPillar((f) => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }))} className="h-9" />
          <Input placeholder="Slug" value={newPillar.slug} onChange={(e) => setNewPillar((f) => ({ ...f, slug: e.target.value }))} className="h-9" />
          <input type="color" value={newPillar.color} onChange={(e) => setNewPillar((f) => ({ ...f, color: e.target.value }))} className="h-9 w-full rounded-md border border-input cursor-pointer" />
          <Input placeholder="Icône (ex: Brain)" value={newPillar.icon_name} onChange={(e) => setNewPillar((f) => ({ ...f, icon_name: e.target.value }))} className="h-9" />
          <Button onClick={handleAdd} disabled={adding} size="sm" className="gap-2 h-9">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}
