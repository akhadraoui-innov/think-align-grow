import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface KPIDashboardProps {
  kpis: Record<string, number>;
}

const KPI_META: Record<string, { label: string; icon: string; tooltip: string }> = {
  budget: { label: "Budget", icon: "💰", tooltip: "Ressources financières restantes" },
  morale: { label: "Moral", icon: "😊", tooltip: "Moral de l'équipe — impacte productivité et rétention" },
  risk: { label: "Risque", icon: "⚠️", tooltip: "Niveau de risque global — à minimiser" },
  time_remaining: { label: "Temps", icon: "⏳", tooltip: "Temps restant avant la deadline" },
};

export function KPIDashboard({ kpis }: KPIDashboardProps) {
  const historyRef = useRef<Record<string, number[]>>({});

  // Track history
  useEffect(() => {
    Object.entries(kpis).forEach(([k, v]) => {
      if (!historyRef.current[k]) historyRef.current[k] = [];
      const h = historyRef.current[k];
      if (h.length === 0 || h[h.length - 1] !== v) {
        h.push(v);
        if (h.length > 4) h.shift();
      }
    });
  }, [kpis]);

  const relevantKPIs = Object.entries(kpis).filter(([k]) => k in KPI_META);
  if (relevantKPIs.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-4 text-xs">
        {relevantKPIs.map(([key, value]) => {
          const meta = KPI_META[key];
          const history = historyRef.current[key] || [];
          const prev = history.length >= 2 ? history[history.length - 2] : value;
          const diff = value - prev;
          const TrendIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
          const trendColor = key === "risk"
            ? (diff > 0 ? "text-destructive" : diff < 0 ? "text-emerald-500" : "text-muted-foreground")
            : (diff > 0 ? "text-emerald-500" : diff < 0 ? "text-destructive" : "text-muted-foreground");

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-help">
                  <span>{meta.icon}</span>
                  <span className="text-muted-foreground">{meta.label}:</span>
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full",
                        value > 60 ? "bg-emerald-500" : value > 30 ? "bg-amber-500" : "bg-destructive"
                      )}
                      animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <span className="font-bold tabular-nums">{value}</span>
                  {diff !== 0 && (
                    <TrendIcon className={cn("h-3 w-3", trendColor)} />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                {meta.tooltip}
                {history.length > 1 && (
                  <span className="block text-muted-foreground mt-1">
                    Historique : {history.join(" → ")}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
