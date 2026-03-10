import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package } from "lucide-react";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { getPillarGradient } from "@/hooks/useToolkitData";
import { FormatSelector, type CardFormat } from "./FormatSelector";

export interface StagingItem {
  id: string;
  card_id: string;
  format: string;
}

interface StagingZoneProps {
  items: StagingItem[];
  cards: DbCard[];
  pillars: DbPillar[];
  onDropFromSidebar: (cardId: string) => void;
  onRemove: (itemId: string) => void;
  onFormatChange: (itemId: string, format: CardFormat) => void;
  readOnly?: boolean;
}

export function StagingZone({ items, cards, pillars, onDropFromSidebar, onRemove, onFormatChange, readOnly }: StagingZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const cardId = e.dataTransfer.getData("card-id");
    if (cardId) onDropFromSidebar(cardId);
  }, [onDropFromSidebar]);

  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-dashed p-3 transition-all min-h-[80px]",
        isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20 bg-secondary/10"
      )}
      onDragOver={readOnly ? undefined : handleDragOver}
      onDragLeave={readOnly ? undefined : handleDragLeave}
      onDrop={readOnly ? undefined : handleDrop}
    >
      <div className="flex items-center gap-2 mb-2">
        <Package className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Zone de tri
        </span>
        <span className="text-[10px] text-muted-foreground/60">{items.length} carte{items.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {items.map((item) => {
            const card = cards.find(c => c.id === item.card_id);
            const pillar = card ? pillars.find(p => p.id === card.pillar_id) : null;
            const gradient = pillar ? getPillarGradient(pillar.slug) : "primary";
            if (!card) return null;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                draggable={!readOnly}
                onDragStart={(e: any) => {
                  e.dataTransfer?.setData("card-id", card.id);
                  e.dataTransfer?.setData("staging-id", item.id);
                  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
                }}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-xl bg-card border border-border group",
                  !readOnly && "cursor-grab active:cursor-grabbing"
                )}
              >
                <div
                  className="h-5 w-1 rounded-full shrink-0"
                  style={{ background: `hsl(var(--pillar-${gradient}))` }}
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

        {items.length === 0 && !isDragOver && (
          <span className="text-[10px] text-muted-foreground/40 italic">Glissez des cartes ici pour les pré-sélectionner</span>
        )}
      </div>
    </div>
  );
}
