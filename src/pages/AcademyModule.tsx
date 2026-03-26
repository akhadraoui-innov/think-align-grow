import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PageTransition } from "@/components/ui/PageTransition";
import { ArrowLeft, BookOpen, HelpCircle, FileText, MessageSquare, CheckCircle2, ArrowRight, Check, Bot, Send, ChevronLeft, ChevronRight, Lock, Menu, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { AcademyQuiz } from "@/components/academy/AcademyQuiz";
import { AcademyExercise } from "@/components/academy/AcademyExercise";
import { AcademyPractice } from "@/components/academy/AcademyPractice";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const moduleTypeIcons: Record<string, any> = {
  lesson: BookOpen, quiz: HelpCircle, exercise: FileText, practice: MessageSquare,
};
const moduleTypeLabels: Record<string, string> = {
  lesson: "Leçon", quiz: "Quiz", exercise: "Exercice", practice: "Pratique IA",
};

export default function AcademyModule() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const pathId = searchParams.get("pathId");
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const startTimeRef = useRef(Date.now());
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: module, isLoading } = useQuery({
    queryKey: ["academy-module", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_modules").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: contents = [] } = useQuery({
    queryKey: ["academy-module-contents", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_contents").select("*").eq("module_id", id!).order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: enrollment } = useQuery({
    queryKey: ["academy-enrollment-for-module", pathId, user?.id],
    enabled: !!pathId && !!user,
    queryFn: async () => {
      const { data } = await supabase.from("academy_enrollments").select("*").eq("path_id", pathId!).eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: currentProgress } = useQuery({
    queryKey: ["academy-module-progress", enrollment?.id, id],
    enabled: !!enrollment && !!id,
    queryFn: async () => {
      const { data } = await supabase.from("academy_progress").select("*").eq("enrollment_id", enrollment!.id).eq("module_id", id!).maybeSingle();
      return data;
    },
  });

  const { data: pathData } = useQuery({
    queryKey: ["academy-path-name", pathId],
    enabled: !!pathId,
    queryFn: async () => {
      const { data } = await supabase.from("academy_paths").select("name").eq("id", pathId!).single();
      return data;
    },
  });

  const { data: pathModules = [] } = useQuery({
    queryKey: ["academy-path-modules-nav", pathId],
    enabled: !!pathId,
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_path_modules").select("module_id, sort_order, academy_modules(id, title, module_type, estimated_minutes)").eq("path_id", pathId!).order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allProgress = [] } = useQuery({
    queryKey: ["academy-all-progress-sidebar", enrollment?.id],
    enabled: !!enrollment,
    queryFn: async () => {
      const { data } = await supabase.from("academy_progress").select("module_id, status, score").eq("enrollment_id", enrollment!.id);
      return data || [];
    },
  });

  const progressMap = useMemo(() => new Map(allProgress.map((p: any) => [p.module_id, p])), [allProgress]);
  const currentIndex = pathModules.findIndex((pm: any) => pm.module_id === id);
  const nextModule = currentIndex >= 0 && currentIndex < pathModules.length - 1 ? pathModules[currentIndex + 1] : null;
  const prevModule = currentIndex > 0 ? pathModules[currentIndex - 1] : null;
  const completedCount = allProgress.filter((p: any) => p.status === "completed").length;
  const progressPct = pathModules.length > 0 ? Math.round((completedCount / pathModules.length) * 100) : 0;

  useEffect(() => { startTimeRef.current = Date.now(); }, [id]);

  const saveProgress = useCallback(async (score: number | null, status: string = "completed") => {
    if (!enrollment || !id || !user) return;
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    const payload = {
      enrollment_id: enrollment.id, module_id: id, user_id: user.id, status, score,
      time_spent_seconds: timeSpent,
      ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
      ...(status === "in_progress" && !currentProgress ? { started_at: new Date().toISOString() } : {}),
    };
    if (currentProgress) {
      await supabase.from("academy_progress").update({
        status: payload.status, score: payload.score,
        time_spent_seconds: (currentProgress as any).time_spent_seconds + timeSpent,
        ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
      }).eq("id", (currentProgress as any).id);
    } else {
      await supabase.from("academy_progress").insert(payload);
    }
    qc.invalidateQueries({ queryKey: ["academy-module-progress"] });
    qc.invalidateQueries({ queryKey: ["academy-progress"] });
    qc.invalidateQueries({ queryKey: ["academy-all-progress-sidebar"] });
  }, [enrollment, id, user, currentProgress, qc]);

  const handleMarkComplete = async () => {
    setIsCompleting(true);
    try { await saveProgress(100, "completed"); toast.success("Module marqué comme terminé !"); }
    catch { toast.error("Erreur lors de la sauvegarde"); }
    finally { setIsCompleting(false); }
  };

  const isCompleted = (currentProgress as any)?.status === "completed";
  const isPractice = module?.module_type === "practice";

  if (isLoading) {
    return <PageTransition><div className="flex items-center justify-center h-screen"><div className="animate-pulse space-y-4 w-96"><div className="h-6 bg-muted rounded w-1/3" /><div className="h-4 bg-muted rounded w-2/3" /><div className="h-64 bg-muted rounded" /></div></div></PageTransition>;
  }

  if (!module) {
    return <PageTransition><div className="flex items-center justify-center h-screen text-center"><div><p className="text-muted-foreground">Module introuvable.</p><Button variant="ghost" className="mt-4" onClick={() => navigate(-1 as any)}><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Button></div></div></PageTransition>;
  }

  const navigateToModule = (pm: any) => {
    navigate(`/academy/module/${pm.module_id}?pathId=${pathId}`);
    setMobileSidebarOpen(false);
  };

  const getModuleStatus = (moduleId: string, idx: number) => {
    const p = progressMap.get(moduleId) as any;
    if (p?.status === "completed") return "completed";
    if (p?.status === "in_progress") return "in_progress";
    if (!enrollment) return "available";
    if (idx === 0) return "available";
    const prev = progressMap.get(pathModules[idx - 1]?.module_id) as any;
    if (prev?.status === "completed") return "available";
    return "locked";
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Sidebar header */}
      <div className="p-4 border-b border-border/50">
        <button
          onClick={() => pathId ? navigate(`/academy/path/${pathId}`) : navigate("/academy")}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-3 w-3" />
          <span className="truncate">{pathData?.name || "Retour"}</span>
        </button>
        {pathModules.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">{completedCount}/{pathModules.length} modules</span>
              <span className="font-medium">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
          </div>
        )}
      </div>

      {/* Module list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {pathModules.map((pm: any, idx: number) => {
            const mod = pm.academy_modules;
            if (!mod) return null;
            const status = getModuleStatus(pm.module_id, idx);
            const isCurrent = pm.module_id === id;
            const Icon = moduleTypeIcons[mod.module_type] || BookOpen;

            return (
              <button
                key={pm.module_id}
                onClick={() => status !== "locked" && navigateToModule(pm)}
                disabled={status === "locked"}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm group",
                  isCurrent && "bg-primary/10 text-primary font-medium",
                  !isCurrent && status !== "locked" && "hover:bg-muted/50 text-foreground",
                  status === "locked" && "opacity-40 cursor-not-allowed",
                )}
              >
                {/* Status indicator */}
                <div className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                  status === "completed" && "bg-primary text-primary-foreground",
                  status === "in_progress" && "bg-primary/20 text-primary",
                  status === "available" && !isCurrent && "bg-muted text-muted-foreground",
                  isCurrent && status !== "completed" && "bg-primary/20 text-primary",
                  status === "locked" && "bg-muted text-muted-foreground/50",
                )}>
                  {status === "completed" ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                   status === "locked" ? <Lock className="h-3 w-3" /> :
                   <Icon className="h-3.5 w-3.5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-tight truncate">{mod.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{moduleTypeLabels[mod.module_type]}</span>
                    {mod.estimated_minutes && (
                      <span className="text-[10px] text-muted-foreground">· {mod.estimated_minutes}min</span>
                    )}
                  </div>
                </div>

                {status === "completed" && (progressMap.get(pm.module_id) as any)?.score != null && (
                  <span className="text-[10px] font-medium text-primary shrink-0">{(progressMap.get(pm.module_id) as any).score}%</span>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Sidebar footer */}
      <div className="p-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-xs h-8"
          onClick={() => pathId ? navigate(`/academy/path/${pathId}`) : navigate("/academy")}
        >
          <GraduationCap className="h-3.5 w-3.5" />
          Voir le parcours
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    const moduleType = module.module_type;

    if (moduleType === "quiz") {
      return <AcademyQuiz moduleId={id!} enrollmentId={enrollment?.id} onComplete={(score, total) => { saveProgress(Math.round((score / total) * 100), "completed"); toast.success(`Quiz terminé : ${score}/${total} points`); }} />;
    }
    if (moduleType === "exercise") {
      return <AcademyExercise moduleId={id!} enrollmentId={enrollment?.id} onComplete={(score) => { saveProgress(score, "completed"); toast.success(`Exercice évalué : ${score}/100`); }} />;
    }
    if (moduleType === "practice") {
      return <AcademyPractice moduleId={id!} enrollmentId={enrollment?.id} onComplete={(score) => { saveProgress(score, "completed"); toast.success(`Session terminée : ${score}/100`); }} />;
    }

    // Default: lesson content
    return (
      <div className="max-w-3xl mx-auto" ref={contentRef}>
        {contents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Le contenu de ce module sera bientôt disponible.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {contents.map((c: any, idx: number) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                {c.content_type === "video" && c.media_url ? (
                  <div className="aspect-video rounded-2xl overflow-hidden bg-muted shadow-lg">
                    <iframe src={c.media_url} className="w-full h-full" allowFullScreen />
                  </div>
                ) : (
                  <article className="prose prose-sm max-w-none dark:prose-invert leading-relaxed">
                    <EnrichedMarkdown content={c.body || ""} />
                  </article>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Desktop sidebar */}
        {pathModules.length > 0 && !isMobile && (
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-r border-border/50 bg-muted/20 overflow-hidden shrink-0"
              >
                <div className="w-[280px] h-full">
                  {sidebarContent}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        )}

        {/* Mobile sidebar */}
        {pathModules.length > 0 && isMobile && (
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetContent side="left" className="w-[300px] p-0">
              {sidebarContent}
            </SheetContent>
          </Sheet>
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-background shrink-0">
            {/* Sidebar toggle */}
            {pathModules.length > 0 && (
              <>
                {isMobile ? (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileSidebarOpen(true)}>
                    <Menu className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                )}
              </>
            )}

            {/* Module info */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                isPractice ? "bg-violet-500/10 text-violet-500" : "bg-primary/10 text-primary"
              )}>
                {isPractice ? <Bot className="h-4 w-4" /> :
                 React.createElement(moduleTypeIcons[module.module_type] || BookOpen, { className: "h-4 w-4" })}
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold truncate">{module.title}</h1>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{moduleTypeLabels[module.module_type]}</span>
                  {module.estimated_minutes && <span>· {module.estimated_minutes} min</span>}
                  {isCompleted && <CheckCircle2 className="h-3 w-3 text-primary" />}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Segmented progress dots */}
              {pathModules.length > 0 && !isMobile && (
                <div className="flex items-center gap-0.5 mr-2">
                  {pathModules.map((pm: any, i: number) => (
                    <div
                      key={pm.module_id}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        pm.module_id === id ? "w-4 bg-primary" : "w-1.5",
                        pm.module_id !== id && (progressMap.get(pm.module_id) as any)?.status === "completed" ? "bg-primary/50" : "bg-muted-foreground/20",
                      )}
                    />
                  ))}
                </div>
              )}

              {enrollment && !isCompleted && module.module_type === "lesson" && (
                <Button size="sm" variant="outline" onClick={handleMarkComplete} disabled={isCompleting} className="h-8 text-xs gap-1.5">
                  <Check className="h-3 w-3" /> Terminé
                </Button>
              )}

              {/* Nav arrows */}
              {prevModule && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateToModule(prevModule)} title={(prevModule.academy_modules as any)?.title}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {nextModule && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateToModule(nextModule)} title={(nextModule.academy_modules as any)?.title}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className={cn(
            "flex-1 overflow-y-auto",
            isPractice ? "" : "p-6 md:p-8",
          )}>
            {renderContent()}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
