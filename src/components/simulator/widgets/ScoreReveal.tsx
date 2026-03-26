import { useState } from "react";
import { motion } from "framer-motion";
import { Award, Star, Lightbulb, RotateCcw, ArrowRight, TrendingUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SessionReplay } from "./SessionReplay";

interface ScoreRevealProps {
  score: number;
  feedback: string;
  dimensions?: { name: string; score: number }[];
  recommendations?: string[];
  nextPractices?: { label: string; type: string }[];
  messages?: { role: "user" | "assistant"; content: string }[];
  onRestart?: () => void;
  onNextPractice?: (type: string) => void;
}

export function ScoreReveal({ score, feedback, dimensions, recommendations, nextPractices, onRestart, onNextPractice }: ScoreRevealProps) {
  const grade = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";
  const gradeColor = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-primary" : score >= 40 ? "text-amber-500" : "text-destructive";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4 rounded-2xl border bg-card p-5 space-y-4"
    >
      {/* Score header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
            <Award className={cn("h-8 w-8", gradeColor)} />
          </motion.div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Score final</p>
            <motion.p
              className={cn("text-3xl font-black tabular-nums", gradeColor)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {score}<span className="text-lg text-muted-foreground">/100</span>
            </motion.p>
          </div>
        </div>
        <motion.div
          className={cn("text-5xl font-black", gradeColor)}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", delay: 0.4 }}
        >
          {grade}
        </motion.div>
      </div>

      {/* Dimensions */}
      {dimensions && dimensions.length > 0 && (
        <motion.div className="grid grid-cols-2 gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {dimensions.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <Star className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground capitalize">{d.name.replace(/_/g, " ")}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", d.score >= 7 ? "bg-emerald-500" : d.score >= 4 ? "bg-amber-500" : "bg-destructive")}
                  initial={{ width: 0 }}
                  animate={{ width: `${d.score * 10}%` }}
                  transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                />
              </div>
              <span className="font-bold tabular-nums">{d.score}/10</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Feedback */}
      <p className="text-sm text-muted-foreground leading-relaxed">{feedback}</p>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <motion.div
          className="bg-muted/50 rounded-xl p-3 space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            Recommandations
          </div>
          <ul className="space-y-1">
            {recommendations.map((r, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-2">
                <span className="text-primary font-bold">{i + 1}.</span>
                {r}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Next practices */}
      {nextPractices && nextPractices.length > 0 && onNextPractice && (
        <motion.div
          className="bg-primary/5 rounded-xl p-3 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            Prochaines étapes suggérées
          </div>
          <div className="flex flex-wrap gap-2">
            {nextPractices.map((p) => (
              <Button
                key={p.type}
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 h-7"
                onClick={() => onNextPractice(p.type)}
              >
                {p.label}
                <ArrowRight className="h-3 w-3" />
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Restart */}
      {onRestart && (
        <div className="flex justify-center pt-1">
          <Button variant="outline" size="sm" onClick={onRestart} className="gap-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Recommencer
          </Button>
        </div>
      )}
    </motion.div>
  );
}
