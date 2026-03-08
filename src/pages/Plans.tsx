import { motion } from "framer-motion";
import { ArrowRight, Clock, Target, Sparkles, Zap, Trophy, Compass } from "lucide-react";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { DotPattern } from "@/components/ui/PatternBackground";

const gamePlans = [
  { title: "Lancer sa Startup", description: "Structurez votre idée et transformez-la en business viable", cards: 15, duration: "2h", difficulty: "Débutant", gradient: "accent", icon: Compass },
  { title: "Pivot Stratégique", description: "Repensez votre modèle quand le marché change", cards: 12, duration: "1h30", difficulty: "Intermédiaire", gradient: "business", icon: Zap },
  { title: "Levée de Fonds", description: "Préparez votre pitch pour convaincre les investisseurs", cards: 18, duration: "3h", difficulty: "Avancé", gradient: "finance", icon: Trophy },
  { title: "Croissance Accélérée", description: "Identifiez et activez vos leviers de croissance", cards: 14, duration: "2h", difficulty: "Intermédiaire", gradient: "thinking", icon: Sparkles },
  { title: "Innovation Disruptive", description: "Méthodes de rupture appliquées à votre secteur", cards: 16, duration: "2h30", difficulty: "Avancé", gradient: "innovation", icon: Zap },
];

const difficultyColors: Record<string, string> = {
  "Débutant": "bg-pillar-finance/20 text-pillar-finance",
  "Intermédiaire": "bg-pillar-business/20 text-pillar-business",
  "Avancé": "bg-pillar-thinking/20 text-pillar-thinking",
};

export default function Plans() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-12 pb-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-bold mb-1 uppercase tracking-tight">Plans de Jeu</h1>
          <p className="text-sm text-muted-foreground">Parcours guidés avec combinaisons stratégiques</p>
        </motion.div>
      </div>

      {/* Featured plan */}
      <div className="px-6 mb-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl bg-gradient-to-br from-accent to-pillar-marketing p-6 relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
        >
          <DotPattern className="opacity-[0.06]" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/60">
                Recommandé pour commencer
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-foreground uppercase tracking-tight mb-1">
              Mission #1 : Validate
            </h3>
            <p className="text-sm text-foreground/60 mb-3">
              Validez votre idée en 8 cartes stratégiques essentielles.
            </p>
            <div className="flex items-center gap-4 text-xs text-foreground/50 font-medium">
              <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5" /> 8 cartes</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 45min</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-6 space-y-3">
        {gamePlans.map((plan, i) => (
          <motion.div
            key={plan.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
            className="rounded-3xl bg-card border border-border p-5 cursor-pointer hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <GradientIcon icon={plan.icon} gradient={plan.gradient} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wide">
                    {plan.title}
                  </h3>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{plan.description}</p>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${difficultyColors[plan.difficulty]}`}>
                    {plan.difficulty}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Target className="h-3 w-3" /> {plan.cards}
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
  );
}
