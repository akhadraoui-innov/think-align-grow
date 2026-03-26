import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TensionGaugeProps {
  tension: number;
  rapport: number;
  progress?: number;
}

function GaugeBar({ label, value, max = 10, tooltip, colorFn }: {
  label: string; value: number; max?: number; tooltip: string;
  colorFn: (v: number) => string;
}) {
  const prevRef = useRef(value);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (value !== prevRef.current) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1.5 cursor-help", pulse && "animate-pulse")}>
            <span className="text-muted-foreground text-xs">{label}:</span>
            <div className="flex gap-0.5">
              {Array.from({ length: max }).map((_, i) => (
                <motion.div
                  key={i}
                  className={cn("w-2 h-3 rounded-sm transition-colors", i < value ? colorFn(value) : "bg-muted")}
                  initial={false}
                  animate={i < value && pulse ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3, delay: i * 0.02 }}
                />
              ))}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px] text-xs">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function TensionGauge({ tension, rapport, progress }: TensionGaugeProps) {
  return (
    <div className="flex items-center gap-4 text-xs">
      <GaugeBar
        label="Tension"
        value={tension}
        tooltip="Niveau de tension dans l'échange. Haut = blocage possible, bas = confort."
        colorFn={(v) => v >= 8 ? "bg-destructive" : v >= 5 ? "bg-amber-500" : "bg-emerald-500"}
      />
      <GaugeBar
        label="Rapport"
        value={rapport}
        tooltip="Qualité de la relation. Plus c'est haut, plus l'interlocuteur est en confiance."
        colorFn={() => "bg-primary"}
      />
      {progress !== undefined && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-help">
                <span className="text-muted-foreground">Progrès:</span>
                <span className="font-bold">{progress}%</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Avancement vers l'objectif de la négociation</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
