import { motion } from "framer-motion";
import { Award, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreRevealProps {
  score: number;
  feedback: string;
  dimensions?: { name: string; score: number }[];
}

export function ScoreReveal({ score, feedback, dimensions }: ScoreRevealProps) {
  const grade = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";
  const gradeColor = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-blue-500" : score >= 40 ? "text-amber-500" : "text-red-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4 rounded-2xl border bg-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Award className={cn("h-8 w-8", gradeColor)} />
          <div>
            <p className="text-xs text-muted-foreground font-medium">Score final</p>
            <p className={cn("text-3xl font-black tabular-nums", gradeColor)}>
              {score}<span className="text-lg text-muted-foreground">/100</span>
            </p>
          </div>
        </div>
        <div className={cn("text-5xl font-black", gradeColor)}>{grade}</div>
      </div>

      {dimensions && dimensions.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {dimensions.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <Star className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground capitalize">{d.name.replace(/_/g, " ")}</span>
              <span className="ml-auto font-bold">{d.score}/10</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground leading-relaxed">{feedback}</p>
    </motion.div>
  );
}
