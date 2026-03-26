import { cn } from "@/lib/utils";
import { Target } from "lucide-react";

interface ObjectivesPanelProps {
  objectives: { label: string; completed: boolean }[];
}

export function ObjectivesPanel({ objectives }: ObjectivesPanelProps) {
  if (objectives.length === 0) return null;

  const completedCount = objectives.filter((o) => o.completed).length;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <Target className="h-3 w-3" /> Objectifs ({completedCount}/{objectives.length})
      </p>
      <div className="space-y-1">
        {objectives.map((obj, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className={cn(
              "h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0",
              obj.completed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
            )}>
              {obj.completed && <span className="text-[8px]">✓</span>}
            </div>
            <span className={cn(obj.completed && "line-through text-muted-foreground")}>{obj.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
