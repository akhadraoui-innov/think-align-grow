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

const AI_LEVELS: { value: AIAssistanceLevel; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  { value: "autonomous", label: "Autonome", icon: <Shield className="h-3.5 w-3.5" />, desc: "Vous êtes seul, évaluation en fin", color: "text-muted-foreground" },
  { value: "guided", label: "Guidé", icon: <Sparkles className="h-3.5 w-3.5" />, desc: "Suggestions et aide sur demande", color: "text-primary" },
  { value: "intensive", label: "Intensif", icon: <MessageSquare className="h-3.5 w-3.5" />, desc: "Coaching continu et proactif", color: "text-emerald-600" },
];

const SECTION_ICONS = [
  { icon: BookOpen, color: "text-blue-600 bg-blue-50" },
  { icon: Target, color: "text-violet-600 bg-violet-50" },
  { icon: Target, color: "text-emerald-600 bg-emerald-50" },
  { icon: Lightbulb, color: "text-amber-600 bg-amber-50" },
  { icon: Sparkles, color: "text-primary bg-primary/10" },
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
      <div className="p-5 border-b space-y-3 shrink-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <Badge variant="outline" className="text-xs font-medium">{UNIVERSE_LABELS[modeDef.universe]}</Badge>
            <h2 className="text-lg font-bold leading-tight">{modeDef.label}</h2>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
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
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div className={cn("h-5 w-5 rounded flex items-center justify-center", SECTION_ICONS[0].color)}>
                <BookOpen className="h-3 w-3" />
              </div>
              Ce que vous allez pratiquer
            </h3>
            <p className="text-sm leading-relaxed">{insight.longDescription}</p>
          </section>

          <Separator />

          {/* Skills */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div className={cn("h-5 w-5 rounded flex items-center justify-center", SECTION_ICONS[1].color)}>
                <Target className="h-3 w-3" />
              </div>
              Compétences développées
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {insight.skills.map(s => (
                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
              ))}
            </div>
          </section>

          <Separator />

          {/* Evaluation criteria with gradient bars */}
          <section className="space-y-2.5">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div className={cn("h-5 w-5 rounded flex items-center justify-center", SECTION_ICONS[2].color)}>
                <Target className="h-3 w-3" />
              </div>
              Critères d'évaluation
            </h3>
            <div className="space-y-2">
              {modeDef.evaluationDimensions.map((dim, i) => (
                <div key={dim} className="space-y-1">
                  <span className="text-xs capitalize">{dim.replace(/_/g, " ")}</span>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                      style={{ width: `${Math.min(60 + i * 10, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Tips with colored pills */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div className={cn("h-5 w-5 rounded flex items-center justify-center", SECTION_ICONS[3].color)}>
                <Lightbulb className="h-3 w-3" />
              </div>
              Conseils pour bien démarrer
            </h3>
            <div className="space-y-2.5">
              {insight.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-2">
              <p className="text-xs text-muted-foreground italic">
                💬 Exemple : « {insight.exampleFirstMessage} »
              </p>
            </div>
          </section>

          <Separator />

          {/* AI Assistance Level */}
          <section className="space-y-2.5">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div className={cn("h-5 w-5 rounded flex items-center justify-center", SECTION_ICONS[4].color)}>
                <Sparkles className="h-3 w-3" />
              </div>
              Niveau d'accompagnement
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
                    <p className="text-xs text-muted-foreground">{level.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Launch button */}
      <div className="p-5 border-t shrink-0">
        <Button size="lg" className="w-full gap-2" onClick={onLaunch}>
          <Play className="h-4 w-4" />
          Lancer la simulation
        </Button>
      </div>
    </motion.div>
  );
}
