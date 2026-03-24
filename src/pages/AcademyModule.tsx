import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PageTransition } from "@/components/ui/PageTransition";
import { ArrowLeft, BookOpen, HelpCircle, FileText, MessageSquare, CheckCircle2, ArrowRight, Check, Bot, Send, List, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
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
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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
  const [readingProgress, setReadingProgress] = useState(0);
  const [showToc, setShowToc] = useState(false);
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

  // Reading progress tracking
  useEffect(() => {
    if (activeTab !== "content") return;
    const handleScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const totalHeight = el.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) { setReadingProgress(100); return; }
      const scrolled = Math.max(0, -rect.top);
      setReadingProgress(Math.min(100, Math.round((scrolled / totalHeight) * 100)));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab, contents]);

  // Extract headings for ToC
  const tocHeadings = useMemo(() => {
    const headings: { level: number; text: string; id: string }[] = [];
    contents.forEach((c: any) => {
      const matches = (c.body || "").matchAll(/^(#{2,3})\s+(.+)$/gm);
      for (const match of matches) {
        const text = match[2].trim();
        headings.push({
          level: match[1].length,
          text,
          id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        });
      }
    });
    return headings;
  }, [contents]);

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
  }, [enrollment, id, user, currentProgress, qc]);

  const handleMarkComplete = async () => {
    setIsCompleting(true);
    try { await saveProgress(100, "completed"); toast.success("Module marqué comme terminé !"); }
    catch { toast.error("Erreur lors de la sauvegarde"); }
    finally { setIsCompleting(false); }
  };

  const isCompleted = (currentProgress as any)?.status === "completed";
  const moduleTypeIcon: Record<string, JSX.Element> = {
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
      {/* Reading progress bar */}
      {activeTab === "content" && contents.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted/50">
          <motion.div
            className="h-full bg-primary"
            style={{ width: `${readingProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => pathId ? navigate(`/academy/path/${pathId}`) : navigate(-1 as any)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> {pathId ? "Retour au parcours" : "Retour"}
          </Button>
          {tocHeadings.length > 2 && activeTab === "content" && (
            <Button variant="outline" size="sm" onClick={() => setShowToc(!showToc)} className="gap-1.5">
              <List className="h-3.5 w-3.5" /> Sommaire
            </Button>
          )}
        </div>

        {/* Module position */}
        {pathId && pathModules.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              {pathModules.map((pm: any, i: number) => (
                <button
                  key={pm.module_id}
                  onClick={() => navigateToModule(pm)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    pm.module_id === id ? "w-6 bg-primary" : "w-2 bg-muted hover:bg-muted-foreground/30"
                  )}
                  title={(pm.academy_modules as any)?.title}
                />
              ))}
            </div>
            <span className="ml-2">Module {currentIndex + 1}/{pathModules.length}</span>
            {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
          </div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
              {moduleTypeIcon[module.module_type] || <BookOpen className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-display font-bold tracking-tight">{module.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="secondary" className="capitalize">{module.module_type}</Badge>
                {module.estimated_minutes && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    {module.estimated_minutes} min
                  </span>
                )}
                {(module.objectives as string[])?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(module.objectives as string[]).slice(0, 3).map((obj, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{obj}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Table of contents sidebar */}
        <AnimatePresence>
          {showToc && tocHeadings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sommaire</p>
                  <nav className="space-y-1">
                    {tocHeadings.map((h, i) => (
                      <a
                        key={i}
                        href={`#${h.id}`}
                        className={cn(
                          "block text-xs hover:text-primary transition-colors",
                          h.level === 3 ? "pl-4 text-muted-foreground" : "font-medium"
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {tabs.length > 1 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              {tabs.map(t => (
                <TabsTrigger key={t.id} value={t.id} className="gap-2">
                  {t.icon} {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="content" className="mt-6">
              <div ref={contentRef}>
                <ImmersiveContent contents={contents} />
              </div>
            </TabsContent>
            {hasQuiz && (
              <TabsContent value="quiz" className="mt-6">
                <AcademyQuiz moduleId={id!} enrollmentId={enrollment?.id} onComplete={(score, total) => { saveProgress(Math.round((score / total) * 100), "completed"); toast.success(`Quiz terminé : ${score}/${total} points`); }} />
              </TabsContent>
            )}
            {hasExercise && (
              <TabsContent value="exercise" className="mt-6">
                <AcademyExercise moduleId={id!} enrollmentId={enrollment?.id} onComplete={(score) => { saveProgress(score, "completed"); toast.success(`Exercice évalué : ${score}/100`); }} />
              </TabsContent>
            )}
            {hasPractice && (
              <TabsContent value="practice" className="mt-6">
                <AcademyPractice moduleId={id!} enrollmentId={enrollment?.id} onComplete={(score) => { saveProgress(score, "completed"); toast.success(`Session terminée : ${score}/100`); }} />
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <div className="mt-6" ref={contentRef}>
            {tabs[0]?.id === "quiz" ? <AcademyQuiz moduleId={id!} enrollmentId={enrollment?.id} onComplete={(s, t) => { saveProgress(Math.round((s/t)*100), "completed"); toast.success(`Quiz terminé : ${s}/${t}`); }} />
            : tabs[0]?.id === "exercise" ? <AcademyExercise moduleId={id!} enrollmentId={enrollment?.id} onComplete={s => { saveProgress(s, "completed"); toast.success(`Score : ${s}/100`); }} />
            : tabs[0]?.id === "practice" ? <AcademyPractice moduleId={id!} enrollmentId={enrollment?.id} onComplete={s => { saveProgress(s, "completed"); toast.success(`Score : ${s}/100`); }} />
            : <ImmersiveContent contents={contents} />}
          </div>
        )}

        {/* Complete button */}
        {enrollment && !isCompleted && (contents.length > 0 || module.module_type === "lesson") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center pt-4"
          >
            <Button onClick={handleMarkComplete} disabled={isCompleting} size="lg" className="gap-2 shadow-lg">
              <Check className="h-4 w-4" /> Marquer comme terminé
            </Button>
          </motion.div>
        )}

        {isCompleted && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center gap-2 text-sm text-primary font-medium pt-2"
          >
            <CheckCircle2 className="h-5 w-5" /> Module terminé
          </motion.div>
        )}

        {/* Navigation inter-modules */}
        {pathId && pathModules.length > 1 && (
          <div className="flex items-center justify-between pt-6 border-t">
            {prevModule ? (
              <Button variant="outline" size="sm" onClick={() => navigateToModule(prevModule)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground">Précédent</p>
                  <p className="text-xs font-medium truncate max-w-[150px]">{(prevModule.academy_modules as any)?.title}</p>
                </div>
              </Button>
            ) : <div />}
            {nextModule ? (
              <Button size="sm" onClick={() => navigateToModule(nextModule)} className="gap-2">
                <div className="text-right">
                  <p className="text-[10px] text-primary-foreground/70">Suivant</p>
                  <p className="text-xs font-medium truncate max-w-[150px]">{(nextModule.academy_modules as any)?.title}</p>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => navigate(`/academy/path/${pathId}`)} className="gap-2">
                Voir le parcours <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Floating AI Tutor */}
      <TutorChat moduleTitle={module.title} moduleId={id!} />
    </PageTransition>
  );
}

// ── Immersive Content Renderer ──

function ImmersiveContent({ contents }: { contents: any[] }) {
  if (contents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Le contenu de ce module sera bientôt disponible.</p>
        </CardContent>
      </Card>
    );
  }

  return (
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
            <article className="prose prose-sm max-w-none dark:prose-invert">
              <EnrichedMarkdown content={c.body || ""} />
            </article>
          )}
        </motion.div>
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
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Button
            size="icon"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50 bg-primary hover:bg-primary/90"
          >
            <Bot className="h-6 w-6" />
          </Button>
        </motion.div>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[440px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b bg-muted/30">
          <SheetTitle className="text-sm flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            Tuteur IA — {moduleTitle}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-16 space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 mx-auto">
                <Bot className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="font-medium">Posez une question</p>
              <p className="text-xs max-w-[200px] mx-auto">Je suis votre tuteur IA pour ce module. Je suis là pour vous aider à comprendre.</p>
              <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                {["Explique le concept principal", "Donne un exemple concret", "Résume cette leçon"].map(s => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); }}
                    className="text-[10px] px-2.5 py-1.5 rounded-full border hover:bg-muted/50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-4">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                )}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:mb-2 [&>p:last-child]:mb-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{m.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-muted-foreground">Réflexion...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-3 border-t bg-background">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Posez votre question..."
              className="h-10"
              disabled={isStreaming}
            />
            <Button size="icon" onClick={sendMessage} disabled={!input.trim() || isStreaming} className="h-10 w-10 shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
