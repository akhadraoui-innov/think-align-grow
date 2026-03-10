import { motion } from "framer-motion";
import type { ChallengeAnalysis as ChallengeAnalysisType } from "@/hooks/useChallengeData";
import { cn } from "@/lib/utils";

interface ChallengeAnalysisProps {
  analysis: ChallengeAnalysisType;
}

function MaturityBar({ value, label }: { value: number; label: string }) {
  const pct = (value / 5) * 100;
  const color = value <= 2 ? "bg-destructive" : value <= 3 ? "bg-primary" : "bg-pillar-finance";

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium truncate">{label}</span>
        <span className="text-xs font-bold text-muted-foreground">{value}/5</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}

export function ChallengeAnalysisView({ analysis }: ChallengeAnalysisProps) {
  const data = analysis.analysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full overflow-auto p-6 space-y-8"
    >
      {/* Global maturity */}
      {data.global_maturity !== undefined && (
        <div className="text-center space-y-3">
          <h2 className="font-display font-black text-2xl uppercase tracking-tight">Maturité globale</h2>
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-card border-2 border-border mx-auto">
            <span className="font-display font-black text-3xl">{data.global_maturity}</span>
            <span className="text-sm text-muted-foreground">/5</span>
          </div>
        </div>
      )}

      {/* Summary */}
      {data.summary && (
        <div className="rounded-2xl bg-card border border-border p-5">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-2">Synthèse</h3>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Per-subject breakdown */}
      {data.subjects && data.subjects.length > 0 && (
        <div className="space-y-6">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground">Par sujet</h3>
          {data.subjects.map((subj, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-5 space-y-3">
              <MaturityBar value={subj.maturity} label={subj.title} />
              <p className="text-sm text-muted-foreground leading-relaxed">{subj.interpretation}</p>
              {subj.reflections && subj.reflections.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-border">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Réflexions</span>
                  <ul className="space-y-1">
                    {subj.reflections.map((r, j) => (
                      <li key={j} className="text-sm flex gap-2">
                        <span className="text-primary shrink-0">→</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
