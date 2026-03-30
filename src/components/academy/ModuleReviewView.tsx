import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, BookOpen, FileText, MessageSquare, HelpCircle, Sparkles, Brain, RotateCcw, Clock, Trophy, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { EnrichedMarkdown } from "./EnrichedMarkdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";

interface ModuleReviewViewProps {
  module: any;
  metadata: any;
  contents: any[];
  enrollment: any;
  pathId: string | null;
  onRefaire?: () => void;
}

export function ModuleReviewView({ module, metadata, contents, enrollment, pathId, onRefaire }: ModuleReviewViewProps) {
  const { user } = useAuth();
  const [analysisContent, setAnalysisContent] = useState<string | null>(metadata?.ai_analysis || null);
  const [knowledgeContent, setKnowledgeContent] = useState<string | null>(metadata?.ai_knowledge || null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [practiceSession, setPracticeSession] = useState<any>(null);

  const moduleType = module?.module_type || "lesson";

  // Load practice session if applicable
  useEffect(() => {
    if (moduleType === "practice" && metadata?.practice_session_id) {
      supabase.from("academy_practice_sessions").select("*").eq("id", metadata.practice_session_id).single()
        .then(({ data }) => { if (data) setPracticeSession(data); });
    }
  }, [moduleType, metadata?.practice_session_id]);

  const fetchAI = async (mode: "analysis" | "knowledge") => {
    const setLoading = mode === "analysis" ? setLoadingAnalysis : setLoadingKnowledge;
    const setContent = mode === "analysis" ? setAnalysisContent : setKnowledgeContent;
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const resp = await supabase.functions.invoke("academy-tutor", {
        body: { action: "debrief", module_id: module.id, path_id: pathId, metadata, mode },
      });
      if (resp.data?.content) setContent(resp.data.content);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] gap-1">
            <CheckCircle2 className="h-3 w-3" /> Complété
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {moduleType === "quiz" ? "Quiz" : moduleType === "exercise" ? "Exercice" : moduleType === "practice" ? "Pratique IA" : "Leçon"}
          </Badge>
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">{module.title}</h1>
        {module.description && <p className="text-muted-foreground">{module.description}</p>}
      </motion.div>

      <Tabs defaultValue="result" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="result" className="text-xs gap-1.5"><Trophy className="h-3.5 w-3.5" /> Résultat</TabsTrigger>
          <TabsTrigger value="analysis" className="text-xs gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Analyse IA</TabsTrigger>
          <TabsTrigger value="knowledge" className="text-xs gap-1.5"><Brain className="h-3.5 w-3.5" /> Knowledge Brief</TabsTrigger>
        </TabsList>

        {/* ─── TAB: Résultat ─── */}
        <TabsContent value="result" className="space-y-4">
          {moduleType === "lesson" && <LessonResult contents={contents} metadata={metadata} />}
          {moduleType === "quiz" && <QuizResult metadata={metadata} />}
          {moduleType === "exercise" && <ExerciseResult metadata={metadata} />}
          {moduleType === "practice" && <PracticeResult session={practiceSession} metadata={metadata} />}

          {onRefaire && moduleType !== "lesson" && (
            <Button variant="outline" onClick={onRefaire} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Refaire ce module
            </Button>
          )}
        </TabsContent>

        {/* ─── TAB: Analyse IA ─── */}
        <TabsContent value="analysis" className="space-y-4">
          {analysisContent ? (
            <Card>
              <CardContent className="p-6 prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{analysisContent}</ReactMarkdown>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center space-y-3">
                <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">L'IA analyse vos résultats, identifie les patterns et vous donne des recommandations personnalisées.</p>
                <Button onClick={() => fetchAI("analysis")} disabled={loadingAnalysis} className="gap-2">
                  {loadingAnalysis ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Générer l'analyse
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── TAB: Knowledge Brief ─── */}
        <TabsContent value="knowledge" className="space-y-4">
          {knowledgeContent ? (
            <Card>
              <CardContent className="p-6 prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{knowledgeContent}</ReactMarkdown>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center space-y-3">
                <Brain className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Synthèse des concepts clés, points à retenir et liens avec la suite du parcours.</p>
                <Button onClick={() => fetchAI("knowledge")} disabled={loadingKnowledge} className="gap-2">
                  {loadingKnowledge ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                  Générer le brief
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Lesson Result ───
function LessonResult({ contents, metadata }: { contents: any[]; metadata: any }) {
  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Leçon terminée</p>
            <p className="text-xs text-muted-foreground">
              {metadata?.read_at && `Lu le ${new Date(metadata.read_at).toLocaleDateString("fr-FR")}`}
              {metadata?.time_seconds && ` · ${Math.round(metadata.time_seconds / 60)} min`}
            </p>
          </div>
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </CardContent>
      </Card>
      {contents.map((c: any) => (
        <article key={c.id} className="prose prose-sm max-w-none dark:prose-invert opacity-80">
          <EnrichedMarkdown content={c.body || ""} />
        </article>
      ))}
    </div>
  );
}

// ─── Quiz Result ───
function QuizResult({ metadata }: { metadata: any }) {
  const answers = metadata?.quiz_answers || [];
  const correctCount = answers.filter((a: any) => a.is_correct).length;
  const totalPoints = answers.reduce((s: number, a: any) => s + (a.points || 0), 0);
  const earnedPoints = answers.filter((a: any) => a.is_correct).reduce((s: number, a: any) => s + (a.points || 0), 0);

  if (answers.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Aucune donnée de réponse enregistrée pour ce quiz.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{Math.round((correctCount / answers.length) * 100)}%</p>
          <p className="text-[10px] text-muted-foreground uppercase">Score</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{correctCount}/{answers.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Bonnes réponses</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{earnedPoints}/{totalPoints}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Points</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{metadata?.best_streak || 0}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Meilleure série</p>
        </CardContent></Card>
      </div>

      {/* Per-question review */}
      <div className="space-y-2">
        {answers.map((a: any, i: number) => (
          <Card key={i} className={cn("transition-colors", a.is_correct ? "border-emerald-500/20" : "border-destructive/20")}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {a.is_correct ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-1" /> : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-1" />}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium">{a.question}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={a.is_correct ? "text-emerald-600" : "text-destructive"}>
                      Votre réponse : {a.user_answer}
                    </span>
                    {!a.is_correct && (
                      <span className="text-emerald-600">Correcte : {a.correct_answer}</span>
                    )}
                  </div>
                  {a.explanation && <p className="text-xs text-muted-foreground">{a.explanation}</p>}
                  {a.ai_insight && (
                    <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-xs text-primary flex items-center gap-1"><Sparkles className="h-3 w-3" /> Insight IA</p>
                      <p className="text-xs mt-1">{a.ai_insight}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Exercise Result ───
function ExerciseResult({ metadata }: { metadata: any }) {
  const submissions = metadata?.submissions || [];

  if (submissions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Aucune soumission enregistrée.
        </CardContent>
      </Card>
    );
  }

  const latest = submissions[submissions.length - 1];

  return (
    <div className="space-y-4">
      {/* Latest submission */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Dernière soumission</h3>
            <Badge variant={latest.score >= 70 ? "default" : "outline"}>{latest.score}/100</Badge>
          </div>
          <Progress value={latest.score} className="h-2" />
          <div className="rounded-lg bg-muted/30 p-3 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
            {latest.text}
          </div>
          {latest.strengths?.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-emerald-600">✅ Points forts</p>
              {latest.strengths.map((s: string, i: number) => (
                <p key={i} className="text-xs flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />{s}</p>
              ))}
            </div>
          )}
          {latest.improvements?.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-600">💡 Axes d'amélioration</p>
              {latest.improvements.map((s: string, i: number) => (
                <p key={i} className="text-xs flex items-start gap-1.5"><Sparkles className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />{s}</p>
              ))}
            </div>
          )}
          {latest.summary && <p className="text-xs text-muted-foreground italic">{latest.summary}</p>}
        </CardContent>
      </Card>

      {/* History accordion */}
      {submissions.length > 1 && (
        <Accordion type="single" collapsible>
          <AccordionItem value="history">
            <AccordionTrigger className="text-sm">Historique ({submissions.length} tentatives)</AccordionTrigger>
            <AccordionContent className="space-y-2">
              {submissions.slice(0, -1).reverse().map((s: any, i: number) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">Tentative {submissions.length - 1 - i}</span>
                      <Badge variant="outline" className="text-[10px]">{s.score}/100</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{s.text}</p>
                  </CardContent>
                </Card>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}

// ─── Practice Result ───
function PracticeResult({ session, metadata }: { session: any; metadata: any }) {
  if (!session) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          {metadata?.practice_session_id ? "Chargement de la session..." : "Aucune session de pratique enregistrée."}
        </CardContent>
      </Card>
    );
  }

  const messages = (session.messages as any[]) || [];
  const evaluation = session.evaluation as any;

  return (
    <div className="space-y-4">
      {/* Score */}
      {evaluation && (
        <Card className="bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{session.score || evaluation.score || "?"}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Session évaluée</p>
              <p className="text-xs text-muted-foreground">{evaluation.feedback || "Évaluation complétée"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation */}
      <div className="space-y-2 max-h-96 overflow-y-auto rounded-xl border p-3">
        {messages.map((m: any, i: number) => (
          <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[80%] rounded-xl px-3 py-2 text-sm",
              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
