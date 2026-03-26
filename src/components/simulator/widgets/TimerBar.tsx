import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Timer } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TimerBarProps {
  totalSeconds: number;
  onExpire?: () => void;
}

const ALERT_THRESHOLDS = [50, 25, 10];

export function TimerBar({ totalSeconds, onExpire }: TimerBarProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const expiredRef = useRef(false);
  const alertedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire?.();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [totalSeconds, onExpire]);

  // Vibration alerts at thresholds
  useEffect(() => {
    const pct = (remaining / totalSeconds) * 100;
    for (const threshold of ALERT_THRESHOLDS) {
      if (pct <= threshold && !alertedRef.current.has(threshold)) {
        alertedRef.current.add(threshold);
        if (navigator.vibrate) {
          navigator.vibrate(threshold <= 10 ? [100, 50, 100, 50, 100] : [100, 50, 100]);
        }
      }
    }
  }, [remaining, totalSeconds]);

  const pct = (remaining / totalSeconds) * 100;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="px-4 py-2 border-b bg-muted/20 flex items-center gap-3 cursor-help">
            <Timer className={cn("h-4 w-4", pct < 20 ? "text-destructive animate-pulse" : "text-muted-foreground")} />
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", pct < 20 ? "bg-destructive" : pct < 50 ? "bg-amber-500" : "bg-primary")}
                initial={{ width: "100%" }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className={cn("text-xs font-mono tabular-nums min-w-[3rem] text-right", pct < 20 && "text-destructive font-bold")}>
              {mins}:{secs.toString().padStart(2, "0")}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="text-xs">
          {pct < 10 ? "⚠️ Temps critique !" : pct < 25 ? "Attention, le temps presse" : pct < 50 ? "Moitié du temps écoulée" : "Temps restant confortable"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
