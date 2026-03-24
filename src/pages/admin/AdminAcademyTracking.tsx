import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, BookOpen, Trophy, TrendingUp, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

const statusLabels: Record<string, string> = {
  active: "En cours",
  completed: "Terminé",
  paused: "Suspendu",
};

const statusColors: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-700",
  completed: "bg-emerald-500/10 text-emerald-700",
  paused: "bg-amber-500/10 text-amber-700",
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/10 text-blue-700",
};

export default function AdminAcademyTracking() {
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

  const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p]));

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

  const enrollmentProgress = (enrollmentId: string) => {
    const ep = progress.filter((p: any) => p.enrollment_id === enrollmentId);
    const completed = ep.filter((p: any) => p.status === "completed").length;
    return { completed, total: ep.length, pct: ep.length > 0 ? Math.round((completed / ep.length) * 100) : 0 };
  };

  const stats = [
    { label: "Inscriptions", value: `${totalEnrollments}`, icon: Users, gradient: "from-blue-500 to-cyan-500" },
    { label: "Taux complétion", value: `${completionRate}%`, icon: TrendingUp, gradient: "from-emerald-500 to-teal-500" },
    { label: "Modules terminés", value: `${completedModules}`, icon: BookOpen, gradient: "from-violet-500 to-blue-500" },
    { label: "Score moyen", value: `${avgScore}`, icon: Trophy, gradient: "from-amber-500 to-orange-500" },
  ];

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Suivi des apprenants</h1>
              <p className="text-xs text-muted-foreground">{totalEnrollments} inscriptions · {completedModules} modules complétés</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(s => (
            <Card key={s.label} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", s.gradient)}>
                    <s.icon className="h-4.5 w-4.5" />
                  </div>
                  <AnimatedCounter value={s.value} label={s.label} className="text-left [&>div:first-child]:text-xl [&>div:last-child]:text-left" />
                </div>
              </CardContent>
            </Card>
          ))}
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
        </div>

        {/* Enrollment Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 backdrop-blur-sm sticky top-0">
                    <th className="text-left p-3 font-medium text-muted-foreground">Apprenant</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Parcours</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Statut</th>
                    <th className="text-left p-3 font-medium text-muted-foreground min-w-[180px]">Progression</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Inscrit le</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((e: any, idx: number) => {
                    const profile = profileMap[e.user_id];
                    const prog = enrollmentProgress(e.id);
                    return (
                      <tr key={e.id} className={cn("hover:bg-muted/50 transition-colors", idx % 2 === 1 && "bg-muted/20")}>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                              {(profile?.display_name || profile?.email || "U")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{profile?.display_name || "Utilisateur"}</p>
                              <p className="text-[10px] text-muted-foreground">{profile?.email || ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm">{(e as any).academy_paths?.name || "—"}</span>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={cn("text-[10px]", statusColors[e.status] || "")}>
                            {statusLabels[e.status] || e.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Progress value={prog.pct} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground font-medium w-10 text-right">{prog.pct}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {new Date(e.enrolled_at).toLocaleDateString("fr-FR")}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">Aucune inscription</td></tr>
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
            {paths.map(p => {
              const pathEnrollments = enrollments.filter((e: any) => e.path_id === p.id);
              const pathCompleted = pathEnrollments.filter((e: any) => e.status === "completed").length;
              const pct = pathEnrollments.length > 0 ? Math.round((pathCompleted / pathEnrollments.length) * 100) : 0;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-1/3 truncate">{p.name}</span>
                  <Progress value={pct} className="h-2.5 flex-1" />
                  <span className="text-xs text-muted-foreground font-medium w-20 text-right">{pathCompleted}/{pathEnrollments.length} ({pct}%)</span>
                </div>
              );
            })}
            {paths.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Aucun parcours publié</p>}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
