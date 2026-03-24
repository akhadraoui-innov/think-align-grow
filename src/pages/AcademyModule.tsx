import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PageTransition } from "@/components/ui/PageTransition";
import { ArrowLeft, BookOpen, HelpCircle, FileText, MessageSquare, CheckCircle2, ArrowRight, Check, Bot, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { AcademyQuiz } from "@/components/academy/AcademyQuiz";
import { AcademyExercise } from "@/components/academy/AcademyExercise";
import { AcademyPractice } from "@/components/academy/AcademyPractice";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AcademyModule() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const pathId = searchParams.get("pathId");
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("content");
  const [isCompleting, setIsCompleting] = useState(false);
  const startTimeRef = useRef(Date.now());

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

  const { data: pathModules = [] } = useQuery({
    queryKey: ["academy-path-modules-nav", pathId],
    enabled: !!pathId,
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_path_modules").select("module_id, sort_order, academy_modules(title)").eq("path_id", pathId!).order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const currentIndex = pathModules.findIndex((pm: any) => pm.module_id === id);
  const nextModule = currentIndex >= 0 && currentIndex < pathModules.length - 1 ? pathModules[currentIndex + 1] : null;
  const prevModule = currentIndex > 0 ? pathModules[currentIndex - 1] : null;

  const { data: hasQuiz } = useQuery({
    queryKey: ["academy-has-quiz", id], enabled: !!id,
    queryFn: async () => { const { count } = await supabase.from("academy_quizzes").select("id", { count: "exact", head: true }).eq("module_id", id!); return (count || 0) > 0; },
  });

  const { data: hasExercise } = useQuery({
    queryKey: ["academy-has-exercise", id], enabled: !!id,
    queryFn: async () => { const { count } = await supabase.from("academy_exercises").select("id", { count: "exact", head: true }).eq("module_id", id!); return (count || 0) > 0; },
  });

  const { data: hasPractice } = useQuery({
    queryKey: ["academy-has-practice", id], enabled: !!id,
    queryFn: async () => { const { count } = await supabase.from("academy_practices").select("id", { count: "exact", head: true }).eq("module_id", id!); return (count || 0) > 0; },
  });

  useEffect(() => { startTimeRef.current = Date.now(); }, [id]);

  const saveProgress = async (score: number | null, status: string = "completed") => {
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
  };

  const handleMarkComplete = async () => {
    setIsCompleting(true);
    try { await saveProgress(100, "completed"); toast.success("Module marqué comme terminé !"); }
    catch { toast.error("Erreur lors de la sauvegarde"); }
    finally { setIsCompleting(false); }
  };

  const isCompleted = (currentProgress as any)?.status === "completed";
  const moduleTypeIcon = {
    lesson: <BookOpen className="h-5 w-5" />, quiz: <HelpCircle className="h-5 w-5" />,
    exercise: <FileText className="h-5 w-5" />, practice: <MessageSquare className="h-5 w-5" />,
  };

  if (isLoading) {
    return <PageTransition><div className="container max-w-4xl mx-auto px-4 py-8"><div className="animate-pulse space-y-4"><div className="h-6 bg-muted rounded w-1/3" /><div className="h-4 bg-muted rounded w-2/3" /><div className="h-64 bg-muted rounded" /></div></div></PageTransition>;
  }

  if (!module) {
    return <PageTransition><div className="container max-w-4xl mx-auto px-4 py-8 text-center"><p className="text-muted-foreground">Module introuvable.</p><Button variant="ghost" className="mt-4" onClick={() => navigate(-1 as any)}><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Button></div></PageTransition>;
  }

  const tabs = [
    { id: "content", label: "Contenu", icon: <BookOpen className="h-4 w-4" />, show: contents.length > 0 },
    { id: "quiz", label: "Quiz", icon: <HelpCircle className="h-4 w-4" />, show: !!hasQuiz },
    { id: "exercise", label: "Exercice", icon: <FileText className="h-4 w-4" />, show: !!hasExercise },
    { id: "practice", label: "Pratique IA", icon: <MessageSquare className="h-4 w-4" />, show: !!hasPractice },
  ].filter(t => t.show);

  const navigateToModule = (pm: any) => navigate(`/academy/module/${pm.module_id}?pathId=${pathId}`);

  return (
    <PageTransition>
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => pathId ? navigate(`/academy/path/${pathId}`) : navigate(-1 as any)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> {pathId ? "Retour au parcours" : "Retour"}
        </Button>

        {pathId && pathModules.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            Module {currentIndex + 1}/{pathModules.length}
            {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-primary ml-1" />}
          </div>
        )}

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
            {module.estimated_minutes && <span className="text-xs text-muted-foreground">{module.estimated_minutes} min</span>}
            {(module.objectives as string[])?.length > 0 && (
              <div className="flex flex-wrap gap-1 ml-2">
                {(module.objectives as string[]).map((obj, i) => <Badge key={i} variant="outline" className="text-[10px]">{obj}</Badge>)}
              </div>
            )}
          </div>
        </div>

        {tabs.length > 1 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {tabs.map(t => <TabsTrigger key={t.id} value={t.id} className="gap-2">{t.icon} {t.label}</TabsTrigger>)}
            </TabsList>
            <TabsContent value="content" className="mt-6"><ContentView contents={contents} /></TabsContent>
            {hasQuiz && <TabsContent value="quiz" className="mt-6"><AcademyQuiz moduleId={id!} enrollmentId={enrollment?.id} onComplete={(score, total) => { saveProgress(Math.round((score / total) * 100), "completed"); toast.success(`Quiz terminé : ${score}/${total} points`); }} /></TabsContent>}
            {hasExercise && <TabsContent value="exercise" className="mt-6"><AcademyExercise moduleId={id!} enrollmentId={enrollment?.id} onComplete={(score) => { saveProgress(score, "completed"); toast.success(`Exercice évalué : ${score}/100`); }} /></TabsContent>}
            {hasPractice && <TabsContent value="practice" className="mt-6"><AcademyPractice moduleId={id!} enrollmentId={enrollment?.id} onComplete={(score) => { saveProgress(score, "completed"); toast.success(`Session terminée : ${score}/100`); }} /></TabsContent>}
          </Tabs>
        ) : (
          <div className="mt-6">
            {tabs[0]?.id === "quiz" ? <AcademyQuiz moduleId={id!} enrollmentId={enrollment?.id} onComplete={(s, t) => { saveProgress(Math.round((s/t)*100), "completed"); toast.success(`Quiz terminé : ${s}/${t}`); }} />
            : tabs[0]?.id === "exercise" ? <AcademyExercise moduleId={id!} enrollmentId={enrollment?.id} onComplete={s => { saveProgress(s, "completed"); toast.success(`Score : ${s}/100`); }} />
            : tabs[0]?.id === "practice" ? <AcademyPractice moduleId={id!} enrollmentId={enrollment?.id} onComplete={s => { saveProgress(s, "completed"); toast.success(`Score : ${s}/100`); }} />
            : <ContentView contents={contents} />}
          </div>
        )}

        {enrollment && !isCompleted && (contents.length > 0 || module.module_type === "lesson") && (
          <div className="flex justify-center pt-4">
            <Button onClick={handleMarkComplete} disabled={isCompleting} size="lg" className="gap-2"><Check className="h-4 w-4" /> Marquer comme terminé</Button>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium pt-2">
            <CheckCircle2 className="h-4 w-4" /> Module terminé
          </div>
        )}

        {pathId && pathModules.length > 1 && (
          <div className="flex items-center justify-between pt-6 border-t">
            {prevModule ? <Button variant="outline" size="sm" onClick={() => navigateToModule(prevModule)}><ArrowLeft className="h-4 w-4 mr-2" /> Module précédent</Button> : <div />}
            {nextModule ? <Button size="sm" onClick={() => navigateToModule(nextModule)}>Module suivant <ArrowRight className="h-4 w-4 ml-2" /></Button>
            : <Button size="sm" variant="secondary" onClick={() => navigate(`/academy/path/${pathId}`)}>Voir le parcours <ArrowRight className="h-4 w-4 ml-2" /></Button>}
          </div>
        )}
      </div>

      {/* Floating AI Tutor Chat */}
      <TutorChat moduleTitle={module.title} moduleId={id!} />
    </PageTransition>
  );
}

function ContentView({ contents }: { contents: any[] }) {
  if (contents.length === 0) {
    return <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground text-sm">Le contenu de ce module sera bientôt disponible.</CardContent></Card>;
  }
  return (
    <div className="space-y-6">
      {contents.map((c: any) => (
        <Card key={c.id}>
          <CardContent className="p-6">
            {c.content_type === "video" && c.media_url ? (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted"><iframe src={c.media_url} className="w-full h-full" allowFullScreen /></div>
            ) : (
              <EnrichedMarkdown content={c.body || ""} />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Floating AI Tutor Chat ──

function TutorChat({ moduleTitle, moduleId }: { moduleTitle: string; moduleId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg = { role: "user" as const, content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsStreaming(true);

    let assistantSoFar = "";
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/academy-practice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          system_override: `Tu es un tuteur pédagogique bienveillant et expert pour le module "${moduleTitle}". 
Tu réponds aux questions de l'apprenant sur le contenu du module de façon claire, structurée et encourageante.
Utilise des exemples concrets, des analogies, et du markdown pour structurer tes réponses.
Si l'apprenant semble perdu, propose-lui de reformuler ou de décomposer le concept.
Reste focalisé sur le sujet du module. Réponds en français.`,
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {}
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue. Réessayez." }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90">
          <Bot className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[440px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" /> Tuteur IA — {moduleTitle}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-12 space-y-2">
              <Bot className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p>Posez une question sur le contenu de ce module.</p>
              <p className="text-xs">Je suis là pour vous aider à comprendre.</p>
            </div>
          )}
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md",
                )}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  ) : m.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-3 border-t">
          <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <Input placeholder="Votre question..." value={input} onChange={e => setInput(e.target.value)} disabled={isStreaming} className="flex-1" />
            <Button type="submit" size="icon" disabled={!input.trim() || isStreaming}><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
