import { motion } from "framer-motion";
import { ArrowRight, Clock, Target } from "lucide-react";

const gamePlans = [
  { title: "LANCER SA STARTUP", description: "Structurez votre idée et transformez-la en business viable", cards: 15, duration: "2h", difficulty: "Débutant", bg: "bg-accent" },
  { title: "PIVOT STRATÉGIQUE", description: "Repensez votre modèle quand le marché change", cards: 12, duration: "1h30", difficulty: "Intermédiaire", bg: "bg-pillar-business" },
  { title: "LEVÉE DE FONDS", description: "Préparez votre pitch pour convaincre les investisseurs", cards: 18, duration: "3h", difficulty: "Avancé", bg: "bg-pillar-finance" },
  { title: "CROISSANCE ACCÉLÉRÉE", description: "Identifiez et activez vos leviers de croissance", cards: 14, duration: "2h", difficulty: "Intermédiaire", bg: "bg-pillar-growth" },
  { title: "INNOVATION DISRUPTIVE", description: "Méthodes de rupture appliquées à votre secteur", cards: 16, duration: "2h30", difficulty: "Avancé", bg: "bg-pillar-thinking" },
];

export default function Plans() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-12 pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-bold mb-1 uppercase tracking-tight">Plans de Jeu</h1>
          <p className="text-sm text-muted-foreground">Parcours guidés avec combinaisons stratégiques</p>
        </motion.div>
      </div>

      <div className="px-6 space-y-4">
        {gamePlans.map((plan, i) => (
          <motion.div
            key={plan.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`rounded-3xl ${plan.bg} p-6 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform relative overflow-hidden`}
          >
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-foreground/5" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-full bg-background/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground">
                  {plan.difficulty}
                </span>
                <ArrowRight className="h-5 w-5 text-foreground/60" />
              </div>

              <h3 className="font-display font-bold text-xl text-foreground mb-1 tracking-tight">{plan.title}</h3>
              <p className="text-sm text-foreground/60 mb-4 line-clamp-2">{plan.description}</p>

              <div className="flex items-center gap-4 text-xs text-foreground/50 font-medium">
                <span className="flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" />
                  {plan.cards} cartes
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {plan.duration}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
