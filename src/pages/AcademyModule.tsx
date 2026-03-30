import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PageTransition } from "@/components/ui/PageTransition";
import {
  ArrowLeft, BookOpen, HelpCircle, FileText, MessageSquare, CheckCircle2,
  Check, Bot, ChevronLeft, ChevronRight, Lock, Menu, GraduationCap,
  Clock, Trophy, Sparkles, PartyPopper, ArrowRight, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { AcademyQuiz } from "@/components/academy/AcademyQuiz";
import { AcademyExercise } from "@/components/academy/AcademyExercise";
import { AcademyPractice } from "@/components/academy/AcademyPractice";
import React, { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAcademyModule } from "@/hooks/useAcademyModule";

const moduleTypeIcons: Record<string, any> = {
  lesson: BookOpen, quiz: HelpCircle, exercise: FileText, practice: MessageSquare,
};
const moduleTypeLabels: Record<string, string> = {
  lesson: "Leçon", quiz: "Quiz", exercise: "Exercice", practice: "Pratique IA",
};

// ── Confetti for path completion ──
function PathCompletionCelebration({ pathName, onContinue, onViewCertificate, hasCertificate }: { pathName: string; onContinue: () => void; onViewCertificate?: () => void; hasCertificate?: boolean }) {
  const colors = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 1, x: "50vw", y: "50vh", scale: 0 }}
            animate={{
              x: `${Math.random() * 100}vw`,
              y: `${Math.random() * 100}vh`,
              scale: [0, 1, 0.5],
              rotate: Math.random() * 720,
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.5 }}
            className="absolute rounded-sm"
            style={{
              width: 6 + Math.random() * 8,
              height: 6 + Math.random() * 8,
              backgroundColor: colors[i % colors.length],
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        className="relative z-10 text-center space-y-6 p-10"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="flex h-24 w-24 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-2xl shadow-amber-500/30">
            <Trophy className="h-12 w-12 text-white" />
          </div>
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-3xl font-display font-bold">Félicitations ! 🎉</h2>
          <p className="text-muted-foreground text-lg">
            Vous avez terminé le parcours
          </p>
          <p className="text-xl font-semibold text-primary">{pathName}</p>
          {hasCertificate && (
            <p className="text-sm text-amber-600 font-medium">🏆 Votre certificat a été généré !</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          {hasCertificate && onViewCertificate && (
            <Button size="lg" variant="outline" onClick={onViewCertificate} className="gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/5">
              <Award className="h-5 w-5" /> Voir mon certificat
            </Button>
          )}
          <Button size="lg" onClick={onContinue} className="gap-2 shadow-lg">
            <PartyPopper className="h-5 w-5" /> Voir le parcours
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AcademyModule() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const pathId = searchParams.get("pathId");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const {
    module, isLoading, contents, pathData, pathModules,
    enrollment, currentProgress, progressMap,
    currentIndex, nextModule, prevModule,
    completedCount, progressPct, isCompleted, totalTimeSpent,
    saveProgress, getModuleStatus, certificateJustIssued,
  } = useAcademyModule(id, pathId);

  const isPractice = module?.module_type === "practice";

  const handleMarkComplete = async () => {
    setIsCompleting(true);
    try {
      await saveProgress(100, "completed");
      toast.success("Module marqué comme terminé !");
      // Check if this was the last module
      const newCompleted = completedCount + 1;
      if (newCompleted >= pathModules.length && pathModules.length > 0) {
        setShowCelebration(true);
      }
    } catch { toast.error("Erreur lors de la sauvegarde"); }
    finally { setIsCompleting(false); }
  };

  const navigateToModule = (pm: any) => {
    navigate(`/academy/module/${pm.module_id}?pathId=${pathId}`);
    setMobileSidebarOpen(false);
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse space-y-4 w-96">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!module) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center h-screen text-center">
          <div>
            <p className="text-muted-foreground">Module introuvable.</p>
            <Button variant="ghost" className="mt-4" onClick={() => navigate(-1 as any)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // ── Sidebar ──
  const sidebarContent = (
    <div className="flex flex-col h-full bg-muted/10">
      {/* Header with breadcrumb */}
      <div className="p-4 space-y-3 border-b border-border/50">
        <button
          onClick={() => pathId ? navigate(`/academy/path/${pathId}`) : navigate("/academy")}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
          <span className="truncate font-medium">{pathData?.name || "Retour au parcours"}</span>
        </button>

        {/* Path progress card */}
        {pathModules.length > 0 && (
          <div className="rounded-xl bg-gradient-to-br from-primary/8 to-primary/3 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">Progression</span>
              <span className="text-xs font-bold text-primary">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{completedCount}/{pathModules.length} modules</span>
              {totalTimeSpent > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {Math.round(totalTimeSpent / 60)}min
                </span>
              )}
            </div>
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
            const progress = progressMap.get(pm.module_id) as any;

            return (
              <button
                key={pm.module_id}
                onClick={() => status !== "locked" && navigateToModule(pm)}
                disabled={status === "locked"}
                className={cn(
                  "w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm group relative",
                  isCurrent && "bg-primary/10 ring-1 ring-primary/20",
                  !isCurrent && status !== "locked" && "hover:bg-muted/60",
                  status === "locked" && "opacity-35 cursor-not-allowed",
                )}
              >
                {/* Status dot/icon */}
                <div className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors mt-0.5",
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
                  <p className={cn(
                    "text-[13px] leading-tight",
                    isCurrent ? "font-semibold text-primary" : "font-medium",
                  )}>
                    {mod.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-muted-foreground">{moduleTypeLabels[mod.module_type]}</span>
                    {mod.estimated_minutes && (
                      <span className="text-[10px] text-muted-foreground">· {mod.estimated_minutes}min</span>
                    )}
                  </div>
                  {/* Score for completed */}
                  {status === "completed" && progress?.score != null && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${progress.score}%` }} />
                      </div>
                      <span className="text-[9px] font-semibold text-primary">{progress.score}%</span>
                    </div>
                  )}
                </div>

                {/* Current indicator */}
                {isCurrent && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border/50 space-y-2">
        {pathData?.certificate_enabled && progressPct === 100 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs h-8 text-amber-600 border-amber-500/30 hover:bg-amber-500/5"
            onClick={() => navigate("/academy/certificates")}
          >
            <Trophy className="h-3.5 w-3.5" />
            Voir mon certificat
          </Button>
        )}
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

  // ── Content ──
  const renderContent = () => {
    if (module.module_type === "quiz") {
      return (
        <AcademyQuiz
          moduleId={id!}
          enrollmentId={enrollment?.id}
          onComplete={(score, total) => {
            saveProgress(Math.round((score / total) * 100), "completed");
            toast.success(`Quiz terminé : ${score}/${total} points`);
            if (completedCount + 1 >= pathModules.length && pathModules.length > 0) setShowCelebration(true);
          }}
        />
      );
    }
    if (module.module_type === "exercise") {
      return (
        <AcademyExercise
          moduleId={id!}
          enrollmentId={enrollment?.id}
          onComplete={(score) => {
            saveProgress(score, "completed");
            toast.success(`Exercice évalué : ${score}/100`);
            if (completedCount + 1 >= pathModules.length && pathModules.length > 0) setShowCelebration(true);
          }}
        />
      );
    }
    if (module.module_type === "practice") {
      return (
        <AcademyPractice
          moduleId={id!}
          enrollmentId={enrollment?.id}
          onComplete={(score) => {
            saveProgress(score, "completed");
            toast.success(`Session terminée : ${score}/100`);
            if (completedCount + 1 >= pathModules.length && pathModules.length > 0) setShowCelebration(true);
          }}
        />
      );
    }

    // ── Lesson: Magazine-style reader ──
    return (
      <div className="max-w-3xl mx-auto">
        {/* Module header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 space-y-4"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-[10px] font-medium gap-1">
              {React.createElement(moduleTypeIcons[module.module_type] || BookOpen, { className: "h-3 w-3" })}
              {moduleTypeLabels[module.module_type]}
            </Badge>
            {module.estimated_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {module.estimated_minutes} min de lecture
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight leading-tight">
            {module.title}
          </h1>
          {module.description && (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {module.description}
            </p>
          )}
          <Separator />
        </motion.div>

        {contents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Le contenu de ce module sera bientôt disponible.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-12">
            {contents.map((c: any, idx: number) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
              >
                {c.content_type === "video" && c.media_url ? (
                  <div className="aspect-video rounded-2xl overflow-hidden bg-muted shadow-lg ring-1 ring-border/50">
                    <iframe src={c.media_url} className="w-full h-full" allowFullScreen />
                  </div>
                ) : (
                  <article className="prose prose-lg max-w-none dark:prose-invert leading-relaxed prose-headings:font-display prose-p:text-foreground/85 prose-li:text-foreground/85">
                    <EnrichedMarkdown content={c.body || ""} />
                  </article>
                )}
              </motion.div>
            ))}

            {/* End-of-lesson CTA */}
            {enrollment && !isCompleted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-8 border-t"
              >
                <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                  <CardContent className="p-6 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">Vous avez terminé cette leçon ?</p>
                      <p className="text-xs text-muted-foreground">Marquez-la comme terminée pour débloquer la suite.</p>
                    </div>
                    <Button onClick={handleMarkComplete} disabled={isCompleting} className="gap-2 shadow-md shrink-0">
                      <CheckCircle2 className="h-4 w-4" /> Terminé
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Next module nudge */}
            {isCompleted && nextModule && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-8 border-t"
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all group border-primary/20"
                  onClick={() => navigateToModule(nextModule)}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0 group-hover:bg-primary/20 transition-colors">
                      {React.createElement(
                        moduleTypeIcons[(nextModule as any).academy_modules?.module_type] || BookOpen,
                        { className: "h-6 w-6 text-primary" }
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">Module suivant</p>
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {(nextModule as any).academy_modules?.title}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <PageTransition>
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <PathCompletionCelebration
            pathName={pathData?.name || "ce parcours"}
            onContinue={() => {
              setShowCelebration(false);
              if (pathId) navigate(`/academy/path/${pathId}`);
            }}
          />
        )}
      </AnimatePresence>

      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        {pathModules.length > 0 && !isMobile && (
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 288, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-r border-border/50 overflow-hidden shrink-0"
              >
                <div className="w-[288px] h-full">
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

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top bar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-background/80 backdrop-blur-xl shrink-0">
            {pathModules.length > 0 && (
              isMobile ? (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileSidebarOpen(true)}>
                  <Menu className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              )
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0 flex-1">
              <button onClick={() => navigate("/academy")} className="hover:text-foreground transition-colors shrink-0">
                Academy
              </button>
              <span className="opacity-40">/</span>
              {pathData && (
                <>
                  <button
                    onClick={() => pathId && navigate(`/academy/path/${pathId}`)}
                    className="hover:text-foreground transition-colors truncate max-w-[150px]"
                  >
                    {pathData.name}
                  </button>
                  <span className="opacity-40">/</span>
                </>
              )}
              <span className="font-semibold text-foreground truncate">{module.title}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Segmented progress dots */}
              {pathModules.length > 0 && pathModules.length <= 20 && !isMobile && (
                <div className="flex items-center gap-0.5 mr-2">
                  {pathModules.map((pm: any) => (
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
                <Button size="sm" variant="outline" onClick={handleMarkComplete} disabled={isCompleting} className="h-7 text-[11px] gap-1.5">
                  <Check className="h-3 w-3" /> Terminé
                </Button>
              )}

              {isCompleted && (
                <Badge variant="outline" className="text-[10px] text-primary border-primary/30 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Complété
                </Badge>
              )}

              {prevModule && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateToModule(prevModule)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {nextModule && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateToModule(nextModule)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className={cn(
            "flex-1 overflow-y-auto",
            isPractice ? "" : "p-6 md:p-10",
          )}>
            <AnimatePresence mode="wait">
              <motion.div
                key={id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  isPractice && "h-full",
                )}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
