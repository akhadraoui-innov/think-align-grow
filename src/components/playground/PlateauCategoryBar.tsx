import { Layers, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { PHASE_LABELS } from "@/hooks/useToolkitData";
import type { Tables } from "@/integrations/supabase/types";
import type { SessionCategory } from "@/hooks/usePlaygroundSessions";

type Pillar = Tables<"pillars">;
type Card = Tables<"cards">;

const PHASES = ["foundations", "model", "growth", "execution"] as const;
const PHASE_COLORS: Record<string, string> = {
  foundations: "#0EA5E9",
  model: "#8B5CF6",
  growth: "#10B981",
  execution: "#F59E0B",
};

export function PlateauCategoryBar({
  cards,
  pillars,
  value,
  onChange,
  accent,
}: {
  cards: Card[];
  pillars: Pillar[];
  value: SessionCategory;
  onChange: (v: SessionCategory) => void;
  accent: string;
}) {
  const total = cards.length;
  const byPhase: Record<string, number> = {};
  const byPillar: Record<string, number> = {};
  for (const c of cards) {
    byPhase[c.phase as string] = (byPhase[c.phase as string] || 0) + 1;
    byPillar[c.pillar_id] = (byPillar[c.pillar_id] || 0) + 1;
  }

  const Chip = ({
    active,
    color,
    onClick,
    label,
    count,
    icon,
  }: {
    active: boolean;
    color: string;
    onClick: () => void;
    label: string;
    count: number;
    icon?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all",
        active
          ? "text-white shadow-md ring-2 ring-offset-1"
          : "bg-card hover:bg-muted text-foreground"
      )}
      style={
        active
          ? { background: color, borderColor: color, boxShadow: `0 4px 14px -4px ${color}88` }
          : { borderColor: color + "55", color }
      }
    >
      {icon}
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-mono",
          active ? "bg-white/25" : "bg-muted"
        )}
      >
        {count}
      </span>
    </button>
  );

  return (
    <div className="flex items-center gap-4 px-6 py-3 border-b bg-card/60 backdrop-blur overflow-x-auto">
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Catégorie
        </span>
      </div>

      <Chip
        active={value.type === "all"}
        color={accent}
        onClick={() => onChange({ type: "all", value: null })}
        label="Toutes"
        count={total}
        icon={<Layers className="w-3.5 h-3.5" />}
      />

      <div className="w-px h-6 bg-border flex-shrink-0" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex-shrink-0">
        Phases
      </span>
      {PHASES.map((p) => (
        <Chip
          key={p}
          active={value.type === "phase" && value.value === p}
          color={PHASE_COLORS[p]}
          onClick={() => onChange({ type: "phase", value: p })}
          label={PHASE_LABELS[p] || p}
          count={byPhase[p] || 0}
        />
      ))}

      <div className="w-px h-6 bg-border flex-shrink-0" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex-shrink-0">
        Piliers
      </span>
      {pillars.map((p) => (
        <Chip
          key={p.id}
          active={value.type === "pillar" && value.value === p.id}
          color={p.color || accent}
          onClick={() => onChange({ type: "pillar", value: p.id })}
          label={p.name}
          count={byPillar[p.id] || 0}
          icon={<Compass className="w-3.5 h-3.5" />}
        />
      ))}
    </div>
  );
}
