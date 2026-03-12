import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, AlertTriangle, Check, Clock, CircleDot, PartyPopper, ArrowRight, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleComplete = useCallback(async () => {
    setGenOpen(true);
    setPhase("generating");
    setTimeline([{ id: "start", label: "Analyse du toolkit", status: "active" }]);
    setTotalCards(0);
    setTotalQuiz(0);
    setElapsed(0);
    setErrorMessage("");
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non connecté");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-toolkit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          mode: "complete_missing",
          toolkit_id: toolkit.id,
          generate_quiz: !hasQuiz,
        }),
      });

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

          if (data.type === "progress") {
            switch (data.step) {
              case "toolkit_created":
              case "analysis_done":
                setTimeline(prev => prev.map(t => t.id === "start" ? { ...t, status: "done", detail: "✓" } : t));
                break;
              case "cards_generating":
                setTimeline(prev => [...prev, { id: `cards-${data.index}`, label: data.pillar, status: "active", detail: "Génération..." }]);
                break;
              case "cards_done":
                setTimeline(prev => prev.map(t => t.label === data.pillar && t.status === "active" ? { ...t, status: "done", detail: `${data.count} cartes` } : t));
                setTotalCards(prev => prev + data.count);
                break;
              case "quiz_generating":
                setTimeline(prev => [...prev, { id: `quiz-${data.pillar}`, label: `Quiz — ${data.pillar}`, status: "active" }]);
                break;
              case "quiz_done":
                setTimeline(prev => prev.map(t => t.id === `quiz-${data.pillar}` ? { ...t, status: "done", detail: `${data.count} questions` } : t));
                setTotalQuiz(prev => prev + data.count);
                break;
            }
          } else if (data.type === "complete") {
            if (timerRef.current) clearInterval(timerRef.current);
            setPhase("complete");
            setTotalCards(data.cards || 0);
            setTotalQuiz(data.quiz || 0);
            onUpdate();
          } else if (data.type === "error") {
            throw new Error(data.message);
          }
        }
      }
    } catch (e: any) {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase("error");
      setErrorMessage(e.message);
    }
  }, [toolkit.id, hasQuiz, onUpdate]);

  if (missingItems.length === 0) return null;

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
        <Button size="sm" onClick={handleComplete} className="gap-2 shrink-0">
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
                      <span className={t.status === "done" ? "text-muted-foreground" : "text-foreground"}>{t.label}</span>
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
                {totalCards > 0 && <p className="text-xs text-muted-foreground">{totalCards} cartes générées avant l'erreur</p>}
                <Button variant="outline" onClick={() => { setGenOpen(false); onUpdate(); }}>Fermer</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
