import { CheckCircle, Circle, Lightbulb, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Objective {
  label: string;
  completed: boolean;
}

interface ModuleGuideProps {
  title?: string;
  progress?: number;
  objectives?: Objective[];
  expertTip?: string;
  caseStudyUrl?: string;
}

export function ModuleGuide({
  title = "Module Guide",
  progress = 0,
  objectives = [],
  expertTip,
  caseStudyUrl,
}: ModuleGuideProps) {
  return (
    <aside className="w-64 shrink-0 border-l border-border/50 bg-card/30 p-4 flex flex-col gap-5 overflow-auto">
      {/* Header + Progress */}
      <div>
        <h3 className="text-xs font-bold text-foreground mb-3">{title}</h3>
        <div className="flex items-center gap-2">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-[10px] font-semibold text-primary">{progress}%</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Complete</p>
      </div>

      {/* Objectives */}
      {objectives.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Core Objectives
          </h4>
          <div className="space-y-2">
            {objectives.map((obj, i) => (
              <div key={i} className="flex items-start gap-2">
                {obj.completed ? (
                  <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
                )}
                <span
                  className={cn(
                    "text-[11px] leading-snug",
                    obj.completed ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {obj.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expert Tip */}
      {expertTip && (
        <div className="rounded-xl bg-accent/8 border border-accent/15 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-accent" />
            <span className="text-[10px] font-semibold text-accent">Expert Tip</span>
          </div>
          <p className="text-[10px] text-foreground/80 leading-relaxed">{expertTip}</p>
          {caseStudyUrl && (
            <a
              href={caseStudyUrl}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-accent mt-2 hover:underline"
            >
              Read Case Study <ArrowRight className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </aside>
  );
}
