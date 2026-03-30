// Portal wrapper for AcademyPath — same logic, portal navigation
import { useParams, useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/ui/PageTransition";
import { ArrowLeft, BookOpen, Clock, GraduationCap, HelpCircle, FileText, MessageSquare, Lock, CheckCircle2, PlayCircle, Target, Users, Award, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

const moduleTypeIcons: Record<string, any> = { lesson: BookOpen, quiz: HelpCircle, exercise: FileText, practice: MessageSquare };
const moduleTypeLabels: Record<string, string> = { lesson: "Leçon", quiz: "Quiz", exercise: "Exercice", practice: "Pratique IA" };

export default function PortalFormationsPath() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [expandedObjectives, setExpandedObjectives] = useState(false);

  const { data: path, isLoading } = useQuery({
    queryKey: ["academy-path", id], enabled: !!id,
    queryFn: async () => { const { data, error } = await supabase.from("academy_paths").select("*, academy_functions!academy_paths_function_id_fkey(name), academy_personae!academy_paths_persona_id_fkey(name)").eq("id", id!).single(); if (error) throw error; return data; },
  });
  const { data: modules = [] } = useQuery({
    queryKey: ["academy-path-modules", id], enabled: !!id,
    queryFn: async () => { const { data } = await supabase.from("academy_path_modules").select("*, academy_modules(*)").eq("path_id", id!).order("sort_order"); return data || []; },
  });
  const { data: enrollment } = useQuery({
    queryKey: ["academy-enrollment", id, user?.id], enabled: !!id && !!user,
    queryFn: async () => { const { data } = await supabase.from("academy_enrollments").select("*").eq("path_id", id!).eq("user_id", user!.id).maybeSingle(); return data; },
  });
  const { data: progressList = [] } = useQuery({
    queryKey: ["academy-progress", enrollment?.id], enabled: !!enrollment,
    queryFn: async () => { const { data } = await supabase.from("academy_progress").select("*").eq("enrollment_id", enrollment!.id); return data || []; },
  });
  const { data: enrollmentCount = 0 } = useQuery({
    queryKey: ["academy-path-enrollment-count", id], enabled: !!id,
    queryFn: async () => { const { count } = await supabase.from("academy_enrollments").select("id", { count: "exact", head: true }).eq("path_id", id!); return count || 0; },
  });

  const enrollMutation = useMutation({
    mutationFn: async () => { if (!user || !id) throw new Error("Missing data"); const { error } = await supabase.from("academy_enrollments").insert({ path_id: id, user_id: user.id, status: "active" }); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["academy-enrollment"] }); qc.invalidateQueries({ queryKey: ["academy-enrollments"] }); toast.success("Vous êtes inscrit !"); },
    onError: () => toast.error("Erreur lors de l'inscription"),
  });

  const progressMap = new Map(progressList.map((p: any) => [p.module_id, p]));
  const completedCount = progressList.filter((p: any) => p.status === "completed").length;
  const totalModules = modules.length;
  const progressPct = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
  const allObjectives = modules.reduce((acc: string[], pm: any) => [...acc, ...((pm.academy_modules?.objectives as string[]) || [])], []);
  const uniqueObjectives = [...new Set(allObjectives)].slice(0, 8);
  const totalMinutes = modules.reduce((s: number, pm: any) => s + (pm.academy_modules?.estimated_minutes || 0), 0);
  const totalHoursCalc = Math.round(totalMinutes / 60 * 10) / 10;
  const firstIncomplete = modules.find((pm: any) => { const p = progressMap.get(pm.module_id) as any; return !p || p.status !== "completed"; });

  if (isLoading) return <PageTransition><div className="container max-w-4xl mx-auto px-4 py-8"><div className="animate-pulse space-y-4"><div className="h-6 bg-muted rounded w-1/3" /><div className="h-48 bg-muted rounded" /></div></div></PageTransition>;
  if (!path) return <PageTransition><div className="container max-w-4xl mx-auto px-4 py-8 text-center"><p className="text-muted-foreground">Parcours introuvable.</p><Button variant="ghost" className="mt-4" onClick={() => navigate("/portal")}><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Button></div></PageTransition>;

  return (
    <PageTransition>
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/portal")}><ArrowLeft className="h-4 w-4 mr-2" /> Retour aux formations</Button>

        {/* HERO */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border">
          <div className="p-8 space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 shrink-0"><GraduationCap className="h-7 w-7 text-primary" /></div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">{path.name}</h1>
                <p className="text-muted-foreground mt-1.5 leading-relaxed">{path.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {path.difficulty && <Badge variant="secondary" className="capitalize">{path.difficulty}</Badge>}
              {(path as any).academy_functions && <Badge variant="outline" className="text-xs">{(path as any).academy_functions.name}</Badge>}
              <span className="flex items-center gap-1.5 text-muted-foreground"><BookOpen className="h-3.5 w-3.5" /> {totalModules} modules</span>
              {totalHoursCalc > 0 && <span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {totalHoursCalc}h</span>}
              {enrollmentCount > 0 && <span className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-3.5 w-3.5" /> {enrollmentCount} inscrits</span>}
            </div>
            {user && !enrollment && <Button onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending} size="lg" className="gap-2 shadow-lg"><PlayCircle className="h-5 w-5" /> S'inscrire</Button>}
            {enrollment && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm"><span className="font-medium">Progression</span><span className="text-muted-foreground">{completedCount}/{totalModules} · {progressPct}%</span></div>
                <Progress value={progressPct} className="h-3" />
                {progressPct === 100 && <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 text-sm text-emerald-600 font-medium"><Award className="h-5 w-5" /> Parcours terminé ! 🎉</motion.div>}
                {progressPct < 100 && firstIncomplete && <Button size="sm" onClick={() => navigate(`/portal/module/${firstIncomplete.module_id}?pathId=${id}`)} className="gap-2"><PlayCircle className="h-4 w-4" /> Continuer</Button>}
              </div>
            )}
          </div>
        </motion.div>

        {/* OBJECTIVES */}
        {uniqueObjectives.length > 0 && (
          <Card><CardContent className="p-6">
            <button onClick={() => setExpandedObjectives(!expandedObjectives)} className="flex items-center justify-between w-full text-left">
              <h2 className="text-sm font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Ce que vous allez apprendre</h2>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedObjectives && "rotate-180")} />
            </button>
            <AnimatePresence>
              {(expandedObjectives || uniqueObjectives.length <= 4) && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                    {uniqueObjectives.map((obj, i) => <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span className="text-sm text-muted-foreground">{obj}</span></div>)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent></Card>
        )}

        {/* SYLLABUS */}
        <section className="space-y-4">
          <h2 className="text-lg font-display font-bold">Programme</h2>
          {modules.length === 0 ? (
            <Card className="border-dashed"><CardContent className="p-6 text-center text-muted-foreground text-sm">Aucun module.</CardContent></Card>
          ) : (
            <div className="relative">
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-border" />
              {modules.map((pm: any, idx: number) => {
                const mod = pm.academy_modules; if (!mod) return null;
                const progress = progressMap.get(pm.module_id) as any;
                const isCompleted = progress?.status === "completed";
                const isStarted = progress?.status === "in_progress";
                const prevCompleted = idx === 0 || (progressMap.get(modules[idx - 1]?.module_id) as any)?.status === "completed";
                const isAvailable = !enrollment || idx === 0 || prevCompleted;
                const isLocked = enrollment && !isAvailable;
                const Icon = moduleTypeIcons[mod.module_type] || BookOpen;

                return (
                  <motion.div key={pm.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="relative pl-14 pb-6">
                    <div className={cn("absolute left-4 top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10", isCompleted && "bg-primary border-primary", isStarted && "bg-background border-primary", !isCompleted && !isStarted && !isLocked && "bg-background border-border", isLocked && "bg-muted border-muted-foreground/30")}>
                      {isCompleted && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                      {isLocked && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
                    </div>
                    <Card className={cn("transition-all overflow-hidden", isLocked && "opacity-50", !isLocked && "hover:shadow-md cursor-pointer")} onClick={() => !isLocked && navigate(`/portal/module/${pm.module_id}?pathId=${id}`)}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-4">
                          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", isCompleted ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}><Icon className="h-5 w-5" /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2"><p className="text-sm font-semibold">{mod.title}</p>{isStarted && <Badge variant="outline" className="text-[10px] text-primary">En cours</Badge>}</div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{mod.description}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-[10px]">{moduleTypeLabels[mod.module_type] || mod.module_type}</Badge>
                            {mod.estimated_minutes && <span className="text-[10px] text-muted-foreground">{mod.estimated_minutes}min</span>}
                            {isCompleted && progress?.score != null && <Badge className="text-[10px]">{progress.score}%</Badge>}
                          </div>
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
