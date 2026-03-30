import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, BookOpen, FileText, MessageSquare, Sparkles, Brain, RotateCcw, Clock, Trophy, Star, Loader2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EnrichedMarkdown } from "./EnrichedMarkdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";


interface ModuleReviewViewProps {
  module: any;
  metadata: any;
  contents: any[];
  enrollment: any;
  pathId: string | null;
  onRefaire?: () => void;
}

// ─── Executive AI Card ───
function AIExecutiveCard({ title, subtitle, icon: Icon, content, loading, accentColor, generatedAt, onRetry }: {
  title: string; subtitle: string; icon: any; content: string | null; loading: boolean; accentColor: string; generatedAt?: string; onRetry?: () => void;
}) {
  if (loading) {
    return (
      <Card className={cn("border-l-4", accentColor)}>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
            <div>
              <Skeleton className="h-4 w-40 mb-1" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-4 w-full" />
          <p className="text-xs text-muted-foreground italic flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Génération en cours...</p>
        </CardContent>
      </Card>
    );
  }

  if (!content) {
    return (
      <Card className={cn("border-l-4 border-dashed", accentColor)}>
        <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-center">
          <Icon className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">La génération n'a pas abouti.</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5 text-xs">
              <RotateCcw className="h-3 w-3" /> Réessayer
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-l-4 shadow-sm", accentColor)}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <EnrichedMarkdown content={content} />
        {generatedAt && (
          <p className="text-[10px] text-muted-foreground/60 pt-2 border-t border-border/30">
            Généré le {new Date(generatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · IA Lovable
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function ModuleReviewView({ module, metadata, contents, enrollment, pathId, onRefaire }: ModuleReviewViewProps) {
  const { user } = useAuth();
  const [evaluationContent, setEvaluationContent] = useState<string | null>(metadata?.ai_evaluation || null);
  const [analysisContent, setAnalysisContent] = useState<string | null>(metadata?.ai_analysis || null);
  const [knowledgeContent, setKnowledgeContent] = useState<string | null>(metadata?.ai_knowledge || null);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [practiceSession, setPracticeSession] = useState<any>(null);
  const [generatedTimestamps, setGeneratedTimestamps] = useState<Record<string, string>>({
    evaluation: metadata?.ai_evaluation_at || "",
    analysis: metadata?.ai_analysis_at || "",
    knowledge: metadata?.ai_knowledge_at || "",
  });

  const autoFetchedRef = useRef({ evaluation: false, analysis: false, knowledge: false });
  const moduleType = module?.module_type || "lesson";

  // Load practice session if applicable
  useEffect(() => {
    if (moduleType === "practice" && metadata?.practice_session_id) {
      supabase.from("academy_practice_sessions").select("*").eq("id", metadata.practice_session_id).single()
        .then(({ data }) => { if (data) setPracticeSession(data); });
    }
  }, [moduleType, metadata?.practice_session_id]);

  const persistToMetadata = useCallback(async (key: string, value: string) => {
    if (!enrollment?.id || !module?.id) return;
    const { data: prog } = await supabase.from("academy_progress")
      .select("id, metadata").eq("enrollment_id", enrollment.id).eq("module_id", module.id).maybeSingle();
    if (prog) {
      const existing = (prog.metadata as any) || {};
      await supabase.from("academy_progress").update({
        metadata: { ...existing, [key]: value, [`${key}_at`]: new Date().toISOString() } as any,
      }).eq("id", prog.id);
    }
  }, [enrollment?.id, module?.id]);

  const fetchAI = useCallback(async (mode: "evaluation" | "analysis" | "knowledge") => {
    const setLoading = mode === "evaluation" ? setLoadingEvaluation : mode === "analysis" ? setLoadingAnalysis : setLoadingKnowledge;
    const setContent = mode === "evaluation" ? setEvaluationContent : mode === "analysis" ? setAnalysisContent : setKnowledgeContent;
    setLoading(true);
    try {
      const resp = await supabase.functions.invoke("academy-tutor", {
        body: { action: "debrief", module_id: module.id, path_id: pathId, metadata, mode },
      });
      if (resp.data?.content) {
        setContent(resp.data.content);
        const metaKey = `ai_${mode}`;
        await persistToMetadata(metaKey, resp.data.content);
        setGeneratedTimestamps(prev => ({ ...prev, [mode]: new Date().toISOString() }));
      }
    } catch (e) { console.error(`Failed to fetch ${mode}:`, e); }
    finally { setLoading(false); }
  }, [module?.id, pathId, metadata, persistToMetadata]);

  // Auto-generate all 3 AI contents on mount
  useEffect(() => {
    if (!module?.id) return;
    if (!evaluationContent && !autoFetchedRef.current.evaluation) {
      autoFetchedRef.current.evaluation = true;
      fetchAI("evaluation");
    }
  }, [module?.id]);

  useEffect(() => {
    if (!module?.id) return;
    if (!analysisContent && !autoFetchedRef.current.analysis) {
      autoFetchedRef.current.analysis = true;
      fetchAI("analysis");
    }
  }, [module?.id]);

  useEffect(() => {
    if (!module?.id) return;
    if (!knowledgeContent && !autoFetchedRef.current.knowledge) {
      autoFetchedRef.current.knowledge = true;
      fetchAI("knowledge");
    }
  }, [module?.id]);

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

      <Tabs defaultValue="responses" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="responses" className="text-[11px] gap-1 py-2"><FileText className="h-3.5 w-3.5" /> Mes réponses</TabsTrigger>
          <TabsTrigger value="result" className="text-[11px] gap-1 py-2"><Trophy className="h-3.5 w-3.5" /> Résultat</TabsTrigger>
          <TabsTrigger value="evaluation" className="text-[11px] gap-1 py-2"><Star className="h-3.5 w-3.5" /> Évaluation</TabsTrigger>
          <TabsTrigger value="analysis" className="text-[11px] gap-1 py-2"><Sparkles className="h-3.5 w-3.5" /> Analyse IA</TabsTrigger>
          <TabsTrigger value="knowledge" className="text-[11px] gap-1 py-2"><Brain className="h-3.5 w-3.5" /> Knowledge</TabsTrigger>
        </TabsList>

        {/* ─── TAB: Mes réponses (raw data only) ─── */}
        <TabsContent value="responses" className="space-y-4">
          {moduleType === "lesson" && <LessonResponses contents={contents} metadata={metadata} />}
          {moduleType === "quiz" && <QuizResponses metadata={metadata} />}
          {moduleType === "exercise" && <ExerciseResponses metadata={metadata} />}
          {moduleType === "practice" && <PracticeResponses session={practiceSession} metadata={metadata} />}
        </TabsContent>

        {/* ─── TAB: Résultat ─── */}
        <TabsContent value="result" className="space-y-4">
          {moduleType === "lesson" && <LessonResult metadata={metadata} />}
          {moduleType === "quiz" && <QuizResult metadata={metadata} />}
          {moduleType === "exercise" && <ExerciseResult metadata={metadata} />}
          {moduleType === "practice" && <PracticeResult session={practiceSession} metadata={metadata} />}

          {onRefaire && moduleType !== "lesson" && (
            <Button variant="outline" onClick={onRefaire} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Refaire ce module
            </Button>
          )}
        </TabsContent>

        {/* ─── TAB: Évaluation globale ─── */}
        <TabsContent value="evaluation" className="space-y-4">
          <AIExecutiveCard
            title="Évaluation globale"
            subtitle="Synthèse personnalisée de votre performance"
            icon={Award}
            content={evaluationContent}
            loading={loadingEvaluation}
            accentColor="border-emerald-500"
            generatedAt={generatedTimestamps.evaluation}
          />
        </TabsContent>

        {/* ─── TAB: Analyse IA ─── */}
        <TabsContent value="analysis" className="space-y-4">
          <AIExecutiveCard
            title="Analyse IA"
            subtitle="Patterns de performance et recommandations"
            icon={Sparkles}
            content={analysisContent}
            loading={loadingAnalysis}
            accentColor="border-primary"
            generatedAt={generatedTimestamps.analysis}
          />
        </TabsContent>

        {/* ─── TAB: Knowledge Brief ─── */}
        <TabsContent value="knowledge" className="space-y-4">
          <AIExecutiveCard
            title="Knowledge Brief"
            subtitle="Concepts clés et liens avec votre parcours"
            icon={Brain}
            content={knowledgeContent}
            loading={loadingKnowledge}
            accentColor="border-amber-500"
            generatedAt={generatedTimestamps.knowledge}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ══════════════════════════════════════════════════
// RAW RESPONSES — No AI feedback, just user data
// ══════════════════════════════════════════════════

function LessonResponses({ contents, metadata }: { contents: any[]; metadata: any }) {
  return (
    <div className="space-y-4">
      <Card className="bg-muted/30">
        <CardContent className="p-4 flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Leçon consultée</p>
            <p className="text-xs text-muted-foreground">
              {metadata?.read_at && `Le ${new Date(metadata.read_at).toLocaleDateString("fr-FR")}`}
              {metadata?.time_seconds && ` · ${Math.round(metadata.time_seconds / 60)} min de lecture`}
            </p>
          </div>
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

function QuizResponses({ metadata }: { metadata: any }) {
  const answers = metadata?.quiz_answers || [];
  if (answers.length === 0) return <EmptyState text="Aucune réponse enregistrée pour ce quiz." />;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Vos {answers.length} réponses</p>
      {answers.map((a: any, i: number) => (
        <Card key={i} className={cn("transition-colors", a.is_correct ? "border-emerald-500/20" : "border-destructive/20")}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {a.is_correct ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-1" /> : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-1" />}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium">Q{i + 1}. {a.question}</p>
                <p className="text-xs">
                  <span className={a.is_correct ? "text-emerald-600" : "text-destructive"}>
                    Votre réponse : {a.user_answer}
                  </span>
                  {!a.is_correct && <span className="text-emerald-600 ml-2">· Correcte : {a.correct_answer}</span>}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ExerciseResponses({ metadata }: { metadata: any }) {
  const submissions = metadata?.submissions || [];
  if (submissions.length === 0) return <EmptyState text="Aucune soumission enregistrée." />;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">{submissions.length} soumission(s)</p>
      {submissions.map((s: any, i: number) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Soumission {i + 1}</span>
              {s.submitted_at && <span className="text-[10px] text-muted-foreground">{new Date(s.submitted_at).toLocaleDateString("fr-FR")}</span>}
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto border">
              {s.text}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PracticeResponses({ session, metadata }: { session: any; metadata: any }) {
  if (!session) return <EmptyState text={metadata?.practice_session_id ? "Chargement de la session..." : "Aucune session de pratique enregistrée."} />;
  const messages = (session.messages as any[]) || [];
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Conversation ({messages.length} échanges)</p>
      <div className="space-y-2 max-h-[500px] overflow-y-auto rounded-xl border p-3">
        {messages.map((m: any, i: number) => (
          <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[80%] rounded-xl px-3 py-2 text-sm", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// RESULT TAB — Scores, KPIs, feedback
// ══════════════════════════════════════════════════

function LessonResult({ metadata }: { metadata: any }) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Leçon terminée avec succès</p>
          <p className="text-xs text-muted-foreground">
            {metadata?.read_at && `Lu le ${new Date(metadata.read_at).toLocaleDateString("fr-FR")}`}
            {metadata?.time_seconds && ` · ${Math.round(metadata.time_seconds / 60)} min`}
          </p>
        </div>
        <CheckCircle2 className="h-6 w-6 text-primary" />
      </CardContent>
    </Card>
  );
}

function QuizResult({ metadata }: { metadata: any }) {
  const answers = metadata?.quiz_answers || [];
  const correctCount = answers.filter((a: any) => a.is_correct).length;
  const totalPoints = answers.reduce((s: number, a: any) => s + (a.points || 0), 0);
  const earnedPoints = answers.filter((a: any) => a.is_correct).reduce((s: number, a: any) => s + (a.points || 0), 0);

  if (answers.length === 0) return <EmptyState text="Aucune donnée de résultat." />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard value={`${Math.round((correctCount / answers.length) * 100)}%`} label="Score" />
        <KPICard value={`${correctCount}/${answers.length}`} label="Bonnes réponses" />
        <KPICard value={`${earnedPoints}/${totalPoints}`} label="Points" />
        <KPICard value={`${metadata?.best_streak || 0}`} label="Meilleure série" />
      </div>

      {/* Per-question with AI insights */}
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
                    {!a.is_correct && <span className="text-emerald-600">Correcte : {a.correct_answer}</span>}
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

function ExerciseResult({ metadata }: { metadata: any }) {
  const submissions = metadata?.submissions || [];
  if (submissions.length === 0) return <EmptyState text="Aucune soumission enregistrée." />;
  const latest = submissions[submissions.length - 1];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Dernière soumission</h3>
            <Badge variant={latest.score >= 70 ? "default" : "outline"}>{latest.score}/100</Badge>
          </div>
          <Progress value={latest.score} className="h-2" />
          <div className="rounded-lg bg-muted/30 p-3 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
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
      {submissions.length > 1 && (
        <Accordion type="single" collapsible>
          <AccordionItem value="history">
            <AccordionTrigger className="text-sm">Historique ({submissions.length} tentatives)</AccordionTrigger>
            <AccordionContent className="space-y-2">
              {submissions.slice(0, -1).reverse().map((s: any, i: number) => (
                <Card key={i}><CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">Tentative {submissions.length - 1 - i}</span>
                    <Badge variant="outline" className="text-[10px]">{s.score}/100</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{s.text}</p>
                </CardContent></Card>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}

function PracticeResult({ session, metadata }: { session: any; metadata: any }) {
  if (!session) return <EmptyState text={metadata?.practice_session_id ? "Chargement..." : "Aucune session enregistrée."} />;
  const evaluation = session.evaluation as any;

  return (
    <div className="space-y-4">
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
    </div>
  );
}

// ─── Shared components ───
function KPICard({ value, label }: { value: string; label: string }) {
  return (
    <Card><CardContent className="p-4 text-center">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
    </CardContent></Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-6 text-center text-sm text-muted-foreground">{text}</CardContent>
    </Card>
  );
}
