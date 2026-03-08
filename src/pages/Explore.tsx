import { motion } from "framer-motion";
import { Search, Brain, Lightbulb, TrendingUp, DollarSign, Megaphone, Settings, Users, Scale, Rocket, Star } from "lucide-react";
import { Input } from "@/components/ui/input";

const pillars = [
  { name: "Thinking", icon: Brain, color: "bg-pillar-thinking", lightColor: "bg-pillar-thinking-light", textColor: "text-pillar-thinking", cards: 22 },
  { name: "Business", icon: TrendingUp, color: "bg-pillar-business", lightColor: "bg-pillar-business-light", textColor: "text-pillar-business", cards: 24 },
  { name: "Innovation", icon: Lightbulb, color: "bg-pillar-innovation", lightColor: "bg-pillar-innovation-light", textColor: "text-pillar-innovation", cards: 20 },
  { name: "Finance", icon: DollarSign, color: "bg-pillar-finance", lightColor: "bg-pillar-finance-light", textColor: "text-pillar-finance", cards: 18 },
  { name: "Marketing", icon: Megaphone, color: "bg-pillar-marketing", lightColor: "bg-pillar-marketing-light", textColor: "text-pillar-marketing", cards: 21 },
  { name: "Operations", icon: Settings, color: "bg-pillar-operations", lightColor: "bg-pillar-operations-light", textColor: "text-pillar-operations", cards: 19 },
  { name: "Team", icon: Users, color: "bg-pillar-team", lightColor: "bg-pillar-team-light", textColor: "text-pillar-team", cards: 20 },
  { name: "Legal", icon: Scale, color: "bg-pillar-legal", lightColor: "bg-pillar-legal-light", textColor: "text-pillar-legal", cards: 16 },
  { name: "Growth", icon: Rocket, color: "bg-pillar-growth", lightColor: "bg-pillar-growth-light", textColor: "text-pillar-growth", cards: 22 },
  { name: "Impact", icon: Star, color: "bg-pillar-impact", lightColor: "bg-pillar-impact-light", textColor: "text-pillar-impact", cards: 18 },
];

export default function Explore() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-1">Explorer</h1>
          <p className="text-sm text-muted-foreground mb-5">200+ cartes stratégiques réparties en 10 piliers</p>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une carte, un concept..."
              className="rounded-2xl pl-11 h-12 bg-card border-border"
            />
          </div>
        </motion.div>
      </div>

      {/* Phase filters */}
      <div className="px-6 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {["Toutes", "Fondations", "Modèle", "Croissance", "Exécution"].map((phase, i) => (
            <button
              key={phase}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                i === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border hover:bg-accent"
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
                transition={{ delay: i * 0.05 }}
                className={`relative overflow-hidden rounded-2xl ${pillar.lightColor} p-5 cursor-pointer card-shadow hover:card-shadow-hover transition-all hover:scale-[1.02] active:scale-[0.98]`}
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${pillar.color}/20 mb-3`}>
                  <Icon className={`h-5 w-5 ${pillar.textColor}`} />
                </div>
                <h3 className={`font-display font-bold text-base ${pillar.textColor}`}>{pillar.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{pillar.cards} cartes</p>

                {/* Decorative circle */}
                <div className={`absolute -bottom-4 -right-4 h-20 w-20 rounded-full ${pillar.color}/5`} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
