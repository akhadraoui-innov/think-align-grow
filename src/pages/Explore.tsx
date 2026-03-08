import { motion } from "framer-motion";
import { Search, Brain, Lightbulb, TrendingUp, DollarSign, Megaphone, Settings, Users, Scale, Rocket, Star } from "lucide-react";
import { Input } from "@/components/ui/input";

const pillars = [
  { name: "THINKING", icon: Brain, bg: "bg-pillar-thinking", cards: 22 },
  { name: "BUSINESS", icon: TrendingUp, bg: "bg-pillar-business", cards: 24 },
  { name: "INNOVATION", icon: Lightbulb, bg: "bg-pillar-innovation", cards: 20 },
  { name: "FINANCE", icon: DollarSign, bg: "bg-pillar-finance", cards: 18 },
  { name: "MARKETING", icon: Megaphone, bg: "bg-pillar-marketing", cards: 21 },
  { name: "OPERATIONS", icon: Settings, bg: "bg-pillar-operations", cards: 19 },
  { name: "TEAM", icon: Users, bg: "bg-pillar-team", cards: 20 },
  { name: "LEGAL", icon: Scale, bg: "bg-pillar-legal", cards: 16 },
  { name: "GROWTH", icon: Rocket, bg: "bg-pillar-growth", cards: 22 },
  { name: "IMPACT", icon: Star, bg: "bg-pillar-impact", cards: 18 },
];

const phases = ["Toutes", "Fondations", "Modèle", "Croissance", "Exécution"];

export default function Explore() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
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
      <div className="px-6 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {phases.map((phase, i) => (
            <button
              key={phase}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                i === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground border border-border hover:bg-border"
              }`}
            >
              {phase}
            </button>
          ))}
        </div>
      </div>

      {/* Pillar Grid */}
      <div className="px-6">
        <div className="grid grid-cols-2 gap-3">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`relative overflow-hidden rounded-3xl ${pillar.bg} p-5 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-transform`}
              >
                <Icon className="h-7 w-7 text-foreground mb-3" />
                <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wide">{pillar.name}</h3>
                <p className="text-xs text-foreground/60 mt-0.5">{pillar.cards} cartes</p>

                {/* Decorative */}
                <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-foreground/5" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
