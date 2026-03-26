import { cn } from "@/lib/utils";

interface TensionGaugeProps {
  tension: number; // 1-10
  rapport: number; // 1-10
  progress?: number; // 0-100
}

export function TensionGauge({ tension, rapport, progress }: TensionGaugeProps) {
  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Tension:</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-3 rounded-sm transition-colors",
                i < tension
                  ? tension >= 8 ? "bg-red-500" : tension >= 5 ? "bg-amber-500" : "bg-green-500"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Rapport:</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-3 rounded-sm transition-colors",
                i < rapport ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
      {progress !== undefined && (
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Progrès:</span>
          <span className="font-bold">{progress}%</span>
        </div>
      )}
    </div>
  );
}
