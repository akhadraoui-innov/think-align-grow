import { useState, type ReactNode } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepDef {
  title: string;
  description?: string;
  icon?: LucideIcon;
  content: ReactNode;
  canProceed?: boolean;
}

interface StepDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  steps: StepDef[];
  onComplete: () => void;
  completing?: boolean;
  title: string;
  icon: LucideIcon;
  gradient?: string;
  completeLabel?: string;
}

export function StepDialog({
  open,
  onOpenChange,
  steps,
  onComplete,
  completing,
  title,
  icon,
  gradient = "primary",
  completeLabel = "Créer",
}: StepDialogProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const total = steps.length;
  const current = steps[step];
  const isLast = step === total - 1;

  const goNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) setStep(0);
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 gap-0 rounded-2xl overflow-hidden border-border/50 shadow-[var(--shadow-elevated)] max-w-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <GradientIcon icon={icon} gradient={gradient} size="sm" />
            <div>
              <h2 className="text-lg font-display font-bold text-foreground">{title}</h2>
              {current?.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{current.description}</p>
              )}
            </div>
          </div>

          {/* Progress */}
          {total > 1 && (
            <div className="flex items-center gap-1 mt-5">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => { if (i < step) { setDirection(-1); setStep(i); } }}
                    className={cn(
                      "relative flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold transition-all duration-300 shrink-0",
                      i < step && "bg-primary text-primary-foreground cursor-pointer",
                      i === step && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                      i > step && "bg-muted text-muted-foreground"
                    )}
                  >
                    {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </button>
                  {i < total - 1 && (
                    <div className="flex-1 mx-1.5">
                      <div className={cn(
                        "h-0.5 rounded-full transition-colors duration-300",
                        i < step ? "bg-primary" : "bg-border"
                      )} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step title */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            {total > 1 && `Étape ${step + 1} · `}{current?.title}
          </p>
        </div>

        {/* Content with animation */}
        <div className="px-6 pb-2 min-h-[160px] relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ x: direction * 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -60, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {current?.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 bg-muted/30 backdrop-blur-sm flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Précédent
            </Button>
          ) : (
            <div />
          )}
          <Button
            size="sm"
            onClick={goNext}
            disabled={current?.canProceed === false || completing}
            className="gap-1.5 min-w-[120px]"
          >
            {completing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isLast ? (
              <>
                <Check className="h-3.5 w-3.5" /> {completeLabel}
              </>
            ) : (
              <>
                Suivant <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
