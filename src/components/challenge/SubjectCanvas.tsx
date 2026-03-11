import { useCallback, useRef, useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
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
  onMoveToSlot?: (responseId: string, newSlotId: string, cardId: string) => void;
  onUpdateResponse?: (responseId: string, updates: { format?: string; maturity?: number; rank?: number }) => void;
  stagingItems?: StagingItem[];
  onStage?: (cardId: string) => void;
  onUnstage?: (itemId: string) => void;
  onStagingFormatChange?: (itemId: string, format: CardFormat) => void;
  onReorderStaging?: (draggedId: string, targetId: string) => void;
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
  stagingItems = [], onStage, onUnstage, onStagingFormatChange, onReorderStaging,
  readOnly,
}: SubjectCanvasProps) {
  const subjectSlots = slots.filter(s => s.subject_id === subject.id);
  const subjectResponses = responses.filter(r => r.subject_id === subject.id);
  const subjectStaging = stagingItems.filter(i => i.subject_id === subject.id);
  const filledCount = new Set(subjectResponses.map(r => r.slot_id)).size;
  const requiredCount = subjectSlots.filter(s => s.required).length;
  const requiredFilled = subjectSlots.filter(s => s.required && subjectResponses.some(r => r.slot_id === s.id)).length;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 10);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => observer.disconnect();
  }, [checkScroll]);

  const handleStageDrop = useCallback((cardId: string) => {
    onStage?.(cardId);
  }, [onStage]);

  const handleSlotDrop = useCallback((slotId: string, cardId: string) => {
    const stagingItem = subjectStaging.find(i => i.card_id === cardId);
    if (stagingItem) onUnstage?.(stagingItem.id);
    onDrop(slotId, cardId);
  }, [onDrop, onUnstage, subjectStaging]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
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
      <div className="relative flex-1 overflow-y-auto min-h-0 p-6" ref={scrollRef} onScroll={checkScroll}>
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
              onReorder={onReorderStaging}
              readOnly={readOnly}
              viewMode="list"
            />
          </div>
        )}

        {/* Floating scroll buttons */}
        {(canScrollUp || canScrollDown) && (
          <div className="sticky bottom-4 float-right flex flex-col gap-2 z-10 mr-1">
            {canScrollUp && (
              <button
                onClick={() => scrollRef.current?.scrollBy({ top: -300, behavior: 'smooth' })}
                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            )}
            {canScrollDown && (
              <button
                onClick={() => scrollRef.current?.scrollBy({ top: 300, behavior: 'smooth' })}
                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
