import { AdminShell } from "@/components/admin/AdminShell";
import { useObservability, ObsFilters } from "@/hooks/useObservability";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Activity, Users, Building2, Zap, Download, CalendarIcon,
  GitCommitHorizontal, Filter, X,
} from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ChevronRight, Search, Package } from "lucide-react";

const ASSET_TYPE_LABELS: Record<string, string> = {
  path: "Parcours",
  quiz: "Quiz",
  exercise: "Exercice",
  practice: "Pratique",
  persona: "Persona",
  campaign: "Campagne",
};

const ASSET_TYPE_COLORS: Record<string, string> = {
  path: "hsl(var(--primary))",
  quiz: "hsl(262, 80%, 55%)",
  exercise: "hsl(174, 70%, 42%)",
  practice: "hsl(32, 90%, 55%)",
  persona: "hsl(340, 75%, 55%)",
  campaign: "hsl(210, 80%, 55%)",
};

const ACTION_LABELS: Record<string, string> = {
  updated: "a modifié",
  created: "a créé",
  deleted: "a supprimé",
};

export default function AdminObservability() {
  const {
    filters, setFilters, kpis, chartData, timeline, coverageMatrix,
    profileMap, orgMap, orgs, isLoading, exportCsv, ASSET_TYPES,
  } = useObservability();

  const [matrixFilter, setMatrixFilter] = useState<{ orgId: string; assetType: string } | null>(null);

  const filteredTimeline = matrixFilter
    ? timeline.filter(
        (item) => item.orgId === matrixFilter.orgId && item.assetType === matrixFilter.assetType
      )
    : timeline;

  const updateFilter = (patch: Partial<ObsFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const maxMatrixValue = Math.max(
    1,
    ...coverageMatrix.flatMap((row) =>
      ASSET_TYPES.map((t) => (row as any)[t] || 0)
    )
  );

  return (
    <AdminShell>
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Observabilité</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Cycle de vie des contenus pédagogiques à travers les organisations
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Global Filters */}
        <Card className="border-dashed">
          <CardContent className="py-3 px-4">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

              {/* Org filter */}
              <Select
                value={filters.orgIds[0] || "all"}
                onValueChange={(v) => updateFilter({ orgIds: v === "all" ? [] : [v] })}
              >
                <SelectTrigger className="w-[200px] h-8 text-xs">
                  <SelectValue placeholder="Organisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les organisations</SelectItem>
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Asset type filter */}
              <Select
                value={filters.assetTypes[0] || "all"}
                onValueChange={(v) => updateFilter({ assetTypes: v === "all" ? [] : [v] })}
              >
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Type d'asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {format(filters.dateRange.from, "dd/MM")} — {format(filters.dateRange.to, "dd/MM")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        updateFilter({ dateRange: { from: range.from, to: range.to } });
                      }
                    }}
                    className="p-3 pointer-events-auto"
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              {matrixFilter && (
                <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setMatrixFilter(null)}>
                  {orgMap.get(matrixFilter.orgId)?.name} × {ASSET_TYPE_LABELS[matrixFilter.assetType]}
                  <X className="h-3 w-3" />
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Versions totales", value: kpis.totalVersions, icon: GitCommitHorizontal, color: "text-primary" },
            { label: "Contributeurs actifs", value: kpis.activeContributors, icon: Users, color: "text-emerald-500" },
            { label: "Organisations actives", value: kpis.activeOrgs, icon: Building2, color: "text-violet-500" },
            { label: "Modif. aujourd'hui", value: kpis.todayVersions, icon: Zap, color: "text-amber-500" },
          ].map((kpi) => (
            <Card key={kpi.label} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                    <div className="text-3xl font-bold mt-1 tracking-tight">
                      {isLoading ? <Skeleton className="h-9 w-16" /> : <AnimatedCounter value={String(kpi.value)} label={kpi.label} />}
                    </div>
                  </div>
                  <div className={cn("p-2.5 rounded-xl bg-muted/50", kpi.color)}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart + Timeline row */}
        <div className="grid lg:grid-cols-5 gap-4">
          {/* Area Chart */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Activité sur 28 jours
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    {ASSET_TYPES.map((type) => (
                      <Area
                        key={type}
                        type="monotone"
                        dataKey={type}
                        stackId="1"
                        stroke={ASSET_TYPE_COLORS[type]}
                        fill={ASSET_TYPE_COLORS[type]}
                        fillOpacity={0.3}
                        name={ASSET_TYPE_LABELS[type]}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              )}
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-3 justify-center">
                {ASSET_TYPES.map((type) => (
                  <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ASSET_TYPE_COLORS[type] }} />
                    {ASSET_TYPE_LABELS[type]}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Fil d'activité</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[340px]">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-3 w-3/4" />
                          <Skeleton className="h-2.5 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredTimeline.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">Aucune activité</div>
                ) : (
                  <div className="relative px-4 py-2">
                    <div className="absolute left-[31px] top-0 bottom-0 w-px bg-border" />
                    {filteredTimeline.map((item) => {
                      const profile = item.userId ? profileMap.get(item.userId) : null;
                      const org = item.orgId ? orgMap.get(item.orgId) : null;
                      const initials = (profile?.display_name || profile?.email || "?")
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <div key={item.id} className="relative flex gap-3 py-2.5 group">
                          <Avatar className="h-7 w-7 shrink-0 z-10 border-2 border-background">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px] bg-muted">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs leading-snug">
                              <span className="font-semibold text-foreground">
                                {profile?.display_name || profile?.email || "Système"}
                              </span>{" "}
                              <span className="text-muted-foreground">
                                {ACTION_LABELS[item.action] || item.action}
                              </span>{" "}
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal" style={{
                                borderColor: ASSET_TYPE_COLORS[item.assetType],
                                color: ASSET_TYPE_COLORS[item.assetType],
                              }}>
                                {ASSET_TYPE_LABELS[item.assetType] || item.assetType}
                              </Badge>
                            </p>
                            {item.summary && item.summary !== "modification" && (
                              <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                                {item.summary}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-0.5">
                              {org && (
                                <span className="text-[10px] text-muted-foreground font-medium">{org.name}</span>
                              )}
                              <span className="text-[10px] text-muted-foreground/50">
                                {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true, locale: fr })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Coverage Matrix */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Matrice de couverture Organisation × Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : coverageMatrix.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune donnée cross-org disponible
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left font-semibold p-2 text-muted-foreground">Organisation</th>
                      {ASSET_TYPES.map((t) => (
                        <th key={t} className="text-center font-semibold p-2 text-muted-foreground">
                          {ASSET_TYPE_LABELS[t]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {coverageMatrix.map((row) => (
                      <tr key={row.orgId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-2 font-medium text-foreground">{row.orgName}</td>
                        {ASSET_TYPES.map((t) => {
                          const val = (row as any)[t] || 0;
                          const opacity = val === 0 ? 0 : Math.max(0.1, Math.min(0.8, val / maxMatrixValue));
                          const isActive =
                            matrixFilter?.orgId === row.orgId && matrixFilter?.assetType === t;

                          return (
                            <td
                              key={t}
                              className={cn(
                                "text-center p-2 cursor-pointer transition-all rounded",
                                isActive && "ring-2 ring-primary ring-offset-1"
                              )}
                              style={{
                                backgroundColor: val > 0 ? `hsl(var(--primary) / ${opacity})` : undefined,
                              }}
                              onClick={() =>
                                setMatrixFilter(
                                  isActive ? null : { orgId: row.orgId, assetType: t }
                                )
                              }
                            >
                              <span className={cn("font-bold", val > 0 ? "text-foreground" : "text-muted-foreground/40")}>
                                {val}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
