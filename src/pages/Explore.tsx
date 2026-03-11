import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Brain, Lightbulb, TrendingUp, Briefcase, BarChart3, Hammer, Users, Shield, Heart, Sparkles, ArrowLeft, X, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { DotPattern } from "@/components/ui/PatternBackground";
import { FlipCard } from "@/components/ui/FlipCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { usePillars, useCards, getPillarGradient, PHASE_LABELS } from "@/hooks/useToolkitData";
import type { DbPillar, DbCard } from "@/hooks/useToolkitData";

const iconMap: Record<string, typeof Brain> = {
  Brain, Briefcase, Lightbulb, TrendingUp, BarChart3, Hammer, Users, Shield, Heart, Wallet,
};

const phases = [
  { id: "all", label: "Toutes" },
  { id: "foundations", label: "Fondations" },
  { id: "model", label: "Modèle" },
  { id: "growth", label: "Croissance" },
  { id: "execution", label: "Exécution" },
];

export default function Explore() {
  const { data: pillars, isLoading: loadingPillars } = usePillars();
  const { data: allCards, isLoading: loadingCards } = useCards();
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState("all");
  const [query, setQuery] = useState("");

  const pillarMap = useMemo(() => {
    const m: Record<string, DbPillar> = {};
    pillars?.forEach(p => { m[p.id] = p; });
    return m;
  }, [pillars]);

  const selectedPillar = selectedPillarId ? pillarMap[selectedPillarId] : null;

  const filteredCards = useMemo(() => {
    let result = allCards || [];
    if (selectedPillarId) result = result.filter(c => c.pillar_id === selectedPillarId);
    if (query) {
      const q = query.toLowerCase();
      result = (allCards || []).filter(c =>
        c.title.toLowerCase().includes(q) ||
        (c.definition || "").toLowerCase().includes(q)
      );
    }
    if (activePhase !== "all") result = result.filter(c => c.phase === activePhase);
    return result;
  }, [selectedPillarId, activePhase, query, allCards]);

  const getCardCount = (pillarId: string) => {
    return (allCards || []).filter(c => c.pillar_id === pillarId && (activePhase === "all" || c.phase === activePhase)).length;
  };

  const getPillarSlug = (pillarId: string) => pillarMap[pillarId]?.slug || "business";
  const getPillarIcon = (p: DbPillar) => iconMap[p.icon_name || "Brain"] || Brain;

  if (loadingPillars || loadingCards) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Chargement...</p>
        </div>
      </PageTransition>
    );
  }

  // Pillar detail view
  if (selectedPillar) {
    const Icon = getPillarIcon(selectedPillar);
    return (
      <PageTransition>
        <div className="min-h-screen bg-background pb-24">
          <div className="px-6 pt-10 pb-4">
            <button
              onClick={() => setSelectedPillarId(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>
            <div className="flex items-center gap-3 mb-4">
              <GradientIcon icon={Icon} gradient={getPillarGradient(selectedPillar.slug, selectedPillar.color)} size="md" />
              <div>
                <h1 className="font-display text-3xl font-bold uppercase tracking-tight">{selectedPillar.name}</h1>
                <p className="text-sm text-muted-foreground">{filteredCards.length} cartes</p>
              </div>
            </div>
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
                  <FlipCard card={card} pillarSlug={getPillarSlug(card.pillar_id)} />
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
        <div className="px-6 pt-12 pb-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl font-bold mb-1 uppercase tracking-tight">Explorer</h1>
            <p className="text-sm text-muted-foreground mb-5">{(allCards || []).length} cartes réparties en {(pillars || []).length} piliers</p>

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

        {query ? (
          <div className="px-6 space-y-3">
            <p className="text-xs text-muted-foreground mb-2">{filteredCards.length} résultats</p>
            {filteredCards.map((card, i) => (
              <motion.div key={card.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <FlipCard card={card} pillarSlug={getPillarSlug(card.pillar_id)} />
              </motion.div>
            ))}
          </div>
        ) : (
          <>
            <div className="px-6 mb-4">
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

            {/* Featured card */}
            {allCards?.[0] && (
              <div className="px-6 mb-5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-3xl bg-gradient-to-br from-primary to-pillar-thinking p-5 relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
                  onClick={() => setSelectedPillarId(allCards[0].pillar_id)}
                >
                  <DotPattern className="opacity-[0.06]" />
                  <div className="relative flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/10">
                      <Sparkles className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-foreground/60 mb-0.5">Carte du jour</p>
                      <h3 className="font-display font-bold text-base text-primary-foreground uppercase tracking-wide">{allCards[0].title}</h3>
                      <p className="text-xs text-primary-foreground/60 mt-0.5">{PHASE_LABELS[allCards[0].phase]}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Horizontal pillar scroll */}
            <div className="px-6 mb-4">
              <h2 className="font-display text-lg font-bold mb-3 uppercase tracking-tight">Piliers</h2>
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-6 px-6">
                {(pillars || []).map((pillar, i) => {
                  const Icon = getPillarIcon(pillar);
                  return (
                    <motion.button
                      key={pillar.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.04 }}
                      onClick={() => setSelectedPillarId(pillar.id)}
                      className="shrink-0 w-32 rounded-3xl bg-card border border-border p-4 text-left hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-95 transition-all"
                    >
                      <GradientIcon icon={Icon} gradient={getPillarGradient(pillar.slug)} size="sm" className="mb-2" />
                      <h3 className="font-display font-bold text-xs text-foreground uppercase tracking-wide">{pillar.name}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{getCardCount(pillar.id)} cartes</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Grid */}
            <div className="px-6">
              <h2 className="font-display text-lg font-bold mb-3 uppercase tracking-tight">Tous les piliers</h2>
              <div className="grid grid-cols-2 gap-3">
                {(pillars || []).map((pillar, i) => {
                  const Icon = getPillarIcon(pillar);
                  return (
                    <motion.div
                      key={pillar.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.04 }}
                      onClick={() => setSelectedPillarId(pillar.id)}
                      className="relative overflow-hidden rounded-3xl bg-card border border-border p-5 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 hover:shadow-lg hover:shadow-primary/5"
                    >
                      <GradientIcon icon={Icon} gradient={getPillarGradient(pillar.slug)} size="sm" className="mb-3" />
                      <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wide">{pillar.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{getCardCount(pillar.id)} cartes</p>
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
