import { motion } from "framer-motion";
import { Play, Target, Sparkles, MessageSquare, BarChart3, HelpCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ModeDefinition } from "../config/modeRegistry";
import { cn } from "@/lib/utils";

interface OnboardingOverlayProps {
  modeDef: ModeDefinition;
  universeName: string;
  difficulty?: string;
  aiAssistanceLevel?: string;
  onStart: () => void;
}

const STEPS = [
  { icon: <MessageSquare className="h-4 w-4" />, label: "Briefing", desc: "Lisez le contexte et les objectifs" },
  { icon: <Sparkles className="h-4 w-4" />, label: "Interaction", desc: "Échangez avec l'IA spécialisée" },
  { icon: <BarChart3 className="h-4 w-4" />, label: "Évaluation", desc: "Score détaillé et recommandations" },
];

const AI_LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  autonomous: { label: "Mode autonome", color: "bg-muted text-muted-foreground" },
  guided: { label: "Mode guidé", color: "bg-primary/10 text-primary" },
  intensive: { label: "Mode coaching intensif", color: "bg-emerald-100 text-emerald-700" },
};

export function OnboardingOverlay({ modeDef, universeName, difficulty, aiAssistanceLevel, onStart }: OnboardingOverlayProps) {
  const levelInfo = AI_LEVEL_LABELS[aiAssistanceLevel || "guided"];

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 md:p-8 text-center overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="max-w-lg w-full space-y-6"
      >
        {/* Icon */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
        >
          <Sparkles className="h-8 w-8 text-primary" />
        </motion.div>

        {/* Title */}
        <div className="space-y-3">
          <Badge variant="outline" className="text-xs">{universeName}</Badge>
          <h2 className="text-2xl font-bold tracking-tight">{modeDef.label}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">{modeDef.description}</p>
        </div>

        {/* How it works */}
        <div className="bg-muted/30 rounded-xl p-4">
          <p className="text-xs font-semibold mb-3 flex items-center justify-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-primary" /> Comment ça marche
          </p>
          <div className="flex items-start gap-2 justify-center">
            {STEPS.map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {step.icon}
                </div>
                <p className="text-xs font-semibold">{step.label}</p>
                <p className="text-xs text-muted-foreground leading-snug">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Evaluation criteria */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-3 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Target className="h-3.5 w-3.5 text-primary" /> Critères d'évaluation
          </div>
          <div className="flex flex-wrap gap-1.5">
            {modeDef.evaluationDimensions.map((dim) => (
              <Badge key={dim} variant="secondary" className="text-xs capitalize">{dim.replace(/_/g, " ")}</Badge>
            ))}
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {difficulty && (
            <Badge className={cn(
              "text-xs",
              difficulty === "easy" || difficulty === "beginner" ? "bg-emerald-100 text-emerald-700" :
              difficulty === "hard" || difficulty === "expert" ? "bg-red-100 text-red-700" :
              difficulty === "advanced" ? "bg-orange-100 text-orange-700" :
              "bg-amber-100 text-amber-700"
            )}>
              Difficulté : {difficulty}
            </Badge>
          )}
          {levelInfo && (
            <Badge className={cn("text-xs", levelInfo.color)}>
              <Shield className="h-3 w-3 mr-1" /> {levelInfo.label}
            </Badge>
          )}
        </div>

        {/* Start button */}
        <Button size="lg" onClick={onStart} className="gap-2">
          <Play className="h-4 w-4" /> Commencer la simulation
        </Button>
      </motion.div>
    </div>
  );
}
