import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { quizQuestions, computeRadarScores } from "@/data/mockQuiz";
import { RadarChart } from "./RadarChart";
import type { PillarId } from "@/data/mockCards";

interface QuizEngineProps {
  onComplete?: (scores: Record<PillarId, number>) => void;
}

export function QuizEngine({ onComplete }: QuizEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const question = quizQuestions[currentIndex];
  const progress = ((currentIndex + (finished ? 1 : 0)) / quizQuestions.length) * 100;
  const scores = computeRadarScores(answers);

  const handleSelect = (score: number) => {
    setSelectedOption(score);
  };

  const handleNext = () => {
    if (selectedOption === null) return;
    const newAnswers = { ...answers, [question.id]: selectedOption };
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setFinished(true);
      const finalScores = computeRadarScores(newAnswers);
      onComplete?.(finalScores);
    }
  };

  if (finished) {
    const avg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).filter(v => v > 0).length;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center"
      >
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
          {Object.entries(scores).filter(([, v]) => v > 0).map(([pillar, score]) => (
            <div key={pillar} className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2 border border-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{pillar}</span>
              <span className="text-sm font-bold text-foreground">{Math.round(score)}%</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          <span>Question {currentIndex + 1}/{quizQuestions.length}</span>
          <span className="capitalize">{question.pillar}</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
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
            {question.options.map((opt) => (
              <button
                key={opt.score}
                onClick={() => handleSelect(opt.score)}
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
        {currentIndex < quizQuestions.length - 1 ? "Suivant" : "Voir mes résultats"}
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}
