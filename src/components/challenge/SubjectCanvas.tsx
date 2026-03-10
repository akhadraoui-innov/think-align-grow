import { motion } from "framer-motion";
import type { ChallengeSubject, ChallengeSlot, ChallengeResponse } from "@/hooks/useChallengeData";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { DropSlot } from "./DropSlot";
import { cn } from "@/lib/utils";

interface SubjectCanvasProps {
  subject: ChallengeSubject;
  slots: ChallengeSlot[];
  responses: ChallengeResponse[];
  cards: DbCard[];
  pillars: DbPillar[];
  onDrop: (slotId: string, cardId: string) => void;
  onRemove: (responseId: string) => void;
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

export function SubjectCanvas({ subject, slots, responses, cards, pillars, onDrop, onRemove, readOnly }: SubjectCanvasProps) {
  const subjectSlots = slots.filter(s => s.subject_id === subject.id);
  const subjectResponses = responses.filter(r => r.subject_id === subject.id);
  const filledCount = new Set(subjectResponses.map(r => r.slot_id)).size;
  const requiredCount = subjectSlots.filter(s => s.required).length;
  const requiredFilled = subjectSlots.filter(s => s.required && subjectResponses.some(r => r.slot_id === s.id)).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full"
    >
      {/* Subject header */}
      <div className="px-6 py-5 border-b border-border">
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
      <div className="flex-1 overflow-auto p-6">
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
              onDrop={onDrop}
              onRemove={onRemove}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
