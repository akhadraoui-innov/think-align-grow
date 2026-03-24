import { useParams, useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/ui/PageTransition";
import { ArrowLeft, BookOpen, Clock, GraduationCap, HelpCircle, FileText, MessageSquare, Lock, CheckCircle2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const moduleTypeIcons: Record<string, any> = {
  lesson: BookOpen,
  quiz: HelpCircle,
  exercise: FileText,
  practice: MessageSquare,
};

const moduleTypeLabels: Record<string, string> = {
  lesson: "Leçon",
  quiz: "Quiz",
  exercise: "Exercice",
  practice: "Pratique IA",
};

export default function AcademyPath() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: path, isLoading } = useQuery({
    queryKey: ["academy-path", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_paths")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["academy-path-modules", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_path_modules")
        .select("*, academy_modules(*)")
        .eq("path_id", id!)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  // User enrollment
  const { data: enrollment } = useQuery({
    queryKey: ["academy-enrollment", id, user?.id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_enrollments")
        .select("*")
        .eq("path_id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  // User progress for all modules in this path
  const { data: progressList = [] } = useQuery({
    queryKey: ["academy-progress", enrollment?.id],
    enabled: !!enrollment,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_progress")
        .select("*")
        .eq("enrollment_id", enrollment!.id);
      return data || [];
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("Missing data");
      const { error } = await supabase.from("academy_enrollments").insert({
        path_id: id,
        user_id: user.id,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy-enrollment"] });
      qc.invalidateQueries({ queryKey: ["academy-enrollments"] });
      toast.success("Vous êtes inscrit à ce parcours !");
    },
    onError: () => toast.error("Erreur lors de l'inscription"),
  });

  const progressMap = new Map(progressList.map((p: any) => [p.module_id, p]));
  const completedCount = progressList.filter((p: any) => p.status === "completed").length;
  const totalModules = modules.length;
  const progressPct = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  if (isLoading) {
    return (
      <PageTransition>
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!path) {
    return (
      <PageTransition>
        <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Parcours introuvable.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/academy")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/academy")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour à l'Academy
        </Button>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">{path.name}</h1>
                <p className="text-sm text-muted-foreground">{path.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {path.difficulty && <Badge variant="secondary">{path.difficulty}</Badge>}
              {path.estimated_hours && path.estimated_hours > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {String(path.estimated_hours)}h estimées
                </span>
              )}
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" /> {totalModules} modules
              </span>
            </div>

            {/* Enrollment + progress */}
            {user && !enrollment && (
              <Button onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending} className="mt-4">
                <PlayCircle className="h-4 w-4 mr-2" /> S'inscrire au parcours
              </Button>
            )}

            {enrollment && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progression</span>
                  <span className="text-muted-foreground">{completedCount}/{totalModules} modules · {progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-3" />
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <section className="space-y-1">
          {modules.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                Aucun module dans ce parcours pour le moment.
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-border" />

              {modules.map((pm: any, idx: number) => {
                const mod = pm.academy_modules;
                if (!mod) return null;
                const progress = progressMap.get(pm.module_id) as any;
                const isCompleted = progress?.status === "completed";
                const isStarted = progress?.status === "in_progress";
                const prevCompleted = idx === 0 || (progressMap.get(modules[idx - 1]?.module_id) as any)?.status === "completed";
                const isAvailable = !enrollment || idx === 0 || prevCompleted;
                const isLocked = enrollment && !isAvailable;
                const Icon = moduleTypeIcons[mod.module_type] || BookOpen;

                return (
                  <motion.div
                    key={pm.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative pl-14 pb-6"
                  >
                    {/* Timeline dot */}
                    <div className={cn(
                      "absolute left-4 top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10",
                      isCompleted && "bg-primary border-primary",
                      isStarted && "bg-background border-primary",
                      !isCompleted && !isStarted && !isLocked && "bg-background border-border",
                      isLocked && "bg-muted border-muted-foreground/30",
                    )}>
                      {isCompleted && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                      {isLocked && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
                    </div>

                    <Card
                      className={cn(
                        "transition-all",
                        isLocked && "opacity-50",
                        !isLocked && "hover:shadow-md cursor-pointer",
                      )}
                      onClick={() => !isLocked && navigate(`/academy/module/${pm.module_id}`)}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          isCompleted ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{mod.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{mod.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px]">
                            {moduleTypeLabels[mod.module_type] || mod.module_type}
                          </Badge>
                          {mod.estimated_minutes && (
                            <span className="text-[10px] text-muted-foreground">{mod.estimated_minutes}min</span>
                          )}
                          {isCompleted && progress?.score != null && (
                            <Badge className="text-[10px]">{progress.score}%</Badge>
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
