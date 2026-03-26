import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus, Trash2, Pencil, Sparkles, Loader2,
  FileText, HelpCircle, ChevronDown, ChevronRight,
  Clock, Bot, Dumbbell, CheckCircle2,
  AlertTriangle, RefreshCw, Lightbulb, Link2, ListOrdered,
  PenTool, Theater, Image, Zap, BookOpen
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";

const quizTypeConfig: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  mcq: { icon: HelpCircle, label: "QCM", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
  true_false: { icon: CheckCircle2, label: "Vrai / Faux", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  ordering: { icon: ListOrdered, label: "Ordonner", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
  matching: { icon: Link2, label: "Associer", color: "text-cyan-600", bg: "bg-cyan-100 dark:bg-cyan-900/30" },
  fill_blank: { icon: PenTool, label: "Compléter", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
  scenario: { icon: Theater, label: "Scénario", color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-900/30" },
};

export const moduleTypeConfig: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  lesson: { icon: BookOpen, label: "Leçon", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
  quiz: { icon: HelpCircle, label: "Quiz", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
  exercise: { icon: Dumbbell, label: "Exercice", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  practice: { icon: Bot, label: "Pratique IA", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
};

interface PathModulesTabProps {
  pathModules: any[];
  contents: any[];
  quizzes: any[];
  exercises: any[];
  practices: any[];
  progress: any[];
  expandedModules: Set<string>;
  toggleModule: (id: string) => void;
  batchGenerating: boolean;
  batchProgress: { current: number; total: number; step: string };
  batchGenerateAll: () => void;
  openCreateModule: () => void;
  openEditModule: (m: any) => void;
  removeModule: { mutate: (id: string) => void };
  genContent: { mutate: (id: string) => void; isPending: boolean };
  genQuiz: { mutate: (id: string) => void; isPending: boolean };
  genIllustrations: { mutate: (id: string) => void; isPending: boolean };
  genExercise: { mutate: (id: string) => void; isPending: boolean };
  genPractice: { mutate: (id: string) => void; isPending: boolean };
}

export function PathModulesTab({
  pathModules, contents, quizzes, exercises, practices, progress,
  expandedModules, toggleModule,
  batchGenerating, batchProgress, batchGenerateAll,
  openCreateModule, openEditModule, removeModule,
  genContent, genQuiz, genIllustrations, genExercise, genPractice,
}: PathModulesTabProps) {
  const getModuleContents = (moduleId: string) => contents.filter((c: any) => c.module_id === moduleId);
  const getModuleQuiz = (moduleId: string) => quizzes.find((q: any) => q.module_id === moduleId);
  const getModuleExercise = (moduleId: string) => exercises.find((e: any) => e.module_id === moduleId);
  const getModulePractice = (moduleId: string) => practices.find((p: any) => p.module_id === moduleId);
  const getModuleProgress = (moduleId: string) => progress.filter((p: any) => p.module_id === moduleId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Parcours pédagogique</h2>
        <div className="flex items-center gap-2">
          {pathModules.length > 0 && (
            <Button size="sm" variant="outline" onClick={batchGenerateAll} disabled={batchGenerating}
              className="border-primary/30 text-primary">
              {batchGenerating ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> {batchProgress.step} ({batchProgress.current}/{batchProgress.total})</>
              ) : (
                <><Zap className="h-3.5 w-3.5 mr-1" /> Tout générer</>
              )}
            </Button>
          )}
          <Button size="sm" onClick={openCreateModule}>
            <Plus className="h-4 w-4 mr-1" /> Ajouter un module
          </Button>
        </div>
      </div>
      {batchGenerating && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium">{batchProgress.step}</span>
            <span className="text-xs text-muted-foreground ml-auto">{batchProgress.current}/{batchProgress.total}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {pathModules.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Aucun module dans ce parcours</p>
            <p className="text-xs mt-1">Ajoutez des modules pour structurer la formation</p>
            <Button size="sm" className="mt-4" onClick={openCreateModule}>
              <Plus className="h-4 w-4 mr-1" /> Premier module
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-border" />
          <div className="space-y-3">
            {pathModules.map((pm: any, idx: number) => {
              const mod = pm.academy_modules;
              if (!mod) return null;
              const typeConf = moduleTypeConfig[mod.module_type] || moduleTypeConfig.lesson;
              const TypeIcon = typeConf.icon;
              const modContents = getModuleContents(mod.id);
              const modQuiz = getModuleQuiz(mod.id);
              const modExercise = getModuleExercise(mod.id);
              const modPractice = getModulePractice(mod.id);
              const modProgress = getModuleProgress(mod.id);
              const isExpanded = expandedModules.has(mod.id);
              const hasContent = modContents.length > 0;
              const questionCount = modQuiz?.academy_quiz_questions?.length || 0;
              const hasExercise = !!modExercise;
              const hasPractice = !!modPractice;
              const completedCount = modProgress.filter((p: any) => p.status === "completed").length;

              return (
                <Collapsible key={pm.id} open={isExpanded} onOpenChange={() => toggleModule(mod.id)}>
                  <div className="relative pl-12">
                    <div className={`absolute left-0 top-4 z-10 flex h-[46px] w-[46px] items-center justify-center rounded-xl ${typeConf.bg} border-2 border-background shadow-sm`}>
                      <TypeIcon className={`h-5 w-5 ${typeConf.color}`} />
                    </div>
                    <Card className={`transition-all ${isExpanded ? "shadow-md ring-1 ring-primary/20" : "hover:shadow-sm"}`}>
                      <CollapsibleTrigger asChild>
                        <CardContent className="p-4 cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-muted-foreground">MODULE {idx + 1}</span>
                                <Badge variant="outline" className="text-[10px]">{typeConf.label}</Badge>
                                <Badge variant={mod.status === "published" ? "default" : "secondary"} className="text-[10px]">{mod.status}</Badge>
                                {mod.estimated_minutes && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <Clock className="h-2.5 w-2.5" /> {mod.estimated_minutes} min
                                  </span>
                                )}
                              </div>
                              <p className="font-medium text-sm">{mod.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{mod.description}</p>
                              <div className="flex items-center gap-3 mt-2">
                                {hasContent ? (
                                  <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Contenu ({modContents.length} sections)
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-amber-600 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> Pas de contenu
                                  </span>
                                )}
                                {questionCount > 0 ? (
                                  <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Quiz ({questionCount} questions)
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">— Pas de quiz</span>
                                )}
                                {completedCount > 0 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {completedCount} complété{completedCount > 1 ? "s" : ""}
                                  </span>
                                )}
                                {hasExercise && (
                                  <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Exercice
                                  </span>
                                )}
                                {hasPractice && (
                                  <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Pratique IA
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <Separator />
                        <CardContent className="p-4 space-y-4 bg-muted/30">
                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); genContent.mutate(mod.id); }}
                              disabled={genContent.isPending}>
                              {genContent.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                              {hasContent ? "Régénérer contenu" : "Générer contenu"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); genQuiz.mutate(mod.id); }}
                              disabled={genQuiz.isPending}>
                              {genQuiz.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <HelpCircle className="h-3.5 w-3.5 mr-1" />}
                              {questionCount > 0 ? "Régénérer quiz" : "Générer quiz"}
                            </Button>
                            {hasContent && (
                              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); genIllustrations.mutate(mod.id); }}
                                disabled={genIllustrations.isPending}>
                                {genIllustrations.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Image className="h-3.5 w-3.5 mr-1" />}
                                Illustrations
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); genExercise.mutate(mod.id); }}
                              disabled={genExercise.isPending}>
                              {genExercise.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Dumbbell className="h-3.5 w-3.5 mr-1" />}
                              {hasExercise ? "Régénérer exercice" : "Générer exercice"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); genPractice.mutate(mod.id); }}
                              disabled={genPractice.isPending}>
                              {genPractice.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Bot className="h-3.5 w-3.5 mr-1" />}
                              {hasPractice ? "Régénérer pratique" : "Générer pratique"}
                            </Button>
                            <div className="flex-1" />
                            <Button size="sm" variant="ghost" onClick={() => openEditModule(mod)}>
                              <Pencil className="h-3.5 w-3.5 mr-1" /> Éditer
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeModule.mutate(pm.id)}>
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Retirer
                            </Button>
                          </div>

                          {/* Content preview */}
                          {hasContent && (
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contenu du module</h4>
                              {modContents.map((c: any, ci: number) => {
                                const contentId = `content-${c.id}`;
                                const isFullView = expandedModules.has(contentId);
                                return (
                                  <div key={c.id} className="rounded-xl border bg-background overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/30">
                                      <Badge variant="outline" className="text-[10px]">Section {ci + 1}</Badge>
                                      <Badge variant="outline" className="text-[10px]">{c.content_type}</Badge>
                                      <span className="text-[10px] text-muted-foreground ml-auto">{(c.body?.length || 0).toLocaleString()} car.</span>
                                    </div>
                                    <div className={`p-4 ${!isFullView ? "max-h-96 overflow-y-auto" : ""}`}>
                                      <div className="prose prose-sm max-w-none dark:prose-invert text-xs">
                                        <EnrichedMarkdown content={c.body || ""} />
                                      </div>
                                    </div>
                                    <div className="px-4 py-2 border-t bg-muted/10 flex justify-end">
                                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => toggleModule(contentId)}>
                                        {isFullView ? "Réduire" : "Voir tout"}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Quiz preview */}
                          {modQuiz && questionCount > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quiz — {modQuiz.title || "Quiz"}</h4>
                              <div className="space-y-2">
                                {(modQuiz.academy_quiz_questions || []).map((q: any, qi: number) => {
                                  const qType = quizTypeConfig[q.question_type] || quizTypeConfig.mcq;
                                  const QIcon = qType.icon;
                                  const questionExpandId = `quiz-q-${q.id}`;
                                  const isQExpanded = expandedModules.has(questionExpandId);
                                  const options = q.options || {};
                                  const correctAnswer = q.correct_answer;
                                  const hint = typeof options === "object" && options.hint ? options.hint : null;

                                  return (
                                    <div key={q.id} className="rounded-xl border bg-background overflow-hidden">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); toggleModule(questionExpandId); }}
                                        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/20 transition-colors"
                                      >
                                        <div className={`flex items-center justify-center h-7 w-7 rounded-lg shrink-0 ${qType.bg}`}>
                                          <QIcon className={`h-3.5 w-3.5 ${qType.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[10px] font-bold text-muted-foreground">Q{qi + 1}</span>
                                            <Badge className={`text-[9px] px-1.5 py-0 ${qType.bg} ${qType.color} border-0`}>{qType.label}</Badge>
                                            <span className="text-[10px] text-muted-foreground">{q.points || 1} pt{(q.points || 1) > 1 ? "s" : ""}</span>
                                          </div>
                                          <p className="text-xs font-medium line-clamp-2">{q.question}</p>
                                        </div>
                                        {isQExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />}
                                      </button>

                                      {isQExpanded && (
                                        <div className="px-4 pb-4 pt-1 border-t space-y-3 bg-muted/10">
                                          {(q.question_type === "mcq" || q.question_type === "true_false") && Array.isArray(options.choices || options) && (
                                            <div className="space-y-1.5">
                                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Options</p>
                                              {(options.choices || options).map((opt: any, oi: number) => {
                                                const optLabel = typeof opt === "string" ? opt : opt.label || opt.text || JSON.stringify(opt);
                                                const isCorrect = Array.isArray(correctAnswer) ? correctAnswer.includes(oi) || correctAnswer.includes(optLabel) : correctAnswer === oi || correctAnswer === optLabel || correctAnswer === opt;
                                                return (
                                                  <div key={oi} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs border ${isCorrect ? "border-emerald-500/50 bg-emerald-500/10" : "border-transparent bg-muted/30"}`}>
                                                    {isCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                                                    <span className={isCorrect ? "font-medium" : ""}>{optLabel}</span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                          {q.question_type === "ordering" && Array.isArray(options.items || options) && (
                                            <div className="space-y-1.5">
                                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Ordre correct</p>
                                              {(Array.isArray(correctAnswer) ? correctAnswer : options.items || options).map((item: any, oi: number) => (
                                                <div key={oi} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs border bg-muted/20">
                                                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{oi + 1}</span>
                                                  <span>{typeof item === "string" ? item : item.label || JSON.stringify(item)}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {q.question_type === "matching" && (
                                            <div className="space-y-1.5">
                                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Paires</p>
                                              {(Array.isArray(correctAnswer) ? correctAnswer : options.pairs || []).map((pair: any, pi: number) => (
                                                <div key={pi} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs border bg-muted/20">
                                                  <span className="font-medium">{pair.left || pair[0]}</span>
                                                  <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                                                  <span>{pair.right || pair[1]}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {q.question_type === "fill_blank" && (
                                            <div className="space-y-1.5">
                                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Réponse attendue</p>
                                              <div className="rounded-lg px-3 py-2 text-xs border bg-emerald-500/10 border-emerald-500/50 font-medium">
                                                {Array.isArray(correctAnswer) ? correctAnswer.join(" / ") : String(correctAnswer)}
                                              </div>
                                            </div>
                                          )}
                                          {q.question_type === "scenario" && (
                                            <div className="space-y-1.5">
                                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Scénario</p>
                                              {options.context && <p className="text-xs text-muted-foreground italic rounded-lg bg-muted/30 p-3">{options.context}</p>}
                                              {Array.isArray(options.choices) && options.choices.map((opt: any, oi: number) => {
                                                const optLabel = typeof opt === "string" ? opt : opt.label || opt.text || JSON.stringify(opt);
                                                const isCorrect = correctAnswer === oi || correctAnswer === optLabel;
                                                return (
                                                  <div key={oi} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs border ${isCorrect ? "border-emerald-500/50 bg-emerald-500/10" : "border-transparent bg-muted/30"}`}>
                                                    {isCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                                                    <span className={isCorrect ? "font-medium" : ""}>{optLabel}</span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                          {hint && (
                                            <div className="flex items-start gap-2 rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
                                              <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                              <p className="text-xs text-amber-700 dark:text-amber-400">{hint}</p>
                                            </div>
                                          )}
                                          {q.explanation && (
                                            <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                                              <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">Explication</p>
                                              <p className="text-xs text-blue-700 dark:text-blue-300">{q.explanation}</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Exercise preview */}
                          {hasExercise && modExercise && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exercice — {modExercise.title}</h4>
                                {modExercise.ai_evaluation_enabled && <Badge variant="secondary" className="text-[10px]">Évaluation IA</Badge>}
                              </div>
                              <div className="rounded-xl border bg-background overflow-hidden">
                                <div className="p-4 space-y-3">
                                  <div className="prose prose-sm max-w-none dark:prose-invert text-xs">
                                    <EnrichedMarkdown content={modExercise.instructions || ""} />
                                  </div>
                                  {(modExercise.evaluation_criteria as any[])?.length > 0 && (
                                    <div className="rounded-lg bg-muted/30 p-3 space-y-1">
                                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Critères d'évaluation</p>
                                      {(modExercise.evaluation_criteria as any[]).map((c: any, i: number) => (
                                        <p key={i} className="text-xs text-muted-foreground">• {typeof c === "string" ? c : c.label || c.criterion || JSON.stringify(c)}</p>
                                      ))}
                                    </div>
                                  )}
                                  <p className="text-[10px] text-muted-foreground">Type de rendu : {modExercise.expected_output_type || "text"}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Practice preview */}
                          {hasPractice && modPractice && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pratique IA — {modPractice.title}</h4>
                                {modPractice.difficulty && <Badge variant="outline" className="text-[10px]">{modPractice.difficulty}</Badge>}
                                <Badge variant="secondary" className="text-[10px]">{modPractice.max_exchanges} échanges max</Badge>
                              </div>
                              <div className="rounded-xl border bg-background overflow-hidden">
                                <div className="p-4 space-y-3">
                                  <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Scénario</p>
                                    <p className="text-xs text-muted-foreground">{modPractice.scenario || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">System Prompt</p>
                                    <div className="rounded-lg bg-muted/30 p-3 text-xs font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
                                      {modPractice.system_prompt || "—"}
                                    </div>
                                  </div>
                                  {(modPractice.evaluation_rubric as any[])?.length > 0 && (
                                    <div className="rounded-lg bg-muted/30 p-3 space-y-1">
                                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Grille d'évaluation</p>
                                      {(Array.isArray(modPractice.evaluation_rubric) ? modPractice.evaluation_rubric : []).map((r: any, i: number) => (
                                        <p key={i} className="text-xs text-muted-foreground">• {typeof r === "string" ? r : r.label || r.criterion || JSON.stringify(r)}</p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {!hasContent && questionCount === 0 && !hasExercise && !hasPractice && (
                            <div className="text-center py-6 text-muted-foreground">
                              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                              <p className="text-xs">Aucun contenu généré. Utilisez les boutons ci-dessus pour générer.</p>
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
