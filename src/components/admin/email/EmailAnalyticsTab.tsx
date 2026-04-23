import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Mail, AlertCircle, Eye, MousePointer, TrendingUp, Send, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  useEmailAnalytics,
  dedupByMessageId,
  buildDailySeries,
  buildTemplateStats,
  buildProviderStats,
  AnalyticsRange,
} from "@/hooks/useEmailAnalytics";

const RANGE_LABELS: Record<AnalyticsRange, { label: string; days: number }> = {
  "24h": { label: "24h", days: 1 },
  "7d": { label: "7 jours", days: 7 },
  "30d": { label: "30 jours", days: 30 },
  "90d": { label: "90 jours", days: 90 },
};

export function EmailAnalyticsTab({ organizationId }: { organizationId: string | null }) {
  const [range, setRange] = useState<AnalyticsRange>("7d");
  const { data: rawRows = [], isLoading } = useEmailAnalytics(organizationId, range);

  const rows = useMemo(() => dedupByMessageId(rawRows), [rawRows]);
  const days = RANGE_LABELS[range].days;

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.total++;
        if (r.status === "sent") acc.sent++;
        if (r.status === "failed" || r.status === "dlq") acc.failed++;
        if (r.status === "bounced") acc.bounced++;
        if (r.opened_at) acc.opened++;
        if (r.clicked_at) acc.clicked++;
        return acc;
      },
      { total: 0, sent: 0, failed: 0, bounced: 0, opened: 0, clicked: 0 }
    );
  }, [rows]);

  const deliverability = totals.total > 0 ? Math.round((totals.sent / totals.total) * 1000) / 10 : 0;
  const openRate = totals.sent > 0 ? Math.round((totals.opened / totals.sent) * 1000) / 10 : 0;
  const clickRate = totals.sent > 0 ? Math.round((totals.clicked / totals.sent) * 1000) / 10 : 0;
  const bounceRate = totals.total > 0 ? Math.round((totals.bounced / totals.total) * 1000) / 10 : 0;

  const series = useMemo(() => buildDailySeries(rows, days), [rows, days]);
  const templateStats = useMemo(() => buildTemplateStats(rows), [rows]);
  const providerStats = useMemo(() => buildProviderStats(rows), [rows]);

  const exportCSV = () => {
    const header = ["template_code", "total", "sent", "failed", "open_rate_%", "click_rate_%"];
    const lines = templateStats.map((t) => [t.template_code, t.total, t.sent, t.failed, t.open_rate, t.click_rate]);
    const csv = [header, ...lines]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-analytics-${range}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Analytics & Reporting
          </h2>
          <p className="text-xs text-muted-foreground">
            {totals.total} envois uniques sur les {RANGE_LABELS[range].label.toLowerCase()} · dédupliqués par message_id
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={range} onValueChange={(v) => v && setRange(v as AnalyticsRange)} size="sm">
            {(Object.keys(RANGE_LABELS) as AnalyticsRange[]).map((r) => (
              <ToggleGroupItem key={r} value={r} className="text-xs">
                {RANGE_LABELS[r].label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!templateStats.length}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KPI icon={Mail} label="Total" value={totals.total} suffix="" tone="default" />
        <KPI icon={Send} label="Délivrés" value={deliverability} suffix="%" tone="success" />
        <KPI icon={Eye} label="Ouvertures" value={openRate} suffix="%" tone="info" />
        <KPI icon={MousePointer} label="Clics" value={clickRate} suffix="%" tone="accent" />
        <KPI icon={AlertCircle} label="Échecs" value={totals.failed} suffix="" tone="destructive" />
        <KPI icon={AlertTriangle} label="Bounces" value={bounceRate} suffix="%" tone="warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Évolution journalière</h3>
          <div className="h-64">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="g-sent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-failed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => format(parseISO(v), "dd/MM", { locale: fr })}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    labelFormatter={(v) => format(parseISO(String(v)), "dd MMM yyyy", { locale: fr })}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="sent" stroke="hsl(var(--primary))" fill="url(#g-sent)" name="Délivrés" />
                  <Area type="monotone" dataKey="failed" stroke="hsl(var(--destructive))" fill="url(#g-failed)" name="Échecs" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Engagement (ouvertures & clics)</h3>
          <div className="h-64">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => format(parseISO(v), "dd/MM", { locale: fr })}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    labelFormatter={(v) => format(parseISO(String(v)), "dd MMM yyyy", { locale: fr })}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="opened" fill="hsl(var(--primary))" name="Ouvertures" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicked" fill="hsl(var(--accent))" name="Clics" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-semibold">Top templates</h3>
            <p className="text-xs text-muted-foreground">Performance par template (volume + engagement)</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Délivrés</TableHead>
                <TableHead className="text-right">Échecs</TableHead>
                <TableHead className="text-right">Ouv.</TableHead>
                <TableHead className="text-right">Clics</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                    Chargement…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && templateStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                    Aucun envoi sur la période
                  </TableCell>
                </TableRow>
              )}
              {templateStats.slice(0, 10).map((t) => (
                <TableRow key={t.template_code}>
                  <TableCell className="font-mono text-xs">{t.template_code}</TableCell>
                  <TableCell className="text-right text-xs">{t.total}</TableCell>
                  <TableCell className="text-right text-xs text-emerald-600">{t.sent}</TableCell>
                  <TableCell className="text-right text-xs text-destructive">{t.failed}</TableCell>
                  <TableCell className="text-right text-xs">{t.open_rate}%</TableCell>
                  <TableCell className="text-right text-xs">{t.click_rate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-semibold">Providers</h3>
            <p className="text-xs text-muted-foreground">Répartition + taux d'échec</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Échec</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground">
                    Chargement…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && providerStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground">
                    —
                  </TableCell>
                </TableRow>
              )}
              {providerStats.map((p) => (
                <TableRow key={p.provider}>
                  <TableCell className="text-xs">{p.provider}</TableCell>
                  <TableCell className="text-right text-xs">{p.total}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={
                        p.failure_rate > 10
                          ? "text-destructive border-destructive/40"
                          : p.failure_rate > 2
                          ? "text-amber-600 border-amber-500/40"
                          : "text-emerald-600 border-emerald-500/40"
                      }
                    >
                      {p.failure_rate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

function KPI({
  icon: Icon,
  label,
  value,
  suffix,
  tone,
}: {
  icon: any;
  label: string;
  value: number;
  suffix: string;
  tone: "default" | "success" | "info" | "accent" | "destructive" | "warning";
}) {
  const toneCls: Record<string, string> = {
    default: "text-foreground",
    success: "text-emerald-600",
    info: "text-blue-600",
    accent: "text-violet-600",
    destructive: "text-destructive",
    warning: "text-amber-600",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
        <Icon className={`h-3.5 w-3.5 ${toneCls[tone]}`} />
      </div>
      <div className={`text-2xl font-bold mt-1.5 ${toneCls[tone]}`}>
        {value}
        <span className="text-sm font-normal ml-0.5">{suffix}</span>
      </div>
    </Card>
  );
}
