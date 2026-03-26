import { motion } from "framer-motion";
import { Target, CheckCircle2, Circle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ObjectivesPanelProps {
  objectives: { label: string; completed: boolean; hint?: string }[];
}

export function ObjectivesPanel({ objectives }: ObjectivesPanelProps) {
  if (objectives.length === 0) return null;

  const completedCount = objectives.filter((o) => o.completed).length;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Target className="h-3 w-3" /> Objectifs ({completedCount}/{objectives.length})
        </p>
        <div className="space-y-1">
          {objectives.map((obj, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <motion.div
                  className="flex items-center gap-2 text-xs cursor-help"
                  initial={false}
                  animate={obj.completed ? { x: [0, 4, 0] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {obj.completed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={cn(obj.completed && "line-through text-muted-foreground")}>{obj.label}</span>
                </motion.div>
              </TooltipTrigger>
              {obj.hint && (
                <TooltipContent side="right" className="text-xs max-w-[200px]">{obj.hint}</TooltipContent>
              )}
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
