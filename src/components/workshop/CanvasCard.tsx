import { motion } from "framer-motion";
import { Trash2, BarChart3, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { CanvasItem } from "@/hooks/useCanvasItems";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { getPillarGradient, PHASE_LABELS } from "@/hooks/useToolkitData";

interface CanvasCardProps {
  item: CanvasItem;
  card: DbCard;
  pillar: DbPillar | null;
  isSelected: boolean;
  isDragging: boolean;
  creatorName: string;
  onPointerDown: (e: React.PointerEvent) => void;
  onDelete: () => void;
}

export function CanvasCard({
  item,
  card,
  pillar,
  isSelected,
  isDragging,
  creatorName,
  onPointerDown,
  onDelete,
}: CanvasCardProps) {
  const gradient = pillar ? getPillarGradient(pillar.slug) : "primary";
  const pillarColor = `hsl(var(--pillar-${gradient}))`;

  return (
    <motion.div
      className={cn(
        "absolute w-[280px] rounded-2xl bg-card border-2 overflow-hidden cursor-grab active:cursor-grabbing select-none",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border",
        isDragging && "shadow-elevated opacity-90"
      )}
      style={{
        left: item.x,
        top: item.y,
        zIndex: item.z_index,
      }}
      onPointerDown={onPointerDown}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Pillar color bar */}
      <div 
        className="h-2"
        style={{ background: pillarColor }}
      />

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span 
            className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ 
              background: `${pillarColor}15`,
              color: pillarColor,
            }}
          >
            {pillar?.name || "Pilier"}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            {PHASE_LABELS[card.phase] || card.phase}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display font-black text-lg uppercase tracking-tight leading-tight mb-2">
          {card.title}
        </h3>

        {/* Subtitle */}
        {card.subtitle && (
          <p className="text-xs text-muted-foreground italic mb-2">
            {card.subtitle}
          </p>
        )}

        {/* Definition */}
        {card.definition && (
          <p className="text-xs text-foreground/80 leading-relaxed mb-3 line-clamp-3">
            {card.definition}
          </p>
        )}

        {/* Action */}
        {card.action && (
          <div 
            className="rounded-xl p-3 mb-3"
            style={{ background: `${pillarColor}08`, borderLeft: `3px solid ${pillarColor}` }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="h-3 w-3" style={{ color: pillarColor }} />
              <span 
                className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: pillarColor }}
              >
                Action
              </span>
            </div>
            <p className="text-xs text-foreground leading-relaxed line-clamp-2">
              {card.action}
            </p>
          </div>
        )}

        {/* KPI */}
        {card.kpi && (
          <div className="flex items-start gap-2 mb-3">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-[10px] text-muted-foreground leading-relaxed">
              <span className="font-bold">KPI:</span> {card.kpi}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <div 
              className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: pillarColor }}
            >
              {creatorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {creatorName}
            </span>
          </div>

          {/* Delete button (only visible when selected) */}
          {isSelected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
