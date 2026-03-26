import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface DecisionTimelineProps {
  decisions: { label: string; impact: string; timestamp: Date }[];
}

export function DecisionTimeline({ decisions }: DecisionTimelineProps) {
  if (decisions.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <Clock className="h-3 w-3" /> Historique des décisions
      </p>
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
        {decisions.map((d, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-2 text-xs"
          >
            <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
            <div className="min-w-0">
              <span className="font-medium">{d.label}</span>
              <span className={cn(
                "ml-1.5",
                d.impact === "positive" ? "text-green-600" : 
                d.impact === "negative" ? "text-red-500" : "text-muted-foreground"
              )}>
                {d.impact === "positive" ? "↑" : d.impact === "negative" ? "↓" : "→"}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
