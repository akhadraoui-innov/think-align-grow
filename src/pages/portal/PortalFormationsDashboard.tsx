// Portal version of AcademyDashboard — reuses same data hooks, portal navigation
import { PageTransition } from "@/components/ui/PageTransition";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowLeft, BookOpen, Trophy, Clock, Flame, Target, TrendingUp, Calendar, ChevronRight, Star, GraduationCap, Zap } from "lucide-react";
import { useMemo } from "react";

export default function PortalFormationsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: enrollments = [] } = useQuery({
    queryKey: ["dashboard-enrollments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("academy_enrollments").select("*, academy_paths(*)").eq("user_id", user!.id).order("enrolled_at", { ascending: false });
      return data || [];
    },
  });

  const { data: allProgress = [] } = useQuery({
    queryKey: ["dashboard-all-progress", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("academy_progress").select("*, academy_modules(title, module_type)").eq("user_id", user!.id).order("completed_at", { ascending: false });
      return data || [];
    },
  });

  const { data: moduleCounts = {} } = useQuery({
    queryKey: ["dashboard-module-counts", enrollments.map((e: any) => e.path_id)],
    enabled: enrollments.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("academy_path_modules").select("path_id").in("path_id", enrollments.map((e: any) => e.path_id));
      const counts: Record<string, number> = {};
      (data || []).forEach((d: any) => { counts[d.path_id] = (counts[d.path_id] || 0) + 1; });
      return counts;
    },
  });

  const { data: assignedPractices = [] } = useQuery({
    queryKey: ["dashboard-assigned-practices", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("practice_user_assignments")
        .select("id, due_date, practice_id, academy_practices(id, title, scenario, difficulty)")
        .eq("user_id", user!.id)
        .order("due_date", { ascending: true, nullsFirst: false });
      return (data || []).filter((a: any) => a.academy_practices);
    },
  });

  const completedModules = allProgress.filter((p: any) => p.status === "completed").length;
  const totalTimeSeconds = allProgress.reduce((s: number, p: any) => s + (p.time_spent_seconds || 0), 0);
  const totalTimeHours = Math.round(totalTimeSeconds / 3600 * 10) / 10;
  const avgScore = allProgress.filter((p: any) => p.score != null).length > 0
    ? Math.round(allProgress.filter((p: any) => p.score != null).reduce((s: number, p: any) => s + p.score, 0) / allProgress.filter((p: any) => p.score != null).length) : 0;
  const activeEnrollments = enrollments.filter((e: any) => e.status === "active");
  const completedEnrollments = enrollments.filter((e: any) => e.completed_at);

  const activityMap = useMemo(() => {
    const map: Record<string, number> = {};
    allProgress.forEach((p: any) => { const d = p.completed_at || p.started_at; if (d) { const day = new Date(d).toISOString().split("T")[0]; map[day] = (map[day] || 0) + 1; } });
    return map;
  }, [allProgress]);

  const heatmapWeeks = useMemo(() => {
    const weeks: string[][] = []; const today = new Date();
    for (let w = 11; w >= 0; w--) { const week: string[] = []; for (let d = 0; d < 7; d++) { const date = new Date(today); date.setDate(date.getDate() - (w * 7 + (6 - d))); week.push(date.toISOString().split("T")[0]); } weeks.push(week); }
    return weeks;
  }, []);

  const streak = useMemo(() => {
    let count = 0; const today = new Date();
    for (let i = 0; i < 365; i++) { const d = new Date(today); d.setDate(d.getDate() - i); const key = d.toISOString().split("T")[0]; if (activityMap[key]) count++; else if (i > 0) break; }
    return count;
  }, [activityMap]);

  const getEnrollmentProgress = (enrollmentId: string, pathId: string) => {
    const total = (moduleCounts as Record<string, number>)[pathId] || 0;
    if (!total) return 0;
    const completed = allProgress.filter((p: any) => p.enrollment_id === enrollmentId && p.status === "completed").length;
    return Math.round((completed / total) * 100);
  };

  const getHeatColor = (count: number) => {
    if (count === 0) return "bg-muted"; if (count === 1) return "bg-primary/20"; if (count === 2) return "bg-primary/40"; if (count <= 4) return "bg-primary/60"; return "bg-primary";
  };

  return (
    <PageTransition>
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/portal")}><ArrowLeft className="h-4 w-4 mr-2" /> Formations</Button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
          <h1 className="text-3xl font-display font-bold tracking-tight">Mon tableau de bord</h1>
          <p className="text-muted-foreground">Suivez votre progression et vos performances</p>
        </motion.div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: BookOpen, label: "Modules terminés", value: completedModules, color: "text-primary" },
            { icon: Clock, label: "Heures de formation", value: `${totalTimeHours}h`, color: "text-blue-500" },
            { icon: Target, label: "Score moyen", value: `${avgScore}%`, color: "text-emerald-500" },
            { icon: Flame, label: "Jours consécutifs", value: streak, color: "text-amber-500" },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card><CardContent className="p-5"><kpi.icon className={cn("h-5 w-5 mb-2", kpi.color)} /><p className="text-2xl font-bold">{kpi.value}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{kpi.label}</p></CardContent></Card>
            </motion.div>
          ))}
        </div>

        {/* Activity heatmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card><CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> Activité (12 semaines)</h3>
              {streak > 0 && <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20"><Flame className="h-3 w-3 mr-1" /> {streak} jour{streak > 1 ? "s" : ""}</Badge>}
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {heatmapWeeks.map((week, wi) => (<div key={wi} className="flex flex-col gap-1">{week.map(day => { const count = activityMap[day] || 0; return <div key={day} className={cn("h-3 w-3 rounded-sm transition-colors", getHeatColor(count))} title={`${day}: ${count}`} />; })}</div>))}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><span>Moins</span>{[0,1,2,3,5].map(c => <div key={c} className={cn("h-3 w-3 rounded-sm", getHeatColor(c))} />)}<span>Plus</span></div>
          </CardContent></Card>
        </motion.div>

        {/* Active paths */}
        {activeEnrollments.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-display font-bold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Parcours en cours</h2>
            <div className="space-y-3">
              {activeEnrollments.map((e: any, idx: number) => {
                const pct = getEnrollmentProgress(e.id, e.path_id);
                return (
                  <motion.div key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                    <Card className="cursor-pointer hover:shadow-md transition-all group" onClick={() => navigate(`/portal/path/${e.path_id}`)}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0"><GraduationCap className="h-6 w-6 text-primary" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm group-hover:text-primary transition-colors">{e.academy_paths?.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{e.academy_paths?.description}</p>
                          <div className="flex items-center gap-3 mt-2"><Progress value={pct} className="h-2 flex-1" /><span className="text-xs font-medium text-muted-foreground">{pct}%</span></div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Completed paths */}
        {completedEnrollments.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-display font-bold flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /> Parcours terminés</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {completedEnrollments.map((e: any) => (
                <Card key={e.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/portal/path/${e.path_id}`)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 shrink-0"><Trophy className="h-5 w-5 text-amber-500" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{e.academy_paths?.name}</p>
                      <p className="text-[10px] text-muted-foreground">Terminé le {new Date(e.completed_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600">100%</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Recent activity */}
        {allProgress.filter((p: any) => p.completed_at).length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-display font-bold flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Activité récente</h2>
            <div className="space-y-2">
              {allProgress.filter((p: any) => p.completed_at).slice(0, 8).map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border">
                  <div className={cn("h-2 w-2 rounded-full shrink-0", p.score && p.score >= 70 ? "bg-emerald-500" : "bg-primary")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{(p as any).academy_modules?.title || "Module terminé"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(p.completed_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      {p.score != null && ` · Score: ${p.score}%`}
                      {p.time_spent_seconds > 0 && ` · ${Math.round(p.time_spent_seconds / 60)}min`}
                    </p>
                  </div>
                  {p.score != null && <Badge variant="outline" className="text-[10px]"><Star className="h-2.5 w-2.5 mr-1" /> {p.score}%</Badge>}
                </div>
              ))}
            </div>
          </section>
        )}

        {enrollments.length === 0 && (
          <Card className="border-dashed"><CardContent className="p-12 text-center space-y-3">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Aucun parcours en cours</p>
            <Button onClick={() => navigate("/portal")}>Découvrir les parcours</Button>
          </CardContent></Card>
        )}
      </div>
    </PageTransition>
  );
}
