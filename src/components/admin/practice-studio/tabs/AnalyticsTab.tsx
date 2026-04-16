import { usePracticeAnalytics, usePracticeVersions } from "@/hooks/useAdminPractices";
import { Badge } from "@/components/ui/badge";

interface Props {
  practiceId: string;
}

export function AnalyticsTab({ practiceId }: Props) {
  const { data: analytics } = usePracticeAnalytics(practiceId);
  const { data: versions = [] } = usePracticeVersions(practiceId);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="grid grid-cols-4 gap-3">
        <Stat label="Sessions" value={analytics?.total ?? 0} />
        <Stat label="Complétées" value={analytics?.completed ?? 0} />
        <Stat label="Taux de complétion" value={`${analytics?.completionRate ?? 0}%`} />
        <Stat label="Score moyen" value={`${analytics?.avgScore ?? 0}/100`} />
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">Historique des versions</h3>
        {versions.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucun snapshot encore enregistré.</p>
        ) : (
          <div className="space-y-1.5">
            {versions.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">v{v.version_number}</Badge>
                  <span>{v.change_summary ?? "Snapshot"}</span>
                </div>
                <span className="text-muted-foreground">{new Date(v.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-display font-semibold mt-1">{value}</p>
    </div>
  );
}
