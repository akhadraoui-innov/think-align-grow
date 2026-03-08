import { motion } from "framer-motion";
import { Layers, ArrowRight, Clock, Target } from "lucide-react";

const gamePlans = [
  { title: "Lancer sa Startup", description: "Un parcours complet pour structurer votre idée et la transformer en business viable", cards: 15, duration: "2h", difficulty: "Débutant", color: "border-primary/20" },
  { title: "Pivot Stratégique", description: "Repensez votre modèle quand le marché change", cards: 12, duration: "1h30", difficulty: "Intermédiaire", color: "border-pillar-business/20" },
  { title: "Levée de Fonds", description: "Préparez et structurez votre pitch pour convaincre les investisseurs", cards: 18, duration: "3h", difficulty: "Avancé", color: "border-pillar-finance/20" },
  { title: "Croissance Accélérée", description: "Identifiez et activez vos leviers de croissance", cards: 14, duration: "2h", difficulty: "Intermédiaire", color: "border-pillar-growth/20" },
  { title: "Innovation Disruptive", description: "Appliquez les méthodes de rupture à votre secteur", cards: 16, duration: "2h30", difficulty: "Avancé", color: "border-pillar-innovation/20" },
];

export default function Plans() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-12 pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-1">Plans de Jeu</h1>
          <p className="text-sm text-muted-foreground">Parcours guidés avec combinaisons de cartes stratégiques</p>
        </motion.div>
      </div>

      <div className="px-6 space-y-4">
        {gamePlans.map((plan, i) => (
          <motion.div
            key={plan.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-2xl border ${plan.color} bg-card p-5 card-shadow cursor-pointer hover:card-shadow-hover transition-all`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                <Layers className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                {plan.difficulty}
              </span>
            </div>

            <h3 className="font-display font-bold text-lg mb-1">{plan.title}</h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{plan.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" />
                  {plan.cards} cartes
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {plan.duration}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
