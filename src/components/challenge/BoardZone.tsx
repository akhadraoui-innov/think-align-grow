import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChallengeSlot, ChallengeResponse } from "@/hooks/useChallengeData";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { GameCard } from "./GameCard";
import { GripVertical } from "lucide-react";

interface BoardZoneProps {
  slot: ChallengeSlot;
  responses: ChallengeResponse[];
  cards: DbCard[];
  pillars: DbPillar[];
  onDrop: (slotId: string, cardId: string) => void;
  onRemove: (responseId: string) => void;
  onMoveToSlot?: (sourceResponseId: string, targetSlotId: string, cardId: string) => void;
  onUpdateResponse?: (responseId: string, updates: { maturity?: number; rank?: number }) => void;
  readOnly?: boolean;
}

export function BoardZone({ slot, responses, cards, pillars, onDrop, onRemove, onMoveToSlot, onUpdateResponse, readOnly }: BoardZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const slotResponses = responses
    .filter(r => r.slot_id === slot.id)
    .sort((a, b) => a.rank - b.rank);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only handle leave if we're actually leaving the zone, not entering a child
    const relatedTarget = e.relatedTarget as Node;
    if (e.currentTarget.contains(relatedTarget)) return;
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const cardId = e.dataTransfer.getData("card-id");
    if (!cardId) return;

    // Check if card is already in this slot — prevent duplicates
    const alreadyHere = slotResponses.some(r => r.card_id === cardId);
    if (alreadyHere) return;

    // If dragged from another slot (has source-response-id), it's a MOVE
    const sourceResponseId = e.dataTransfer.getData("source-response-id");
    if (sourceResponseId) {
      // Use onMoveToSlot if available (removes source + adds to target atomically)
      if (onMoveToSlot) {
        onMoveToSlot(sourceResponseId, slot.id, cardId);
        return;
      }
      // Fallback: remove source, then add
      onRemove(sourceResponseId);
    }

    // If dragged from staging, remove staging item
    const stagingId = e.dataTransfer.getData("staging-id");
    // Note: staging removal is handled by the parent via onDrop chain

    onDrop(slot.id, cardId);
  }, [slot.id, onDrop, onRemove, onMoveToSlot, slotResponses]);

  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-dashed p-4 min-h-[280px] transition-all duration-200 flex flex-col",
        isDragOver && "border-primary bg-primary/5 scale-[1.01]",
        slotResponses.length > 0 ? "border-solid border-border/50 bg-card/50" : "border-muted-foreground/20 bg-secondary/10",
        slot.required && slotResponses.length === 0 && "border-destructive/30"
      )}
      onDragOver={readOnly ? undefined : handleDragOver}
      onDragLeave={readOnly ? undefined : handleDragLeave}
      onDrop={readOnly ? undefined : handleDrop}
    >
      {/* Zone header */}
      <div className="mb-3">
        <span className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">
          {slot.label}
        </span>
        {slot.required && <span className="text-destructive ml-1 text-xs">*</span>}
        <span className="ml-2 text-[9px] text-muted-foreground/50">
          {slot.slot_type === "ranked" ? "classé" : slot.slot_type === "single" ? "1 carte" : "multi"}
        </span>
      </div>

      {/* Cards */}
      {slotResponses.length > 0 ? (
        <div className="flex flex-wrap gap-3 flex-1">
          {slotResponses.map((resp, idx) => {
            const card = cards.find(c => c.id === resp.card_id);
            const pillar = card ? pillars.find(p => p.id === card.pillar_id) : null;
            if (!card) return null;

            return (
              <div key={resp.id} className="relative">
                {slot.slot_type === "ranked" && (
                  <div className="absolute -top-2 -left-2 z-10 h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-black">
                    {idx + 1}
                  </div>
                )}
                <GameCard
                  card={card}
                  pillar={pillar || undefined}
                  maturity={resp.maturity}
                  onMaturityChange={(v) => onUpdateResponse?.(resp.id, { maturity: v })}
                  onRemove={() => onRemove(resp.id)}
                  readOnly={readOnly}
                  draggable={!readOnly}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("card-id", card.id);
                    e.dataTransfer.setData("source-response-id", resp.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground/30">
          {isDragOver ? (
            <span className="text-sm font-bold text-primary animate-pulse">Déposer ici</span>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <GripVertical className="h-6 w-6" />
              <span className="text-xs">Glissez des cartes ici</span>
              {slot.hint && <span className="text-[10px] italic text-center max-w-[200px]">{slot.hint}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
