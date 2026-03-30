// Portal version of SimulatorReport — portal navigation
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageTransition } from "@/components/ui/PageTransition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getModeDefinition } from "@/components/simulator/config/modeRegistry";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowLeft, Award, Mail, RotateCcw, ChevronDown, CheckCircle2, AlertTriangle, BookOpen, Compass, Lightbulb, MessageSquare, Sparkles, TrendingUp, Brain, Target, Zap, BarChart3 } from "lucide-react";

interface KPIs { communication_clarity: number; analysis_depth: number; adaptability: number; response_relevance: number; idea_structuring: number; }
const KPI_META: { key: keyof KPIs; label: string; icon: typeof Brain }[] = [
  { key: "communication_clarity", label: "Clarté", icon: MessageSquare },
  { key: "analysis_depth", label: "Analyse", icon: Brain },
  { key: "adaptability", label: "Adaptabilité", icon: Zap },
  { key: "response_relevance", label: "Pertinence", icon: Target },
  { key: "idea_structuring", label: "Structure", icon: BarChart3 },
];

export default function PortalPratiqueReport() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [practice, setPractice] = useState<any>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [transcriptOpen, setTranscriptOpen] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const { data: sess } = await supabase.from("academy_practice_sessions").select("*").eq("id", sessionId).single();
      if (!sess) { setLoading(false); return; }
      setSession(sess);
      if (sess.practice_id) { const { data: pract } = await supabase.from("academy_practices").select("title, practice_type, difficulty, scenario").eq("id", sess.practice_id).maybeSingle(); setPractice(pract); }
      if (sess.user_id && sess.practice_id) { const { count } = await supabase.from("academy_practice_sessions").select("id", { count: "exact", head: true }).eq("user_id", sess.user_id).eq("practice_id", sess.practice_id).lte("started_at", sess.started_at); setAttemptNumber(count || 1); }
      setLoading(false);
    })();
  }, [sessionId]);

  const evaluation: any = session?.evaluation ? (typeof session.evaluation === "string" ? JSON.parse(session.evaluation) : session.evaluation) : null;
  const messages: any[] = session?.messages ? (Array.isArray(session.messages) ? session.messages : []) : [];
  const score = evaluation?.score ?? session?.score ?? 0;
  const grade = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";
  const gradeColor = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-primary" : score >= 40 ? "text-amber-500" : "text-destructive";
  const gradeBg = score >= 80 ? "bg-emerald-500/10" : score >= 60 ? "bg-primary/10" : score >= 40 ? "bg-amber-500/10" : "bg-destructive/10";
  const modeDef = practice?.practice_type ? getModeDefinition(practice.practice_type) : null;

  const handleSendEmail = async () => { if (!user || !sessionId) return; setSending(true); try { const { error } = await supabase.functions.invoke("send-session-report", { body: { session_id: sessionId } }); if (error) throw error; toast.success("Rapport envoyé !"); } catch { toast.error("Erreur."); } finally { setSending(false); } };

  if (loading) return <PageTransition><div className="max-w-3xl mx-auto px-4 py-8 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-32 w-full" /></div></PageTransition>;
  if (!session || !evaluation) return <PageTransition><div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4"><Award className="h-12 w-12 mx-auto text-muted-foreground" /><p className="text-muted-foreground">Rapport non disponible</p><Button onClick={() => navigate("/portal/pratique/history")}>Retour</Button></div></PageTransition>;

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/portal/pratique/history")} className="mt-1 shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display font-bold truncate">{practice?.title ?? "Session"}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">{modeDef && <Badge variant="outline" className="text-[11px]">{modeDef.label}</Badge>}{practice?.difficulty && <Badge variant="secondary" className="text-[11px]">{practice.difficulty}</Badge>}<span className="text-xs text-muted-foreground">{session.started_at && format(new Date(session.started_at), "dd MMM yyyy à HH:mm", { locale: fr })}</span><Badge variant="outline" className="text-[11px]">Tentative {attemptNumber}</Badge></div>
          </div>
        </div>

        {/* Score */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border bg-card p-6 flex items-center gap-6">
          <div className={cn("h-20 w-20 rounded-2xl flex items-center justify-center shrink-0", gradeBg)}><div className="text-center"><p className={cn("text-3xl font-black tabular-nums leading-none", gradeColor)}>{score}</p><p className="text-[10px] text-muted-foreground">/100</p></div></div>
          <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><span className={cn("text-2xl font-black", gradeColor)}>{grade}</span><Sparkles className={cn("h-4 w-4", gradeColor)} /></div><p className="text-sm text-muted-foreground leading-relaxed">{evaluation.feedback}</p></div>
        </motion.div>

        {/* KPIs */}
        {evaluation.kpis && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-5 gap-3">
          {KPI_META.map(({ key, label, icon: Icon }) => { const val = evaluation.kpis![key] ?? 0; const color = val >= 7 ? "text-emerald-500" : val >= 4 ? "text-amber-500" : "text-destructive"; const barColor = val >= 7 ? "bg-emerald-500" : val >= 4 ? "bg-amber-500" : "bg-destructive"; return <div key={key} className="rounded-xl border bg-card p-3 text-center space-y-1.5"><Icon className={cn("h-4 w-4 mx-auto", color)} /><p className="text-[11px] font-medium text-muted-foreground">{label}</p><p className={cn("text-lg font-black tabular-nums", color)}>{val}<span className="text-[10px] text-muted-foreground">/10</span></p><div className="h-1 bg-muted rounded-full overflow-hidden"><div className={cn("h-full rounded-full", barColor)} style={{ width: `${val*10}%` }} /></div></div>; })}
        </motion.div>}

        <Separator />

        {/* Strengths */}
        {evaluation.strengths?.length > 0 && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3"><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><h3 className="text-sm font-semibold">Points forts</h3></div>{evaluation.strengths.map((s: any, i: number) => <div key={i} className="rounded-xl border border-l-4 border-l-emerald-500 bg-card p-4 space-y-1"><p className="text-sm font-semibold">{s.title}</p><p className="text-sm text-muted-foreground">{s.detail}</p></div>)}</motion.div>}

        {/* Improvements */}
        {evaluation.improvements?.length > 0 && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /><h3 className="text-sm font-semibold">Axes d'amélioration</h3></div>{evaluation.improvements.map((imp: any, i: number) => <div key={i} className="rounded-xl border border-l-4 border-l-amber-500 bg-card p-4 space-y-2"><p className="text-sm font-semibold">{imp.title}</p><p className="text-sm text-muted-foreground">{imp.detail}</p>{imp.how && <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3"><p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">📌 Comment progresser</p><p className="text-sm text-amber-800 dark:text-amber-300">{imp.how}</p></div>}</div>)}</motion.div>}

        <Separator />

        {/* Transcript */}
        {messages.length > 0 && <Collapsible open={transcriptOpen} onOpenChange={setTranscriptOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group"><MessageSquare className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-semibold flex-1">Échanges ({messages.length})</span><ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", transcriptOpen && "rotate-180")} /></CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">{messages.map((m: any, i: number) => <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}><div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{m.role === "user" ? "V" : "IA"}</div><div className={cn("max-w-[80%] rounded-xl p-3 text-sm leading-relaxed", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border")}>{m.content}</div></div>)}</CollapsibleContent>
        </Collapsible>}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={handleSendEmail} disabled={sending} className="gap-2"><Mail className="h-4 w-4" />{sending ? "Envoi…" : "Envoyer par email"}</Button>
          <Button variant="outline" onClick={() => navigate("/portal/pratique")} className="gap-2"><RotateCcw className="h-4 w-4" />Refaire</Button>
          <Button variant="ghost" onClick={() => navigate("/portal/pratique/history")} className="gap-2"><TrendingUp className="h-4 w-4" />Historique</Button>
        </div>
      </div>
    </PageTransition>
  );
}
