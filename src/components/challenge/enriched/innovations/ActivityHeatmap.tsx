import { useMemo } from "react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** counts keyed by slot id */
  countsBySlot: Record<string, number>;
  /** Display variant */
  variant?: "badge" | "bar";
  className?: string;
}

/** Innovation #2 — Heatmap d'activité : badge coloré sur chaque slot indiquant son niveau d'activité */
export function ActivityHeat({ countsBySlot, slotId, variant = "badge", className }: Props & { slotId: string }) {
  const max = useMemo(() => Math.max(1, ...Object.values(countsBySlot || {})), [countsBySlot]);
  const count = countsBySlot[slotId] || 0;
  const intensity = Math.min(1, count / max);

  if (count === 0) return null;

  // 0 → muted, 1 → primary
  const bg = `hsl(var(--primary) / ${0.15 + intensity * 0.55})`;
  const border = `hsl(var(--primary) / ${0.4 + intensity * 0.5})`;

  if (variant === "bar") {
    return (
      <div className={cn("h-1 rounded-full", className)} style={{ background: bg, width: `${20 + intensity * 80}%` }} title={`${count} interactions`} />
    );
  }

  return (
    <span
      className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border", className)}
      style={{ background: bg, borderColor: border, color: "hsl(var(--primary))" }}
      title={`${count} interactions`}
    >
      <Activity className="h-2.5 w-2.5" />
      {count}
    </span>
  );
}

/** Hook utilitaire : compte les artifacts par slot */
export function useSlotActivityCounts(artifacts: Array<{ slot_id?: string | null }>) {
  return useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of artifacts) {
      if (!a.slot_id) continue;
      counts[a.slot_id] = (counts[a.slot_id] || 0) + 1;
    }
    return counts;
  }, [artifacts]);
}
