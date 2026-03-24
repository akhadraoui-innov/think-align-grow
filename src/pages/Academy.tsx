import { PageTransition } from "@/components/ui/PageTransition";
import { GraduationCap, BookOpen, Trophy, ArrowRight, Search, Clock, Filter, PlayCircle, Sparkles, TrendingUp, Users, Star, ChevronRight, LayoutDashboard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const difficultyConfig: Record<string, { label: string; color: string; gradient: string }> = {
  beginner: { label: "Débutant", color: "text-emerald-600", gradient: "from-emerald-500/20 to-teal-500/10" },
  intermediate: { label: "Intermédiaire", color: "text-blue-600", gradient: "from-blue-500/20 to-indigo-500/10" },
  advanced: { label: "Avancé", color: "text-purple-600", gradient: "from-purple-500/20 to-pink-500/10" },
};

export default function Academy() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);

  const { data: enrollments = [] } = useQuery({
    queryKey: ["academy-enrollments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_enrollments")
        .select("*, academy_paths(*)")
        .eq("user_id", user!.id)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: progressData = [] } = useQuery({
    queryKey: ["academy-all-progress", user?.id],
    enabled: !!user && enrollments.length > 0,
    queryFn: async () => {
      const enrollmentIds = enrollments.map((e: any) => e.id);
      const { data } = await supabase
        .from("academy_progress")
        .select("enrollment_id, status")
        .in("enrollment_id", enrollmentIds);
      return data || [];
    },
  });

  const { data: catalog = [], isLoading: catalogLoading } = useQuery({
    queryKey: ["academy-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_paths")
        .select("*, academy_functions!academy_paths_function_id_fkey(name, department), academy_personae!academy_paths_persona_id_fkey(name)")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: moduleCounts = {} } = useQuery({
    queryKey: ["academy-module-counts", catalog.map((c: any) => c.id)],
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

  const { data: enrollmentCounts = {} } = useQuery({
    queryKey: ["academy-enrollment-counts", catalog.map((c: any) => c.id)],
    enabled: catalog.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_enrollments")
        .select("path_id")
        .in("path_id", catalog.map((c: any) => c.id));
      const counts: Record<string, number> = {};
      (data || []).forEach((d: any) => { counts[d.path_id] = (counts[d.path_id] || 0) + 1; });
      return counts;
    },
  });

  const enrolledPathIds = new Set(enrollments.map((e: any) => e.path_id));

  const filteredCatalog = catalog.filter((p: any) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterDifficulty && p.difficulty !== filterDifficulty) return false;
    return true;
  });

  const getEnrollmentProgress = (enrollmentId: string, pathId: string) => {
    const total = (moduleCounts as Record<string, number>)[pathId] || 0;
    if (!total) return 0;
    const completed = progressData.filter((p: any) => p.enrollment_id === enrollmentId && p.status === "completed").length;
    return Math.round((completed / total) * 100);
  };

  // Stats
  const totalHours = catalog.reduce((s: number, p: any) => s + (Number(p.estimated_hours) || 0), 0);
  const activeEnrollments = enrollments.filter((e: any) => e.status === "active").length;
  const completedEnrollments = enrollments.filter((e: any) => e.status === "completed").length;

  // Featured paths (most enrolled)
  const featured = [...catalog].sort((a: any, b: any) => ((enrollmentCounts as any)[b.id] || 0) - ((enrollmentCounts as any)[a.id] || 0)).slice(0, 3);

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* ═══ HERO ═══ */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/8 via-primary/4 to-accent/5">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "32px 32px" }} />
          <div className="container max-w-6xl mx-auto px-4 py-12 relative z-10">
            <div className="flex items-start gap-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/70 shadow-xl shadow-primary/20 shrink-0"
              >
                <GraduationCap className="h-10 w-10 text-primary-foreground" />
              </motion.div>
              <div className="space-y-3">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-display font-bold tracking-tight"
                >
                  Academy
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg text-muted-foreground max-w-xl"
                >
                  Formations IA adaptatives avec contenu interactif, quiz gamifiés, exercices évalués par IA et coaching conversationnel.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-4 text-sm"
                >
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <strong className="text-foreground">{catalog.length}</strong> parcours
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    <strong className="text-foreground">{totalHours}h</strong> de formation
                  </span>
                  {user && activeEnrollments > 0 && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <strong className="text-foreground">{activeEnrollments}</strong> en cours
                    </span>
                  )}
                  {user && completedEnrollments > 0 && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Trophy className="h-4 w-4 text-primary" />
                      <strong className="text-foreground">{completedEnrollments}</strong> terminé{completedEnrollments > 1 ? "s" : ""}
                    </span>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-6xl mx-auto px-4 py-8 space-y-10">
          {/* ═══ EN COURS ═══ */}
          {user && enrollments.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  Vos parcours en cours
                </h2>
                <Button variant="outline" size="sm" onClick={() => navigate("/academy/dashboard")} className="gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5" /> Mon tableau de bord
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrollments.slice(0, 6).map((e: any, idx: number) => {
                  const pct = getEnrollmentProgress(e.id, e.path_id);
                  const diff = difficultyConfig[e.academy_paths?.difficulty] || difficultyConfig.intermediate;
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ y: -4 }}
                    >
                      <Card
                        className="overflow-hidden cursor-pointer hover:shadow-xl transition-all h-full group border-primary/20"
                        onClick={() => navigate(`/academy/path/${e.path_id}`)}
                      >
                        <div className={`h-2 bg-gradient-to-r from-primary to-primary/60 transition-all`} style={{ width: `${pct}%` }} />
                        <CardContent className="p-5 space-y-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={cn("text-[10px]", diff.color)}>{diff.label}</Badge>
                              {pct === 100 && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/20">Terminé</Badge>}
                            </div>
                            <p className="font-semibold text-sm group-hover:text-primary transition-colors">{e.academy_paths?.name || "Parcours"}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{e.academy_paths?.description}</p>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="font-medium">{pct}%</span>
                              <span className="flex items-center gap-1">
                                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" /> Continuer
                              </span>
                            </div>
                            <Progress value={pct} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* ═══ FEATURED ═══ */}
          {featured.length > 0 && !search && !filterDifficulty && (
            <section className="space-y-4">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Parcours recommandés
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featured.map((path: any, idx: number) => {
                  const diff = difficultyConfig[path.difficulty] || difficultyConfig.intermediate;
                  const modCount = (moduleCounts as Record<string, number>)[path.id] || 0;
                  const enrollCount = (enrollmentCounts as Record<string, number>)[path.id] || 0;
                  const isEnrolled = enrolledPathIds.has(path.id);

                  return (
                    <motion.div
                      key={path.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ y: -4 }}
                    >
                      <Card
                        className={cn(
                          "overflow-hidden cursor-pointer hover:shadow-xl transition-all h-full group",
                          isEnrolled && "ring-2 ring-primary/20",
                        )}
                        onClick={() => navigate(`/academy/path/${path.id}`)}
                      >
                        <div className={`h-28 bg-gradient-to-br ${diff.gradient} relative p-5 flex flex-col justify-end`}>
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            {isEnrolled && <Badge className="text-[10px]">Inscrit</Badge>}
                            <Badge variant="outline" className={cn("text-[10px] bg-background/80 backdrop-blur", diff.color)}>{diff.label}</Badge>
                          </div>
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background/80 backdrop-blur shadow-sm">
                            <GraduationCap className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <CardContent className="p-5 space-y-3">
                          <div>
                            <p className="font-semibold group-hover:text-primary transition-colors">{path.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">{path.description}</p>
                          </div>
                          {/* Targets */}
                          {((path as any).academy_functions || (path as any).academy_personae) && (
                            <div className="flex flex-wrap gap-1">
                              {(path as any).academy_functions && (
                                <Badge variant="secondary" className="text-[10px]">{(path as any).academy_functions.name}</Badge>
                              )}
                              {(path as any).academy_personae && (
                                <Badge variant="outline" className="text-[10px]">{(path as any).academy_personae.name}</Badge>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t">
                            {modCount > 0 && (
                              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {modCount} modules</span>
                            )}
                            {Number(path.estimated_hours) > 0 && (
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {String(path.estimated_hours)}h</span>
                            )}
                            {enrollCount > 0 && (
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {enrollCount} inscrits</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ═══ CATALOGUE ═══ */}
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Tous les parcours
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher un parcours..."
                    className="pl-9 w-56 h-9"
                  />
                </div>
                <div className="flex gap-1">
                  {(["beginner", "intermediate", "advanced"] as const).map(d => (
                    <Button
                      key={d}
                      variant={filterDifficulty === d ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-8"
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
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-24 bg-muted" />
                    <CardContent className="p-5">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredCatalog.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center text-muted-foreground">
                  <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">
                    {search || filterDifficulty ? "Aucun parcours ne correspond à vos critères." : "Aucun parcours disponible pour le moment."}
                  </p>
                  <p className="text-xs mt-1">Revenez bientôt, de nouvelles formations sont en préparation.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCatalog.map((path: any, idx: number) => {
                  const isEnrolled = enrolledPathIds.has(path.id);
                  const modCount = (moduleCounts as Record<string, number>)[path.id] || 0;
                  const enrollCount = (enrollmentCounts as Record<string, number>)[path.id] || 0;
                  const diff = difficultyConfig[path.difficulty] || difficultyConfig.intermediate;

                  return (
                    <motion.div
                      key={path.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      whileHover={{ y: -3 }}
                    >
                      <Card
                        className={cn(
                          "overflow-hidden cursor-pointer hover:shadow-lg transition-all h-full group",
                          isEnrolled && "ring-2 ring-primary/20",
                        )}
                        onClick={() => navigate(`/academy/path/${path.id}`)}
                      >
                        <div className={`h-20 bg-gradient-to-br ${diff.gradient} relative p-4 flex items-end`}>
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/80 backdrop-blur">
                            <GraduationCap className="h-5 w-5 text-primary" />
                          </div>
                          <div className="absolute top-3 right-3 flex items-center gap-1">
                            {isEnrolled && <Badge className="text-[10px]">Inscrit</Badge>}
                          </div>
                        </div>
                        <CardContent className="p-4 space-y-2.5">
                          <div>
                            <p className="font-semibold text-sm group-hover:text-primary transition-colors">{path.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{path.description}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={cn("text-[10px]", diff.color)}>{diff.label}</Badge>
                            {Number(path.estimated_hours) > 0 && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {String(path.estimated_hours)}h
                              </span>
                            )}
                            {modCount > 0 && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <BookOpen className="h-3 w-3" /> {modCount} modules
                              </span>
                            )}
                            {enrollCount > 0 && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" /> {enrollCount}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
