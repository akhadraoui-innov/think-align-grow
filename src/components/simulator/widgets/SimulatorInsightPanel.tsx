import { motion } from "framer-motion";
import { X, Play, BookOpen, Target, Lightbulb, Clock, Users, MessageSquare, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { ModeDefinition } from "../config/modeRegistry";
import { UNIVERSE_LABELS } from "../config/modeRegistry";
import { getModeInsight } from "../config/modeInsights";
import type { AIAssistanceLevel } from "../SimulatorShell";

interface SimulatorInsightPanelProps {
  practiceType: string;
  modeDef: ModeDefinition;
  aiLevel: AIAssistanceLevel;
  onAiLevelChange: (level: AIAssistanceLevel) => void;
  onLaunch: () => void;
  onClose: () => void;
}

const AI_LEVELS: { value: AIAssistanceLevel; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "autonomous", label: "Autonome", icon: <Shield className="h-3.5 w-3.5" />, desc: "Vous êtes seul, évaluation en fin" },
  { value: "guided", label: "Guidé", icon: <Sparkles className="h-3.5 w-3.5" />, desc: "Suggestions et aide sur demande" },
  { value: "intensive", label: "Intensif", icon: <MessageSquare className="h-3.5 w-3.5" />, desc: "Coaching continu et proactif" },
];

export function SimulatorInsightPanel({ practiceType, modeDef, aiLevel, onAiLevelChange, onLaunch, onClose }: SimulatorInsightPanelProps) {
  const insight = getModeInsight(practiceType);

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-[400px] border-l bg-background flex flex-col h-full shrink-0"
    >
      {/* Header */}
      <div className="p-5 border-b space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <Badge variant="outline" className="text-[10px] font-medium">{UNIVERSE_LABELS[modeDef.universe]}</Badge>
            <h2 className="text-lg font-bold leading-tight">{modeDef.label}</h2>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {insight.duration}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {insight.targetAudience}</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">
          {/* Description */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5 text-primary" /> Ce que vous allez pratiquer
            </h3>
            <p className="text-sm leading-relaxed">{insight.longDescription}</p>
          </section>

          <Separator />

          {/* Skills */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Target className="h-3.5 w-3.5 text-primary" /> Compétences développées
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {insight.skills.map(s => (
                <Badge key={s} variant="secondary" className="text-[11px]">{s}</Badge>
              ))}
            </div>
          </section>

          <Separator />

          {/* Evaluation criteria */}
          <section className="space-y-2.5">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Target className="h-3.5 w-3.5 text-primary" /> Critères d'évaluation
            </h3>
            <div className="space-y-1.5">
              {modeDef.evaluationDimensions.map((dim, i) => (
                <div key={dim} className="flex items-center gap-2">
                  <span className="text-xs capitalize flex-1">{dim.replace(/_/g, " ")}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div
                        key={j}
                        className={cn(
                          "h-1.5 w-4 rounded-full",
                          j <= Math.min(i + 2, 4) ? "bg-primary" : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Tips */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Conseils pour bien démarrer
            </h3>
            <div className="space-y-2">
              {insight.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-bold text-xs mt-0.5">{i + 1}.</span>
                  <span className="leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
            <div className="bg-muted/50 rounded-lg p-3 mt-2">
              <p className="text-xs text-muted-foreground italic">
                💬 Exemple : « {insight.exampleFirstMessage} »
              </p>
            </div>
          </section>

          <Separator />

          {/* AI Assistance Level */}
          <section className="space-y-2.5">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Niveau d'accompagnement
            </h3>
            <div className="grid gap-2">
              {AI_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => onAiLevelChange(level.value)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                    aiLevel === level.value
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30 hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    aiLevel === level.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {level.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{level.label}</p>
                    <p className="text-[11px] text-muted-foreground">{level.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Launch button */}
      <div className="p-5 border-t">
        <Button size="lg" className="w-full gap-2" onClick={onLaunch}>
          <Play className="h-4 w-4" />
          Lancer la simulation
        </Button>
      </div>
    </motion.div>
  );
}
