import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SubjectCanvas } from "./SubjectCanvas";
import { ChallengeAnalysisView } from "./ChallengeAnalysis";
import {
  useChallengeStructure,
  useChallengeResponses,
  useChallengeAnalysis,
  type ChallengeTemplate,
} from "@/hooks/useChallengeData";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { supabase } from "@/integrations/supabase/client";

interface ChallengeViewProps {
  template: ChallengeTemplate;
  workshopId: string;
  cards: DbCard[];
  pillars: DbPillar[];
  isHost: boolean;
  readOnly?: boolean;
}

export function ChallengeView({ template, workshopId, cards, pillars, isHost, readOnly }: ChallengeViewProps) {
  const { subjects, slots, loading } = useChallengeStructure(template.id);
  const { responses, placeCard, removeCard } = useChallengeResponses(workshopId);
  const { data: analysis, refetch: refetchAnalysis } = useChallengeAnalysis(workshopId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Cards already placed in any slot
  const placedCardIds = useMemo(() => new Set(responses.map(r => r.card_id)), [responses]);

  const handleDrop = useCallback((slotId: string, cardId: string) => {
    const subject = subjects[currentIndex];
    if (!subject) return;
    placeCard(slotId, subject.id, cardId);
  }, [subjects, currentIndex, placeCard]);

  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-challenge", {
        body: { workshop_id: workshopId, template_id: template.id },
      });
      if (error) throw error;
      await refetchAnalysis();
      setShowAnalysis(true);
      toast.success("Analyse terminée !");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'analyse");
    } finally {
      setAnalyzing(false);
    }
  }, [workshopId, template.id, refetchAnalysis]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (showAnalysis && analysis) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setShowAnalysis(false)} className="rounded-xl">
            <ChevronLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <h2 className="font-display font-bold text-sm uppercase tracking-widest">Résultats de l'analyse</h2>
        </div>
        <ChallengeAnalysisView analysis={analysis} />
      </div>
    );
  }

  const currentSubject = subjects[currentIndex];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Stepper */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {subjects.map((subj, i) => {
            const subjSlots = slots.filter(s => s.subject_id === subj.id);
            const filled = new Set(responses.filter(r => r.subject_id === subj.id).map(r => r.slot_id)).size;
            const complete = filled >= subjSlots.length;

            return (
              <button
                key={subj.id}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                  i === currentIndex
                    ? "bg-primary text-primary-foreground"
                    : complete
                    ? "bg-pillar-finance/10 text-pillar-finance"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}
              >
                {complete && <CheckCircle2 className="h-3 w-3" />}
                <span>{i + 1}. {subj.title}</span>
              </button>
            );
          })}
        </div>

        {/* Navigation + Analyze */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-xl"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(i => i - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-xl"
            disabled={currentIndex === subjects.length - 1}
            onClick={() => setCurrentIndex(i => i + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {isHost && (
            <>
              {analysis && (
                <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setShowAnalysis(true)}>
                  Voir l'analyse
                </Button>
              )}
              <Button
                size="sm"
                className="rounded-xl font-bold"
                onClick={handleAnalyze}
                disabled={analyzing || responses.length === 0}
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                Analyser
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Current subject canvas */}
      <AnimatePresence mode="wait">
        {currentSubject && (
          <SubjectCanvas
            key={currentSubject.id}
            subject={currentSubject}
            slots={slots}
            responses={responses}
            cards={cards}
            pillars={pillars}
            onDrop={handleDrop}
            onRemove={removeCard}
            readOnly={readOnly}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
