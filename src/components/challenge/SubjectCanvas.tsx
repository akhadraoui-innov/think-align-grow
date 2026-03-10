import { useCallback } from "react";
import { motion } from "framer-motion";
import type { ChallengeSubject, ChallengeSlot, ChallengeResponse } from "@/hooks/useChallengeData";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { DropSlot } from "./DropSlot";
import { StagingZone, type StagingItem } from "./StagingZone";
import { cn } from "@/lib/utils";
import type { CardFormat } from "./FormatSelector";

interface SubjectCanvasProps {
  subject: ChallengeSubject;
  slots: ChallengeSlot[];
  responses: ChallengeResponse[];
  cards: DbCard[];
  pillars: DbPillar[];
  onDrop: (slotId: string, cardId: string) => void;
  onRemove: (responseId: string) => void;
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

export function SubjectCanvas({
  subject, slots, responses, cards, pillars,
  onDrop, onRemove, onUpdateResponse,
  stagingItems = [], onStage, onUnstage, onStagingFormatChange,
  readOnly,
}: SubjectCanvasProps) {
  const subjectSlots = slots.filter(s => s.subject_id === subject.id);
  const subjectResponses = responses.filter(r => r.subject_id === subject.id);
  const subjectStaging = stagingItems.filter(i => i.subject_id === subject.id);
  const filledCount = new Set(subjectResponses.map(r => r.slot_id)).size;
  const requiredCount = subjectSlots.filter(s => s.required).length;
  const requiredFilled = subjectSlots.filter(s => s.required && subjectResponses.some(r => r.slot_id === s.id)).length;

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
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
    >
      {/* Subject header */}
      <div className="px-6 py-5 border-b border-border shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg", TYPE_COLORS[subject.type])}>
            {TYPE_LABELS[subject.type]}
          </span>
          <span className="text-xs text-muted-foreground">
            {filledCount}/{subjectSlots.length} emplacements remplis
            {requiredCount > 0 && ` · ${requiredFilled}/${requiredCount} requis`}
          </span>
        </div>
        <h2 className="font-display font-black text-xl tracking-tight">{subject.title}</h2>
        {subject.description && (
          <p className="text-sm text-muted-foreground mt-1">{subject.description}</p>
        )}
      </div>

      {/* Slots grid */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <div className={cn(
          "grid gap-4",
          subjectSlots.length <= 3 ? "grid-cols-1 sm:grid-cols-3" :
          subjectSlots.length <= 4 ? "grid-cols-1 sm:grid-cols-2" :
          subjectSlots.length <= 6 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" :
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        )}>
          {subjectSlots.map(slot => (
            <DropSlot
              key={slot.id}
              slot={slot}
              responses={subjectResponses}
              cards={cards}
              pillars={pillars}
              onDrop={handleSlotDrop}
              onRemove={onRemove}
              onUpdateResponse={onUpdateResponse}
              readOnly={readOnly}
            />
          ))}
        </div>

        {/* Staging zone — at bottom */}
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
              viewMode="list"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
