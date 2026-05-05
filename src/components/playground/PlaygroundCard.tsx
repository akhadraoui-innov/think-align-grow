import { motion } from "framer-motion";
import { Sparkles, Target, Zap, Clock, Award } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PHASE_LABELS } from "@/hooks/useToolkitData";
import type { Tables } from "@/integrations/supabase/types";

type Card = Tables<"cards"> & { image_url?: string | null; image_status?: string | null };
type Pillar = Tables<"pillars">;

export type PlaygroundCardProps = {
  card: Card;
  pillar?: Pillar;
  index?: number;
  variant?: "default" | "compact" | "presentation";
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  className?: string;
};

const PHASE_COLORS: Record<string, string> = {
  foundations: "#0EA5E9",
  model: "#8B5CF6",
  growth: "#10B981",
  execution: "#F59E0B",
};

export function PlaygroundCard({
  card,
  pillar,
  index = 0,
  variant = "default",
  onClick,
  draggable,
  onDragStart,
  className,
}: PlaygroundCardProps) {
  const [flipped, setFlipped] = useState(false);
  const accent = pillar?.color || "#4F6BED";
  const phaseColor = PHASE_COLORS[card.phase as string] || accent;

  const sizeCls =
    variant === "compact"
      ? "w-[180px] h-[252px]"
      : variant === "presentation"
      ? "w-[min(520px,90vw)] h-[min(728px,80vh)]"
      : "w-[280px] h-[392px]";

  const titleCls = variant === "compact" ? "text-sm" : variant === "presentation" ? "text-3xl" : "text-lg";
  const imgH = variant === "compact" ? "h-[112px]" : variant === "presentation" ? "h-[260px]" : "h-[170px]";

  const handleClick = () => {
    if (onClick) onClick();
    else setFlipped((f) => !f);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.3) }}
      whileHover={{ y: -4 }}
      className={cn("relative [perspective:1200px]", sizeCls, className)}
    >
      <div
        draggable={draggable}
        onDragStart={onDragStart as any}
        className="w-full h-full"
      >
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]"
        )}
      >
        {/* FRONT */}
        <button
          type="button"
          onClick={handleClick}
          className="absolute inset-0 [backface-visibility:hidden] cursor-pointer text-left"
        >
          <div
            className="relative w-full h-full rounded-2xl overflow-hidden bg-card border shadow-md hover:shadow-xl transition-shadow flex flex-col"
            style={{
              borderColor: accent,
              boxShadow: `0 1px 0 0 ${accent}22 inset, 0 8px 24px -12px ${accent}55`,
            }}
          >
            {/* Top band */}
            <div
              className="flex items-center justify-between px-3 h-7 text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ background: `linear-gradient(90deg, ${accent}, ${phaseColor})` }}
            >
              <span className="truncate">{pillar?.name || "Pilier"}</span>
              <span className="flex items-center gap-1 opacity-90">
                <Zap className="w-3 h-3" />
                {card.valorization || 0}
              </span>
            </div>

            {/* Illustration */}
            <div className={cn("relative w-full overflow-hidden flex-shrink-0 bg-muted", imgH)}>
              {card.image_url ? (
                <img
                  src={card.image_url}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${accent}33, transparent 60%), linear-gradient(135deg, ${accent}11, ${phaseColor}22)`,
                  }}
                >
                  {card.image_status === "generating" ? (
                    <div className="animate-pulse text-xs text-muted-foreground">Génération…</div>
                  ) : (
                    <Sparkles className="w-10 h-10 opacity-30" style={{ color: accent }} />
                  )}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent" />
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-[9px] uppercase backdrop-blur bg-white/85">
                  {PHASE_LABELS[card.phase as string] || card.phase}
                </Badge>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-3 flex flex-col gap-1.5 min-h-0">
              <h3 className={cn("font-bold leading-tight font-display line-clamp-2", titleCls)}>
                {card.title}
              </h3>
              {card.subtitle && variant !== "compact" && (
                <p className="text-xs text-muted-foreground line-clamp-2">{card.subtitle}</p>
              )}
              {variant !== "compact" && (
                <>
                  <div className="h-px bg-border my-1" />
                  {card.action && (
                    <div className="flex items-start gap-1.5 text-xs">
                      <Target className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: accent }} />
                      <span className="line-clamp-2">{card.action}</span>
                    </div>
                  )}
                  {card.kpi && (
                    <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <Award className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: phaseColor }} />
                      <span className="line-clamp-1">{card.kpi}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t bg-muted/40 text-[10px] text-muted-foreground">
              <span className="font-mono">#{String((card.sort_order ?? 0) + 1).padStart(3, "0")}</span>
              {card.duration_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {card.duration_minutes}min
                </span>
              )}
            </div>
          </div>
        </button>

        {/* BACK */}
        <button
          type="button"
          onClick={handleClick}
          className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] cursor-pointer text-left"
        >
          <div
            className="w-full h-full rounded-2xl border-2 p-4 flex flex-col gap-3 overflow-y-auto"
            style={{ borderColor: accent, background: `linear-gradient(160deg, ${accent}10, transparent)` }}
          >
            <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color: accent }}>
              {pillar?.name}
            </div>
            <h3 className={cn("font-bold font-display", titleCls)}>{card.title}</h3>
            {card.definition && (
              <p className="text-sm leading-relaxed text-foreground/80">{card.definition}</p>
            )}
            {card.qualification && (
              <div className="text-xs">
                <span className="font-semibold">Qualification :</span> {card.qualification}
              </div>
            )}
            <div className="mt-auto flex items-center justify-between text-xs pt-2 border-t">
              <span className="flex items-center gap-1 font-bold" style={{ color: accent }}>
                <Zap className="w-3.5 h-3.5" /> {card.valorization || 0} pts
              </span>
              <span className="text-muted-foreground italic">Cliquez pour retourner</span>
            </div>
          </div>
        </button>
      </div>
      </div>
    </motion.div>
  );
}
