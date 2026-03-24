import { useParams, useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/ui/PageTransition";
import { ArrowLeft, BookOpen, HelpCircle, FileText, MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AcademyQuiz } from "@/components/academy/AcademyQuiz";
import { AcademyExercise } from "@/components/academy/AcademyExercise";
import { AcademyPractice } from "@/components/academy/AcademyPractice";
import { useState } from "react";
import { toast } from "sonner";

export default function AcademyModule() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("content");

  const { data: module, isLoading } = useQuery({
    queryKey: ["academy-module", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_modules")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: contents = [] } = useQuery({
    queryKey: ["academy-module-contents", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_contents")
        .select("*")
        .eq("module_id", id!)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  // Check if module has quiz/exercise/practice
  const { data: hasQuiz } = useQuery({
    queryKey: ["academy-has-quiz", id],
    enabled: !!id,
    queryFn: async () => {
      const { count } = await supabase
        .from("academy_quizzes")
        .select("id", { count: "exact", head: true })
        .eq("module_id", id!);
      return (count || 0) > 0;
    },
  });

  const { data: hasExercise } = useQuery({
    queryKey: ["academy-has-exercise", id],
    enabled: !!id,
    queryFn: async () => {
      const { count } = await supabase
        .from("academy_exercises")
        .select("id", { count: "exact", head: true })
        .eq("module_id", id!);
      return (count || 0) > 0;
    },
  });

  const { data: hasPractice } = useQuery({
    queryKey: ["academy-has-practice", id],
    enabled: !!id,
    queryFn: async () => {
      const { count } = await supabase
        .from("academy_practices")
        .select("id", { count: "exact", head: true })
        .eq("module_id", id!);
      return (count || 0) > 0;
    },
  });

  const moduleTypeIcon = {
    lesson: <BookOpen className="h-5 w-5" />,
    quiz: <HelpCircle className="h-5 w-5" />,
    exercise: <FileText className="h-5 w-5" />,
    practice: <MessageSquare className="h-5 w-5" />,
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
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
        <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Module introuvable.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate(-1 as any)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
        </div>
      </PageTransition>
    );
  }

  const tabs = [
    { id: "content", label: "Contenu", icon: <BookOpen className="h-4 w-4" />, show: contents.length > 0 },
    { id: "quiz", label: "Quiz", icon: <HelpCircle className="h-4 w-4" />, show: !!hasQuiz },
    { id: "exercise", label: "Exercice", icon: <FileText className="h-4 w-4" />, show: !!hasExercise },
    { id: "practice", label: "Pratique IA", icon: <MessageSquare className="h-4 w-4" />, show: !!hasPractice },
  ].filter(t => t.show);

  return (
    <PageTransition>
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {moduleTypeIcon[module.module_type as keyof typeof moduleTypeIcon] || <BookOpen className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-display font-bold">{module.title}</h1>
              <p className="text-sm text-muted-foreground">{module.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{module.module_type}</Badge>
            {module.estimated_minutes && (
              <span className="text-xs text-muted-foreground">{module.estimated_minutes} min</span>
            )}
            {(module.objectives as string[])?.length > 0 && (
              <div className="flex flex-wrap gap-1 ml-2">
                {(module.objectives as string[]).map((obj, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{obj}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        {tabs.length > 1 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {tabs.map(t => (
                <TabsTrigger key={t.id} value={t.id} className="gap-2">
                  {t.icon} {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="content" className="mt-6">
              <ContentView contents={contents} />
            </TabsContent>

            {hasQuiz && (
              <TabsContent value="quiz" className="mt-6">
                <AcademyQuiz
                  moduleId={id!}
                  onComplete={(score, total) => {
                    toast.success(`Quiz terminé : ${score}/${total} points`);
                  }}
                />
              </TabsContent>
            )}

            {hasExercise && (
              <TabsContent value="exercise" className="mt-6">
                <AcademyExercise
                  moduleId={id!}
                  onComplete={(score) => {
                    toast.success(`Exercice évalué : ${score}/100`);
                  }}
                />
              </TabsContent>
            )}

            {hasPractice && (
              <TabsContent value="practice" className="mt-6">
                <AcademyPractice
                  moduleId={id!}
                  onComplete={(score) => {
                    toast.success(`Session terminée : ${score}/100`);
                  }}
                />
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <div className="mt-6">
            {tabs[0]?.id === "quiz" ? (
              <AcademyQuiz moduleId={id!} onComplete={(s, t) => toast.success(`Quiz terminé : ${s}/${t}`)} />
            ) : tabs[0]?.id === "exercise" ? (
              <AcademyExercise moduleId={id!} onComplete={s => toast.success(`Score : ${s}/100`)} />
            ) : tabs[0]?.id === "practice" ? (
              <AcademyPractice moduleId={id!} onComplete={s => toast.success(`Score : ${s}/100`)} />
            ) : (
              <ContentView contents={contents} />
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function ContentView({ contents }: { contents: any[] }) {
  if (contents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          Le contenu de ce module sera bientôt disponible.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {contents.map((c: any) => (
        <Card key={c.id}>
          <CardContent className="p-6">
            {c.content_type === "markdown" ? (
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-a:text-primary">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {c.body || ""}
                </ReactMarkdown>
              </div>
            ) : c.content_type === "video" && c.media_url ? (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <iframe src={c.media_url} className="w-full h-full" allowFullScreen />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {c.body || ""}
                </ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
