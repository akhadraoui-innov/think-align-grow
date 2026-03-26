import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, RotateCcw, ChevronRight, Target, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getModeDefinition, UNIVERSE_LABELS } from "./config/modeRegistry";
import { OnboardingOverlay } from "./widgets/OnboardingOverlay";
import { HelpDrawer } from "./widgets/HelpDrawer";
import { cn } from "@/lib/utils";

interface SimulatorShellProps {
  practiceType: string;
  practiceId: string;
  previewMode?: boolean;
  exchangeCount: number;
  maxExchanges: number;
  difficulty?: string;
  children: React.ReactNode;
  onReset?: () => void;
}

export function SimulatorShell({
  practiceType,
  practiceId,
  previewMode,
  exchangeCount,
  maxExchanges,
  difficulty,
  children,
  onReset,
}: SimulatorShellProps) {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [objectivesOpen, setObjectivesOpen] = useState(false);

  const modeDef = getModeDefinition(practiceType);
  const universeName = modeDef ? UNIVERSE_LABELS[modeDef.universe] : "";
  const progressPct = maxExchanges > 0 ? (exchangeCount / maxExchanges) * 100 : 0;

  const isExpert = difficulty === "expert" || difficulty === "advanced";
  const isBeginner = difficulty === "beginner" || difficulty === "débutant";

  if (showOnboarding && modeDef && !isExpert) {
    return (
      <OnboardingOverlay
        modeDef={modeDef}
        universeName={universeName}
        difficulty={difficulty}
        onStart={() => setShowOnboarding(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {modeDef && (
            <Badge variant="outline" className="text-[10px] shrink-0 font-medium">
              {universeName}
            </Badge>
          )}
          <span className="text-sm font-semibold truncate">
            {modeDef?.label || practiceType}
          </span>
          {previewMode && (
            <Badge variant="secondary" className="text-[10px]">Preview</Badge>
          )}
        </div>

        {/* Progress chip */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="tabular-nums">{exchangeCount}/{maxExchanges}</span>
        </div>

        {/* Actions */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setObjectivesOpen(!objectivesOpen)}>
                <Target className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Objectifs & critères</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowHelp(true)}>
                <HelpCircle className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Aide IA</TooltipContent>
          </Tooltip>

          {onReset && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onReset}>
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Recommencer</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>

      {/* ── Objectives Panel (collapsible) ── */}
      <AnimatePresence>
        {objectivesOpen && modeDef && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b bg-muted/30"
          >
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                Critères d'évaluation
              </div>
              <div className="flex flex-wrap gap-1.5">
                {modeDef.evaluationDimensions.map((dim) => (
                  <Badge key={dim} variant="outline" className="text-[10px] capitalize">
                    {dim.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {modeDef.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 min-h-0 relative">
        {children}
      </div>

      {/* ── Help Drawer ── */}
      <HelpDrawer
        open={showHelp}
        onClose={() => setShowHelp(false)}
        practiceId={practiceId}
        practiceType={practiceType}
      />
    </div>
  );
}
