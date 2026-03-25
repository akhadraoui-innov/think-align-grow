import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Dumbbell, Plus, Pencil, Trash2, Save, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";

interface Exercise {
  id: string;
  module_id: string;
  title: string;
  instructions: string;
  expected_output_type: string;
  ai_evaluation_enabled: boolean;
  evaluation_criteria: Record<string, any>;
  generation_mode: string;
}

interface Props {
  moduleId: string;
  exercises: Exercise[];
}

const emptyForm = {
  title: "",
  instructions: "",
  expected_output_type: "text",
  ai_evaluation_enabled: true,
  evaluation_criteria: {} as Record<string, string>,
};

const criteriaPresets = [
  { key: "pertinence", label: "Pertinence", desc: "Adéquation de la réponse aux objectifs" },
  { key: "argumentation", label: "Argumentation", desc: "Qualité des arguments et exemples" },
  { key: "structure", label: "Structure", desc: "Organisation logique du contenu" },
  { key: "creativite", label: "Créativité", desc: "Originalité et innovation" },
  { key: "completude", label: "Complétude", desc: "Couverture exhaustive du sujet" },
];

export function AcademyExercisesTab({ moduleId, exercises }: Props) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [customCriterionKey, setCustomCriterionKey] = useState("");
  const [customCriterionVal, setCustomCriterionVal] = useState("");

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        module_id: moduleId,
        title: form.title,
        instructions: form.instructions,
        expected_output_type: form.expected_output_type,
        ai_evaluation_enabled: form.ai_evaluation_enabled,
        evaluation_criteria: form.evaluation_criteria,
      };
      if (editId) {
        const { error } = await supabase.from("academy_exercises").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("academy_exercises").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-module-exercises", moduleId] });
      toast.success(editId ? "Exercice mis à jour" : "Exercice créé");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academy_exercises").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-module-exercises", moduleId] });
      toast.success("Exercice supprimé");
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(ex: Exercise) {
    setEditId(ex.id);
    setForm({
      title: ex.title,
      instructions: ex.instructions,
      expected_output_type: ex.expected_output_type,
      ai_evaluation_enabled: ex.ai_evaluation_enabled,
      evaluation_criteria: (ex.evaluation_criteria || {}) as Record<string, string>,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditId(null);
  }

  function addCriterion(key: string, value: string) {
    setForm(f => ({ ...f, evaluation_criteria: { ...f.evaluation_criteria, [key]: value } }));
  }

  function removeCriterion(key: string) {
    setForm(f => {
      const c = { ...f.evaluation_criteria };
      delete c[key];
      return { ...f, evaluation_criteria: c };
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{exercises.length} exercice{exercises.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> Ajouter un exercice
        </Button>
      </div>

      {exercises.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucun exercice. Créez-en un pour ce module.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {exercises.map((ex) => (
            <Card key={ex.id}>
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-emerald-500" />
                    {ex.title}
                    {ex.ai_evaluation_enabled && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Sparkles className="h-3 w-3 mr-0.5" /> Éval. IA
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">{ex.expected_output_type}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(ex)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(ex.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <EnrichedMarkdown content={ex.instructions} />
                </div>
                {ex.evaluation_criteria && Object.keys(ex.evaluation_criteria).length > 0 && (
                  <div className="rounded-xl bg-muted/30 p-3 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Critères d'évaluation</p>
                    {Object.entries(ex.evaluation_criteria).map(([k, v]) => (
                      <div key={k} className="text-xs flex gap-2">
                        <span className="font-medium capitalize">{k.replace(/_/g, " ")}:</span>
                        <span className="text-muted-foreground">{String(v)}</span>
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
            <DialogTitle>{editId ? "Modifier l'exercice" : "Nouvel exercice"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Titre</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Rédiger un plan stratégique IA" />
            </div>

            <div className="space-y-1.5">
              <Label>Instructions (Markdown)</Label>
              <Textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} rows={8} placeholder="Décrivez l'exercice en détail. Le markdown est supporté." className="font-mono text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type de rendu attendu</Label>
                <Select value={form.expected_output_type} onValueChange={v => setForm(f => ({ ...f, expected_output_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texte libre</SelectItem>
                    <SelectItem value="markdown">Markdown structuré</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="file">Fichier uploadé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Évaluation IA</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch checked={form.ai_evaluation_enabled} onCheckedChange={v => setForm(f => ({ ...f, ai_evaluation_enabled: v }))} />
                  <span className="text-sm text-muted-foreground">{form.ai_evaluation_enabled ? "Activée" : "Désactivée"}</span>
                </div>
              </div>
            </div>

            {/* Evaluation Criteria */}
            <div className="space-y-2">
              <Label>Critères d'évaluation</Label>
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {criteriaPresets.filter(cp => !(cp.key in form.evaluation_criteria)).map(cp => (
                  <Button key={cp.key} variant="outline" size="sm" className="h-7 text-xs" onClick={() => addCriterion(cp.key, cp.desc)}>
                    <Plus className="h-3 w-3 mr-1" /> {cp.label}
                  </Button>
                ))}
              </div>
              {/* Active criteria */}
              {Object.entries(form.evaluation_criteria).length > 0 && (
                <div className="space-y-2 rounded-xl border p-3">
                  {Object.entries(form.evaluation_criteria).map(([k, v]) => (
                    <div key={k} className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-semibold capitalize">{k.replace(/_/g, " ")}</p>
                        <Input value={String(v)} onChange={e => addCriterion(k, e.target.value)} className="h-7 text-xs mt-1" />
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 mt-3" onClick={() => removeCriterion(k)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {/* Custom */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input value={customCriterionKey} onChange={e => setCustomCriterionKey(e.target.value)} placeholder="Nom du critère" className="h-7 text-xs" />
                </div>
                <div className="flex-1">
                  <Input value={customCriterionVal} onChange={e => setCustomCriterionVal(e.target.value)} placeholder="Description" className="h-7 text-xs" />
                </div>
                <Button variant="outline" size="sm" className="h-7" disabled={!customCriterionKey.trim()} onClick={() => {
                  addCriterion(customCriterionKey.trim().toLowerCase().replace(/\s+/g, "_"), customCriterionVal || "À évaluer");
                  setCustomCriterionKey("");
                  setCustomCriterionVal("");
                }}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
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
