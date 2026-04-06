import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Briefcase, BarChart3, Zap, Lightbulb } from "lucide-react";
import { PageTransition } from "@/components/ui/PageTransition";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line,
} from "recharts";

function StatsCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-xl font-bold text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  draft: "secondary",
  active: "default",
  completed: "outline",
};

export default function AdminUCM() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["admin-ucm-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ucm_projects")
        .select("*, organizations(name), ucm_use_cases(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: totalUCs } = useQuery({
    queryKey: ["admin-ucm-total-ucs"],
    queryFn: async () => {
      const { count, error } = await supabase.from("ucm_use_cases").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: quotaStats } = useQuery({
    queryKey: ["admin-ucm-quota-stats"],
    queryFn: async () => {
      const period = new Date().toISOString().slice(0, 7);
      const { data, error } = await supabase
        .from("ucm_quota_usage")
        .select("*")
        .eq("period", period);
      if (error) throw error;
      const totals = (data || []).reduce(
        (acc, r: any) => ({
          generations: acc.generations + (r.uc_generations || 0),
          analyses: acc.analyses + (r.analysis_generations || 0),
          tokens: acc.tokens + (r.total_tokens || 0),
        }),
        { generations: 0, analyses: 0, tokens: 0 }
      );
      return totals;
    },
  });

  // UC par org (top 5)
  const ucByOrg = (() => {
    if (!projects) return [];
    const map: Record<string, number> = {};
    projects.forEach((p: any) => {
      const name = p.organizations?.name || "Sans org";
      map[name] = (map[name] || 0) + ((p as any).ucm_use_cases?.[0]?.count || 0);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name: name.length > 12 ? name.slice(0, 12) + "…" : name, count }));
  })();

  // Monthly evolution (from quota data — simplified mock based on current month)
  const { data: monthlyData } = useQuery({
    queryKey: ["admin-ucm-monthly"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ucm_quota_usage")
        .select("period, uc_generations, analysis_generations, total_tokens")
        .order("period", { ascending: true });
      if (error) throw error;
      const byMonth: Record<string, { ucs: number; analyses: number; tokens: number }> = {};
      (data || []).forEach((r: any) => {
        if (!byMonth[r.period]) byMonth[r.period] = { ucs: 0, analyses: 0, tokens: 0 };
        byMonth[r.period].ucs += r.uc_generations || 0;
        byMonth[r.period].analyses += r.analysis_generations || 0;
        byMonth[r.period].tokens += r.total_tokens || 0;
      });
      return Object.entries(byMonth)
        .slice(-6)
        .map(([period, v]) => ({ period, ...v }));
    },
  });

  return (
    <AdminShell>
      <PageTransition>
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold font-display">AI Value Builder</h1>
            <p className="text-sm text-muted-foreground">Tableau de bord UCM — vue d'ensemble et métriques</p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard icon={Briefcase} label="Projets UCM" value={projects?.length || 0} color="bg-primary/10 text-primary" />
            <StatsCard icon={Lightbulb} label="Use Cases générés" value={totalUCs || 0} color="bg-accent/10 text-accent" />
            <StatsCard icon={BarChart3} label="Analyses ce mois" value={quotaStats?.analyses || 0} color="bg-violet-500/10 text-violet-500" />
            <StatsCard icon={Zap} label="Tokens consommés" value={(quotaStats?.tokens || 0).toLocaleString()} color="bg-emerald-500/10 text-emerald-500" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-xl border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">UC par organisation</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                {ucByOrg.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ucByOrg}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Aucune donnée</div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Évolution mensuelle</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                {(monthlyData?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="ucs" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Use Cases" />
                      <Line type="monotone" dataKey="analyses" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Analyses" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Aucune donnée</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Projects Table */}
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Card className="rounded-xl border-border/50">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Tous les projets</CardTitle>
              </CardHeader>
              <CardContent>
                {(!projects || projects.length === 0) ? (
                  <p className="text-center text-muted-foreground py-8">Aucun projet UCM</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entreprise</TableHead>
                        <TableHead>Organisation</TableHead>
                        <TableHead>Secteur</TableHead>
                        <TableHead className="text-center">UC</TableHead>
                        <TableHead className="text-center">Statut</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.company}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{(p as any).organizations?.name || "—"}</TableCell>
                          <TableCell className="text-sm">{p.sector_label || "—"}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs font-mono">{(p as any).ucm_use_cases?.[0]?.count || 0}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={(STATUS_COLORS[p.status] as any) || "secondary"} className="text-xs">
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(p.created_at), "dd MMM yyyy", { locale: fr })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </PageTransition>
    </AdminShell>
  );
}
