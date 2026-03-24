import { PageTransition } from "@/components/ui/PageTransition";
import { GraduationCap, BookOpen, Trophy, ArrowRight, Search, Clock, Filter, PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  intermediate: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  advanced: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

export default function Academy() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);

  const { data: enrollments = [], isLoading: enrollLoading } = useQuery({
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

  // Progress for each enrollment
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
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Module counts per path
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

  return (
    <PageTransition>
      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-8">
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
                <GraduationCap className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold">Academy</h1>
                <p className="text-muted-foreground">Formations interactives, quizzes, exercices et coaching IA</p>
              </div>
            </div>
          </div>
        </div>

        {/* In Progress */}
        {user && enrollments.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              En cours
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrollments.map((e: any) => {
                const pct = getEnrollmentProgress(e.id, e.path_id);
                return (
                  <motion.div key={e.id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                    <Card
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full"
                      onClick={() => navigate(`/academy/path/${e.path_id}`)}
                    >
                      <div className="h-2 bg-gradient-to-r from-primary to-primary/60" style={{ width: `${pct}%` }} />
                      <CardContent className="p-5 space-y-3">
                        <div>
                          <p className="font-semibold text-sm">{e.academy_paths?.name || "Parcours"}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{e.academy_paths?.description}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{pct}% complété</span>
                            <span className="capitalize">{e.status}</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Catalog */}
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Catalogue des parcours
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="pl-9 w-48"
                />
              </div>
              <div className="flex gap-1">
                {["beginner", "intermediate", "advanced"].map(d => (
                  <Button
                    key={d}
                    variant={filterDifficulty === d ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setFilterDifficulty(filterDifficulty === d ? null : d)}
                  >
                    {d === "beginner" ? "Débutant" : d === "intermediate" ? "Intermédiaire" : "Avancé"}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {catalogLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCatalog.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <p className="text-sm">
                  {search || filterDifficulty ? "Aucun parcours ne correspond à vos critères." : "Aucun parcours disponible pour le moment."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCatalog.map((path: any, idx: number) => {
                const isEnrolled = enrolledPathIds.has(path.id);
                const modCount = (moduleCounts as Record<string, number>)[path.id] || 0;

                return (
                  <motion.div
                    key={path.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -2 }}
                  >
                    <Card
                      className={cn(
                        "overflow-hidden cursor-pointer hover:shadow-lg transition-all h-full",
                        isEnrolled && "ring-2 ring-primary/30",
                      )}
                      onClick={() => navigate(`/academy/path/${path.id}`)}
                    >
                      {/* Gradient header */}
                      <div className="h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 relative p-4 flex items-end">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/80 backdrop-blur">
                          <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        {isEnrolled && (
                          <Badge className="absolute top-3 right-3 text-[10px]">Inscrit</Badge>
                        )}
                      </div>
                      <CardContent className="p-5 space-y-3">
                        <div>
                          <p className="font-semibold text-sm">{path.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{path.description}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {path.difficulty && (
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-medium",
                              difficultyColors[path.difficulty] || "bg-muted text-muted-foreground"
                            )}>
                              {path.difficulty}
                            </span>
                          )}
                          {path.estimated_hours > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {String(path.estimated_hours)}h
                            </span>
                          )}
                          {modCount > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <BookOpen className="h-3 w-3" /> {modCount} modules
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
    </PageTransition>
  );
}
