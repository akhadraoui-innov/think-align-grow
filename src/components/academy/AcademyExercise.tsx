import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, CheckCircle2, FileText, RotateCcw, History, ChevronDown, ChevronUp, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnrichedMarkdown } from "./EnrichedMarkdown";

interface AcademyExerciseProps {
  moduleId: string;
  enrollmentId?: string;
  onComplete?: (score: number, metadata?: Record<string, unknown>) => void;
}

interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
  summary: string;
}

interface Submission {
  id: number;
  text: string;
  feedback: Feedback;
  submittedAt: Date;
}

export function AcademyExercise({ moduleId, enrollmentId, onComplete }: AcademyExerciseProps) {
  const [submission, setSubmission] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<Feedback | null>(null);
  const [history, setHistory] = useState<Submission[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showCriteria, setShowCriteria] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: exercise } = useQuery({
    queryKey: ["academy-exercise", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_exercises")
        .select("*")
        .eq("module_id", moduleId)
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (!exercise) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          Aucun exercice disponible pour ce module.
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async () => {
    if (!submission.trim() || isEvaluating) return;
    setIsEvaluating(true);

    try {
      const { data, error } = await supabase.functions.invoke("academy-generate", {
        body: {
          action: "evaluate-exercise",
          exercise_id: exercise.id,
          module_id: moduleId,
          submission: submission.trim(),
        },
      });

      if (error) throw error;
      if (data?.feedback) {
        const fb = data.feedback as Feedback;
        setCurrentFeedback(fb);
        const newHistory = [...history, {
          id: Date.now(),
          text: submission.trim(),
          feedback: fb,
          submittedAt: new Date(),
        }];
        setHistory(newHistory);
        if (fb.score >= 70) {
          const submissionsMeta = newHistory.map(h => ({
            text: h.text, score: h.feedback.score,
            strengths: h.feedback.strengths, improvements: h.feedback.improvements,
            summary: h.feedback.summary, submitted_at: h.submittedAt.toISOString(),
          }));
          onComplete?.(fb.score, { submissions: submissionsMeta });
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'évaluation");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRetry = () => {
    setCurrentFeedback(null);
    // Keep submission text so user can iterate
  };

  const bestScore = history.length > 0 ? Math.max(...history.map(h => h.feedback.score)) : null;
  const attemptCount = history.length;
  const criteria = exercise.evaluation_criteria;
  const hasCriteria = Array.isArray(criteria) ? criteria.length > 0 : (criteria && typeof criteria === "object" && Object.keys(criteria).length > 0);

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold">{exercise.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {exercise.ai_evaluation_enabled && (
                <Badge variant="secondary" className="text-[9px]"><Sparkles className="h-2.5 w-2.5 mr-0.5" /> Éval. IA</Badge>
              )}
              {attemptCount > 0 && (
                <Badge variant="outline" className="text-[9px]">{attemptCount} tentative{attemptCount > 1 ? "s" : ""}</Badge>
              )}
              {bestScore !== null && (
                <Badge variant={bestScore >= 70 ? "default" : "outline"} className="text-[9px]">
                  Meilleur : {bestScore}/100
                </Badge>
              )}
            </div>
          </div>
        </div>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className="text-xs">
            <History className="h-3.5 w-3.5 mr-1" /> Historique
            {showHistory ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>
        )}
      </div>

      {/* Instructions */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <EnrichedMarkdown content={exercise.instructions || ""} />
          </div>

          {/* Criteria collapsible */}
          {hasCriteria && (
            <div className="rounded-xl border bg-muted/30 overflow-hidden">
              <button
                onClick={() => setShowCriteria(!showCriteria)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" /> Critères d'évaluation
                </span>
                {showCriteria ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
              <AnimatePresence>
                {showCriteria && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 space-y-1.5">
                      {(Array.isArray(criteria) ? criteria : Object.entries(criteria).map(([k, v]) => ({ label: k, description: v }))).map((c: any, i: number) => {
                        const label = typeof c === "string" ? c : c.label || c.criterion || c.name || Object.keys(c)[0];
                        const desc = typeof c === "string" ? null : c.description || c.detail || c.weight;
                        return (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-[9px] font-bold text-primary">{i + 1}</span>
                            </div>
                            <div>
                              <span className="font-medium">{String(label)}</span>
                              {desc && <span className="text-muted-foreground ml-1">— {String(desc)}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History panel */}
      <AnimatePresence>
        {showHistory && history.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-2"
          >
            {history.map((h, i) => (
              <Card key={h.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold">Tentative {i + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{h.submittedAt.toLocaleString("fr-FR")}</span>
                      <Badge variant={h.feedback.score >= 70 ? "default" : "outline"} className="text-[10px]">{h.feedback.score}/100</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{h.text}</p>
                  <p className="text-xs mt-1 italic">{h.feedback.summary}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submission / Feedback */}
      {!currentFeedback ? (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Votre réponse</h4>
              <span className="text-[10px] text-muted-foreground">{submission.length} caractères</span>
            </div>
            <Textarea
              ref={textareaRef}
              value={submission}
              onChange={e => setSubmission(e.target.value)}
              placeholder="Rédigez votre réponse ici... Vous pouvez utiliser du texte structuré avec des titres, listes, et paragraphes."
              className="min-h-[240px] resize-y text-sm"
              disabled={isEvaluating}
            />
            {/* Progress indicator while evaluating */}
            {isEvaluating && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Analyse de votre réponse par l'IA...</span>
                </div>
                <Progress value={undefined} className="h-1.5 animate-pulse" />
              </div>
            )}
            <div className="flex justify-end gap-2">
              {attemptCount > 0 && (
                <Button variant="outline" size="sm" onClick={() => setSubmission("")}>Effacer</Button>
              )}
              <Button onClick={handleSubmit} disabled={!submission.trim() || isEvaluating}>
                {isEvaluating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Évaluation...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Soumettre {attemptCount > 0 ? `(#${attemptCount + 1})` : ""}</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            <div className={cn(
              "p-6 space-y-5",
              currentFeedback.score >= 80 ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20" :
              currentFeedback.score >= 50 ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20" :
              "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20"
            )}>
              {/* Score header */}
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg",
                  currentFeedback.score >= 80 ? "bg-gradient-to-br from-emerald-500 to-teal-500" :
                  currentFeedback.score >= 50 ? "bg-gradient-to-br from-amber-500 to-orange-500" :
                  "bg-gradient-to-br from-red-500 to-pink-500"
                )}>
                  <span className="text-2xl font-black text-white">{currentFeedback.score}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">
                    {currentFeedback.score >= 80 ? "Excellent travail ! 🎉" :
                     currentFeedback.score >= 50 ? "Bon effort ! 💪" :
                     "À améliorer 📚"}
                  </h3>
                  <p className="text-sm text-muted-foreground">{currentFeedback.summary}</p>
                </div>
              </div>

              {/* Score bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Score</span>
                  <span>{currentFeedback.score}/100</span>
                </div>
                <Progress value={currentFeedback.score} className="h-2.5" />
              </div>

              {/* Strengths */}
              {currentFeedback.strengths.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    ✅ Points forts
                  </p>
                  <div className="space-y-1.5">
                    {currentFeedback.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm bg-white/50 dark:bg-white/5 rounded-lg px-3 py-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvements */}
              {currentFeedback.improvements.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    💡 Axes d'amélioration
                  </p>
                  <div className="space-y-1.5">
                    {currentFeedback.improvements.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm bg-white/50 dark:bg-white/5 rounded-lg px-3 py-2">
                        <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleRetry} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" /> Réessayer
                </Button>
                {currentFeedback.score >= 70 && (
                  <Button className="flex-1" onClick={() => onComplete?.(currentFeedback.score)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Valider et continuer
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
