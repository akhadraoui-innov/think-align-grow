import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, AlertTriangle, Check, Clock, CircleDot, PartyPopper, ArrowRight, Loader2, RotateCcw } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  toolkit: Tables<"toolkits">;
  pillars: Tables<"pillars">[];
  cards: Tables<"cards">[];
  quizQuestions: any[];
  onUpdate: () => void;
}

type TimelineEntry = {
  id: string;
  label: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
};

type GenPhase = "idle" | "generating" | "complete" | "error";

export function ToolkitCompletionBanner({ toolkit, pillars, cards, quizQuestions, onUpdate }: Props) {
  const emptyPillars = pillars.filter(p => !cards.some(c => c.pillar_id === p.id));
  const hasQuiz = quizQuestions.length > 0;
  const missingItems: string[] = [];

  if (emptyPillars.length > 0) missingItems.push(`${emptyPillars.length} pilier${emptyPillars.length > 1 ? "s" : ""} sans cartes`);
  if (!hasQuiz && pillars.length > 0) missingItems.push("Aucune question de quiz");

  const [genOpen, setGenOpen] = useState(false);
  const [phase, setPhase] = useState<GenPhase>("idle");
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [totalQuiz, setTotalQuiz] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [failedPillars, setFailedPillars] = useState<Tables<"pillars">[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const processSSEStream = async (response: Response, onProgress: (data: any) => void) => {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No stream");
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = JSON.parse(line.slice(6));
        if (data.type === "error") throw new Error(data.message);
        onProgress(data);
      }
    }
  };

  const callGenerate = async (session: any, body: Record<string, any>) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return fetch(`${supabaseUrl}/functions/v1/generate-toolkit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });
  };

  const handleComplete = useCallback(async (pillarsToProcess?: Tables<"pillars">[]) => {
    const targetPillars = pillarsToProcess || emptyPillars;
    const needQuiz = !hasQuiz && pillars.length > 0;

    setGenOpen(true);
    setPhase("generating");
    setTotalCards(0);
    setTotalQuiz(0);
    setElapsed(0);
    setErrorMessage("");
    setFailedPillars([]);

    // Build initial timeline
    const initialTimeline: TimelineEntry[] = targetPillars.map((p, i) => ({
      id: `cards-${p.id}`,
      label: p.name,
      status: i === 0 ? "active" : "pending",
      detail: "En attente…",
    }));
    if (needQuiz) {
      initialTimeline.push({ id: "quiz", label: "Quiz", status: "pending", detail: "En attente…" });
    }
    setTimeline(initialTimeline);

    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non connecté");

      let cardsTotal = 0;
      const failed: Tables<"pillars">[] = [];

      // Process each pillar individually
      for (let i = 0; i < targetPillars.length; i++) {
        const pillar = targetPillars[i];

        setTimeline(prev => prev.map(t =>
          t.id === `cards-${pillar.id}` ? { ...t, status: "active", detail: "Génération…" } : t
        ));

        try {
          const response = await callGenerate(session, {
            mode: "complete_missing",
            toolkit_id: toolkit.id,
            pillar_ids: [pillar.id],
            generate_quiz: false,
          });

          let pillarCards = 0;
          await processSSEStream(response, (data) => {
            if (data.type === "progress" && data.step === "cards_done") {
              pillarCards = data.count || 0;
            }
          });

          cardsTotal += pillarCards;
          setTotalCards(cardsTotal);
          setTimeline(prev => prev.map(t =>
            t.id === `cards-${pillar.id}` ? { ...t, status: "done", detail: `${pillarCards} cartes` } : t
          ));
        } catch (e: any) {
          console.error(`Failed for pillar ${pillar.name}:`, e);
          failed.push(pillar);
          setTimeline(prev => prev.map(t =>
            t.id === `cards-${pillar.id}` ? { ...t, status: "error", detail: "Erreur" } : t
          ));
        }
      }

      // Quiz pass - all pillars at once
      if (needQuiz) {
        setTimeline(prev => prev.map(t =>
          t.id === "quiz" ? { ...t, status: "active", detail: "Génération…" } : t
        ));

        try {
          const response = await callGenerate(session, {
            mode: "complete_missing",
            toolkit_id: toolkit.id,
            generate_quiz: true,
            pillar_ids: [], // empty = skip cards, quiz handles all pillars internally
          });

          let quizTotal = 0;
          await processSSEStream(response, (data) => {
            if (data.type === "progress" && data.step === "quiz_done") {
              quizTotal += data.count || 0;
            }
            if (data.type === "complete") {
              quizTotal = data.quiz || quizTotal;
            }
          });

          setTotalQuiz(quizTotal);
          setTimeline(prev => prev.map(t =>
            t.id === "quiz" ? { ...t, status: "done", detail: `${quizTotal} questions` } : t
          ));
        } catch (e: any) {
          console.error("Quiz generation failed:", e);
          setTimeline(prev => prev.map(t =>
            t.id === "quiz" ? { ...t, status: "error", detail: "Erreur" } : t
          ));
        }
      }

      if (timerRef.current) clearInterval(timerRef.current);
      setFailedPillars(failed);
      setPhase(failed.length > 0 ? "error" : "complete");
      setTotalCards(cardsTotal);
      if (failed.length > 0) {
        setErrorMessage(`${failed.length} pilier(s) en erreur. Les autres ont été sauvegardés.`);
      }
      onUpdate();
    } catch (e: any) {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase("error");
      setErrorMessage(e.message);
    }
  }, [toolkit.id, emptyPillars, hasQuiz, pillars, onUpdate]);

  const isComplete = missingItems.length === 0;

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec.toString().padStart(2, "0")}s` : `${sec}s`;
  };

  const completedCount = timeline.filter(t => t.status === "done").length;
  const totalCount = Math.max(timeline.length, 1);
  const progressPct = phase === "complete" ? 100 : Math.round((completedCount / totalCount) * 100);

  return (
    <>
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center gap-4">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Toolkit incomplet</p>
          <p className="text-xs text-muted-foreground mt-0.5">{missingItems.join(" · ")}</p>
        </div>
        <Button size="sm" onClick={() => handleComplete()} className="gap-2 shrink-0">
          <Sparkles className="h-4 w-4" /> Compléter avec l'IA
        </Button>
      </div>

      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogTitle className="sr-only">Complétion IA</DialogTitle>

          <AnimatePresence mode="wait">
            {phase === "generating" && (
              <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 py-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Complétion en cours…</h3>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{formatElapsed(elapsed)}</span>
                </div>
                <Progress value={progressPct} className="h-2" />
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {timeline.map(t => (
                    <div key={t.id} className="flex items-center gap-2 text-sm">
                      {t.status === "active" && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />}
                      {t.status === "done" && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                      {t.status === "pending" && <CircleDot className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
                      {t.status === "error" && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                      <span className={t.status === "done" ? "text-muted-foreground" : t.status === "error" ? "text-destructive" : "text-foreground"}>{t.label}</span>
                      {t.detail && <span className="ml-auto text-xs text-muted-foreground">{t.detail}</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {phase === "complete" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-4">
                <PartyPopper className="h-12 w-12 text-primary mx-auto" />
                <h3 className="text-lg font-display font-bold text-foreground">Complétion terminée !</h3>
                <div className="flex justify-center gap-4">
                  {totalCards > 0 && <Badge variant="secondary" className="text-sm">{totalCards} cartes</Badge>}
                  {totalQuiz > 0 && <Badge variant="secondary" className="text-sm">{totalQuiz} quiz</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">Temps : {formatElapsed(elapsed)}</p>
                <Button onClick={() => { setGenOpen(false); onUpdate(); }} className="gap-2">
                  <ArrowRight className="h-4 w-4" /> Voir le résultat
                </Button>
              </motion.div>
            )}

            {phase === "error" && (
              <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 py-4">
                <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
                <p className="text-sm text-foreground font-medium">Erreur lors de la complétion</p>
                <p className="text-xs text-muted-foreground">{errorMessage}</p>
                {totalCards > 0 && <p className="text-xs text-muted-foreground">{totalCards} cartes générées avec succès</p>}
                <div className="flex justify-center gap-2">
                  {failedPillars.length > 0 && (
                    <Button variant="default" size="sm" onClick={() => handleComplete(failedPillars)} className="gap-2">
                      <RotateCcw className="h-4 w-4" /> Relancer ({failedPillars.length} pilier{failedPillars.length > 1 ? "s" : ""})
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => { setGenOpen(false); onUpdate(); }}>Fermer</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
