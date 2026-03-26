import { motion } from "framer-motion";
import { Play, Target, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ModeDefinition } from "../config/modeRegistry";
import { cn } from "@/lib/utils";

interface OnboardingOverlayProps {
  modeDef: ModeDefinition;
  universeName: string;
  difficulty?: string;
  onStart: () => void;
}

export function OnboardingOverlay({ modeDef, universeName, difficulty, onStart }: OnboardingOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="max-w-md space-y-6"
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
        <div className="space-y-2">
          <Badge variant="outline" className="text-[10px]">{universeName}</Badge>
          <h2 className="text-xl font-bold">{modeDef.label}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {modeDef.description}
          </p>
        </div>

        {/* Rules */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-3 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Target className="h-3.5 w-3.5 text-primary" />
            Critères d'évaluation
          </div>
          <div className="flex flex-wrap gap-1.5">
            {modeDef.evaluationDimensions.map((dim) => (
              <Badge key={dim} variant="secondary" className="text-[10px] capitalize">
                {dim.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>

        {difficulty && (
          <Badge
            className={cn(
              "text-xs",
              difficulty === "easy" ? "bg-emerald-100 text-emerald-700" :
              difficulty === "hard" || difficulty === "expert" ? "bg-red-100 text-red-700" :
              "bg-amber-100 text-amber-700"
            )}
          >
            Difficulté : {difficulty}
          </Badge>
        )}

        {/* Start button */}
        <Button size="lg" onClick={onStart} className="gap-2">
          <Play className="h-4 w-4" />
          Commencer la simulation
        </Button>
      </motion.div>
    </div>
  );
}
