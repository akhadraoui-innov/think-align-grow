import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Server,
  ShieldAlert,
  Zap,
} from "lucide-react";
import {
  useProviderHealth,
  useQuotaAlerts,
  useCronHealth,
} from "@/hooks/useEmailReliability";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EmailPriorityLanesPanel } from "./EmailPriorityLanesPanel";

export function EmailReliabilityTab() {
  const [hours, setHours] = useState(24);
  const providers = useProviderHealth(hours);
  const alerts = useQuotaAlerts();
  const cron = useCronHealth();

  const refetchAll = () => {
    providers.refetch();
    alerts.refetch();
    cron.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Santé & Reliability</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(hours)} onValueChange={(v) => setHours(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Dernière heure</SelectItem>
              <SelectItem value="24">24h</SelectItem>
              <SelectItem value="168">7 jours</SelectItem>
              <SelectItem value="720">30 jours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={refetchAll}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Priority lanes (Lot E2) */}
      <EmailPriorityLanesPanel />

      {/* Provider Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4" />
            Santé des providers
          </CardTitle>
          <CardDescription>
            Statistiques d'envoi par provider sur la fenêtre sélectionnée. Le circuit-breaker s'ouvre automatiquement
            au-delà de 20% de défaillance sur les 100 derniers envois.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {providers.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : !providers.data?.length ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucun envoi sur la période.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead className="text-right">Bounced</TableHead>
                  <TableHead className="text-right">DLQ</TableHead>
                  <TableHead className="text-right">Failure %</TableHead>
                  <TableHead>Circuit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.data.map((p) => (
                  <TableRow key={p.provider}>
                    <TableCell className="font-medium">{p.provider}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.total}</TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-600">{p.sent}</TableCell>
                    <TableCell className="text-right tabular-nums text-destructive">{p.failed}</TableCell>
                    <TableCell className="text-right tabular-nums text-amber-600">{p.bounced}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.dlq}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <Badge
                        variant={p.failure_rate > 20 ? "destructive" : p.failure_rate > 5 ? "secondary" : "outline"}
                      >
                        {p.failure_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.circuit_open ? (
                        <Badge variant="destructive" className="gap-1">
                          <ShieldAlert className="h-3 w-3" /> OPEN
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-600/40">
                          <CheckCircle2 className="h-3 w-3" /> OK
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Quota alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Alertes quota (&gt;80%)
            </CardTitle>
            <CardDescription>Organisations approchant leur plafond mensuel.</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !alerts.data?.length ? (
              <div className="py-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                Aucune organisation en dépassement.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {alerts.data.map((a) => (
                  <li key={a.organization_id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{a.organization_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.sent_count.toLocaleString()} / {a.monthly_limit.toLocaleString()} envois
                      </p>
                    </div>
                    <Badge
                      variant={a.usage_percent >= 100 ? "destructive" : a.usage_percent >= 95 ? "secondary" : "outline"}
                    >
                      {a.usage_percent}%
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Cron health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-primary" />
              Santé des cron jobs
            </CardTitle>
            <CardDescription>Dernier run des tâches planifiées email.</CardDescription>
          </CardHeader>
          <CardContent>
            {cron.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !cron.data?.length ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Aucun cron job email configuré.</p>
            ) : (
              <ul className="divide-y divide-border">
                {cron.data.map((c) => (
                  <li key={c.jobname} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium font-mono">{c.jobname}</p>
                      {c.last_status === "succeeded" ? (
                        <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-600/40">
                          <CheckCircle2 className="h-3 w-3" /> OK
                        </Badge>
                      ) : c.last_status ? (
                        <Badge variant="destructive" className="gap-1">
                          <ShieldAlert className="h-3 w-3" /> {c.last_status}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Jamais exécuté</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {c.schedule} · {c.last_start
                        ? format(new Date(c.last_start), "d MMM 'à' HH:mm", { locale: fr })
                        : "—"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
