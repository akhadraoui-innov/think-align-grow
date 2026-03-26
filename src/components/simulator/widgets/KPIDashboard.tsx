import { cn } from "@/lib/utils";

interface KPIDashboardProps {
  kpis: Record<string, number>;
}

const KPI_META: Record<string, { label: string; color: string; icon: string }> = {
  budget: { label: "Budget", color: "text-emerald-600", icon: "💰" },
  morale: { label: "Moral", color: "text-blue-600", icon: "😊" },
  risk: { label: "Risque", color: "text-red-500", icon: "⚠️" },
  time_remaining: { label: "Temps", color: "text-amber-600", icon: "⏳" },
};

export function KPIDashboard({ kpis }: KPIDashboardProps) {
  const relevantKPIs = Object.entries(kpis).filter(([k]) => k in KPI_META);
  if (relevantKPIs.length === 0) return null;

  return (
    <div className="flex items-center gap-4 text-xs">
      {relevantKPIs.map(([key, value]) => {
        const meta = KPI_META[key];
        return (
          <div key={key} className="flex items-center gap-1.5">
            <span>{meta.icon}</span>
            <span className="text-muted-foreground">{meta.label}:</span>
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", 
                  value > 60 ? "bg-emerald-500" : value > 30 ? "bg-amber-500" : "bg-red-500"
                )}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
              />
            </div>
            <span className={cn("font-bold tabular-nums", meta.color)}>{value}</span>
          </div>
        );
      })}
    </div>
  );
}
