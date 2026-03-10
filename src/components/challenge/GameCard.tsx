import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { getPillarGradient, PHASE_LABELS } from "@/hooks/useToolkitData";
import { MaturitySelector, MaturityBadge } from "./MaturitySelector";
import { X } from "lucide-react";

interface GameCardProps {
  card: DbCard;
  pillar?: DbPillar;
  maturity?: number;
  onMaturityChange?: (value: number) => void;
  onRemove?: () => void;
  readOnly?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

export function GameCard({
  card,
  pillar,
  maturity = 0,
  onMaturityChange,
  onRemove,
  readOnly,
  draggable,
  onDragStart,
}: GameCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const isDraggingRef = useRef(false);
  const gradient = pillar ? getPillarGradient(pillar.slug) : "primary";
  const phaseLabel = PHASE_LABELS[card.phase] || card.phase;

  const handleDragStart = (e: React.DragEvent) => {
    isDraggingRef.current = true;
    onDragStart?.(e);
  };

  const handleDragEnd = () => {
    // Reset after a short delay to avoid click-after-drag
    setTimeout(() => { isDraggingRef.current = false; }, 100);
  };

  const handleCardClick = () => {
    // Don't flip if we just finished dragging
    if (isDraggingRef.current) return;
    setIsFlipped(!isFlipped);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onRemove?.();
  };

  return (
    <div
      className="w-44 h-60 shrink-0"
      style={{ perspective: "1000px" }}
      draggable={draggable && !readOnly}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <motion.div
        className={cn(
          "relative w-full h-full cursor-pointer",
          draggable && !readOnly && "cursor-grab active:cursor-grabbing"
        )}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.45, type: "spring", stiffness: 220, damping: 28 }}
        style={{ transformStyle: "preserve-3d" }}
        onClick={handleCardClick}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl border-2 border-border overflow-hidden flex flex-col"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Colored header */}
          <div
            className="px-3 pt-3 pb-2 shrink-0"
            style={{ background: `hsl(var(--pillar-${gradient}) / 0.15)` }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[8px] font-black uppercase tracking-[0.15em] truncate"
                style={{ color: `hsl(var(--pillar-${gradient}))` }}
              >
                {pillar?.name || "Pilier"}
              </span>
              {!readOnly && onRemove && (
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={handleRemoveClick}
                  className="p-1 rounded-md hover:bg-destructive/20 transition-colors z-10 relative"
                >
                  <X className="h-3.5 w-3.5 text-destructive" />
                </button>
              )}
            </div>
            <h3 className="font-display font-black text-sm leading-tight text-foreground line-clamp-2">
              {card.title}
            </h3>
            {card.subtitle && (
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{card.subtitle}</p>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 px-3 py-2 flex flex-col justify-between bg-card">
            <p className="text-[10px] text-muted-foreground line-clamp-4 leading-relaxed">
              {card.definition || card.objective}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span
                className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md"
                style={{
                  background: `hsl(var(--pillar-${gradient}) / 0.1)`,
                  color: `hsl(var(--pillar-${gradient}))`,
                }}
              >
                {phaseLabel}
              </span>
              <MaturityBadge value={maturity} />
            </div>
          </div>

          {/* Bottom accent */}
          <div
            className="h-1 shrink-0"
            style={{ background: `hsl(var(--pillar-${gradient}))` }}
          />
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl border-2 border-border overflow-hidden flex flex-col bg-card"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div
            className="h-1 shrink-0"
            style={{ background: `hsl(var(--pillar-${gradient}))` }}
          />
          <div className="flex-1 px-3 py-3 flex flex-col gap-3 overflow-auto">
            <div>
              <span className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground">Action</span>
              <p className="text-[11px] text-foreground leading-relaxed mt-1">{card.action || "—"}</p>
            </div>
            <div>
              <span className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground">KPI</span>
              <p className="text-[11px] text-foreground leading-relaxed mt-1">{card.kpi || "—"}</p>
            </div>
          </div>
          <div className="px-3 pb-2" onClick={(e) => e.stopPropagation()}>
            {onMaturityChange && !readOnly ? (
              <MaturitySelector value={maturity} onChange={onMaturityChange} />
            ) : (
              <MaturityBadge value={maturity} />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
