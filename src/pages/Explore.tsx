import { motion } from "framer-motion";
import { Search, Brain, Lightbulb, TrendingUp, DollarSign, Megaphone, Settings, Users, Scale, Rocket, Star, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { DotPattern } from "@/components/ui/PatternBackground";

const pillars = [
  { name: "Thinking", icon: Brain, gradient: "thinking", cards: 22, color: "border-pillar-thinking/30" },
  { name: "Business", icon: TrendingUp, gradient: "business", cards: 24, color: "border-pillar-business/30" },
  { name: "Innovation", icon: Lightbulb, gradient: "innovation", cards: 20, color: "border-pillar-innovation/30" },
  { name: "Finance", icon: DollarSign, gradient: "finance", cards: 18, color: "border-pillar-finance/30" },
  { name: "Marketing", icon: Megaphone, gradient: "marketing", cards: 21, color: "border-pillar-marketing/30" },
  { name: "Operations", icon: Settings, gradient: "primary", cards: 19, color: "border-pillar-operations/30" },
  { name: "Team", icon: Users, gradient: "team", cards: 20, color: "border-pillar-team/30" },
  { name: "Legal", icon: Scale, gradient: "accent", cards: 16, color: "border-pillar-legal/30" },
  { name: "Growth", icon: Rocket, gradient: "finance", cards: 22, color: "border-pillar-growth/30" },
  { name: "Impact", icon: Star, gradient: "impact", cards: 18, color: "border-pillar-impact/30" },
];

const phases = ["Toutes", "Fondations", "Modèle", "Croissance", "Exécution"];

export default function Explore() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-bold mb-1 uppercase tracking-tight">Explorer</h1>
          <p className="text-sm text-muted-foreground mb-5">200+ cartes réparties en 10 piliers</p>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une carte..."
              className="rounded-2xl pl-11 h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </motion.div>
      </div>

      {/* Phase pills */}
      <div className="px-6 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {phases.map((phase, i) => (
            <button
              key={phase}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                i === 0
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-secondary text-muted-foreground border border-border hover:border-primary/30"
              }`}
            >
              {phase}
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

      {/* Pillar Grid */}
      <div className="px-6">
        <div className="grid grid-cols-2 gap-3">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.04 }}
              className={`relative overflow-hidden rounded-3xl bg-card border ${pillar.color} p-5 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 hover:shadow-lg hover:shadow-primary/5`}
            >
              <GradientIcon icon={pillar.icon} gradient={pillar.gradient} size="sm" className="mb-3" />
              <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wide">
                {pillar.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{pillar.cards} cartes</p>

              {/* Decorative */}
              <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-primary/5" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
