import { useCallback, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, GripVertical } from "lucide-react";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { getPillarCssColor } from "@/hooks/useToolkitData";
import { FormatSelector, type CardFormat } from "./FormatSelector";
import { GameCard } from "./GameCard";

export interface StagingItem {
  id: string;
  card_id: string;
  format: string;
  sort_order?: number;
  subject_id?: string;
  [key: string]: any;
}

interface StagingZoneProps {
  items: StagingItem[];
  cards: DbCard[];
  pillars: DbPillar[];
  onDropFromSidebar: (cardId: string) => void;
  onRemove: (itemId: string) => void;
  onFormatChange: (itemId: string, format: CardFormat) => void;
  onReorder?: (draggedId: string, targetId: string) => void;
  readOnly?: boolean;
  viewMode?: "list" | "board";
}

export function StagingZone({ items, cards, pillars, onDropFromSidebar, onRemove, onFormatChange, onReorder, readOnly, viewMode = "list" }: StagingZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [reorderTargetId, setReorderTargetId] = useState<string | null>(null);
  const [reorderDragId, setReorderDragId] = useState<string | null>(null);
  const dragCounterRef = useRef(0);

  // Sort items by sort_order for flat display
  const sortedItems = [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("reorder-id")) return;
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.getData("source-response-id")) return;
    if (e.dataTransfer.types.includes("reorder-id")) return;
    const cardId = e.dataTransfer.getData("card-id");
    if (cardId) onDropFromSidebar(cardId);
  }, [onDropFromSidebar]);

  // Reorder handlers per item
  const handleItemDragStart = useCallback((e: React.DragEvent, itemId: string, cardId: string) => {
    e.dataTransfer.setData("reorder-id", itemId);
    e.dataTransfer.setData("card-id", cardId);
    e.dataTransfer.effectAllowed = "move";
    setReorderDragId(itemId);
  }, []);

  const handleItemDragOver = useCallback((e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes("reorder-id")) return;
    e.dataTransfer.dropEffect = "move";
    setReorderTargetId(itemId);
  }, []);

  const handleItemDragLeave = useCallback(() => {
    setReorderTargetId(null);
  }, []);

  const handleItemDrop = useCallback((e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData("reorder-id");
    setReorderTargetId(null);
    setReorderDragId(null);
    if (draggedId && draggedId !== targetItemId && onReorder) {
      onReorder(draggedId, targetItemId);
    }
  }, [onReorder]);

  const handleItemDragEnd = useCallback(() => {
    setReorderTargetId(null);
    setReorderDragId(null);
  }, []);

  const isBoard = viewMode === "board";

  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-dashed p-4 transition-all",
        isBoard ? "min-h-[200px]" : "min-h-[120px]",
        isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20 bg-secondary/10"
      )}
      onDragOver={readOnly ? undefined : handleDragOver}
      onDragLeave={readOnly ? undefined : handleDragLeave}
      onDrop={readOnly ? undefined : handleDrop}
    >
      <div className="flex items-center gap-2 mb-3">
        <Package className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Zone de tri
        </span>
        <span className="text-[10px] text-muted-foreground/60">{items.length} carte{items.length !== 1 ? "s" : ""}</span>
      </div>

      {items.length === 0 && !isDragOver && (
        <div className="flex items-center justify-center py-6 text-muted-foreground/40">
          <span className="text-xs italic">Glissez des cartes ici pour les pré-sélectionner</span>
        </div>
      )}

      <div className={cn("flex flex-wrap gap-2", isBoard && "gap-3")}>
        <AnimatePresence mode="popLayout">
          {sortedItems.map((item) => {
            const card = cards.find(c => c.id === item.card_id);
            if (!card) return null;
            const pillar = pillars.find(p => p.id === card.pillar_id) || null;
            const color = getPillarCssColor(pillar?.slug || "", pillar?.color);
            const isDropTarget = reorderTargetId === item.id && reorderDragId !== item.id;
            const isDragging = reorderDragId === item.id;

            if (isBoard) {
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={cn(
                    "relative transition-all",
                    isDropTarget && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-2xl"
                  )}
                  draggable={!readOnly}
                  onDragStart={(e: any) => handleItemDragStart(e, item.id)}
                  onDragOver={(e: any) => handleItemDragOver(e, item.id)}
                  onDragLeave={handleItemDragLeave}
                  onDrop={(e: any) => handleItemDrop(e, item.id)}
                  onDragEnd={handleItemDragEnd}
                >
                  <GameCard
                    card={card}
                    pillar={pillar || undefined}
                    onRemove={readOnly ? undefined : () => onRemove(item.id)}
                    readOnly={readOnly}
                    draggable={false}
                  />
                </motion.div>
              );
            }

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                draggable={!readOnly}
                onDragStart={(e: any) => handleItemDragStart(e, item.id)}
                onDragOver={(e: any) => handleItemDragOver(e, item.id)}
                onDragLeave={handleItemDragLeave}
                onDrop={(e: any) => handleItemDrop(e, item.id)}
                onDragEnd={handleItemDragEnd}
                className={cn(
                  "flex items-center gap-1.5 p-2 rounded-xl bg-card border border-border group transition-all",
                  !readOnly && "cursor-grab active:cursor-grabbing",
                  isDropTarget && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                )}
              >
                {!readOnly && (
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                )}
                <div
                  className="h-5 w-1 rounded-full shrink-0"
                  style={{ background: color }}
                />
                <span className="text-xs font-medium truncate max-w-[120px]">{card.title}</span>
                {!readOnly && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FormatSelector
                      value={item.format as CardFormat}
                      onChange={(f) => onFormatChange(item.id, f)}
                    />
                    <button
                      onClick={() => onRemove(item.id)}
                      className="p-0.5 rounded hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
