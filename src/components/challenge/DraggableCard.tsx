import { useCallback } from "react";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { getPillarGradient } from "@/hooks/useToolkitData";
import { cn } from "@/lib/utils";

interface DraggableCardProps {
  card: DbCard;
  pillar: DbPillar | undefined;
  isPlaced?: boolean;
}

export function DraggableCard({ card, pillar, isPlaced }: DraggableCardProps) {
  const gradient = pillar ? getPillarGradient(pillar.slug) : "primary";

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData("card-id", card.id);
    e.dataTransfer.effectAllowed = "move";
  }, [card.id]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "flex items-center gap-2 p-2.5 rounded-xl cursor-grab active:cursor-grabbing transition-all",
        "hover:bg-secondary/60 border border-transparent hover:border-border",
        isPlaced && "opacity-40 pointer-events-none"
      )}
    >
      <div
        className="h-7 w-1.5 rounded-full shrink-0"
        style={{ background: `hsl(var(--pillar-${gradient}))` }}
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block truncate">{card.title}</span>
        {card.subtitle && (
          <span className="text-[10px] text-muted-foreground truncate block">{card.subtitle}</span>
        )}
      </div>
    </div>
  );
}
