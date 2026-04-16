import { usePracticeAnalytics } from "@/hooks/useAdminPractices";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Trophy, BarChart3 } from "lucide-react";

interface Props {
  practiceId: string;
}

const WINNER_MIN_SESSIONS = 3;

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

  // Per-dimension scores aggregated from completed sessions
  const { data: dimensionScores = [] } = useQuery({
    queryKey: ["practice-dim-scores", practiceId],
    enabled: !!practiceId,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_practice_sessions")
        .select("evaluation")
        .eq("practice_id", practiceId)
        .not("evaluation", "is", null);
      const buckets: Record<string, { total: number; count: number }> = {};
      for (const row of data ?? []) {
        const dims = (row.evaluation as any)?.dimensions;
        if (!Array.isArray(dims)) continue;
        for (const d of dims) {
          const key = d?.name || d?.label || d?.key;
          const score = typeof d?.score === "number" ? d.score : null;
          if (!key || score === null) continue;
          if (!buckets[key]) buckets[key] = { total: 0, count: 0 };
          buckets[key].total += score;
          buckets[key].count += 1;
        }
      }
      return Object.entries(buckets)
        .map(([name, v]) => ({ name, avg: Math.round(v.total / v.count), count: v.count }))
        .sort((a, b) => b.avg - a.avg);
    },
  });

  const variants = analytics?.variants ?? {};
  const variantList = Object.entries(variants);

  // Winner only if eligible variants have ≥ WINNER_MIN_SESSIONS sessions
  const eligibleWinners = variantList.filter(([, v]) => v.total >= WINNER_MIN_SESSIONS);
  const winner = eligibleWinners.length > 1
    ? eligibleWinners.reduce((best, [id, v]) => (!best || v.avg > best[1].avg) ? [id, v] : best, null as any)
    : null;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="grid grid-cols-4 gap-3">
        <Stat label="Sessions" value={analytics?.total ?? 0} />
        <Stat label="Complétées" value={analytics?.completed ?? 0} />
        <Stat label="Taux de complétion" value={`${analytics?.completionRate ?? 0}%`} />
        <Stat label="Score moyen" value={`${analytics?.avgScore ?? 0}/100`} />
      </div>

      {dimensionScores.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" /> Score moyen par dimension
          </h3>
          <div className="space-y-2.5">
            {dimensionScores.map(d => (
              <div key={d.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium capitalize">{d.name.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground tabular-nums">{d.avg}/100 · {d.count} éval.</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, d.avg)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {variantList.length > 1 && (
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center justify-between">
            <span>Performance par variante</span>
            {!winner && variantList.some(([, v]) => v.total < WINNER_MIN_SESSIONS) && (
              <span className="text-[10px] font-normal text-muted-foreground">
                Gagnante désignée à partir de {WINNER_MIN_SESSIONS} sessions / variante
              </span>
            )}
          </h3>
          <div className="space-y-2">
            {variantList.map(([id, v]: any) => {
              const isWinner = winner && winner[0] === id;
              const insufficient = v.total < WINNER_MIN_SESSIONS;
              return (
                <div key={id} className={`flex items-center justify-between rounded-lg border p-3 ${isWinner ? "border-primary/40 bg-primary/5" : "border-border/60"}`}>
                  <div className="flex items-center gap-2">
                    {isWinner && <Trophy className="h-3.5 w-3.5 text-primary" />}
                    <span className="text-xs font-medium">{v.label}</span>
                    {insufficient && (
                      <Badge variant="outline" className="text-[9px] text-muted-foreground">
                        Données insuffisantes
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground tabular-nums">{v.total} sess.</span>
                    <span className="text-muted-foreground tabular-nums">{v.total ? Math.round((v.completed / v.total) * 100) : 0}% compl.</span>
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
