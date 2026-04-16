import { usePracticeAnalytics } from "@/hooks/useAdminPractices";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface Props {
  practiceId: string;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-display font-semibold mt-1">{value}</p>
    </div>
  );
}

export function AnalyticsTab({ practiceId }: Props) {
  const { data: analytics } = usePracticeAnalytics(practiceId);
  const variants = analytics?.variants ?? {};
  const variantList = Object.entries(variants);
  const winner = variantList.length > 1
    ? variantList.reduce((best, [id, v]) => (!best || v.avg > best[1].avg) ? [id, v] : best, null as any)
    : null;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="grid grid-cols-4 gap-3">
        <Stat label="Sessions" value={analytics?.total ?? 0} />
        <Stat label="Complétées" value={analytics?.completed ?? 0} />
        <Stat label="Taux de complétion" value={`${analytics?.completionRate ?? 0}%`} />
        <Stat label="Score moyen" value={`${analytics?.avgScore ?? 0}/100`} />
      </div>

      {variantList.length > 1 && (
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold">Performance par variante</h3>
          <div className="space-y-2">
            {variantList.map(([id, v]: any) => {
              const isWinner = winner && winner[0] === id;
              return (
                <div key={id} className={`flex items-center justify-between rounded-lg border p-3 ${isWinner ? "border-primary/40 bg-primary/5" : "border-border/60"}`}>
                  <div className="flex items-center gap-2">
                    {isWinner && <Trophy className="h-3.5 w-3.5 text-primary" />}
                    <span className="text-xs font-medium">{v.label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">{v.total} sess.</span>
                    <span className="text-muted-foreground">{v.total ? Math.round((v.completed / v.total) * 100) : 0}% compl.</span>
                    <Badge variant={isWinner ? "default" : "secondary"} className="font-mono">{v.avg}/100</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
