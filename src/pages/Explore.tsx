import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Brain, Lightbulb, TrendingUp, DollarSign, Megaphone, Settings, Users, Scale, Rocket, Star, Sparkles, ArrowLeft, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { DotPattern } from "@/components/ui/PatternBackground";
import { FlipCard } from "@/components/ui/FlipCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { cards, getCardsByPillar, searchCards, type PillarId, type PhaseId } from "@/data/mockCards";

const pillarMeta: { id: PillarId; name: string; icon: typeof Brain; gradient: string }[] = [
  { id: "thinking", name: "Thinking", icon: Brain, gradient: "thinking" },
  { id: "business", name: "Business", icon: TrendingUp, gradient: "business" },
  { id: "innovation", name: "Innovation", icon: Lightbulb, gradient: "innovation" },
  { id: "finance", name: "Finance", icon: DollarSign, gradient: "finance" },
  { id: "marketing", name: "Marketing", icon: Megaphone, gradient: "marketing" },
  { id: "operations", name: "Operations", icon: Settings, gradient: "primary" },
  { id: "team", name: "Team", icon: Users, gradient: "team" },
  { id: "legal", name: "Legal", icon: Scale, gradient: "accent" },
  { id: "growth", name: "Growth", icon: Rocket, gradient: "finance" },
  { id: "impact", name: "Impact", icon: Star, gradient: "impact" },
];

const phases: { id: PhaseId | "all"; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "fondations", label: "Fondations" },
  { id: "modele", label: "Modèle" },
  { id: "croissance", label: "Croissance" },
  { id: "execution", label: "Exécution" },
];

export default function Explore() {
  const [selectedPillar, setSelectedPillar] = useState<PillarId | null>(null);
  const [activePhase, setActivePhase] = useState<PhaseId | "all">("all");
  const [query, setQuery] = useState("");

  const filteredCards = useMemo(() => {
    let result = selectedPillar ? getCardsByPillar(selectedPillar) : (query ? searchCards(query) : cards);
    if (activePhase !== "all") result = result.filter(c => c.phase === activePhase);
    return result;
  }, [selectedPillar, activePhase, query]);

  // Pillar detail view
  if (selectedPillar) {
    const meta = pillarMeta.find(p => p.id === selectedPillar)!;
    return (
      <PageTransition>
        <div className="min-h-screen bg-background pb-24">
          <div className="px-6 pt-10 pb-4">
            <button
              onClick={() => setSelectedPillar(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>
            <div className="flex items-center gap-3 mb-4">
              <GradientIcon icon={meta.icon} gradient={meta.gradient} size="md" />
              <div>
                <h1 className="font-display text-3xl font-bold uppercase tracking-tight">{meta.name}</h1>
                <p className="text-sm text-muted-foreground">{filteredCards.length} cartes</p>
              </div>
            </div>

            {/* Phase filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {phases.map((phase) => (
                <button
                  key={phase.id}
                  onClick={() => setActivePhase(phase.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    activePhase === phase.id
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-secondary text-muted-foreground border border-border hover:border-primary/30"
                  }`}
                >
                  {phase.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <FlipCard card={card} />
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredCards.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Aucune carte pour cette phase.</p>
            )}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="px-6 pt-12 pb-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl font-bold mb-1 uppercase tracking-tight">Explorer</h1>
            <p className="text-sm text-muted-foreground mb-5">{cards.length} cartes réparties en 10 piliers</p>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une carte..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-2xl pl-11 h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Search results */}
        {query ? (
          <div className="px-6 space-y-3">
            <p className="text-xs text-muted-foreground mb-2">{filteredCards.length} résultats</p>
            {filteredCards.map((card, i) => (
              <motion.div key={card.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <FlipCard card={card} />
              </motion.div>
            ))}
          </div>
        ) : (
          <>
            {/* Phase pills */}
            <div className="px-6 mb-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {phases.map((phase, i) => (
                  <button
                    key={phase.id}
                    onClick={() => setActivePhase(phase.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                      activePhase === phase.id
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-secondary text-muted-foreground border border-border hover:border-primary/30"
                    }`}
                  >
                    {phase.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured card */}
            <div className="px-6 mb-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="rounded-3xl bg-gradient-to-br from-primary to-pillar-thinking p-5 relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
                onClick={() => setSelectedPillar("business")}
              >
                <DotPattern className="opacity-[0.06]" />
                <div className="relative flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/10">
                    <Sparkles className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-foreground/60 mb-0.5">
                      Carte du jour
                    </p>
                    <h3 className="font-display font-bold text-base text-primary-foreground uppercase tracking-wide">
                      Blue Ocean Strategy
                    </h3>
                    <p className="text-xs text-primary-foreground/60 mt-0.5">Pilier Business · Phase Modèle</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Horizontal pillar scroll */}
            <div className="px-6 mb-4">
              <h2 className="font-display text-lg font-bold mb-3 uppercase tracking-tight">Piliers</h2>
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-6 px-6">
                {pillarMeta.map((pillar, i) => {
                  const count = cards.filter(c => c.pillar === pillar.id && (activePhase === "all" || c.phase === activePhase)).length;
                  return (
                    <motion.button
                      key={pillar.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.04 }}
                      onClick={() => setSelectedPillar(pillar.id)}
                      className="shrink-0 w-32 rounded-3xl bg-card border border-border p-4 text-left hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-95 transition-all"
                    >
                      <GradientIcon icon={pillar.icon} gradient={pillar.gradient} size="sm" className="mb-2" />
                      <h3 className="font-display font-bold text-xs text-foreground uppercase tracking-wide">{pillar.name}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{count} cartes</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Grid of pillars */}
            <div className="px-6">
              <h2 className="font-display text-lg font-bold mb-3 uppercase tracking-tight">Tous les piliers</h2>
              <div className="grid grid-cols-2 gap-3">
                {pillarMeta.map((pillar, i) => {
                  const count = cards.filter(c => c.pillar === pillar.id && (activePhase === "all" || c.phase === activePhase)).length;
                  return (
                    <motion.div
                      key={pillar.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.04 }}
                      onClick={() => setSelectedPillar(pillar.id)}
                      className="relative overflow-hidden rounded-3xl bg-card border border-border p-5 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 hover:shadow-lg hover:shadow-primary/5"
                    >
                      <GradientIcon icon={pillar.icon} gradient={pillar.gradient} size="sm" className="mb-3" />
                      <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wide">{pillar.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{count} cartes</p>
                      <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-primary/5" />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
