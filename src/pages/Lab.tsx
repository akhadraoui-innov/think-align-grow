import { motion } from "framer-motion";
import { Gamepad2, Trophy, Target, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const features = [
  {
    title: "Auto-évaluation",
    description: "Mesurez votre maturité stratégique par pilier avec un quiz interactif",
    icon: Target,
    color: "bg-primary/10 text-primary",
    locked: false,
  },
  {
    title: "Défis Hebdo",
    description: "Une situation business à résoudre chaque semaine avec les bonnes cartes",
    icon: Zap,
    color: "bg-pillar-business/10 text-pillar-business",
    locked: true,
  },
  {
    title: "Classement",
    description: "Comparez votre score avec la communauté et gagnez des badges",
    icon: Trophy,
    color: "bg-pillar-impact/10 text-pillar-impact",
    locked: true,
  },
];

export default function Lab() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-12 pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 mb-4">
            <Gamepad2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-accent-foreground">Serious Game</span>
          </div>
          <h1 className="font-display text-3xl font-bold mb-1">Strategy Lab</h1>
          <p className="text-sm text-muted-foreground">Challengez votre réflexion stratégique en mode gamifié</p>
        </motion.div>
      </div>

      {/* Radar preview placeholder */}
      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl bg-gradient-hero p-6 text-primary-foreground"
        >
          <h3 className="font-display font-bold text-lg mb-1">Votre Radar Stratégique</h3>
          <p className="text-sm opacity-80 mb-4">Complétez l'auto-évaluation pour visualiser vos forces</p>
          <div className="flex justify-center py-6">
            <div className="h-32 w-32 rounded-full border-2 border-primary-foreground/30 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full border-2 border-primary-foreground/20 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-primary-foreground/20" />
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            className="w-full rounded-2xl font-semibold"
            onClick={() => navigate("/auth")}
          >
            Commencer le diagnostic
          </Button>
        </motion.div>
      </div>

      {/* Features */}
      <div className="px-6 space-y-3">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="relative flex items-center gap-4 rounded-2xl border border-border bg-card p-4 card-shadow"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${feature.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold">{feature.title}</h3>
                  {feature.locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{feature.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
