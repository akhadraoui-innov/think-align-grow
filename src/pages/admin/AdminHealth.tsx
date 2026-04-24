import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useSystemHealth, useEdgeFunctionMetrics } from "@/hooks/useSystemHealth";
import {
  Activity, ShieldCheck, ShieldAlert, Mail, Server, Database, KeyRound,
  Image as ImageIcon, Zap, AlertTriangle, RefreshCw, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { AdminShell } from "@/components/admin/AdminShell";

type Status = "ok" | "warn" | "error";

function StatusBadge({ status, label }: { status: Status; label: string }) {
  const cls =
    status === "ok"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : status === "warn"
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      : "bg-destructive/15 text-destructive";
  return (
    <Badge variant="secondary" className={cn("font-medium border-0", cls)}>
      {label}
    </Badge>
  );
}

function HealthCard({
  title,
  icon: Icon,
  status,
  primary,
  secondary,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  status: Status;
  primary: string;
  secondary?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="p-5 flex flex-col gap-3 min-h-[170px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn(
            "h-4 w-4",
            status === "ok" && "text-emerald-500",
            status === "warn" && "text-amber-500",
            status === "error" && "text-destructive"
          )} />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <StatusBadge status={status} label={status === "ok" ? "OK" : status === "warn" ? "Attention" : "Critique"} />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{primary}</p>
        {secondary && <p className="text-xs text-muted-foreground mt-1">{secondary}</p>}
      </div>
      {children && <div className="mt-auto">{children}</div>}
    </Card>
  );
}

export default function AdminHealth() {
  const { data, isLoading, refetch, isFetching } = useSystemHealth();
  const { data: metrics } = useEdgeFunctionMetrics(24);

  if (isLoading) {
    return (
      <AdminShell>
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </AdminShell>
    );
  }

  if (!data) return <AdminShell><div /></AdminShell>;

  // Compute statuses
  const providersDown = data.providers.filter((p) => p.circuit_open).length;
  const providersStatus: Status = providersDown > 0 ? "error" : data.providers.some((p) => p.failure_rate > 10) ? "warn" : "ok";

  const cronStatus: Status = (() => {
    const failed = data.cron_jobs.filter((c) => c.last_status === "failed").length;
    const inactive = data.cron_jobs.filter((c) => !c.active).length;
    if (failed > 0) return "error";
    if (inactive > 0) return "warn";
    return "ok";
  })();

  const queueStatus: Status = (() => {
    const totalBacklog = data.pgmq_backlogs.reduce((s, q) => s + (q.backlog || 0), 0);
    if (totalBacklog > 1000) return "error";
    if (totalBacklog > 200) return "warn";
    return "ok";
  })();

  const auditStatus: Status = data.audit_chain.valid ? "ok" : "error";

  const secretsStatus: Status = data.secrets_status.email_hmac_secret ? "ok" : "warn";

  const brandStatus: Status = data.brand_assets_status.logo_uploaded ? "ok" : "warn";

  const totalBacklog = data.pgmq_backlogs.reduce((s, q) => s + (q.backlog || 0), 0);

  return (
    <AdminShell>
      <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Health & Observabilité</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vue système globale — actualisée {formatDistanceToNow(new Date(data.generated_at), { addSuffix: true, locale: fr })}.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("h-3.5 w-3.5 mr-2", isFetching && "animate-spin")} />
          Rafraîchir
        </Button>
      </div>

      {/* 6 status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <HealthCard
          title="Providers email"
          icon={Mail}
          status={providersStatus}
          primary={`${data.providers.length} actifs`}
          secondary={providersDown > 0 ? `${providersDown} circuit(s) ouvert(s)` : "Tous opérationnels"}
        >
          <div className="space-y-1.5">
            {data.providers.slice(0, 3).map((p) => (
              <div key={p.provider} className="flex items-center justify-between text-xs">
                <span className="font-medium truncate">{p.provider}</span>
                <span className={cn(
                  "tabular-nums",
                  p.failure_rate > 20 ? "text-destructive" : p.failure_rate > 10 ? "text-amber-500" : "text-muted-foreground"
                )}>
                  {p.failure_rate.toFixed(1)}% échec
                </span>
              </div>
            ))}
            {data.providers.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Aucun provider configuré</p>
            )}
          </div>
        </HealthCard>

        <HealthCard
          title="Tâches CRON"
          icon={Clock}
          status={cronStatus}
          primary={`${data.cron_jobs.filter(c => c.active).length}/${data.cron_jobs.length}`}
          secondary={data.cron_jobs.filter(c => c.last_status === "failed").length > 0 ? "Échecs détectés" : "Toutes actives"}
        >
          <div className="space-y-1.5">
            {data.cron_jobs.slice(0, 3).map((c) => (
              <div key={c.jobname} className="flex items-center justify-between text-xs">
                <span className="font-medium truncate max-w-[60%]">{c.jobname}</span>
                <Badge variant="outline" className="h-5 text-[10px]">
                  {c.last_status ?? "n/a"}
                </Badge>
              </div>
            ))}
          </div>
        </HealthCard>

        <HealthCard
          title="Files prioritaires (pgmq)"
          icon={Server}
          status={queueStatus}
          primary={totalBacklog.toString()}
          secondary="messages en attente cumulés"
        >
          <div className="space-y-1.5">
            {data.pgmq_backlogs.map((q) => (
              <div key={q.lane} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium uppercase tracking-wide">{q.lane}</span>
                  <span className="tabular-nums text-muted-foreground">{q.backlog}</span>
                </div>
                <Progress value={Math.min(100, (q.backlog / 100) * 100)} className="h-1" />
              </div>
            ))}
            {data.pgmq_backlogs.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Aucune lane configurée</p>
            )}
          </div>
        </HealthCard>

        <HealthCard
          title="Chaîne d'audit"
          icon={data.audit_chain.valid ? ShieldCheck : ShieldAlert}
          status={auditStatus}
          primary={data.audit_chain.valid ? "Intègre" : "ROMPUE"}
          secondary={`${data.audit_chain.total} entrées immuables`}
        >
          {!data.audit_chain.valid && data.audit_chain.broken_at != null && (
            <p className="text-xs text-destructive">
              Premier maillon corrompu : entrée #{data.audit_chain.broken_at}
            </p>
          )}
        </HealthCard>

        <HealthCard
          title="Secrets vault"
          icon={KeyRound}
          status={secretsStatus}
          primary={data.secrets_status.count_total.toString()}
          secondary={data.secrets_status.email_hmac_secret ? "HMAC email présent" : "HMAC email manquant"}
        />

        <HealthCard
          title="Actifs de marque"
          icon={ImageIcon}
          status={brandStatus}
          primary={data.brand_assets_status.logo_uploaded ? "OK" : "À configurer"}
          secondary={data.brand_assets_status.logo_uploaded ? "Logo uploadé" : "Aucun logo détecté"}
        />
      </div>

      {/* Quota alerts */}
      {data.quota_alerts && data.quota_alerts.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Organisations proches de leur quota email
          </h3>
          <div className="space-y-2">
            {data.quota_alerts.map((qa) => (
              <div key={qa.organization_id} className="flex items-center gap-3">
                <span className="text-sm font-medium flex-1 truncate">{qa.organization_name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {qa.sent_count}/{qa.monthly_limit}
                </span>
                <Progress value={qa.usage_percent} className="w-32 h-2" />
                <span className={cn(
                  "text-xs font-semibold tabular-nums w-12 text-right",
                  qa.usage_percent >= 90 ? "text-destructive" : "text-amber-500"
                )}>
                  {qa.usage_percent.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edge function metrics */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Métriques des fonctions edge (24h)
          </h3>
          <span className="text-xs text-muted-foreground">P50 / P95 latence • taux d'erreur</span>
        </div>
        {metrics && metrics.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fonction</TableHead>
                <TableHead className="text-right">Invocations</TableHead>
                <TableHead className="text-right">Erreurs</TableHead>
                <TableHead className="text-right">P50 (ms)</TableHead>
                <TableHead className="text-right">P95 (ms)</TableHead>
                <TableHead className="text-right">Taux erreur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((m) => (
                <TableRow key={m.function_name}>
                  <TableCell className="font-mono text-xs">{m.function_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.invocations}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.errors}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.p50_ms ? Math.round(Number(m.p50_ms)) : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.p95_ms ? Math.round(Number(m.p95_ms)) : "—"}</TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "tabular-nums font-semibold",
                      Number(m.error_rate) > 10 ? "text-destructive" : Number(m.error_rate) > 2 ? "text-amber-500" : "text-emerald-500"
                    )}>
                      {m.error_rate ? `${m.error_rate}%` : "0%"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-xs text-muted-foreground italic py-4 text-center">
            Aucune donnée disponible pour les dernières 24h.
          </p>
        )}
      </Card>
      </div>
    </AdminShell>
  );
}
