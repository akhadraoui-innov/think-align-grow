import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AcademyExercisesTab } from "@/components/admin/AcademyExercisesTab";
import { AcademyPracticesTab } from "@/components/admin/AcademyPracticesTab";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, BookOpen, FileText, HelpCircle, Dumbbell, MessageSquare,
  Pencil, Save, Clock, Target, Eye, Sparkles, Play
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { AcademyPractice } from "@/components/academy/AcademyPractice";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  lesson: { label: "Leçon", icon: FileText, color: "text-blue-600" },
  quiz: { label: "Quiz", icon: HelpCircle, color: "text-amber-600" },
  exercise: { label: "Exercice", icon: Dumbbell, color: "text-emerald-600" },
  practice: { label: "Pratique IA", icon: MessageSquare, color: "text-violet-600" },
};

const quizTypeBadge: Record<string, { label: string; emoji: string }> = {
  mcq: { label: "QCM", emoji: "🎯" },
  true_false: { label: "Vrai/Faux", emoji: "⚖️" },
  ordering: { label: "Ordonner", emoji: "📋" },
  matching: { label: "Associer", emoji: "🔗" },
  fill_blank: { label: "Compléter", emoji: "✏️" },
  scenario: { label: "Scénario", emoji: "🎭" },
};

export default function AdminAcademyModuleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [practiceTestOpen, setPracticeTestOpen] = useState(false);

  const { data: mod, isLoading } = useQuery({
    queryKey: ["admin-module-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_modules").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: contents = [] } = useQuery({
    queryKey: ["admin-module-contents", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("academy_contents").select("*").eq("module_id", id!).order("sort_order");
      return data || [];
    },
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ["admin-module-quizzes", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("academy_quizzes").select("*, academy_quiz_questions(*)").eq("module_id", id!);
      return data || [];
    },
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ["admin-module-exercises", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("academy_exercises").select("*").eq("module_id", id!);
      return data || [];
    },
  });

  const { data: practices = [] } = useQuery({
    queryKey: ["admin-module-practices", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("academy_practices").select("*").eq("module_id", id!);
      return data || [];
    },
  });

  const { data: progressData = [] } = useQuery({
    queryKey: ["admin-module-progress", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("academy_progress").select("*").eq("module_id", id!);
      return data || [];
    },
  });

  // Edit state
  const [editForm, setEditForm] = useState<any>(null);

  const updateModule = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from("academy_modules").update(payload).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-module-detail", id] });
      toast.success("Module mis à jour");
      setEditing(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading || !mod) {
    return (
      <AdminShell>
        <div className="p-6 flex items-center justify-center h-64">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminShell>
    );
  }

  const tc = typeConfig[mod.module_type] || typeConfig.lesson;
  const completedCount = progressData.filter(p => p.status === "completed").length;
  const avgScore = (() => {
    const scored = progressData.filter(p => p.score != null);
    if (scored.length === 0) return null;
    return Math.round(scored.reduce((s, p) => s + (p.score || 0), 0) / scored.length);
  })();

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md",
              mod.module_type === "lesson" ? "from-blue-500 to-cyan-500" :
              mod.module_type === "quiz" ? "from-amber-500 to-orange-500" :
              mod.module_type === "exercise" ? "from-emerald-500 to-teal-500" :
              "from-violet-500 to-purple-500"
            )}>
              <tc.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">{mod.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={cn("text-[10px]", tc.color)}>{tc.label}</Badge>
                <Badge variant="outline" className="text-[10px]">{mod.status}</Badge>
                {mod.estimated_minutes && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Clock className="h-3 w-3" /> {mod.estimated_minutes} min
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview apprenant
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setEditForm({ ...mod }); setEditing(true); }}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Modifier
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{progressData.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tentatives</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Complétés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{avgScore !== null ? `${avgScore}%` : "—"}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Score moyen</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{mod.estimated_minutes || "—"}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Minutes est.</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Contenu</TabsTrigger>
            <TabsTrigger value="quiz" className="gap-1.5"><HelpCircle className="h-3.5 w-3.5" /> Quiz</TabsTrigger>
            <TabsTrigger value="exercise" className="gap-1.5"><Dumbbell className="h-3.5 w-3.5" /> Exercice</TabsTrigger>
            <TabsTrigger value="practice" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Pratique</TabsTrigger>
            <TabsTrigger value="info" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Infos</TabsTrigger>
          </TabsList>

          {/* Content tab */}
          <TabsContent value="content">
            {contents.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucun contenu généré pour ce module.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-5">
                  <ScrollArea className="max-h-[600px]">
                    {contents.map((c: any) => (
                      <div key={c.id} className="prose prose-sm max-w-none dark:prose-invert">
                        <EnrichedMarkdown content={c.body} />
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Quiz tab */}
          <TabsContent value="quiz">
            {quizzes.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucun quiz généré.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {quizzes.map((quiz: any) => (
                  <Card key={quiz.id}>
                    <CardHeader className="pb-2 px-5 pt-5">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-amber-500" />
                        {quiz.title || "Quiz"}
                        <Badge variant="outline" className="text-[10px]">Seuil: {quiz.passing_score}%</Badge>
                        <Badge variant="outline" className="text-[10px]">{quiz.academy_quiz_questions?.length || 0} questions</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 space-y-3">
                      {(quiz.academy_quiz_questions || []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((q: any, qi: number) => {
                        const tb = quizTypeBadge[q.question_type] || { label: q.question_type, emoji: "❓" };
                        return (
                          <div key={q.id} className="rounded-xl border p-3 space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold text-muted-foreground mt-0.5">Q{qi + 1}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary" className="text-[10px]">{tb.emoji} {tb.label}</Badge>
                                  <Badge variant="outline" className="text-[10px]">{q.points} pts</Badge>
                                </div>
                                <p className="text-sm font-medium">{q.question}</p>
                              </div>
                            </div>
                            {/* Options */}
                            {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                              <div className="pl-6 space-y-1">
                                {q.options.map((opt: any, oi: number) => {
                                  const isCorrect = (() => {
                                    if (q.question_type === "mcq" || q.question_type === "true_false") {
                                      return q.correct_answer === oi || q.correct_answer === opt?.text || (Array.isArray(q.correct_answer) && q.correct_answer.includes(oi));
                                    }
                                    return false;
                                  })();
                                  const label = typeof opt === "string" ? opt : opt?.text || opt?.label || JSON.stringify(opt);
                                  return (
                                    <div key={oi} className={cn("text-xs px-2 py-1 rounded-lg border", isCorrect ? "bg-emerald-500/10 border-emerald-300 text-emerald-700 font-medium" : "bg-muted/30")}>
                                      {label} {isCorrect && "✓"}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {q.explanation && (
                              <p className="pl-6 text-[11px] text-muted-foreground italic">💡 {q.explanation}</p>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Exercise tab */}
          <TabsContent value="exercise">
            <AcademyExercisesTab moduleId={id!} exercises={exercises as any} />
          </TabsContent>

          {/* Practice tab */}
          <TabsContent value="practice">
            <AcademyPracticesTab moduleId={id!} practices={practices as any} />
          </TabsContent>

          {/* Info tab */}
          <TabsContent value="info">
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-medium">{tc.label}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Statut</p>
                    <p className="font-medium">{mod.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Durée estimée</p>
                    <p className="font-medium">{mod.estimated_minutes || "—"} min</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mode de génération</p>
                    <p className="font-medium">{mod.generation_mode}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{mod.description || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Objectifs</p>
                  {Array.isArray(mod.objectives) && mod.objectives.length > 0 ? (
                    <ul className="space-y-1">
                      {mod.objectives.map((o: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Target className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          {o}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-muted-foreground">Aucun objectif défini</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le module</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Titre</Label>
                <Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={editForm.description || ""} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={editForm.module_type} onValueChange={v => setEditForm({ ...editForm, module_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lesson">Leçon</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="exercise">Exercice</SelectItem>
                      <SelectItem value="practice">Pratique IA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Durée (min)</Label>
                  <Input type="number" value={editForm.estimated_minutes || ""} onChange={e => setEditForm({ ...editForm, estimated_minutes: parseInt(e.target.value) || null })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="published">Publié</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(false)}>Annuler</Button>
                <Button onClick={() => updateModule.mutate({
                  title: editForm.title, description: editForm.description,
                  module_type: editForm.module_type, estimated_minutes: editForm.estimated_minutes,
                  status: editForm.status,
                })} disabled={updateModule.isPending}>
                  <Save className="h-4 w-4 mr-2" /> Sauvegarder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Learner Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> Preview apprenant — {mod.title}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh]">
            <div className="space-y-6 p-2">
              {/* Content */}
              {contents.length > 0 && (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {contents.map((c: any) => (
                    <EnrichedMarkdown key={c.id} content={c.body} />
                  ))}
                </div>
              )}
              {/* Quiz preview */}
              {quizzes.length > 0 && quizzes[0].academy_quiz_questions?.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-amber-500" /> Quiz — {quizzes[0].title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">{quizzes[0].academy_quiz_questions.length} questions · Seuil de réussite : {quizzes[0].passing_score}%</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
