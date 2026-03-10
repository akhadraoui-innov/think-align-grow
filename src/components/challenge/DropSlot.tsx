import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChallengeSlot, ChallengeResponse } from "@/hooks/useChallengeData";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { getPillarGradient } from "@/hooks/useToolkitData";
import { X, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DropSlotProps {
  slot: ChallengeSlot;
  responses: ChallengeResponse[];
  cards: DbCard[];
  pillars: DbPillar[];
  onDrop: (slotId: string, cardId: string) => void;
  onRemove: (responseId: string) => void;
  readOnly?: boolean;
}

export function DropSlot({ slot, responses, cards, pillars, onDrop, onRemove, readOnly }: DropSlotProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const slotResponses = responses.filter(r => r.slot_id === slot.id);
  const isFilled = slot.slot_type === "single" ? slotResponses.length > 0 : false;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isFilled || slot.slot_type !== "single") setIsDragOver(true);
  }, [isFilled, slot.slot_type]);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const cardId = e.dataTransfer.getData("card-id");
    if (!cardId) return;
    if (isFilled && slot.slot_type === "single") return;
    onDrop(slot.id, cardId);
  }, [slot.id, isFilled, slot.slot_type, onDrop]);

  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 border-dashed p-4 min-h-[120px] transition-all duration-200",
        isDragOver && "border-primary bg-primary/5 scale-[1.02]",
        isFilled && slot.slot_type === "single" ? "border-solid border-border bg-card" : "border-muted-foreground/30 bg-secondary/20",
        slot.required && slotResponses.length === 0 && "border-destructive/40"
      )}
      onDragOver={readOnly ? undefined : handleDragOver}
      onDragLeave={readOnly ? undefined : handleDragLeave}
      onDrop={readOnly ? undefined : handleDrop}
    >
      {/* Label */}
      <div className="mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {slot.label}
        </span>
        {slot.required && <span className="text-destructive ml-1 text-xs">*</span>}
        {slot.slot_type !== "single" && (
          <span className="ml-2 text-[10px] text-muted-foreground/70">
            ({slot.slot_type === "multi" ? "plusieurs cartes" : "ordre important"})
          </span>
        )}
      </div>

      {/* Hint */}
      {slot.hint && slotResponses.length === 0 && (
        <p className="text-xs text-muted-foreground/60 italic mb-2">{slot.hint}</p>
      )}

      {/* Placed cards */}
      <AnimatePresence mode="popLayout">
        {slotResponses.map((resp, idx) => {
          const card = cards.find(c => c.id === resp.card_id);
          const pillar = card ? pillars.find(p => p.id === card.pillar_id) : null;
          const gradient = pillar ? getPillarGradient(pillar.slug) : "primary";
          if (!card) return null;

          return (
            <motion.div
              key={resp.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border mb-1 group"
            >
              {slot.slot_type === "ranked" && (
                <span className="text-xs font-black text-muted-foreground w-5 text-center">{idx + 1}</span>
              )}
              <div
                className="h-6 w-1.5 rounded-full shrink-0"
                style={{ background: `hsl(var(--pillar-${gradient}))` }}
              />
              <span className="text-sm font-medium flex-1 truncate">{card.title}</span>
              {!readOnly && (
                <button
                  onClick={() => onRemove(resp.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-destructive/10"
                >
                  <X className="h-3 w-3 text-destructive" />
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty state */}
      {slotResponses.length === 0 && !isDragOver && (
        <div className="flex items-center justify-center h-16 text-muted-foreground/40">
          <GripVertical className="h-5 w-5 mr-1" />
          <span className="text-xs">Glissez une carte ici</span>
        </div>
      )}

      {/* Drag over indicator */}
      {isDragOver && (
        <div className="flex items-center justify-center h-16 text-primary">
          <span className="text-xs font-bold animate-pulse">Déposer ici</span>
        </div>
      )}
    </div>
  );
}
