import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadarChart } from "./RadarChart";
import { useQuizQuestions, usePillars } from "@/hooks/useToolkitData";
import { useToolkit } from "@/hooks/useToolkitData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuizOption {
  label: string;
  score: number;
}

interface QuizEngineProps {
  onComplete?: (scores: Record<string, number>) => void;
}

export function QuizEngine({ onComplete }: QuizEngineProps) {
  const { data: questions, isLoading: loadingQ } = useQuizQuestions();
  const { data: pillars, isLoading: loadingP } = usePillars();
  const { data: toolkit } = useToolkit();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  if (loadingQ || loadingP || !questions?.length || !pillars?.length) {
    return <p className="text-center text-muted-foreground py-8">Chargement du quiz...</p>;
  }

  const pillarMap = Object.fromEntries(pillars.map(p => [p.id, p]));

  const computeScores = (ans: Record<string, number>): Record<string, number> => {
    const totals: Record<string, { sum: number; count: number }> = {};
    questions.forEach(q => {
      if (ans[q.id] !== undefined) {
        const slug = pillarMap[q.pillar_id]?.slug || "unknown";
        if (!totals[slug]) totals[slug] = { sum: 0, count: 0 };
        totals[slug].sum += ans[q.id];
        totals[slug].count += 1;
      }
    });
    const result: Record<string, number> = {};
    pillars.forEach(p => {
      const t = totals[p.slug];
      result[p.slug] = t ? (t.sum / (t.count * 4)) * 100 : 0;
    });
    return result;
  };

  const question = questions[currentIndex];
  const options = (question.options as unknown as QuizOption[]) || [];
  const progress = ((currentIndex + (finished ? 1 : 0)) / questions.length) * 100;
  const scores = computeScores(answers);
  const pillarName = pillarMap[question.pillar_id]?.name || "";

  const saveScoresToDb = async (finalScores: Record<string, number>) => {
    if (!user || !toolkit) return;
    const nonZero = Object.values(finalScores).filter(v => v > 0);
    const avg = nonZero.length ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;
    try {
      await supabase.from("quiz_results").insert({
        user_id: user.id,
        toolkit_id: toolkit.id,
        scores: finalScores,
        total_score: Math.round(avg),
      });
    } catch {
      // Silently fail — quiz still works without persistence
    }
  };

  const handleNext = () => {
    if (selectedOption === null) return;
    const newAnswers = { ...answers, [question.id]: selectedOption };
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setFinished(true);
      const finalScores = computeScores(newAnswers);
      saveScoresToDb(finalScores);
      onComplete?.(finalScores);
    }
  };

  if (finished) {
    const nonZero = Object.values(scores).filter(v => v > 0);
    const avg = nonZero.length ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-6 w-6 text-pillar-finance" />
          <h3 className="font-display font-bold text-xl uppercase">Diagnostic complété !</h3>
        </div>
        <RadarChart scores={scores} size={240} />
        <div className="mt-4 text-center">
          <p className="text-3xl font-display font-bold text-primary">{Math.round(avg)}%</p>
          <p className="text-sm text-muted-foreground">Maturité stratégique moyenne</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 w-full">
          {Object.entries(scores).filter(([, v]) => v > 0).map(([slug, score]) => (
            <div key={slug} className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2 border border-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{slug}</span>
              <span className="text-sm font-bold text-foreground">{Math.round(score)}%</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          <span>Question {currentIndex + 1}/{questions.length}</span>
          <span>{pillarName}</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <h3 className="font-display font-bold text-lg text-foreground mb-5">{question.question}</h3>
          <div className="space-y-2.5">
            {options.map((opt) => (
              <button
                key={opt.score}
                onClick={() => setSelectedOption(opt.score)}
                className={`w-full text-left rounded-2xl px-4 py-3.5 border transition-all duration-200 ${
                  selectedOption === opt.score
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-card border-border text-muted-foreground hover:border-primary/20"
                }`}
              >
                <span className="text-sm">{opt.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <Button
        onClick={handleNext}
        disabled={selectedOption === null}
        className="w-full mt-6 rounded-2xl h-12 font-bold uppercase tracking-wide"
      >
        {currentIndex < questions.length - 1 ? "Suivant" : "Voir mes résultats"}
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}
