
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Users, BookOpen, Trophy, TrendingUp, Search, Filter,
  Download, Clock, ArrowLeft, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  active: "En cours", completed: "Terminé", paused: "Suspendu", not_started: "Non commencé", in_progress: "En cours",
};
const statusColors: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-700", completed: "bg-emerald-500/10 text-emerald-700",
  paused: "bg-amber-500/10 text-amber-700", not_started: "bg-muted text-muted-foreground", in_progress: "bg-blue-500/10 text-blue-700",
};

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];

export default function AdminAcademyTracking() {
  const navigate = useNavigate();
  const [filterPath, setFilterPath] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: enrollments = [] } = useQuery({
    queryKey: ["tracking-enrollments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_enrollments")
        .select("*, academy_paths(name, difficulty)")
        .order("enrolled_at", { ascending: false });
      return data || [];
    },
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["tracking-progress"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_progress").select("*").order("completed_at", { ascending: false });
      return data || [];
    },
  });

  const { data: paths = [] } = useQuery({
    queryKey: ["tracking-paths"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_paths").select("id, name").eq("status", "published");
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["tracking-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, display_name, email, avatar_url");
      return data || [];
    },
  });

  const profileMap = useMemo(() => Object.fromEntries(profiles.map(p => [p.user_id, p])), [profiles]);

  const filtered = enrollments.filter((e: any) => {
    if (filterPath !== "all" && e.path_id !== filterPath) return false;
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    if (searchTerm) {
      const profile = profileMap[e.user_id];
      const name = profile?.display_name || profile?.email || "";
      if (!name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  });

  // Stats
  const totalEnrollments = enrollments.length;
  const completedEnrollments = enrollments.filter((e: any) => e.status === "completed").length;
  const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;
  const completedModules = progress.filter((p: any) => p.status === "completed").length;
  const avgScore = (() => {
    const scored = progress.filter((p: any) => p.score != null);
    if (scored.length === 0) return 0;
    return Math.round(scored.reduce((s: number, p: any) => s + (p.score || 0), 0) / scored.length);
  })();
  const totalTime = progress.reduce((s: number, p: any) => s + (p.time_spent_seconds || 0), 0);
  const avgTimeH = totalEnrollments > 0 ? Math.round(totalTime / totalEnrollments / 3600 * 10) / 10 : 0;

  // Alerts
  const staleEnrollments = enrollments.filter((e: any) => {
    if (e.status !== "active") return false;
    const ep = progress.filter((p: any) => p.enrollment_id === e.id);
    if (ep.length === 0) return true;
    const lastActivity = ep.reduce((latest: string, p: any) => {
      const d = p.completed_at || p.started_at;
      return d && d > latest ? d : latest;
    }, "");
    if (!lastActivity) return true;
    return (Date.now() - new Date(lastActivity).getTime()) > 14 * 86400000;
  });

  // Enrollment trend (last 30 days)
  const enrollmentTrend = useMemo(() => {
    const days = 30;
    return Array.from({ length: days }, (_, i) => {
      const day = subDays(new Date(), days - 1 - i);
      const count = enrollments.filter((e: any) => isSameDay(new Date(e.enrolled_at), day)).length;
      return { date: format(day, "dd/MM"), count };
    });
  }, [enrollments]);

  // Score distribution
  const scoreDistribution = useMemo(() => {
    const buckets = [
      { range: "0-20", min: 0, max: 20, count: 0 },
      { range: "21-40", min: 21, max: 40, count: 0 },
      { range: "41-60", min: 41, max: 60, count: 0 },
      { range: "61-80", min: 61, max: 80, count: 0 },
      { range: "81-100", min: 81, max: 100, count: 0 },
    ];
    progress.filter((p: any) => p.score != null).forEach((p: any) => {
      const b = buckets.find(b => p.score >= b.min && p.score <= b.max);
      if (b) b.count++;
    });
    return buckets;
  }, [progress]);

  // Path completion pie
  const pathPieData = useMemo(() => {
    return paths.map(p => {
      const pe = enrollments.filter((e: any) => e.path_id === p.id);
      const completed = pe.filter((e: any) => e.status === "completed").length;
      return { name: p.name, value: pe.length, completed };
    }).filter(d => d.value > 0);
  }, [paths, enrollments]);

  const enrollmentProgress = (enrollmentId: string) => {
    const ep = progress.filter((p: any) => p.enrollment_id === enrollmentId);
    const completed = ep.filter((p: any) => p.status === "completed").length;
    return { completed, total: ep.length, pct: ep.length > 0 ? Math.round((completed / ep.length) * 100) : 0 };
  };

  // Export CSV
  function exportCsv() {
    const header = "Apprenant,Email,Parcours,Statut,Progression,Inscrit le\n";
    const rows = filtered.map((e: any) => {
      const p = profileMap[e.user_id];
      const prog = enrollmentProgress(e.id);
      return `"${p?.display_name || ""}","${p?.email || ""}","${e.academy_paths?.name || ""}","${e.status}","${prog.pct}%","${new Date(e.enrolled_at).toLocaleDateString("fr-FR")}"`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "tracking_export.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  }

  const stats = [
    { label: "Inscriptions", value: `${totalEnrollments}`, icon: Users, gradient: "from-blue-500 to-cyan-500" },
    { label: "Taux complétion", value: `${completionRate}%`, icon: TrendingUp, gradient: "from-emerald-500 to-teal-500" },
    { label: "Modules terminés", value: `${completedModules}`, icon: BookOpen, gradient: "from-violet-500 to-blue-500" },
    { label: "Score moyen", value: `${avgScore}`, icon: Trophy, gradient: "from-amber-500 to-orange-500" },
    { label: "Temps moyen", value: `${avgTimeH}h`, icon: Clock, gradient: "from-pink-500 to-rose-500" },
  ];

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/portal/academie")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Suivi des apprenants</h1>
              <p className="text-xs text-muted-foreground">{totalEnrollments} inscriptions · {completedModules} modules complétés</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stats.map(s => (
            <Card key={s.label} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", s.gradient)}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <AnimatedCounter value={s.value} label={s.label} className="text-left [&>div:first-child]:text-xl [&>div:last-child]:text-left" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alerts */}
        {staleEnrollments.length > 0 && (
          <Card className="border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/10">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                  {staleEnrollments.length} apprenant{staleEnrollments.length > 1 ? "s" : ""} inactif{staleEnrollments.length > 1 ? "s" : ""} depuis 14+ jours
                </p>
                <p className="text-xs text-amber-700/70 dark:text-amber-500/70 mt-0.5">
                  {staleEnrollments.slice(0, 3).map((e: any) => profileMap[e.user_id]?.display_name || profileMap[e.user_id]?.email || "Utilisateur").join(", ")}
                  {staleEnrollments.length > 3 && ` et ${staleEnrollments.length - 3} autres`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Enrollment trend */}
          <Card>
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-sm font-semibold">Inscriptions (30 jours)</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={enrollmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} name="Inscriptions" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Score distribution */}
          <Card>
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-sm font-semibold">Distribution des scores</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Apprenants" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher un apprenant…" className="pl-8 h-8 text-xs" />
          </div>
          <Select value={filterPath} onValueChange={setFilterPath}>
            <SelectTrigger className="h-8 w-[200px] text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les parcours</SelectItem>
              {paths.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="active">En cours</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="paused">Suspendu</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground">Apprenant</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Parcours</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Statut</th>
                    <th className="text-left p-3 font-medium text-muted-foreground min-w-[180px]">Progression</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Score</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Inscrit le</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((e: any, idx: number) => {
                    const profile = profileMap[e.user_id];
                    const prog = enrollmentProgress(e.id);
                    const ep = progress.filter((p: any) => p.enrollment_id === e.id);
                    const scores = ep.filter((p: any) => p.score != null);
                    const userAvgScore = scores.length > 0 ? Math.round(scores.reduce((s: number, p: any) => s + p.score, 0) / scores.length) : null;
                    const isStale = staleEnrollments.some((s: any) => s.id === e.id);

                    return (
                      <tr key={e.id} className={cn("hover:bg-muted/50 transition-colors", idx % 2 === 1 && "bg-muted/20", isStale && "bg-amber-50/30 dark:bg-amber-950/10")}>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                              {(profile?.display_name || profile?.email || "U")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm flex items-center gap-1">
                                {profile?.display_name || "Utilisateur"}
                                {isStale && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{profile?.email || ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm">{(e as any).academy_paths?.name || "—"}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={cn("text-[10px]", statusColors[e.status] || "")}>
                            {statusLabels[e.status] || e.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Progress value={prog.pct} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground font-medium w-14 text-right">{prog.completed}/{prog.total} ({prog.pct}%)</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {userAvgScore !== null ? (
                            <span className={cn("text-xs font-semibold", userAvgScore >= 80 ? "text-emerald-600" : userAvgScore >= 50 ? "text-amber-600" : "text-red-500")}>
                              {userAvgScore}%
                            </span>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {new Date(e.enrolled_at).toLocaleDateString("fr-FR")}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Aucune inscription</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Path Completion Summary */}
        <Card>
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="text-sm font-semibold">Complétion par parcours</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            {paths.map((p, i) => {
              const pathEnrollments = enrollments.filter((e: any) => e.path_id === p.id);
              const pathCompleted = pathEnrollments.filter((e: any) => e.status === "completed").length;
              const pct = pathEnrollments.length > 0 ? Math.round((pathCompleted / pathEnrollments.length) * 100) : 0;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-sm font-medium w-1/3 truncate">{p.name}</span>
                  <Progress value={pct} className="h-2.5 flex-1" />
                  <span className="text-xs text-muted-foreground font-medium w-24 text-right">{pathCompleted}/{pathEnrollments.length} ({pct}%)</span>
                </div>
              );
            })}
            {paths.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Aucun parcours publié</p>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
