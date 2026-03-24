import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AcademyExerciseProps {
  moduleId: string;
  enrollmentId?: string;
  onComplete?: (score: number) => void;
}

interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
  summary: string;
}

export function AcademyExercise({ moduleId, enrollmentId, onComplete }: AcademyExerciseProps) {
  const [submission, setSubmission] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

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
      const { data: { session } } = await supabase.auth.getSession();
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
        setFeedback(data.feedback);
        onComplete?.(data.feedback.score);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'évaluation");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{exercise.title}</h3>
            {exercise.ai_evaluation_enabled && (
              <Badge variant="secondary" className="text-[10px]">Évaluation IA</Badge>
            )}
          </div>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {exercise.instructions || ""}
            </ReactMarkdown>
          </div>
          {(exercise.evaluation_criteria as any[])?.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-muted/50 border space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Critères d'évaluation
              </p>
              <ul className="space-y-1">
                {(exercise.evaluation_criteria as any[]).map((c: any, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{typeof c === "string" ? c : c.label || c.criterion || JSON.stringify(c)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission */}
      {!feedback ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h4 className="text-sm font-semibold">Votre réponse</h4>
            <Textarea
              value={submission}
              onChange={e => setSubmission(e.target.value)}
              placeholder="Rédigez votre réponse ici..."
              className="min-h-[200px] resize-y"
              disabled={isEvaluating}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!submission.trim() || isEvaluating}
              >
                {isEvaluating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Évaluation en cours...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Soumettre</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Feedback</h3>
                <Badge className="ml-auto text-lg px-3 py-1">
                  {feedback.score}/100
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">{feedback.summary}</p>

              {feedback.strengths.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    ✅ Points forts
                  </p>
                  <ul className="space-y-1">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-sm">{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.improvements.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                    💡 Axes d'amélioration
                  </p>
                  <ul className="space-y-1">
                    {feedback.improvements.map((s, i) => (
                      <li key={i} className="text-sm">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
