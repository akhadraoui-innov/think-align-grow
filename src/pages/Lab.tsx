import { motion } from "framer-motion";
import { Gamepad2, Trophy, Target, Zap, Lock, ChevronRight, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { MeshGradient } from "@/components/ui/PatternBackground";
import { useNavigate } from "react-router-dom";

const features = [
  { title: "Auto-Évaluation", description: "Mesurez votre maturité stratégique par pilier", icon: Target, gradient: "accent", locked: false },
  { title: "Défis Hebdo", description: "Une situation business à résoudre chaque semaine", icon: Zap, gradient: "business", locked: true },
  { title: "Classement", description: "Comparez votre score et gagnez des badges", icon: Trophy, gradient: "impact", locked: true },
];

const badges = [
  { icon: Star, label: "Explorer", desc: "10 cartes vues" },
  { icon: Shield, label: "Stratège", desc: "1er quiz complété" },
  { icon: Trophy, label: "Champion", desc: "Score > 80%" },
];

export default function Lab() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-12 pb-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 mb-4 border border-border">
            <Gamepad2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Serious Game</span>
          </div>
          <h1 className="font-display text-4xl font-bold mb-1 uppercase tracking-tight">Strategy Lab</h1>
          <p className="text-sm text-muted-foreground">Challengez votre réflexion en mode gamifié</p>
        </motion.div>
      </div>

      {/* Radar card */}
      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl bg-gradient-to-br from-primary to-pillar-thinking p-6 relative overflow-hidden"
        >
          <MeshGradient className="opacity-30" />
          <div className="relative">
            <h3 className="font-display font-bold text-lg text-primary-foreground mb-1 uppercase">Votre Radar</h3>
            <p className="text-sm text-primary-foreground/60 mb-5">Complétez le diagnostic pour voir vos forces</p>
            
            {/* Radar SVG */}
            <div className="flex justify-center py-4">
              <svg width="160" height="160" viewBox="0 0 160 160">
                {[60, 45, 30, 15].map((r, i) => (
                  <polygon
                    key={i}
                    points={Array.from({ length: 10 }, (_, j) => {
                      const angle = (Math.PI * 2 * j) / 10 - Math.PI / 2;
                      return `${80 + r * Math.cos(angle)},${80 + r * Math.sin(angle)}`;
                    }).join(" ")}
                    fill="none"
                    stroke="hsl(60 10% 95% / 0.1)"
                    strokeWidth="0.5"
                  />
                ))}
                {Array.from({ length: 10 }, (_, j) => {
                  const angle = (Math.PI * 2 * j) / 10 - Math.PI / 2;
                  return (
                    <line
                      key={j}
                      x1="80" y1="80"
                      x2={80 + 60 * Math.cos(angle)}
                      y2={80 + 60 * Math.sin(angle)}
                      stroke="hsl(60 10% 95% / 0.06)"
                      strokeWidth="0.5"
                    />
                  );
                })}
                <circle cx="80" cy="80" r="3" fill="hsl(48 92% 52%)" className="animate-pulse-soft" />
              </svg>
            </div>

            {/* XP bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-primary-foreground/50 mb-1.5">
                <span>Niveau 1</span>
                <span>0 / 100 XP</span>
              </div>
              <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
                <div className="h-full w-0 rounded-full bg-pillar-impact" />
              </div>
            </div>

            <Button
              className="w-full rounded-2xl bg-background text-foreground font-bold h-12 hover:bg-secondary uppercase tracking-wide shadow-lg"
              onClick={() => navigate("/auth")}
            >
              Commencer le diagnostic
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Badges */}
      <div className="px-6 mb-6">
        <h2 className="font-display text-lg font-bold mb-3 uppercase tracking-tight">Badges à débloquer</h2>
        <div className="flex gap-3">
          {badges.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex-1 rounded-2xl bg-secondary border border-border p-3 text-center"
              >
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{badge.label}</p>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">{badge.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Features */}
      <div className="px-6 space-y-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            className="relative rounded-3xl bg-card border border-border p-5 cursor-pointer hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <GradientIcon icon={feature.icon} gradient={feature.gradient} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wide">{feature.title}</h3>
                  {feature.locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
