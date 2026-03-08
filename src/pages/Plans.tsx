import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Clock, Target, Sparkles, Trophy, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { DotPattern } from "@/components/ui/PatternBackground";
import { PageTransition } from "@/components/ui/PageTransition";
import { useGamePlans, useGamePlanSteps, usePillars, PHASE_LABELS } from "@/hooks/useToolkitData";
import type { DbGamePlan } from "@/hooks/useToolkitData";

const difficultyColors: Record<string, string> = {
  beginner: "bg-pillar-finance/20 text-pillar-finance",
  intermediate: "bg-pillar-business/20 text-pillar-business",
  advanced: "bg-pillar-thinking/20 text-pillar-thinking",
};

const difficultyLabels: Record<string, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
};

export default function Plans() {
  const { data: gamePlans, isLoading } = useGamePlans();
  const { data: pillars } = usePillars();
  const [activePlan, setActivePlan] = useState<DbGamePlan | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const { data: steps } = useGamePlanSteps(activePlan?.id || null);

  const pillarMap = Object.fromEntries((pillars || []).map(p => [p.id, p]));

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Chargement...</p>
        </div>
      </PageTransition>
    );
  }

  if (activePlan && steps?.length) {
    const step = steps[currentStep];
    const card = step?.cards as any; // joined card data
    const progress = (completedSteps.size / steps.length) * 100;

    return (
      <PageTransition>
        <div className="min-h-screen bg-background pb-24">
          <div className="px-6 pt-10 pb-4">
            <button
              onClick={() => { setActivePlan(null); setCurrentStep(0); setCompletedSteps(new Set()); }}
              className="flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>

            <h1 className="font-display text-2xl font-bold uppercase tracking-tight mb-1">{activePlan.name}</h1>
            <p className="text-sm text-muted-foreground mb-4">Étape {currentStep + 1} / {steps.length}</p>

            <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-6">
              <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>

          <div className="px-6">
            <AnimatePresence mode="wait">
              {step && (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-3xl bg-card border border-border p-6 relative overflow-hidden"
                >
                  {card && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary mb-2 block">
                      {pillarMap[card.pillar_id]?.name || ""} · {PHASE_LABELS[card.phase] || card.phase}
                    </span>
                  )}
                  <h2 className="font-display font-bold text-xl text-foreground uppercase tracking-wide mb-3">{step.title}</h2>
                  
                  {step.instruction && (
                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{step.instruction}</p>
                  )}

                  {card?.definition && (
                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{card.definition}</p>
                  )}

                  {card?.action && (
                    <div className="rounded-2xl bg-secondary/60 p-4 mb-4 border border-border">
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary block mb-1">Action</span>
                      <p className="text-sm text-foreground">{card.action}</p>
                    </div>
                  )}

                  {card?.kpi && (
                    <div className="rounded-2xl bg-secondary/60 p-4 border border-border">
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary block mb-1">KPI</span>
                      <p className="text-sm text-muted-foreground">{card.kpi}</p>
                    </div>
                  )}

                  {completedSteps.has(currentStep) && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle2 className="h-6 w-6 text-pillar-finance" />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3 mt-6">
              <Button variant="outline" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} className="flex-1 rounded-2xl h-12">
                <ArrowLeft className="mr-1 h-4 w-4" /> Précédent
              </Button>
              {!completedSteps.has(currentStep) ? (
                <Button onClick={() => setCompletedSteps(new Set([...completedSteps, currentStep]))} className="flex-1 rounded-2xl h-12 font-bold uppercase tracking-wide">
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Valider
                </Button>
              ) : currentStep < steps.length - 1 ? (
                <Button onClick={() => setCurrentStep(currentStep + 1)} className="flex-1 rounded-2xl h-12 font-bold uppercase tracking-wide">
                  Suivant <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => { setActivePlan(null); setCurrentStep(0); setCompletedSteps(new Set()); }}
                  className="flex-1 rounded-2xl h-12 font-bold uppercase tracking-wide bg-pillar-finance text-foreground hover:bg-pillar-finance/80">
                  <Trophy className="mr-1 h-4 w-4" /> Terminé !
                </Button>
              )}
            </div>

            <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
              {steps.map((_, i) => (
                <button key={i} onClick={() => setCurrentStep(i)}
                  className={`h-2 w-2 rounded-full transition-all ${i === currentStep ? "bg-primary w-6" : completedSteps.has(i) ? "bg-pillar-finance" : "bg-border"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-6 pt-12 pb-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl font-bold mb-1 uppercase tracking-tight">Plans de Jeu</h1>
            <p className="text-sm text-muted-foreground">Parcours guidés avec combinaisons stratégiques</p>
          </motion.div>
        </div>

        {/* Featured */}
        {gamePlans?.[0] && (
          <div className="px-6 mb-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              onClick={() => setActivePlan(gamePlans[0])}
              className="rounded-3xl bg-gradient-to-br from-accent to-pillar-marketing p-6 relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
            >
              <DotPattern className="opacity-[0.06]" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/60">Recommandé</span>
                </div>
                <h3 className="font-display text-xl font-bold text-foreground uppercase tracking-tight mb-1">{gamePlans[0].name}</h3>
                <p className="text-sm text-foreground/60 mb-3">{gamePlans[0].description}</p>
                <div className="flex items-center gap-4 text-xs text-foreground/50 font-medium">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {gamePlans[0].estimated_minutes} min</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <div className="px-6 space-y-3">
          {(gamePlans || []).map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              onClick={() => setActivePlan(plan)}
              className="rounded-3xl bg-card border border-border p-5 cursor-pointer hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="flex items-start gap-4">
                <GradientIcon icon={Target} gradient="accent" size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wide">{plan.name}</h3>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{plan.description}</p>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${difficultyColors[plan.difficulty || "intermediate"]}`}>
                      {difficultyLabels[plan.difficulty || "intermediate"]}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {plan.estimated_minutes} min
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
