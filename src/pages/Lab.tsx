import { motion } from "framer-motion";
import { Gamepad2, Trophy, Target, Zap, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const features = [
  { title: "AUTO-ÉVALUATION", description: "Mesurez votre maturité stratégique par pilier", icon: Target, bg: "bg-accent", locked: false },
  { title: "DÉFIS HEBDO", description: "Une situation business à résoudre chaque semaine", icon: Zap, bg: "bg-pillar-business", locked: true },
  { title: "CLASSEMENT", description: "Comparez votre score et gagnez des badges", icon: Trophy, bg: "bg-pillar-impact", locked: true },
];

export default function Lab() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-12 pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 mb-4 border border-border">
            <Gamepad2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Serious Game</span>
          </div>
          <h1 className="font-display text-4xl font-bold mb-1 uppercase tracking-tight">Strategy Lab</h1>
          <p className="text-sm text-muted-foreground">Challengez votre réflexion en mode gamifié</p>
        </motion.div>
      </div>

      {/* Radar preview */}
      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl bg-primary p-6 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-foreground/5" />
          <div className="relative">
            <h3 className="font-display font-bold text-lg text-primary-foreground mb-1 uppercase">Votre Radar</h3>
            <p className="text-sm text-primary-foreground/60 mb-5">Complétez l'auto-évaluation pour voir vos forces</p>
            <div className="flex justify-center py-4">
              <div className="relative h-36 w-36">
                <div className="absolute inset-0 rounded-full border border-primary-foreground/15" />
                <div className="absolute inset-4 rounded-full border border-primary-foreground/10" />
                <div className="absolute inset-8 rounded-full border border-primary-foreground/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-primary-foreground/40 animate-pulse-soft" />
                </div>
              </div>
            </div>
            <Button
              className="w-full rounded-2xl bg-background text-foreground font-bold h-12 hover:bg-secondary uppercase tracking-wide"
              onClick={() => navigate("/auth")}
            >
              Commencer le diagnostic
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
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
              className={`relative rounded-3xl ${feature.bg} p-5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform`}
            >
              <div className="flex items-center gap-4">
                <Icon className="h-6 w-6 text-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wide">{feature.title}</h3>
                    {feature.locked && <Lock className="h-3.5 w-3.5 text-foreground/40" />}
                  </div>
                  <p className="text-xs text-foreground/60">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
