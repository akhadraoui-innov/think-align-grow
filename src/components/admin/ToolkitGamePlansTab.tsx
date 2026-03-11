import { Badge } from "@/components/ui/badge";

interface Props {
  gamePlans: any[];
}

export function ToolkitGamePlansTab({ gamePlans }: Props) {
  if (!gamePlans.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
        Aucun game plan.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {gamePlans.map((gp) => (
        <div key={gp.id} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">{gp.name}</h4>
              {gp.description && <p className="text-xs text-muted-foreground mt-0.5">{gp.description}</p>}
            </div>
            <div className="flex gap-2">
              {gp.difficulty && <Badge variant="outline" className="text-xs">{gp.difficulty}</Badge>}
              {gp.estimated_minutes && <Badge variant="secondary" className="text-xs">{gp.estimated_minutes} min</Badge>}
            </div>
          </div>

          {gp.game_plan_steps?.length > 0 && (
            <div className="pl-4 border-l-2 border-border/50 space-y-1">
              {gp.game_plan_steps
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                .map((step: any, i: number) => (
                  <div key={step.id} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                    <span className="text-sm text-foreground">{step.title}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
