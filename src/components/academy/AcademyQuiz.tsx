import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, Trophy, RotateCcw, Lightbulb, GripVertical, ArrowUp, ArrowDown, BookOpen, Timer, Flame, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  options: { label: string; value: string; hint?: string; scenario_context?: string }[];
  correct_answer: string;
  explanation: string | null;
  points: number;
  sort_order: number;
}

const typeLabels: Record<string, string> = {
  mcq: "QCM", true_false: "Vrai / Faux", ordering: "Ordonner",
  matching: "Associer", fill_blank: "Compléter", scenario: "Mise en situation",
};
const typeIcons: Record<string, string> = {
  mcq: "🎯", true_false: "⚖️", ordering: "📋",
  matching: "🔗", fill_blank: "✏️", scenario: "🎭",
};

// Confetti particle component
function ConfettiParticle({ index }: { index: number }) {
  const colors = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
  const color = colors[index % colors.length];
  const x = (Math.random() - 0.5) * 300;
  const y = -(Math.random() * 200 + 100);
  const rotation = Math.random() * 720 - 360;
  const size = Math.random() * 6 + 4;

  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      animate={{ opacity: 0, x, y: [y, y + 50], rotate: rotation, scale: 0.5 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="absolute pointer-events-none"
      style={{
        width: size,
        height: size * 0.6,
        backgroundColor: color,
        borderRadius: 2,
        left: "50%",
        top: "50%",
      }}
    />
  );
}

function StreakIndicator({ streak }: { streak: number }) {
  if (streak < 2) return null;
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
    >
      <Flame className="h-4 w-4 text-amber-500" />
      <span className="text-sm font-bold text-amber-600">{streak} série !</span>
      {streak >= 5 && <Zap className="h-3.5 w-3.5 text-amber-500" />}
    </motion.div>
  );
}

function XPGain({ points, show }: { points: number; show: boolean }) {
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -40 }}
      transition={{ duration: 1 }}
      className="absolute -top-2 right-4 text-sm font-bold text-primary pointer-events-none"
    >
      +{points} XP
    </motion.div>
  );
}

function QuizTimer({ seconds, isActive, onExpire }: { seconds: number; isActive: boolean; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, onExpire]);

  const pct = (remaining / seconds) * 100;
  const isLow = remaining <= 10;

  return (
    <div className="flex items-center gap-2">
      <Timer className={cn("h-4 w-4", isLow ? "text-destructive animate-pulse" : "text-muted-foreground")} />
      <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full transition-colors", isLow ? "bg-destructive" : "bg-primary")}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className={cn("text-xs font-mono font-bold tabular-nums min-w-[2ch]", isLow && "text-destructive")}>{remaining}s</span>
    </div>
  );
}

export function AcademyQuiz({ moduleId, enrollmentId, onComplete }: AcademyQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [scores, setScores] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [orderItems, setOrderItems] = useState<string[]>([]);
  const [matchPairs, setMatchPairs] = useState<Record<string, string>>({});
  const [matchSelected, setMatchSelected] = useState<string | null>(null);
  const [fillAnswer, setFillAnswer] = useState("");
  const [showRecap, setShowRecap] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [timerEnabled] = useState(true);
  const [timerActive, setTimerActive] = useState(true);
  const [totalXP, setTotalXP] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const { data: quiz } = useQuery({
    queryKey: ["academy-quiz", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_quizzes").select("*").eq("module_id", moduleId).limit(1).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["academy-quiz-questions", quiz?.id],
    enabled: !!quiz?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_quiz_questions").select("*").eq("quiz_id", quiz!.id).order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as QuizQuestion[];
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
  const totalPoints = questions.reduce((s, q) => s + q.points, 0);
  const earnedPoints = scores.reduce((s, correct, i) => s + (correct ? questions[i].points : 0), 0);
  const progressPct = finished ? 100 : ((currentIndex) / questions.length) * 100;
  const hint = current?.options?.[0]?.hint || null;
  const timerSeconds = current?.question_type === "scenario" ? 60 : current?.question_type === "ordering" || current?.question_type === "matching" ? 45 : 30;

  const checkCorrect = (): boolean => {
    if (!current) return false;
    const type = current.question_type;
    if (type === "mcq" || type === "true_false" || type === "scenario") return selectedAnswer === current.correct_answer;
    if (type === "ordering") return orderItems.join(",") === current.correct_answer;
    if (type === "matching") {
      const correctPairs = current.correct_answer.split(",").map(p => p.trim());
      return correctPairs.every(pair => { const [l, r] = pair.split(":").map(s => s.trim()); return matchPairs[l] === r; });
    }
    if (type === "fill_blank") return fillAnswer.trim().toLowerCase() === current.correct_answer.trim().toLowerCase();
    return false;
  };

  const handleConfirm = () => {
    if (hasAnswered) return;
    const isCorrect = checkCorrect();
    setHasAnswered(true);
    setTimerActive(false);
    setScores(prev => [...prev, isCorrect]);

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      const xp = current.points * (newStreak >= 5 ? 3 : newStreak >= 3 ? 2 : 1);
      setTotalXP(prev => prev + xp);
      setShowXP(true);
      setTimeout(() => setShowXP(false), 1200);

      if (newStreak >= 3) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1500);
      }
    } else {
      setStreak(0);
    }
  };

  const handleTimerExpire = useCallback(() => {
    if (!hasAnswered) {
      setHasAnswered(true);
      setTimerActive(false);
      setScores(prev => [...prev, false]);
      setStreak(0);
    }
  }, [hasAnswered]);

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      const finalScores = [...scores];
      const finalEarned = finalScores.reduce((s, c, i) => s + (c ? questions[i].points : 0), 0);
      setFinished(true);
      onComplete?.(finalEarned, totalPoints);
      return;
    }
    const nextQ = questions[currentIndex + 1];
    setCurrentIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setShowHint(false);
    setFillAnswer("");
    setMatchPairs({});
    setMatchSelected(null);
    setTimerActive(true);
    setShowXP(false);
    if (nextQ.question_type === "ordering") {
      setOrderItems(shuffleArray(nextQ.options.map(o => o.value)));
    } else {
      setOrderItems([]);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setScores([]);
    setFinished(false);
    setShowHint(false);
    setFillAnswer("");
    setOrderItems([]);
    setMatchPairs({});
    setMatchSelected(null);
    setShowRecap(false);
    setStreak(0);
    setTotalXP(0);
    setBestStreak(0);
    setTimerActive(true);
    if (questions[0]?.question_type === "ordering") {
      setOrderItems(shuffleArray(questions[0].options.map(o => o.value)));
    }
  };

  if (current?.question_type === "ordering" && orderItems.length === 0 && !hasAnswered) {
    setOrderItems(shuffleArray(current.options.map(o => o.value)));
  }

  const scorePct = Math.round((earnedPoints / totalPoints) * 100);
  const passed = scorePct >= (quiz.passing_score || 70);
  const isCorrectCurrent = scores.length > currentIndex ? scores[currentIndex] : checkCorrect();

  // ── FINISHED SCREEN ──
  if (finished) {
    const failedQuestions = questions.filter((_, i) => !scores[i]);
    const correctCount = scores.filter(Boolean).length;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
        {/* Confetti burst */}
        {passed && (
          <div className="relative h-0">
            {Array.from({ length: 30 }).map((_, i) => <ConfettiParticle key={i} index={i} />)}
          </div>
        )}

        <Card className="overflow-hidden">
          <div className={cn("p-8 text-center relative", passed ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5" : "bg-gradient-to-br from-orange-500/10 to-orange-600/5")}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
              <Trophy className={cn("h-16 w-16 mx-auto mb-4", passed ? "text-emerald-500" : "text-orange-500")} />
            </motion.div>
            <h2 className="text-2xl font-display font-bold mb-2">
              {passed ? "Félicitations ! 🎉" : "Continuez vos efforts ! 💪"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {passed ? "Vous avez validé ce quiz avec succès." : `Score minimum requis : ${quiz.passing_score}%. Réessayez pour progresser.`}
            </p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl bg-background/80 border p-4">
                <p className={cn("text-3xl font-bold", passed ? "text-emerald-500" : "text-orange-500")}>{scorePct}%</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-1">Score</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl bg-background/80 border p-4">
                <p className="text-3xl font-bold text-foreground">{correctCount}/{questions.length}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-1">Bonnes réponses</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-2xl bg-background/80 border p-4">
                <div className="flex items-center justify-center gap-1">
                  <Flame className="h-5 w-5 text-amber-500" />
                  <p className="text-3xl font-bold text-foreground">{bestStreak}</p>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-1">Meilleure série</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="rounded-2xl bg-background/80 border p-4">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-5 w-5 text-primary" />
                  <p className="text-3xl font-bold text-primary">{totalXP}</p>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-1">XP gagnés</p>
              </motion.div>
            </div>

            <div className="flex gap-3 justify-center">
              {!passed && (
                <Button variant="outline" onClick={handleRestart}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Réessayer
                </Button>
              )}
              {failedQuestions.length > 0 && (
                <Button variant="secondary" onClick={() => setShowRecap(!showRecap)}>
                  <BookOpen className="h-4 w-4 mr-2" /> {showRecap ? "Masquer le rappel" : "Mode Rappel"}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Recap Mode */}
        <AnimatePresence>
          {showRecap && failedQuestions.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" /> Concepts à revoir
              </h3>
              {failedQuestions.map((q) => (
                <Card key={q.id} className="border-amber-500/20 bg-amber-500/5">
                  <CardContent className="p-5 space-y-3">
                    <p className="text-sm font-semibold">{q.question}</p>
                    <div className="rounded-lg bg-background p-3 border">
                      <p className="text-xs font-medium text-emerald-600 mb-1">✅ Bonne réponse : {q.correct_answer}</p>
                      {q.explanation && <p className="text-xs text-muted-foreground">{q.explanation}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review answers */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Revue des réponses</h3>
          {questions.map((q, i) => (
            <Card key={q.id} className={cn("transition-colors", scores[i] ? "border-emerald-500/30" : "border-destructive/30")}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {scores[i] ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">{typeIcons[q.question_type]} {typeLabels[q.question_type]}</Badge>
                    </div>
                    <p className="text-sm font-medium">{q.question}</p>
                    {q.explanation && <p className="text-xs text-muted-foreground mt-1">{q.explanation}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    );
  }

  // ── QUESTION SCREEN ──
  const canConfirm = (() => {
    if (current.question_type === "fill_blank") return fillAnswer.trim().length > 0;
    if (current.question_type === "ordering") return orderItems.length > 0;
    if (current.question_type === "matching") return Object.keys(matchPairs).length === current.options.length;
    return !!selectedAnswer;
  })();

  return (
    <div className="space-y-6">
      {/* Header with progress, streak, timer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Question {currentIndex + 1} / {questions.length}</span>
          <div className="flex items-center gap-3">
            <AnimatePresence>
              <StreakIndicator streak={streak} />
            </AnimatePresence>
            {timerEnabled && !hasAnswered && (
              <QuizTimer
                key={current.id}
                seconds={timerSeconds}
                isActive={timerActive && !hasAnswered}
                onExpire={handleTimerExpire}
              />
            )}
          </div>
        </div>
        <Progress value={progressPct} className="h-2" />
        {/* XP bar */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Star className="h-3 w-3 text-primary" /> {totalXP} XP</span>
          <span>{earnedPoints}/{totalPoints} points</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="relative">
          {/* Confetti overlay */}
          {showConfetti && (
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
              {Array.from({ length: 20 }).map((_, i) => <ConfettiParticle key={i} index={i} />)}
            </div>
          )}

          {/* XP gain animation */}
          <XPGain points={current.points * (streak >= 5 ? 3 : streak >= 3 ? 2 : 1)} show={showXP} />

          <Card className={cn(
            "transition-all duration-300",
            hasAnswered && isCorrectCurrent && "ring-2 ring-emerald-500/30",
            hasAnswered && !isCorrectCurrent && "ring-2 ring-destructive/30",
          )}>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{typeIcons[current.question_type]} {typeLabels[current.question_type]}</Badge>
                  <Badge variant="outline" className="text-[10px]">{current.points} pt{current.points > 1 ? "s" : ""}</Badge>
                  {streak >= 3 && (
                    <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                      ×{streak >= 5 ? 3 : 2} multiplicateur
                    </Badge>
                  )}
                </div>

                {current.question_type === "scenario" && current.options?.[0]?.scenario_context && (
                  <div className="rounded-xl bg-muted/50 p-4 border text-sm italic text-muted-foreground">
                    🎭 {current.options[0].scenario_context}
                  </div>
                )}

                <h3 className="text-lg font-semibold">{current.question}</h3>
              </div>

              {(current.question_type === "mcq" || current.question_type === "true_false" || current.question_type === "scenario") && (
                <MCQRenderer current={current} selectedAnswer={selectedAnswer} hasAnswered={hasAnswered} onSelect={setSelectedAnswer} />
              )}

              {current.question_type === "ordering" && (
                <OrderingRenderer items={orderItems} options={current.options} hasAnswered={hasAnswered} correctOrder={current.correct_answer} onReorder={setOrderItems} />
              )}

              {current.question_type === "matching" && (
                <MatchingRenderer options={current.options} pairs={matchPairs} selected={matchSelected} hasAnswered={hasAnswered} correctAnswer={current.correct_answer} onSelect={(label) => {
                  if (hasAnswered) return;
                  if (!matchSelected) { setMatchSelected(label); }
                  else { setMatchPairs(prev => ({ ...prev, [matchSelected]: label })); setMatchSelected(null); }
                }} onReset={() => { setMatchPairs({}); setMatchSelected(null); }} />
              )}

              {current.question_type === "fill_blank" && (
                <FillBlankRenderer question={current.question} answer={fillAnswer} hasAnswered={hasAnswered} correctAnswer={current.correct_answer} onChange={setFillAnswer} />
              )}

              {/* Hint */}
              <AnimatePresence>
                {showHint && hint && !hasAnswered && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                    <p className="text-sm"><Lightbulb className="h-4 w-4 inline mr-2 text-amber-500" />{hint}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Feedback after answering */}
              <AnimatePresence>
                {hasAnswered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className={cn(
                      "rounded-xl p-4 border",
                      isCorrectCurrent ? "bg-emerald-500/5 border-emerald-500/20" : "bg-destructive/5 border-destructive/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {isCorrectCurrent ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        </motion.div>
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium mb-1">
                          {isCorrectCurrent ? "Bonne réponse !" : "Mauvaise réponse"}
                          {isCorrectCurrent && streak >= 3 && ` 🔥 Série de ${streak} !`}
                        </p>
                        {current.explanation && <p className="text-sm text-muted-foreground">{current.explanation}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div>
                  {!hasAnswered && hint && (
                    <Button variant="ghost" size="sm" onClick={() => setShowHint(!showHint)}>
                      <Lightbulb className="h-4 w-4 mr-1" /> Indice
                    </Button>
                  )}
                </div>
                <div className="flex gap-3">
                  {!hasAnswered ? (
                    <Button onClick={handleConfirm} disabled={!canConfirm} className="min-w-[100px]">Valider</Button>
                  ) : (
                    <Button onClick={handleNext} className="min-w-[100px]">
                      {currentIndex + 1 >= questions.length ? <>Résultats <Trophy className="h-4 w-4 ml-2" /></> : <>Suivant <ArrowRight className="h-4 w-4 ml-2" /></>}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── SUB-COMPONENTS ──

function MCQRenderer({ current, selectedAnswer, hasAnswered, onSelect }: { current: QuizQuestion; selectedAnswer: string | null; hasAnswered: boolean; onSelect: (v: string) => void }) {
  return (
    <div className="grid gap-3">
      {current.options.map((opt, idx) => {
        const isSelected = selectedAnswer === opt.value;
        const showCorrect = hasAnswered && opt.value === current.correct_answer;
        const showWrong = hasAnswered && isSelected && !showCorrect;
        return (
          <motion.button key={opt.value} onClick={() => !hasAnswered && onSelect(opt.value)} whileHover={!hasAnswered ? { scale: 1.01 } : {}} whileTap={!hasAnswered ? { scale: 0.99 } : {}}
            className={cn("w-full text-left p-4 rounded-xl border-2 transition-all focus:outline-none",
              !hasAnswered && !isSelected && "border-border hover:border-primary/40 hover:bg-primary/5",
              !hasAnswered && isSelected && "border-primary bg-primary/10",
              showCorrect && "border-emerald-500 bg-emerald-500/10",
              showWrong && "border-destructive bg-destructive/10",
              hasAnswered && !showCorrect && !showWrong && "opacity-50"
            )} disabled={hasAnswered}>
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                !hasAnswered && !isSelected && "bg-muted text-muted-foreground",
                !hasAnswered && isSelected && "bg-primary text-primary-foreground",
                showCorrect && "bg-emerald-500 text-white",
                showWrong && "bg-destructive text-white",
              )}>
                {showCorrect ? <CheckCircle2 className="h-4 w-4" /> : showWrong ? <XCircle className="h-4 w-4" /> : String.fromCharCode(65 + idx)}
              </div>
              <span className="text-sm font-medium">{opt.label}</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

function OrderingRenderer({ items, options, hasAnswered, correctOrder, onReorder }: { items: string[]; options: any[]; hasAnswered: boolean; correctOrder: string; onReorder: (items: string[]) => void }) {
  const correctItems = correctOrder.split(",").map(s => s.trim());
  const labelMap = Object.fromEntries(options.map(o => [o.value, o.label]));

  const moveItem = (index: number, direction: -1 | 1) => {
    if (hasAnswered) return;
    const newItems = [...items];
    const target = index + direction;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    onReorder(newItems);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-2">Utilisez les flèches pour ordonner les éléments :</p>
      {items.map((item, idx) => {
        const isCorrectPos = hasAnswered && correctItems[idx] === item;
        return (
          <motion.div key={item} layout className={cn("flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
            !hasAnswered && "border-border bg-background",
            hasAnswered && isCorrectPos && "border-emerald-500 bg-emerald-500/10",
            hasAnswered && !isCorrectPos && "border-destructive/50 bg-destructive/5",
          )}>
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="flex-1 text-sm font-medium">{labelMap[item] || item}</span>
            {!hasAnswered && (
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveItem(idx, -1)} disabled={idx === 0}><ArrowUp className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1}><ArrowDown className="h-3 w-3" /></Button>
              </div>
            )}
            {hasAnswered && (
              <Badge variant={isCorrectPos ? "default" : "destructive"} className="text-[10px]">{idx + 1}</Badge>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function MatchingRenderer({ options, pairs, selected, hasAnswered, correctAnswer, onSelect, onReset }: { options: any[]; pairs: Record<string, string>; selected: string | null; hasAnswered: boolean; correctAnswer: string; onSelect: (v: string) => void; onReset: () => void }) {
  const leftItems = options.map(o => o.label);
  const rightItems = shuffleArrayStable(options.map(o => o.value), "match");
  const correctMap = Object.fromEntries(correctAnswer.split(",").map(p => { const [l, r] = p.split(":").map(s => s.trim()); return [l, r]; }));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Cliquez sur un élément à gauche puis sur son correspondant à droite :</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {leftItems.map(l => {
            const paired = pairs[l];
            const isSelected = selected === l;
            const isCorrect = hasAnswered && correctMap[l] === paired;
            return (
              <button key={l} onClick={() => !hasAnswered && !paired && onSelect(l)}
                className={cn("w-full text-left p-3 rounded-xl border-2 text-sm font-medium transition-all",
                  !hasAnswered && !isSelected && !paired && "border-border hover:border-primary/40",
                  isSelected && "border-primary bg-primary/10",
                  paired && !hasAnswered && "border-muted bg-muted/30 opacity-60",
                  hasAnswered && isCorrect && "border-emerald-500 bg-emerald-500/10",
                  hasAnswered && !isCorrect && paired && "border-destructive bg-destructive/5",
                )}>
                {l} {paired && <span className="text-xs text-muted-foreground ml-1">→ {paired}</span>}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {rightItems.map(r => {
            const isPaired = Object.values(pairs).includes(r);
            return (
              <button key={r} onClick={() => !hasAnswered && selected && !isPaired && onSelect(r)}
                className={cn("w-full text-left p-3 rounded-xl border-2 text-sm transition-all",
                  !isPaired && "border-border hover:border-primary/40",
                  isPaired && "border-muted bg-muted/30 opacity-60",
                  selected && !isPaired && "border-primary/20 hover:border-primary",
                )}>
                {r}
              </button>
            );
          })}
        </div>
      </div>
      {!hasAnswered && Object.keys(pairs).length > 0 && (
        <Button variant="ghost" size="sm" onClick={onReset}>Réinitialiser</Button>
      )}
    </div>
  );
}

function FillBlankRenderer({ question, answer, hasAnswered, correctAnswer, onChange }: { question: string; answer: string; hasAnswered: boolean; correctAnswer: string; onChange: (v: string) => void }) {
  const isCorrect = answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-muted/30 border">
        <p className="text-sm leading-relaxed">
          {question.split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className={cn("inline-block mx-1 px-3 py-1 rounded-lg border-2 border-dashed min-w-[100px] text-center font-semibold",
                  !hasAnswered && "border-primary/40 bg-primary/5",
                  hasAnswered && isCorrect && "border-emerald-500 bg-emerald-500/10 text-emerald-700",
                  hasAnswered && !isCorrect && "border-destructive bg-destructive/10 text-destructive",
                )}>
                  {answer || "..."}
                </span>
              )}
            </span>
          ))}
        </p>
      </div>
      {!hasAnswered && (
        <Input placeholder="Votre réponse..." value={answer} onChange={e => onChange(e.target.value)} className="max-w-xs" autoFocus />
      )}
      {hasAnswered && !isCorrect && (
        <p className="text-sm text-emerald-600">Réponse attendue : <strong>{correctAnswer}</strong></p>
      )}
    </div>
  );
}

// ── Helpers ──

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function shuffleArrayStable<T>(arr: T[], _seed: string): T[] {
  return shuffleArray(arr);
}
