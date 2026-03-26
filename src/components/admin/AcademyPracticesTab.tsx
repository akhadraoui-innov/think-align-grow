import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Plus, Pencil, Trash2, Save, X, Zap } from "lucide-react";
import { getAllUniverses, getModeDefinition, UNIVERSE_LABELS, type ModeUniverse } from "@/components/simulator/config/modeRegistry";
import { getConfigFields, type ConfigField } from "@/components/simulator/config/typeConfigSchemas";
import { getBehaviorInjection } from "@/components/simulator/config/promptTemplates";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Practice {
  id: string;
  module_id: string;
  title: string;
  scenario: string;
  system_prompt: string;
  max_exchanges: number;
  difficulty: string | null;
  evaluation_rubric: any[];
}

interface Props {
  moduleId: string;
  practices: Practice[];
}

const emptyForm = {
  title: "",
  scenario: "",
  system_prompt: "",
  max_exchanges: 10,
  difficulty: "intermediate" as string,
  evaluation_rubric: [] as { criterion: string; weight: number; description: string }[],
};

const difficultyLabels: Record<string, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  expert: "Expert",
};

export function AcademyPracticesTab({ moduleId, practices }: Props) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        module_id: moduleId,
        title: form.title,
        scenario: form.scenario,
        system_prompt: form.system_prompt,
        max_exchanges: form.max_exchanges,
        difficulty: form.difficulty,
        evaluation_rubric: form.evaluation_rubric,
      };
      if (editId) {
        const { error } = await supabase.from("academy_practices").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("academy_practices").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-module-practices", moduleId] });
      toast.success(editId ? "Pratique mise à jour" : "Pratique créée");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academy_practices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-module-practices", moduleId] });
      toast.success("Pratique supprimée");
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(pr: Practice) {
    setEditId(pr.id);
    const rubric = Array.isArray(pr.evaluation_rubric)
      ? pr.evaluation_rubric.map((r: any) => ({ criterion: r.criterion || "", weight: r.weight || 1, description: r.description || "" }))
      : [];
    setForm({
      title: pr.title,
      scenario: pr.scenario,
      system_prompt: pr.system_prompt,
      max_exchanges: pr.max_exchanges,
      difficulty: pr.difficulty || "intermediate",
      evaluation_rubric: rubric,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditId(null);
  }

  function addRubricItem() {
    setForm(f => ({
      ...f,
      evaluation_rubric: [...f.evaluation_rubric, { criterion: "", weight: 1, description: "" }],
    }));
  }

  function updateRubricItem(index: number, field: string, value: any) {
    setForm(f => ({
      ...f,
      evaluation_rubric: f.evaluation_rubric.map((r, i) => i === index ? { ...r, [field]: value } : r),
    }));
  }

  function removeRubricItem(index: number) {
    setForm(f => ({
      ...f,
      evaluation_rubric: f.evaluation_rubric.filter((_, i) => i !== index),
    }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{practices.length} pratique{practices.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> Ajouter une pratique
        </Button>
      </div>

      {practices.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucune pratique IA. Créez un scénario de coaching.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {practices.map((pr) => (
            <Card key={pr.id}>
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-violet-500" />
                    {pr.title}
                    <Badge variant="outline" className="text-[10px]">{pr.max_exchanges} échanges</Badge>
                    {pr.difficulty && (
                      <Badge variant="secondary" className="text-[10px]">{difficultyLabels[pr.difficulty] || pr.difficulty}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(pr)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(pr.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Scénario</p>
                  <p className="text-sm">{pr.scenario}</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Prompt système IA</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4">{pr.system_prompt}</p>
                </div>
                {Array.isArray(pr.evaluation_rubric) && pr.evaluation_rubric.length > 0 && (
                  <div className="rounded-xl bg-muted/30 p-3 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Grille d'évaluation</p>
                    {pr.evaluation_rubric.map((r: any, i: number) => (
                      <div key={i} className="text-xs flex gap-2">
                        <span className="font-medium">{r.criterion}</span>
                        <span className="text-muted-foreground">(×{r.weight})</span>
                        {r.description && <span className="text-muted-foreground">— {r.description}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier la pratique" : "Nouvelle pratique IA"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Titre</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Négociation budgétaire IA" />
            </div>

            <div className="space-y-1.5">
              <Label>Scénario (contexte pour l'apprenant)</Label>
              <Textarea value={form.scenario} onChange={e => setForm(f => ({ ...f, scenario: e.target.value }))} rows={4} placeholder="Décrivez la situation dans laquelle l'apprenant se trouve..." />
            </div>

            <div className="space-y-1.5">
              <Label>Prompt système IA (instructions pour le coach)</Label>
              <Textarea value={form.system_prompt} onChange={e => setForm(f => ({ ...f, system_prompt: e.target.value }))} rows={6} placeholder="Tu es un coach senior spécialisé en..." className="font-mono text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Échanges max</Label>
                <Input type="number" min={3} max={30} value={form.max_exchanges} onChange={e => setForm(f => ({ ...f, max_exchanges: parseInt(e.target.value) || 10 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Difficulté</Label>
                <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Débutant</SelectItem>
                    <SelectItem value="intermediate">Intermédiaire</SelectItem>
                    <SelectItem value="advanced">Avancé</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Evaluation Rubric */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Grille d'évaluation</Label>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addRubricItem}>
                  <Plus className="h-3 w-3 mr-1" /> Critère
                </Button>
              </div>
              {form.evaluation_rubric.length > 0 && (
                <div className="space-y-2 rounded-xl border p-3">
                  {form.evaluation_rubric.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Input value={r.criterion} onChange={e => updateRubricItem(i, "criterion", e.target.value)} placeholder="Critère" className="h-7 text-xs" />
                        <Input value={r.description} onChange={e => updateRubricItem(i, "description", e.target.value)} placeholder="Description" className="h-7 text-xs col-span-1" />
                        <Input type="number" min={1} max={5} value={r.weight} onChange={e => updateRubricItem(i, "weight", parseInt(e.target.value) || 1)} className="h-7 text-xs w-16" />
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeRubricItem(i)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}>Annuler</Button>
              <Button onClick={() => upsert.mutate()} disabled={!form.title.trim() || upsert.isPending}>
                <Save className="h-4 w-4 mr-2" /> {editId ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
