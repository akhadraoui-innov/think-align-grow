import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface AcademyQuizProps {
  moduleId: string;
  enrollmentId?: string;
  onComplete?: (score: number, total: number) => void;
}

interface QuizQuestion {
  id: string;
  question: string;
  question_type: string;
  options: { label: string; value: string }[];
  correct_answer: string;
  explanation: string | null;
  points: number;
  sort_order: number;
}

export function AcademyQuiz({ moduleId, enrollmentId, onComplete }: AcademyQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [scores, setScores] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  const { data: quiz } = useQuery({
    queryKey: ["academy-quiz", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_quizzes")
        .select("*")
        .eq("module_id", moduleId)
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["academy-quiz-questions", quiz?.id],
    enabled: !!quiz?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_quiz_questions")
        .select("*")
        .eq("quiz_id", quiz!.id)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as QuizQuestion[];
    },
  });

  if (!quiz || questions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          Aucun quiz disponible pour ce module.
        </CardContent>
      </Card>
    );
  }

  const current = questions[currentIndex];
  const isCorrect = selectedAnswer === (current?.correct_answer as any);
  const totalPoints = questions.reduce((s, q) => s + q.points, 0);
  const earnedPoints = scores.reduce((s, correct, i) => s + (correct ? questions[i].points : 0), 0);
  const progressPct = finished ? 100 : ((currentIndex) / questions.length) * 100;

  const handleSelect = (value: string) => {
    if (hasAnswered) return;
    setSelectedAnswer(value);
  };

  const handleConfirm = () => {
    if (!selectedAnswer || hasAnswered) return;
    setHasAnswered(true);
    setScores(prev => [...prev, isCorrect]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      const finalScores = [...scores];
      const finalEarned = finalScores.reduce((s, correct, i) => s + (correct ? questions[i].points : 0), 0);
      setFinished(true);
      onComplete?.(finalEarned, totalPoints);
      return;
    }
    setCurrentIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setHasAnswered(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setScores([]);
    setFinished(false);
  };

  const scorePct = Math.round((earnedPoints / totalPoints) * 100);
  const passed = scorePct >= (quiz.passing_score || 70);

  if (finished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <Card className="overflow-hidden">
          <div className={cn(
            "p-8 text-center",
            passed ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5" : "bg-gradient-to-br from-orange-500/10 to-orange-600/5"
          )}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <Trophy className={cn("h-16 w-16 mx-auto mb-4", passed ? "text-emerald-500" : "text-orange-500")} />
            </motion.div>
            <h2 className="text-2xl font-display font-bold mb-2">
              {passed ? "Félicitations ! 🎉" : "Continuez vos efforts ! 💪"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {passed
                ? "Vous avez validé ce quiz avec succès."
                : `Score minimum requis : ${quiz.passing_score}%. Réessayez pour progresser.`}
            </p>
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <p className={cn("text-4xl font-bold", passed ? "text-emerald-500" : "text-orange-500")}>
                  {scorePct}%
                </p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className="text-4xl font-bold text-foreground">{earnedPoints}/{totalPoints}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className="text-4xl font-bold text-foreground">
                  {scores.filter(Boolean).length}/{questions.length}
                </p>
                <p className="text-xs text-muted-foreground">Bonnes réponses</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              {!passed && (
                <Button variant="outline" onClick={handleRestart}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Réessayer
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Review answers */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Revue des réponses
          </h3>
          {questions.map((q, i) => (
            <Card key={q.id} className={cn("transition-colors", scores[i] ? "border-emerald-500/30" : "border-destructive/30")}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {scores[i]
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    : <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{q.question}</p>
                    {q.explanation && (
                      <p className="text-xs text-muted-foreground mt-1">{q.explanation}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Question {currentIndex + 1} / {questions.length}</span>
          <span>{quiz.title}</span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {current.question_type === "true_false" ? "Vrai / Faux" : "QCM"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {current.points} pt{current.points > 1 ? "s" : ""}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold">{current.question}</h3>
              </div>

              {/* Options */}
              <div className="grid gap-3">
                {(current.options as { label: string; value: string }[]).map((opt) => {
                  const isSelected = selectedAnswer === opt.value;
                  const showCorrect = hasAnswered && opt.value === (current.correct_answer as any);
                  const showWrong = hasAnswered && isSelected && !showCorrect;

                  return (
                    <motion.button
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      whileHover={!hasAnswered ? { scale: 1.01 } : {}}
                      whileTap={!hasAnswered ? { scale: 0.99 } : {}}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border-2 transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20",
                        !hasAnswered && !isSelected && "border-border hover:border-primary/40 hover:bg-primary/5",
                        !hasAnswered && isSelected && "border-primary bg-primary/10",
                        showCorrect && "border-emerald-500 bg-emerald-500/10",
                        showWrong && "border-destructive bg-destructive/10",
                        hasAnswered && !showCorrect && !showWrong && "opacity-50"
                      )}
                      disabled={hasAnswered}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                          !hasAnswered && !isSelected && "bg-muted text-muted-foreground",
                          !hasAnswered && isSelected && "bg-primary text-primary-foreground",
                          showCorrect && "bg-emerald-500 text-white",
                          showWrong && "bg-destructive text-white",
                        )}>
                          {showCorrect ? <CheckCircle2 className="h-4 w-4" /> :
                           showWrong ? <XCircle className="h-4 w-4" /> :
                           String.fromCharCode(65 + (current.options as any[]).indexOf(opt))}
                        </div>
                        <span className="text-sm font-medium">{opt.label}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation after answering */}
              <AnimatePresence>
                {hasAnswered && current.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="rounded-xl bg-muted/50 p-4 border"
                  >
                    <p className="text-sm font-medium mb-1">
                      {isCorrect ? "✅ Bonne réponse !" : "❌ Mauvaise réponse"}
                    </p>
                    <p className="text-sm text-muted-foreground">{current.explanation}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                {!hasAnswered ? (
                  <Button onClick={handleConfirm} disabled={!selectedAnswer}>
                    Valider
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    {currentIndex + 1 >= questions.length ? (
                      <>Voir les résultats <Trophy className="h-4 w-4 ml-2" /></>
                    ) : (
                      <>Suivant <ArrowRight className="h-4 w-4 ml-2" /></>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
