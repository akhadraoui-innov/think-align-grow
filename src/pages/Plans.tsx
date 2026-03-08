import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Clock, Target, Sparkles, Zap, Trophy, Compass, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { DotPattern } from "@/components/ui/PatternBackground";
import { PageTransition } from "@/components/ui/PageTransition";
import { cards, type StrategyCard } from "@/data/mockCards";

interface GamePlan {
  id: string;
  title: string;
  description: string;
  cardIds: string[];
  duration: string;
  difficulty: string;
  gradient: string;
  icon: typeof Compass;
}

const gamePlans: GamePlan[] = [
  { id: "startup", title: "Lancer sa Startup", description: "Structurez votre idée et transformez-la en business viable", cardIds: ["b2", "b5", "b4", "i1", "i2", "i5", "t1", "t5", "f6", "f1", "m1", "te1", "l1", "im1", "g1"], duration: "2h", difficulty: "Débutant", gradient: "accent", icon: Compass },
  { id: "pivot", title: "Pivot Stratégique", description: "Repensez votre modèle quand le marché change", cardIds: ["t3", "t4", "b3", "b7", "i3", "i6", "f3", "f5", "m4", "o2", "g1", "g4"], duration: "1h30", difficulty: "Intermédiaire", gradient: "business", icon: Zap },
  { id: "funding", title: "Levée de Fonds", description: "Préparez votre pitch pour convaincre les investisseurs", cardIds: ["f1", "f2", "f4", "b1", "b6", "b8", "t7", "t8", "m1", "m4", "g2", "g3", "g4", "im1", "im2", "te1", "te2", "l2"], duration: "3h", difficulty: "Avancé", gradient: "finance", icon: Trophy },
  { id: "growth", title: "Croissance Accélérée", description: "Identifiez et activez vos leviers de croissance", cardIds: ["g1", "g2", "g3", "g4", "m2", "m5", "b6", "b8", "f1", "o4", "t4", "t8", "i6", "te3"], duration: "2h", difficulty: "Intermédiaire", gradient: "thinking", icon: Sparkles },
  { id: "disrupt", title: "Innovation Disruptive", description: "Méthodes de rupture appliquées à votre secteur", cardIds: ["i1", "i2", "i3", "i4", "i5", "i6", "t1", "t2", "t5", "b3", "b7", "m2", "g2", "g3", "im2", "te2"], duration: "2h30", difficulty: "Avancé", gradient: "innovation", icon: Zap },
];

const difficultyColors: Record<string, string> = {
  "Débutant": "bg-pillar-finance/20 text-pillar-finance",
  "Intermédiaire": "bg-pillar-business/20 text-pillar-business",
  "Avancé": "bg-pillar-thinking/20 text-pillar-thinking",
};

export default function Plans() {
  const [activePlan, setActivePlan] = useState<GamePlan | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  if (activePlan) {
    const planCards = activePlan.cardIds.map(id => cards.find(c => c.id === id)).filter(Boolean) as StrategyCard[];
    const card = planCards[currentStep];
    const progress = ((completedSteps.size) / planCards.length) * 100;

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

            <h1 className="font-display text-2xl font-bold uppercase tracking-tight mb-1">{activePlan.title}</h1>
            <p className="text-sm text-muted-foreground mb-4">Étape {currentStep + 1} / {planCards.length}</p>

            {/* Progress */}
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-6">
              <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>

          {/* Card display */}
          <div className="px-6">
            <AnimatePresence mode="wait">
              {card && (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-3xl bg-card border border-border p-6 relative overflow-hidden"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary mb-2 block">
                    {card.pillar} · {card.phase}
                  </span>
                  <h2 className="font-display font-bold text-xl text-foreground uppercase tracking-wide mb-3">{card.title}</h2>
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{card.definition}</p>

                  <div className="rounded-2xl bg-secondary/60 p-4 mb-4 border border-border">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary block mb-1">Action</span>
                    <p className="text-sm text-foreground">{card.action}</p>
                  </div>

                  <div className="rounded-2xl bg-secondary/60 p-4 border border-border">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary block mb-1">KPI</span>
                    <p className="text-sm text-muted-foreground">{card.kpi}</p>
                  </div>

                  {completedSteps.has(currentStep) && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle2 className="h-6 w-6 text-pillar-finance" />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="flex-1 rounded-2xl h-12"
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Précédent
              </Button>

              {!completedSteps.has(currentStep) ? (
                <Button
                  onClick={() => setCompletedSteps(new Set([...completedSteps, currentStep]))}
                  className="flex-1 rounded-2xl h-12 font-bold uppercase tracking-wide"
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Valider
                </Button>
              ) : currentStep < planCards.length - 1 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex-1 rounded-2xl h-12 font-bold uppercase tracking-wide"
                >
                  Suivant <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => { setActivePlan(null); setCurrentStep(0); setCompletedSteps(new Set()); }}
                  className="flex-1 rounded-2xl h-12 font-bold uppercase tracking-wide bg-pillar-finance text-foreground hover:bg-pillar-finance/80"
                >
                  <Trophy className="mr-1 h-4 w-4" /> Terminé !
                </Button>
              )}
            </div>

            {/* Step dots */}
            <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
              {planCards.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    i === currentStep ? "bg-primary w-6" :
                    completedSteps.has(i) ? "bg-pillar-finance" : "bg-border"
                  }`}
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
              <h3 className="font-display text-xl font-bold text-foreground uppercase tracking-tight mb-1">
                Mission #1 : Validate
              </h3>
              <p className="text-sm text-foreground/60 mb-3">Validez votre idée en 15 cartes stratégiques.</p>
              <div className="flex items-center gap-4 text-xs text-foreground/50 font-medium">
                <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5" /> 15 cartes</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 2h</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="px-6 space-y-3">
          {gamePlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              onClick={() => setActivePlan(plan)}
              className="rounded-3xl bg-card border border-border p-5 cursor-pointer hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="flex items-start gap-4">
                <GradientIcon icon={plan.icon} gradient={plan.gradient} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wide">{plan.title}</h3>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{plan.description}</p>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${difficultyColors[plan.difficulty]}`}>
                      {plan.difficulty}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Target className="h-3 w-3" /> {plan.cardIds.length}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {plan.duration}
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
