import { useParams, useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/ui/PageTransition";
import {
  ArrowLeft, BookOpen, Clock, GraduationCap, HelpCircle, FileText, MessageSquare,
  Lock, CheckCircle2, PlayCircle, Target, Users, Award, ChevronDown, Trophy,
  Star, Briefcase, Lightbulb, Layers, Sparkles, Loader2, ScrollText, Mail
} from "lucide-react";
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
import { useState, useEffect, useRef } from "react";
import { GuideSection } from "@/components/academy/GuideSection";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { Skeleton } from "@/components/ui/skeleton";

const moduleTypeIcons: Record<string, any> = { lesson: BookOpen, quiz: HelpCircle, exercise: FileText, practice: MessageSquare };
const moduleTypeLabels: Record<string, string> = { lesson: "Leçon", quiz: "Quiz", exercise: "Exercice", practice: "Pratique IA" };
const categoryIcons: Record<string, any> = { technique: Layers, transversale: Users, métier: Briefcase };

function StarRating({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn("h-3 w-3", i <= level ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
      ))}
    </div>
  );
}

export default function PortalFormationsPath() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [expandedObjectives, setExpandedObjectives] = useState(false);
  const [expandedSkills, setExpandedSkills] = useState(false);

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
  const { data: certificate } = useQuery({
    queryKey: ["user-certificate-for-path", id, user?.id], enabled: !!id && !!user,
    queryFn: async () => { const { data } = await supabase.from("academy_certificates").select("id").eq("path_id", id!).eq("user_id", user!.id).eq("status", "active").maybeSingle(); return data; },
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

  const pathSkills: any[] = path ? (Array.isArray(path.skills) ? path.skills : []) : [];
  const pathPrereqs: string[] = path ? (Array.isArray(path.prerequisites) ? (path.prerequisites as any[]).map(String) : []) : [];
  const pathAptitudes: string[] = path ? (Array.isArray(path.aptitudes) ? (path.aptitudes as any[]).map(String) : []) : [];
  const pathOutcomes: string[] = path ? (Array.isArray(path.professional_outcomes) ? (path.professional_outcomes as any[]).map(String) : []) : [];
  const hasSkillsData = pathSkills.length > 0 || pathPrereqs.length > 0 || pathAptitudes.length > 0 || pathOutcomes.length > 0;

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
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">{path.name}</h1>
                  {path.certificate_enabled && <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1"><Award className="h-3 w-3" /> Certifiant</Badge>}
                </div>
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
                {progressPct === 100 && (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-2 text-sm text-emerald-600 font-medium"><Award className="h-5 w-5" /> Parcours terminé ! 🎉</span>
                    {path.certificate_enabled && certificate && (
                      <Button size="sm" variant="outline" onClick={() => navigate(`/portal/certificates/${certificate.id}`)} className="gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/5">
                        <Trophy className="h-4 w-4" /> Voir mon certificat
                      </Button>
                    )}
                    {path.certificate_enabled && !certificate && (
                      <Button size="sm" variant="outline" onClick={() => navigate("/portal/certificates")} className="gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/5">
                        <Trophy className="h-4 w-4" /> Mes certificats
                      </Button>
                    )}
                  </motion.div>
                )}
                {progressPct < 100 && firstIncomplete && <Button size="sm" onClick={() => navigate(`/portal/module/${firstIncomplete.module_id}?pathId=${id}`)} className="gap-2"><PlayCircle className="h-4 w-4" /> Continuer</Button>}
              </div>
            )}
          </div>
        </motion.div>

        {/* SKILLS & COMPETENCES */}
        {hasSkillsData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardContent className="p-6 space-y-5">
                <button onClick={() => setExpandedSkills(!expandedSkills)} className="flex items-center justify-between w-full text-left">
                  <h2 className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Compétences & Aptitudes</h2>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedSkills && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {(expandedSkills || (pathSkills.length + pathAptitudes.length + pathOutcomes.length) <= 6) && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-4">
                      {/* Skills */}
                      {pathSkills.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Target className="h-3 w-3" /> Compétences développées</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {pathSkills.map((s: any, i: number) => {
                              const CatIcon = categoryIcons[s.category] || Layers;
                              return (
                                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/20 border border-border/30">
                                  <CatIcon className="h-4 w-4 text-primary shrink-0" />
                                  <span className="text-sm flex-1">{s.name}</span>
                                  <StarRating level={s.level || 3} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Prerequisites */}
                      {pathPrereqs.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><BookOpen className="h-3 w-3" /> Prérequis</p>
                          <div className="flex flex-wrap gap-2">
                            {pathPrereqs.map((p, i) => <Badge key={i} variant="outline" className="text-xs px-3 py-1.5 gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {p}</Badge>)}
                          </div>
                        </div>
                      )}

                      {/* Aptitudes */}
                      {pathAptitudes.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Lightbulb className="h-3 w-3" /> Aptitudes professionnelles</p>
                          <ul className="space-y-1.5">
                            {pathAptitudes.map((a, i) => <li key={i} className="flex items-start gap-2 text-sm"><Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />{a}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Professional outcomes */}
                      {pathOutcomes.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Briefcase className="h-3 w-3" /> Débouchés professionnels</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {pathOutcomes.map((o, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/20">
                                <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />{o}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}

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

        {/* CERTIFICATION INFO */}
        {path.certificate_enabled && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 shrink-0">
                    <Award className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Parcours certifiant</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Ce parcours délivre un certificat de réussite attestant des compétences acquises.
                      Le certificat inclut une attestation détaillée avec QR code de vérification, vos scores par module,
                      et le référentiel de compétences validées.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* GUIDE PÉDAGOGIQUE */}
        <GuideSection pathId={id!} guideDocument={(path as any).guide_document} isCompleted={progressPct === 100} user={user} />

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

        {/* ÉVALUATION FINALE DU PARCOURS */}
        {enrollment && progressPct === 100 && (
          <PathFinalEvaluation pathId={id!} enrollmentId={enrollment.id} user={user} />
        )}
      </div>
    </PageTransition>
  );
}

function PathFinalEvaluation({ pathId, enrollmentId, user, guideDocument }: { pathId: string; enrollmentId: string; user: any; guideDocument: any }) {
  const existingEval = guideDocument?.path_evaluation || null;
  const [content, setContent] = useState<string | null>(existingEval);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const autoFetched = useRef(false);

  useEffect(() => {
    if (autoFetched.current || content) return;
    autoFetched.current = true;
    generateEvaluation();
  }, []);

  const generateEvaluation = async () => {
    setLoading(true);
    setError(false);
    try {
      const resp = await supabase.functions.invoke("academy-tutor", {
        body: { action: "debrief", mode: "evaluation", path_id: pathId, enrollment_id: enrollmentId, persist: true },
      });
      if (resp.data?.content) {
        setContent(resp.data.content);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-500/5 to-transparent overflow-hidden">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Trophy className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold">Évaluation finale du parcours</h2>
              <p className="text-xs text-muted-foreground">Synthèse personnalisée de votre performance globale</p>
            </div>
          </div>

          {loading && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                Génération de votre évaluation personnalisée...
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-sm text-muted-foreground">La génération n'a pas abouti.</p>
              <Button variant="outline" size="sm" onClick={generateEvaluation} className="gap-1.5">
                <Sparkles className="h-3 w-3" /> Réessayer
              </Button>
            </div>
          )}

          {content && !loading && (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-h2:text-base prose-h2:mt-6 prose-h2:mb-2 prose-h3:text-sm">
              <EnrichedMarkdown content={content} />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
