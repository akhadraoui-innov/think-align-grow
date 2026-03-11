import { useCallback } from "react";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { getPillarGradient } from "@/hooks/useToolkitData";
import { cn } from "@/lib/utils";
import type { CardFormat } from "./FormatSelector";

interface DraggableCardProps {
  card: DbCard;
  pillar: DbPillar | undefined;
  isPlaced?: boolean;
  format?: CardFormat;
}

export function DraggableCard({ card, pillar, isPlaced, format = "normal" }: DraggableCardProps) {
  const gradient = pillar ? getPillarGradient(pillar.slug, pillar.color) : "primary";

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData("card-id", card.id);
    e.dataTransfer.effectAllowed = "move";
  }, [card.id]);

  if (format === "compact") {
    return (
      <div
        draggable={!isPlaced}
        onDragStart={handleDragStart}
        className={cn(
          "flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-grab active:cursor-grabbing transition-all",
          "hover:bg-secondary/60",
          isPlaced && "opacity-40 pointer-events-none"
        )}
      >
        <div
          className="h-4 w-1 rounded-full shrink-0"
          style={{ background: `hsl(var(--pillar-${gradient}))` }}
        />
        <span className="text-xs font-medium truncate">{card.title}</span>
      </div>
    );
  }

  if (format === "expanded") {
    return (
      <div
        draggable={!isPlaced}
        onDragStart={handleDragStart}
        className={cn(
          "flex flex-col gap-1 p-3 rounded-xl cursor-grab active:cursor-grabbing transition-all",
          "hover:bg-secondary/60 border border-transparent hover:border-border",
          isPlaced && "opacity-40 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2">
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
        {(card.objective || card.definition) && (
          <p className="text-[10px] text-muted-foreground/70 line-clamp-2 pl-4">
            {card.objective || card.definition}
          </p>
        )}
      </div>
    );
  }

  // Normal format (default)
  return (
    <div
      draggable={!isPlaced}
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
