import { useCallback } from "react";
import { motion } from "framer-motion";
import type { ChallengeSubject, ChallengeSlot, ChallengeResponse } from "@/hooks/useChallengeData";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { BoardZone } from "./BoardZone";
import { StagingZone, type StagingItem } from "./StagingZone";
import { cn } from "@/lib/utils";

import type { CardFormat } from "./FormatSelector";

interface ChallengeBoardProps {
  subject: ChallengeSubject;
  slots: ChallengeSlot[];
  responses: ChallengeResponse[];
  cards: DbCard[];
  pillars: DbPillar[];
  onDrop: (slotId: string, cardId: string) => void;
  onRemove: (responseId: string) => void;
  onMoveToSlot?: (sourceResponseId: string, targetSlotId: string, cardId: string) => void;
  onUpdateResponse?: (responseId: string, updates: { format?: string; maturity?: number; rank?: number }) => void;
  stagingItems?: StagingItem[];
  onStage?: (cardId: string) => void;
  onUnstage?: (itemId: string) => void;
  onStagingFormatChange?: (itemId: string, format: CardFormat) => void;
  readOnly?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  question: "Question",
  challenge: "Challenge",
  context: "Contexte",
};

const TYPE_COLORS: Record<string, string> = {
  question: "bg-accent/10 text-accent",
  challenge: "bg-destructive/10 text-destructive",
  context: "bg-primary/10 text-primary",
};

export function ChallengeBoard({
  subject, slots, responses, cards, pillars,
  onDrop, onRemove, onMoveToSlot, onUpdateResponse,
  stagingItems = [], onStage, onUnstage, onStagingFormatChange,
  readOnly,
}: ChallengeBoardProps) {
  const subjectSlots = slots.filter(s => s.subject_id === subject.id);
  const subjectResponses = responses.filter(r => r.subject_id === subject.id);
  const subjectStaging = stagingItems.filter(i => i.subject_id === subject.id);

  const handleStageDrop = useCallback((cardId: string) => {
    onStage?.(cardId);
  }, [onStage]);

  const handleSlotDrop = useCallback((slotId: string, cardId: string) => {
    const stagingItem = subjectStaging.find(i => i.card_id === cardId);
    if (stagingItem) onUnstage?.(stagingItem.id);
    onDrop(slotId, cardId);
  }, [onDrop, onUnstage, subjectStaging]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}
    >
      {/* Subject header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg", TYPE_COLORS[subject.type])}>
            {TYPE_LABELS[subject.type]}
          </span>
        </div>
        <h2 className="font-display font-black text-xl tracking-tight">{subject.title}</h2>
        {subject.description && (
          <p className="text-sm text-muted-foreground mt-1">{subject.description}</p>
        )}
      </div>

      {/* Board — scrollable via ScrollArea */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="p-6">
          <div className={cn(
            "grid gap-5",
            subjectSlots.length <= 2 ? "grid-cols-1 sm:grid-cols-2" :
            subjectSlots.length <= 3 ? "grid-cols-1 sm:grid-cols-3" :
            subjectSlots.length <= 4 ? "grid-cols-1 sm:grid-cols-2" :
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          )}>
            {subjectSlots.map(slot => (
              <BoardZone
                key={slot.id}
                slot={slot}
                responses={subjectResponses}
                cards={cards}
                pillars={pillars}
                onDrop={handleSlotDrop}
                onRemove={onRemove}
                onMoveToSlot={onMoveToSlot}
                onUpdateResponse={onUpdateResponse}
                readOnly={readOnly}
              />
            ))}
          </div>

          {/* Staging at bottom with GameCards */}
          {onStage && (
            <div className="mt-6">
              <StagingZone
                items={subjectStaging}
                cards={cards}
                pillars={pillars}
                onDropFromSidebar={handleStageDrop}
                onRemove={(id) => onUnstage?.(id)}
                onFormatChange={(id, fmt) => onStagingFormatChange?.(id, fmt)}
                readOnly={readOnly}
                viewMode="board"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
