import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, RotateCcw, Target, BookOpen, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getModeDefinition, UNIVERSE_LABELS } from "./config/modeRegistry";
import { OnboardingOverlay } from "./widgets/OnboardingOverlay";
import { HelpDrawer } from "./widgets/HelpDrawer";
import { cn } from "@/lib/utils";

export type AIAssistanceLevel = "autonomous" | "guided" | "intensive";

interface SimulatorShellProps {
  practiceType: string;
  practiceId: string;
  previewMode?: boolean;
  exchangeCount: number;
  maxExchanges: number;
  difficulty?: string;
  aiAssistanceLevel?: AIAssistanceLevel;
  children: React.ReactNode;
  onReset?: () => void;
  onClose?: () => void;
  sessionTitle?: string;
}

export function SimulatorShell({
  practiceType,
  practiceId,
  previewMode,
  exchangeCount,
  maxExchanges,
  difficulty,
  aiAssistanceLevel = "guided",
  children,
  onReset,
  onClose,
  sessionTitle,
}: SimulatorShellProps) {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [objectivesOpen, setObjectivesOpen] = useState(false);

  const modeDef = getModeDefinition(practiceType);
  const universeName = modeDef ? UNIVERSE_LABELS[modeDef.universe] : "";
  const progressPct = maxExchanges > 0 ? (exchangeCount / maxExchanges) * 100 : 0;

  const isExpert = difficulty === "expert" || difficulty === "advanced";
  const isBeginner = difficulty === "beginner" || difficulty === "débutant";
  const showHelpButton = !isExpert && aiAssistanceLevel !== "autonomous";

  if (showOnboarding && modeDef && !isExpert) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-card/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold truncate">{sessionTitle || modeDef?.label || practiceType}</span>
            {modeDef && <Badge variant="outline" className="text-xs shrink-0">{universeName}</Badge>}
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <OnboardingOverlay
            modeDef={modeDef}
            universeName={universeName}
            difficulty={difficulty}
            aiAssistanceLevel={aiAssistanceLevel}
            onStart={() => setShowOnboarding(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Merged Header ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-semibold truncate">
            {sessionTitle || modeDef?.label || practiceType}
          </span>
          {modeDef && (
            <Badge variant="outline" className="text-xs shrink-0">
              {universeName}
            </Badge>
          )}
          {previewMode && (
            <Badge variant="secondary" className="text-xs">Preview</Badge>
          )}
        </div>

        {/* Progress chip */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
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
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setObjectivesOpen(!objectivesOpen)}>
                <Target className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Objectifs & critères</TooltipContent>
          </Tooltip>

          {showHelpButton && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showHelp ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 gap-1.5 text-xs",
                    showHelp
                      ? ""
                      : "border-primary/30 text-primary hover:bg-primary/10",
                    aiAssistanceLevel === "intensive" && !showHelp && "animate-pulse"
                  )}
                  onClick={() => setShowHelp(!showHelp)}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Aide IA
                </Button>
              </TooltipTrigger>
              <TooltipContent>Obtenir de l'aide méthodologique</TooltipContent>
            </Tooltip>
          )}

          {onReset && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Recommencer</TooltipContent>
            </Tooltip>
          )}

          {onClose && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fermer</TooltipContent>
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
            className="overflow-hidden border-b bg-muted/10 shrink-0"
          >
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                Critères d'évaluation
              </div>
              <div className="flex flex-wrap gap-1.5">
                {modeDef.evaluationDimensions.map((dim) => (
                  <Badge key={dim} variant="outline" className="text-xs capitalize">
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

      {/* ── Beginner hint ── */}
      {isBeginner && exchangeCount === 0 && aiAssistanceLevel !== "autonomous" && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-center gap-2 shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          Besoin d'aide ? Cliquez sur <span className="font-semibold text-primary">Aide IA</span> pour obtenir des conseils méthodologiques.
        </motion.div>
      )}

      {/* ── Main content + Help Drawer side by side ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-hidden">
          {children}
        </div>
        <AnimatePresence>
          {showHelp && (
            <HelpDrawer
              open={showHelp}
              onClose={() => setShowHelp(false)}
              practiceId={practiceId}
              practiceType={practiceType}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
