import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Layers, Gamepad2, Brain, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const phases = [
  { name: "FONDATIONS", desc: "Posez les bases", icon: Brain, bg: "bg-accent", text: "text-accent-foreground" },
  { name: "MODÈLE", desc: "Structurez le business", icon: Layers, bg: "bg-pillar-business", text: "text-foreground" },
  { name: "CROISSANCE", desc: "Scalez la stratégie", icon: Zap, bg: "bg-pillar-finance", text: "text-foreground" },
  { name: "EXÉCUTION", desc: "Passez à l'action", icon: Gamepad2, bg: "bg-pillar-thinking", text: "text-foreground" },
];

const stats = [
  { value: "200+", label: "Cartes" },
  { value: "10", label: "Piliers" },
  { value: "4", label: "Phases" },
  { value: "∞", label: "Possibilités" },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero */}
      <section className="relative px-6 pt-16 pb-10">
        <div className="absolute top-10 right-10 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-40 left-0 w-32 h-32 rounded-full bg-accent/10 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 mb-8 border border-border"
          >
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Serious Game Stratégique</span>
          </motion.div>

          <h1 className="font-display text-5xl sm:text-6xl font-bold leading-[0.95] tracking-tight mb-6 uppercase">
            Structure
            <br />
            the
            <br />
            <span className="text-gradient-hero">Chaos.</span>
          </h1>

          <p className="text-base text-muted-foreground max-w-sm mb-8 leading-relaxed">
            200+ cartes stratégiques, plans de jeu interactifs et IA pour challenger vos réflexions business.
          </p>

          <div className="flex gap-3">
            <Button
              size="lg"
              className="rounded-2xl bg-primary text-primary-foreground font-bold h-14 px-8 text-base uppercase tracking-wide hover:bg-primary/90"
              onClick={() => navigate("/explore")}
            >
              Explorer
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl h-14 px-6 text-base font-bold border-border hover:bg-secondary"
              onClick={() => navigate("/auth")}
            >
              S'inscrire
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Stats row */}
      <section className="px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex-1 rounded-2xl bg-secondary p-4 text-center border border-border"
            >
              <div className="font-display text-2xl font-bold text-primary">{stat.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Phases — colorful bold cards */}
      <section className="px-6 py-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <h2 className="font-display text-2xl font-bold mb-5 uppercase tracking-tight">4 Phases</h2>

          <div className="grid grid-cols-2 gap-3">
            {phases.map((phase, i) => {
              const Icon = phase.icon;
              return (
                <motion.div
                  key={phase.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 + i * 0.08 }}
                  className={`${phase.bg} rounded-3xl p-5 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-transform`}
                  onClick={() => navigate("/explore")}
                >
                  <Icon className={`h-7 w-7 ${phase.text} mb-3`} />
                  <h3 className={`font-display font-bold text-sm ${phase.text} uppercase tracking-wide`}>{phase.name}</h3>
                  <p className={`text-xs ${phase.text} opacity-70 mt-1`}>{phase.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="px-6 py-8 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-3xl bg-primary p-8 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-foreground/5" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-foreground/5" />
          <div className="relative">
            <Sparkles className="h-8 w-8 text-primary-foreground mb-4 animate-pulse-soft" />
            <h2 className="font-display text-2xl font-bold text-primary-foreground mb-2 uppercase">
              Prêt à jouer ?
            </h2>
            <p className="text-sm text-primary-foreground/70 mb-6">
              Lancez un diagnostic IA de votre maturité stratégique.
            </p>
            <Button
              size="lg"
              className="rounded-2xl bg-background text-foreground font-bold h-13 px-8 hover:bg-secondary"
              onClick={() => navigate("/lab")}
            >
              Commencer
              <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
