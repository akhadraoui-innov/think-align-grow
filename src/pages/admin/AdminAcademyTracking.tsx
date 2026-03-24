import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, BookOpen, Trophy, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

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
      const { data } = await supabase
        .from("academy_progress")
        .select("*")
        .order("completed_at", { ascending: false });
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
      const { data } = await supabase.from("profiles").select("user_id, display_name, email");
      return data || [];
    },
  });

  const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p]));

  const filtered = filterPath === "all" ? enrollments : enrollments.filter((e: any) => e.path_id === filterPath);

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

  // Progress per enrollment
  const enrollmentProgress = (enrollmentId: string) => {
    const ep = progress.filter((p: any) => p.enrollment_id === enrollmentId);
    const completed = ep.filter((p: any) => p.status === "completed").length;
    return { completed, total: ep.length, pct: ep.length > 0 ? Math.round((completed / ep.length) * 100) : 0 };
  };

  const stats = [
    { label: "Inscriptions", value: totalEnrollments, icon: Users, color: "text-blue-600" },
    { label: "Taux complétion", value: `${completionRate}%`, icon: TrendingUp, color: "text-emerald-600" },
    { label: "Modules complétés", value: completedModules, icon: BookOpen, color: "text-primary" },
    { label: "Score moyen", value: `${avgScore}/100`, icon: Trophy, color: "text-amber-600" },
  ];

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-display font-bold">Suivi des apprenants</h1>
          </div>
          <Select value={filterPath} onValueChange={setFilterPath}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filtrer par parcours" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les parcours</SelectItem>
              {paths.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={cn("h-5 w-5", s.color)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enrollment Table */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Inscriptions ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Apprenant</th>
                    <th className="pb-2 font-medium text-muted-foreground">Parcours</th>
                    <th className="pb-2 font-medium text-muted-foreground">Statut</th>
                    <th className="pb-2 font-medium text-muted-foreground">Progression</th>
                    <th className="pb-2 font-medium text-muted-foreground">Inscrit le</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((e: any) => {
                    const profile = profileMap[e.user_id];
                    const prog = enrollmentProgress(e.id);
                    return (
                      <tr key={e.id} className="hover:bg-muted/50">
                        <td className="py-2.5">
                          <p className="font-medium">{profile?.display_name || "Utilisateur"}</p>
                          <p className="text-xs text-muted-foreground">{profile?.email || ""}</p>
                        </td>
                        <td className="py-2.5">
                          <span className="text-sm">{(e as any).academy_paths?.name || "—"}</span>
                        </td>
                        <td className="py-2.5">
                          <Badge variant="outline" className={cn("text-[10px]", statusColors[e.status] || "")}>
                            {statusLabels[e.status] || e.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <Progress value={prog.pct} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-10 text-right">{prog.pct}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground">
                          {new Date(e.enrolled_at).toLocaleDateString("fr-FR")}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">Aucune inscription</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Path Completion Summary */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Complétion par parcours</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {paths.map(p => {
              const pathEnrollments = enrollments.filter((e: any) => e.path_id === p.id);
              const pathCompleted = pathEnrollments.filter((e: any) => e.status === "completed").length;
              const pct = pathEnrollments.length > 0 ? Math.round((pathCompleted / pathEnrollments.length) * 100) : 0;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-1/3 truncate">{p.name}</span>
                  <Progress value={pct} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground w-16 text-right">{pathCompleted}/{pathEnrollments.length}</span>
                </div>
              );
            })}
            {paths.length === 0 && <p className="text-xs text-muted-foreground">Aucun parcours publié</p>}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
