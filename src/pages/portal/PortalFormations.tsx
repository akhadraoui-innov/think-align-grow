import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  GraduationCap, BookOpen, Trophy, Clock, Flame, Target,
  TrendingUp, Calendar, ChevronRight, Star, Zap, Search,
  PlayCircle, Filter, LayoutDashboard
} from "lucide-react";

const difficultyConfig: Record<string, { label: string; color: string }> = {
  beginner: { label: "Débutant", color: "text-[hsl(var(--pillar-finance))]" },
  intermediate: { label: "Intermédiaire", color: "text-[hsl(var(--pillar-marketing))]" },
  advanced: { label: "Avancé", color: "text-[hsl(var(--pillar-innovation))]" },
};

export default function PortalFormations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance } = useCredits();
  const [search, setSearch] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);

  // ─── Enrollments ───
  const { data: enrollments = [] } = useQuery({
    queryKey: ["portal-enrollments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_enrollments")
        .select("*, academy_paths(*)")
        .eq("user_id", user!.id)
        .order("enrolled_at", { ascending: false });
      return data || [];
    },
  });

  // ─── Progress ───
  const { data: allProgress = [] } = useQuery({
    queryKey: ["portal-all-progress", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_progress")
        .select("*, academy_modules(title, module_type)")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false });
      return data || [];
    },
  });

  // ─── Module counts per path ───
  const { data: moduleCounts = {} } = useQuery({
    queryKey: ["portal-module-counts", enrollments.map((e: any) => e.path_id)],
    enabled: enrollments.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_path_modules")
        .select("path_id")
        .in("path_id", enrollments.map((e: any) => e.path_id));
      const counts: Record<string, number> = {};
      (data || []).forEach((d: any) => { counts[d.path_id] = (counts[d.path_id] || 0) + 1; });
      return counts;
    },
  });

  // ─── Catalog ───
  const { data: catalog = [], isLoading: catalogLoading } = useQuery({
    queryKey: ["portal-catalog"],
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_paths")
        .select("*, academy_functions!academy_paths_function_id_fkey(name), academy_personae!academy_paths_persona_id_fkey(name)")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: catalogModuleCounts = {} } = useQuery({
    queryKey: ["portal-catalog-mod-counts", catalog.map((c: any) => c.id)],
    enabled: catalog.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_path_modules")
        .select("path_id")
        .in("path_id", catalog.map((c: any) => c.id));
      const counts: Record<string, number> = {};
      (data || []).forEach((d: any) => { counts[d.path_id] = (counts[d.path_id] || 0) + 1; });
      return counts;
    },
  });

  // ─── Stats ───
  const completedModules = allProgress.filter((p: any) => p.status === "completed").length;
  const totalTimeSec = allProgress.reduce((s: number, p: any) => s + (p.time_spent_seconds || 0), 0);
  const totalTimeH = Math.round(totalTimeSec / 3600 * 10) / 10;
  const avgScore = allProgress.filter((p: any) => p.score != null).length > 0
    ? Math.round(allProgress.filter((p: any) => p.score != null).reduce((s: number, p: any) => s + p.score, 0) / allProgress.filter((p: any) => p.score != null).length)
    : 0;

  const activityMap = useMemo(() => {
    const map: Record<string, number> = {};
    allProgress.forEach((p: any) => {
      const date = p.completed_at || p.started_at;
      if (date) {
        const day = new Date(date).toISOString().split("T")[0];
        map[day] = (map[day] || 0) + 1;
      }
    });
    return map;
  }, [allProgress]);

  const streak = useMemo(() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (activityMap[key]) count++;
      else if (i > 0) break;
    }
    return count;
  }, [activityMap]);

  const heatmapWeeks = useMemo(() => {
    const weeks: string[][] = [];
    const today = new Date();
    for (let w = 11; w >= 0; w--) {
      const week: string[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (w * 7 + (6 - d)));
        week.push(date.toISOString().split("T")[0]);
      }
      weeks.push(week);
    }
    return weeks;
  }, []);

  const getHeatColor = (count: number) => {
    if (count === 0) return "bg-muted";
    if (count === 1) return "bg-primary/20";
    if (count === 2) return "bg-primary/40";
    if (count <= 4) return "bg-primary/60";
    return "bg-primary";
  };

  const enrolledPathIds = new Set(enrollments.map((e: any) => e.path_id));
  const activeEnrollments = enrollments.filter((e: any) => e.status === "active");
  const completedEnrollments = enrollments.filter((e: any) => e.completed_at);

  const getEnrollmentProgress = (enrollmentId: string, pathId: string) => {
    const total = (moduleCounts as Record<string, number>)[pathId] || 0;
    if (!total) return 0;
    const completed = allProgress.filter((p: any) => p.enrollment_id === enrollmentId && p.status === "completed").length;
    return Math.round((completed / total) * 100);
  };

  const filteredCatalog = catalog.filter((p: any) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterDifficulty && p.difficulty !== filterDifficulty) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-5xl space-y-8">
      {/* ─── KPIs ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: BookOpen, label: "Modules terminés", value: String(completedModules), color: "text-primary" },
          { icon: Target, label: "Score moyen", value: `${avgScore}%`, color: "text-accent" },
          { icon: Clock, label: "Temps investi", value: `${totalTimeH}h`, color: "text-muted-foreground" },
          { icon: Flame, label: "Streak", value: `${streak}j`, color: "text-[hsl(var(--pillar-business))]" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={cn("h-5 w-5 shrink-0", kpi.color)} />
                <div>
                  <p className="text-lg font-bold text-foreground leading-none">{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Activity Heatmap ─── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Activité (12 sem.)
            </h3>
            {streak > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                <Flame className="h-3 w-3 mr-1 text-[hsl(var(--pillar-business))]" /> {streak} jour{streak > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {heatmapWeeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map(day => (
                  <div
                    key={day}
                    className={cn("h-3 w-3 rounded-sm", getHeatColor(activityMap[day] || 0))}
                    title={`${day}: ${activityMap[day] || 0} activité(s)`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Moins</span>
            {[0, 1, 2, 3, 5].map(c => (
              <div key={c} className={cn("h-3 w-3 rounded-sm", getHeatColor(c))} />
            ))}
            <span>Plus</span>
          </div>
        </CardContent>
      </Card>

      {/* ─── Parcours en cours ─── */}
      {activeEnrollments.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <PlayCircle className="h-4 w-4 text-primary" /> Parcours en cours
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEnrollments.map((e: any, idx: number) => {
              const pct = getEnrollmentProgress(e.id, e.path_id);
              const diff = difficultyConfig[e.academy_paths?.difficulty] || difficultyConfig.intermediate;
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  whileHover={{ y: -3 }}
                >
                  <Card
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-all group border-primary/15"
                    onClick={() => navigate(`/portal/path/${e.path_id}`)}
                  >
                    <div className="h-1.5 bg-gradient-to-r from-primary to-primary/50" style={{ width: `${pct}%` }} />
                    <CardContent className="p-4 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-[9px]", diff.color)}>{diff.label}</Badge>
                        {pct === 100 && <Badge className="text-[9px] bg-[hsl(var(--pillar-finance))]/10 text-[hsl(var(--pillar-finance))]">Terminé</Badge>}
                      </div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {e.academy_paths?.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{e.academy_paths?.description}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="text-[10px] font-semibold text-primary">{pct}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Parcours terminés ─── */}
      {completedEnrollments.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[hsl(var(--pillar-business))]" /> Parcours terminés
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completedEnrollments.map((e: any) => (
              <Card key={e.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/portal/path/${e.path_id}`)}>>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--pillar-business))]/10 shrink-0">
                    <Trophy className="h-4 w-4 text-[hsl(var(--pillar-business))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{e.academy_paths?.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Terminé le {new Date(e.completed_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[9px]">100%</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ─── Activité récente ─── */}
      {allProgress.filter((p: any) => p.completed_at).length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Activité récente
          </h2>
          <div className="space-y-1.5">
            {allProgress
              .filter((p: any) => p.completed_at)
              .slice(0, 6)
              .map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    p.score && p.score >= 70 ? "bg-[hsl(var(--pillar-finance))]" : "bg-primary"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {(p as any).academy_modules?.title || "Module terminé"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(p.completed_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      {p.score != null && ` · Score: ${p.score}%`}
                      {p.time_spent_seconds > 0 && ` · ${Math.round(p.time_spent_seconds / 60)}min`}
                    </p>
                  </div>
                  {p.score != null && (
                    <Badge variant="secondary" className="text-[10px] font-semibold">{p.score}%</Badge>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ─── Catalogue ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Tous les parcours
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="pl-8 w-44 h-8 text-xs"
              />
            </div>
            <div className="flex gap-1">
              {(["beginner", "intermediate", "advanced"] as const).map(d => (
                <Button
                  key={d}
                  variant={filterDifficulty === d ? "default" : "outline"}
                  size="sm"
                  className="text-[10px] h-7"
                  onClick={() => setFilterDifficulty(filterDifficulty === d ? null : d)}
                >
                  {difficultyConfig[d].label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {catalogLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map((path: any, idx: number) => {
              const diff = difficultyConfig[path.difficulty] || difficultyConfig.intermediate;
              const modCount = (catalogModuleCounts as Record<string, number>)[path.id] || 0;
              const isEnrolled = enrolledPathIds.has(path.id);
              return (
                <motion.div
                  key={path.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  whileHover={{ y: -3 }}
                >
                  <Card
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-all group",
                      isEnrolled && "ring-1 ring-primary/20"
                    )}
                    onClick={() => navigate(`/portal/path/${path.id}`)}
                  >
                    <CardContent className="p-4 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-[9px]", diff.color)}>{diff.label}</Badge>
                        {isEnrolled && <Badge className="text-[9px] bg-primary/10 text-primary border-0">Inscrit</Badge>}
                      </div>
                      <p className="text-sm font-semibold group-hover:text-primary transition-colors">{path.name}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{path.description}</p>
                      {((path as any).academy_functions || (path as any).academy_personae) && (
                        <div className="flex flex-wrap gap-1">
                          {(path as any).academy_functions && <Badge variant="secondary" className="text-[9px]">{(path as any).academy_functions.name}</Badge>}
                          {(path as any).academy_personae && <Badge variant="outline" className="text-[9px]">{(path as any).academy_personae.name}</Badge>}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                        {modCount > 0 && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {modCount} modules</span>}
                        {Number(path.estimated_hours) > 0 && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {path.estimated_hours}h</span>}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
        {!catalogLoading && filteredCatalog.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun parcours trouvé</p>
          </div>
        )}
      </section>
    </div>
  );
}
