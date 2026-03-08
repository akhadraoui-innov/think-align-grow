import { useState } from "react";
import { motion } from "framer-motion";
import { Gamepad2, Trophy, Target, Zap, Lock, ChevronRight, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { MeshGradient } from "@/components/ui/PatternBackground";
import { PageTransition } from "@/components/ui/PageTransition";
import { QuizEngine } from "@/components/game/QuizEngine";
import { RadarChart } from "@/components/game/RadarChart";
import type { PillarId } from "@/data/mockCards";

const features = [
  { title: "Auto-Évaluation", description: "Mesurez votre maturité stratégique par pilier", icon: Target, gradient: "accent", locked: false },
  { title: "Défis Hebdo", description: "Une situation business à résoudre chaque semaine", icon: Zap, gradient: "business", locked: true },
  { title: "Classement", description: "Comparez votre score et gagnez des badges", icon: Trophy, gradient: "impact", locked: true },
];

const badges = [
  { icon: Star, label: "Explorer", desc: "10 cartes vues", unlocked: false },
  { icon: Shield, label: "Stratège", desc: "1er quiz complété", unlocked: false },
  { icon: Trophy, label: "Champion", desc: "Score > 80%", unlocked: false },
];

export default function Lab() {
  const [showQuiz, setShowQuiz] = useState(false);
  const [scores, setScores] = useState<Record<PillarId, number> | null>(null);
  const [xp, setXp] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState<Set<string>>(new Set());

  const handleQuizComplete = (finalScores: Record<PillarId, number>) => {
    setScores(finalScores);
    setShowQuiz(false);
    const avg = Object.values(finalScores).reduce((a, b) => a + b, 0) / Object.values(finalScores).filter(v => v > 0).length;
    setXp(Math.round(avg));
    const newBadges = new Set(unlockedBadges);
    newBadges.add("Stratège");
    if (avg > 80) newBadges.add("Champion");
    setUnlockedBadges(newBadges);
  };

  if (showQuiz) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background pb-24">
          <div className="px-6 pt-10">
            <button
              onClick={() => setShowQuiz(false)}
              className="flex items-center gap-2 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors"
            >
              ← Retour
            </button>
            <QuizEngine onComplete={handleQuizComplete} />
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
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
              <p className="text-sm text-primary-foreground/60 mb-4">
                {scores ? "Votre profil stratégique" : "Complétez le diagnostic pour voir vos forces"}
              </p>

              <div className="flex justify-center py-2">
                <RadarChart
                  scores={scores || { thinking: 0, business: 0, innovation: 0, finance: 0, marketing: 0, operations: 0, team: 0, legal: 0, growth: 0, impact: 0 }}
                  size={180}
                />
              </div>

              {/* XP bar */}
              <div className="mb-4 mt-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-primary-foreground/50 mb-1.5">
                  <span>Niveau {Math.floor(xp / 25) + 1}</span>
                  <span>{xp} / 100 XP</span>
                </div>
                <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-pillar-impact"
                    animate={{ width: `${xp}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>

              <Button
                className="w-full rounded-2xl bg-background text-foreground font-bold h-12 hover:bg-secondary uppercase tracking-wide shadow-lg"
                onClick={() => setShowQuiz(true)}
              >
                {scores ? "Refaire le diagnostic" : "Commencer le diagnostic"}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Badges */}
        <div className="px-6 mb-6">
          <h2 className="font-display text-lg font-bold mb-3 uppercase tracking-tight">Badges</h2>
          <div className="flex gap-3">
            {badges.map((badge, i) => {
              const Icon = badge.icon;
              const isUnlocked = unlockedBadges.has(badge.label);
              return (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className={`flex-1 rounded-2xl border p-3 text-center transition-all ${
                    isUnlocked ? "bg-primary/10 border-primary/30" : "bg-secondary border-border"
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      isUnlocked ? "bg-primary/20" : "bg-muted"
                    }`}>
                      <Icon className={`h-5 w-5 ${isUnlocked ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isUnlocked ? "text-primary" : "text-muted-foreground"}`}>{badge.label}</p>
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
              onClick={() => !feature.locked && feature.title === "Auto-Évaluation" && setShowQuiz(true)}
              className={`relative rounded-3xl bg-card border border-border p-5 transition-all duration-200 ${
                feature.locked ? "opacity-60" : "cursor-pointer hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
              }`}
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
    </PageTransition>
  );
}
