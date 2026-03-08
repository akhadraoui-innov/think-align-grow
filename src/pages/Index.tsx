import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Layers, Gamepad2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

const phases = [
  {
    name: "Fondations",
    description: "Posez les bases de votre réflexion stratégique",
    icon: Brain,
    color: "bg-primary/10 text-primary",
    borderColor: "border-primary/20",
  },
  {
    name: "Modèle",
    description: "Structurez votre modèle d'affaires",
    icon: Layers,
    color: "bg-pillar-business/10 text-pillar-business",
    borderColor: "border-pillar-business/20",
  },
  {
    name: "Croissance",
    description: "Accélérez et scalez votre stratégie",
    icon: Sparkles,
    color: "bg-pillar-finance/10 text-pillar-finance",
    borderColor: "border-pillar-finance/20",
  },
  {
    name: "Exécution",
    description: "Passez à l'action avec des livrables concrets",
    icon: Gamepad2,
    color: "bg-pillar-thinking/10 text-pillar-thinking",
    borderColor: "border-pillar-thinking/20",
  },
];

const stats = [
  { value: "200+", label: "Cartes stratégiques" },
  { value: "10", label: "Piliers d'expertise" },
  { value: "4", label: "Phases de maturité" },
  { value: "10+", label: "Plans de jeu" },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-12">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pillar-thinking/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-accent-foreground">Serious Game Stratégique</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-4">
            L'Innovation est
            <br />
            un <span className="text-gradient-hero">Chaos.</span>
            <br />
            <span className="text-gradient-hero">Structurez-la.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-md mb-8 leading-relaxed">
            200+ cartes stratégiques, des plans de jeu interactifs et l'IA pour challenger, structurer et orchestrer vos réflexions.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="rounded-2xl bg-gradient-hero text-primary-foreground font-semibold h-13 px-8 text-base"
              onClick={() => navigate("/explore")}
            >
              Explorer gratuitement
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl h-13 px-8 text-base font-semibold"
              onClick={() => navigate("/auth")}
            >
              Créer un compte
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="rounded-2xl bg-card p-4 text-center card-shadow"
            >
              <div className="font-display text-2xl font-bold text-gradient-hero">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Phases */}
      <section className="px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <h2 className="font-display text-2xl font-bold mb-1">4 Phases</h2>
          <p className="text-sm text-muted-foreground mb-6">Un parcours de maturité stratégique complet</p>

          <div className="space-y-3">
            {phases.map((phase, i) => (
              <motion.div
                key={phase.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className={`flex items-center gap-4 rounded-2xl border ${phase.borderColor} bg-card p-4 card-shadow cursor-pointer hover:card-shadow-hover transition-shadow`}
                onClick={() => navigate("/explore")}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${phase.color}`}>
                  <phase.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-base">{phase.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{phase.description}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="px-6 py-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-3xl bg-gradient-hero p-8 text-center text-primary-foreground"
        >
          <Sparkles className="h-8 w-8 mx-auto mb-4 animate-pulse-soft" />
          <h2 className="font-display text-2xl font-bold mb-2">Prêt à structurer le chaos ?</h2>
          <p className="text-sm opacity-90 mb-6">
            Commencez par explorer les cartes ou lancez un diagnostic IA de votre maturité stratégique.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="rounded-2xl font-semibold h-12 px-8"
            onClick={() => navigate("/explore")}
          >
            Commencer maintenant
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
