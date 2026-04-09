import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface MetricTooltipProps {
  label: string;
  explanation: string;
  formula?: string;
  benchmark?: string;
  children: React.ReactNode;
}

export function MetricTooltip({ label, explanation, formula, benchmark, children }: MetricTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative group cursor-help">
            {children}
            <Info className="absolute -top-1 -right-1 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3 space-y-1.5">
          <div className="font-semibold text-xs text-foreground">{label}</div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{explanation}</p>
          {formula && (
            <div className="text-[10px] font-mono bg-muted/50 rounded px-2 py-1 text-foreground/70">{formula}</div>
          )}
          {benchmark && (
            <div className="text-[10px] text-primary">Benchmark : {benchmark}</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
