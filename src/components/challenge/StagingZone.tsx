import { useCallback, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package } from "lucide-react";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { getPillarGradient } from "@/hooks/useToolkitData";
import { FormatSelector, type CardFormat } from "./FormatSelector";
import { GameCard } from "./GameCard";

export interface StagingItem {
  id: string;
  card_id: string;
  format: string;
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
  readOnly?: boolean;
  viewMode?: "list" | "board";
}

export function StagingZone({ items, cards, pillars, onDropFromSidebar, onRemove, onFormatChange, readOnly, viewMode = "list" }: StagingZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Group items by pillar
  const groupedItems = useMemo(() => {
    const groups: Record<string, { pillar: DbPillar | null; items: StagingItem[] }> = {};
    items.forEach(item => {
      const card = cards.find(c => c.id === item.card_id);
      const pillarId = card?.pillar_id || "unknown";
      if (!groups[pillarId]) {
        const pillar = card ? pillars.find(p => p.id === card.pillar_id) || null : null;
        groups[pillarId] = { pillar, items: [] };
      }
      groups[pillarId].items.push(item);
    });
    // Sort groups by pillar name
    return Object.values(groups).sort((a, b) => (a.pillar?.name || "").localeCompare(b.pillar?.name || ""));
  }, [items, cards, pillars]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Don't accept reorder drags from slots
    if (e.dataTransfer.types.includes("reorder-id")) return;
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    // Don't accept drags that come from a slot (source-response-id) — those should go to other slots only
    if (e.dataTransfer.getData("source-response-id")) return;
    if (e.dataTransfer.types.includes("reorder-id")) return;
    const cardId = e.dataTransfer.getData("card-id");
    if (cardId) onDropFromSidebar(cardId);
  }, [onDropFromSidebar]);

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

      {/* Grouped by pillar */}
      <div className={cn("flex flex-col gap-3", isBoard && "gap-4")}>
        <AnimatePresence mode="popLayout">
          {groupedItems.map(({ pillar, items: groupItems }) => {
            const gradient = pillar ? getPillarGradient(pillar.slug, pillar?.color) : "primary";
            return (
              <motion.div
                key={pillar?.id || "unknown"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Pillar group header */}
                {items.length > 1 && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: `hsl(var(--pillar-${gradient}))` }} />
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest"
                      style={{ color: `hsl(var(--pillar-${gradient}))` }}
                    >
                      {pillar?.name || "Autre"}
                    </span>
                  </div>
                )}

                {/* Cards in this group */}
                <div className={cn("flex flex-wrap gap-2", isBoard && "gap-3")}>
                  {groupItems.map((item) => {
                    const card = cards.find(c => c.id === item.card_id);
                    if (!card) return null;

                    if (isBoard) {
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <GameCard
                            card={card}
                            pillar={pillar || undefined}
                            onRemove={readOnly ? undefined : () => onRemove(item.id)}
                            readOnly={readOnly}
                            draggable={!readOnly}
                            onDragStart={(e) => {
                              e.dataTransfer.setData("card-id", card.id);
                              e.dataTransfer.setData("staging-id", item.id);
                              e.dataTransfer.effectAllowed = "move";
                            }}
                          />
                        </motion.div>
                      );
                    }

                    // List mode: compact chips
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
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
