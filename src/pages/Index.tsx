import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Sparkles, Compass, Gamepad2, Brain, Zap,
  ChevronRight, BookOpen, Target, FileText, Layers, Eye, Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { MeshGradient, DotPattern } from "@/components/ui/PatternBackground";
import { PageTransition } from "@/components/ui/PageTransition";

const valueProps = [
  {
    title: "S'acculturer",
    subtitle: "Explorez 200+ concepts stratégiques structurés en 10 piliers. Montez en compétence à votre rythme.",
    icon: BookOpen,
    gradient: "accent",
    route: "/explore",
    emoji: "🧠",
  },
  {
    title: "Challenger",
    subtitle: "Testez votre maturité stratégique via des quiz, des défis et un coaching IA qui confronte vos hypothèses.",
    icon: Target,
    gradient: "thinking",
    route: "/lab",
    emoji: "⚡",
  },
  {
    title: "Structurer & Orchestrer",
    subtitle: "Composez des plans de jeu, générez des livrables (SWOT, BMC, pitch deck) et pilotez vos réflexions.",
    icon: FileText,
    gradient: "finance",
    route: "/ai",
    emoji: "🚀",
  },
];

const stats = [
  { value: "200+", label: "Cartes" },
  { value: "10", label: "Piliers" },
  { value: "4", label: "Phases" },
  { value: "∞", label: "Possibilités" },
];

const phases = [
  { name: "Fondations", desc: "Posez les bases de votre réflexion", icon: Brain, color: "bg-accent" },
  { name: "Modèle", desc: "Structurez le business model", icon: Layers, color: "bg-pillar-business" },
  { name: "Croissance", desc: "Scalez la stratégie", icon: Zap, color: "bg-pillar-finance" },
  { name: "Exécution", desc: "Passez à l'action concrète", icon: Gamepad2, color: "bg-pillar-thinking" },
];

const steps = [
  { num: "01", title: "Explorez", desc: "Parcourez les 10 piliers et 200+ cartes stratégiques", icon: Eye },
  { num: "02", title: "Jouez", desc: "Testez-vous avec les plans de jeu et le diagnostic IA", icon: Gamepad2 },
  { num: "03", title: "Générez", desc: "Créez vos livrables et plans d'action personnalisés", icon: Rocket },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative px-6 pt-14 pb-8">
        <MeshGradient />
        <DotPattern />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mb-8"
          >
            <Logo size="md" />
          </motion.div>

          {/* Toolkit badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full bg-secondary/80 backdrop-blur-sm px-4 py-2 mb-6 border border-border"
          >
            <div className="h-2 w-2 rounded-full bg-pillar-impact animate-pulse-soft" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Toolkit · Bootstrap in Business
            </span>
          </motion.div>

          <h1 className="font-display text-[3.2rem] sm:text-6xl font-bold leading-[0.92] tracking-tight mb-5 uppercase">
            Structure
            <br />
            <span className="text-gradient-hero">the Chaos.</span>
          </h1>

          <p className="text-base text-muted-foreground max-w-sm mb-8 leading-relaxed">
            Le serious game stratégique qui transforme vos idées business en plans d'action structurés.
          </p>

          <div className="flex gap-3">
            <Button
              size="lg"
              className="rounded-2xl bg-primary text-primary-foreground font-bold h-14 px-8 text-base uppercase tracking-wide hover:bg-primary/90 shadow-lg shadow-primary/25"
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

      {/* ===== VALUE PROPOSITIONS ===== */}
      <section className="px-6 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-display text-2xl font-bold mb-2 uppercase tracking-tight">
            Pourquoi Hack & Show ?
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            3 propositions de valeur pour transformer votre réflexion stratégique.
          </p>

          <div className="space-y-4">
            {valueProps.map((vp, i) => (
              <motion.div
                key={vp.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                onClick={() => navigate(vp.route)}
                className="group relative rounded-3xl bg-card border border-border p-5 cursor-pointer hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-start gap-4">
                  <GradientIcon icon={vp.icon} gradient={vp.gradient} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{vp.emoji}</span>
                      <h3 className="font-display font-bold text-base uppercase tracking-wide text-foreground">
                        {vp.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {vp.subtitle}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== STATS ===== */}
      <section className="px-6 py-6">
        <div className="grid grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-secondary/60 backdrop-blur-sm p-4 text-center border border-border"
            >
              <AnimatedCounter value={stat.value} label={stat.label} />
            </div>
          ))}
        </div>
      </section>

      {/* ===== 4 PHASES ===== */}
      <section className="px-6 py-8">
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
                  className={`${phase.color} rounded-3xl p-5 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-transform relative overflow-hidden`}
                  onClick={() => navigate("/explore")}
                >
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-foreground/5" />
                  <div className="relative">
                    <Icon className="h-7 w-7 text-foreground mb-3" />
                    <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wide">
                      {phase.name}
                    </h3>
                    <p className="text-xs text-foreground/60 mt-1">{phase.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ===== COMMENT ÇA MARCHE ===== */}
      <section className="px-6 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <h2 className="font-display text-2xl font-bold mb-6 uppercase tracking-tight">
            Comment ça marche ?
          </h2>
          <div className="space-y-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 + i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary border border-border">
                    <span className="font-display text-sm font-bold text-primary">{step.num}</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Icon className="h-4 w-4 text-primary" />
                      <h3 className="font-display font-bold text-sm uppercase tracking-wide">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="px-6 py-8 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-3xl bg-gradient-to-br from-primary to-pillar-thinking p-8 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-foreground/5" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-foreground/5" />
          <DotPattern className="opacity-[0.06]" />
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
              className="rounded-2xl bg-background text-foreground font-bold h-13 px-8 hover:bg-secondary shadow-lg"
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
