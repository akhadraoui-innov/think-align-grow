import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChallengeSlot, ChallengeResponse } from "@/hooks/useChallengeData";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { getPillarCssColor, getPillarCssColorAlpha, PHASE_LABELS } from "@/hooks/useToolkitData";
import { X, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MaturitySelector } from "./MaturitySelector";
import { FormatSelector, type CardFormat } from "./FormatSelector";

interface DropSlotProps {
  slot: ChallengeSlot;
  responses: ChallengeResponse[];
  cards: DbCard[];
  pillars: DbPillar[];
  onDrop: (slotId: string, cardId: string) => void;
  onRemove: (responseId: string) => void;
  onUpdateResponse?: (responseId: string, updates: { format?: string; maturity?: number; rank?: number }) => void;
  readOnly?: boolean;
}

export function DropSlot({ slot, responses, cards, pillars, onDrop, onRemove, onUpdateResponse, readOnly }: DropSlotProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [reorderDropIdx, setReorderDropIdx] = useState<number | null>(null);

  const slotResponses = responses
    .filter(r => r.slot_id === slot.id)
    .sort((a, b) => a.rank - b.rank);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const sourceSlotId = e.dataTransfer.types.includes("source-slot-id");
    if (!sourceSlotId) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const cardId = e.dataTransfer.getData("card-id");
    if (!cardId) return;

    const sourceSlotId = e.dataTransfer.getData("source-slot-id");
    if (sourceSlotId === slot.id) return;

    onDrop(slot.id, cardId);
  }, [slot.id, onDrop]);

  const handleReorder = useCallback((dragId: string, dropIdx: number) => {
    if (!onUpdateResponse) return;
    const dragIdx = slotResponses.findIndex(r => r.id === dragId);
    if (dragIdx < 0 || dragIdx === dropIdx) return;
    const reordered = [...slotResponses];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    reordered.forEach((r, i) => {
      onUpdateResponse(r.id, { rank: i });
    });
    setReorderDropIdx(null);
  }, [slotResponses, onUpdateResponse]);

  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 border-dashed p-4 min-h-[120px] transition-all duration-200",
        isDragOver && "border-primary bg-primary/5 scale-[1.02]",
        slotResponses.length > 0 ? "border-solid border-border bg-card" : "border-muted-foreground/30 bg-secondary/20",
        slot.required && slotResponses.length === 0 && "border-destructive/40"
      )}
      onDragOver={readOnly ? undefined : handleDragOver}
      onDragLeave={readOnly ? undefined : handleDragLeave}
      onDrop={readOnly ? undefined : handleDrop}
    >
      <div className="mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {slot.label}
        </span>
        {slot.required && <span className="text-destructive ml-1 text-xs">*</span>}
        <span className="ml-2 text-[10px] text-muted-foreground/70">
          ({slot.slot_type === "ranked" ? "ordre important" : slot.slot_type === "single" ? "1 carte" : "plusieurs cartes"})
        </span>
      </div>

      {slot.hint && slotResponses.length === 0 && (
        <p className="text-xs text-muted-foreground/60 italic mb-2">{slot.hint}</p>
      )}

      <AnimatePresence mode="popLayout">
        {slotResponses.map((resp, idx) => (
          <SlotCard
            key={resp.id}
            resp={resp}
            idx={idx}
            slot={slot}
            cards={cards}
            pillars={pillars}
            onRemove={onRemove}
            onUpdateResponse={onUpdateResponse}
            onReorder={handleReorder}
            isReorderTarget={reorderDropIdx === idx}
            onReorderHover={(targetIdx) => setReorderDropIdx(targetIdx)}
            readOnly={readOnly}
          />
        ))}
      </AnimatePresence>

      {slotResponses.length === 0 && !isDragOver && (
        <div className="flex items-center justify-center h-16 text-muted-foreground/40">
          <GripVertical className="h-5 w-5 mr-1" />
          <span className="text-xs">Glissez une carte ici</span>
        </div>
      )}

      {isDragOver && (
        <div className="flex items-center justify-center h-16 text-primary">
          <span className="text-xs font-bold animate-pulse">Déposer ici</span>
        </div>
      )}
    </div>
  );
}

/* ── Extracted card row component ── */

interface SlotCardProps {
  resp: ChallengeResponse;
  idx: number;
  slot: ChallengeSlot;
  cards: DbCard[];
  pillars: DbPillar[];
  onRemove: (id: string) => void;
  onUpdateResponse?: (id: string, updates: { format?: string; maturity?: number; rank?: number }) => void;
  onReorder: (dragId: string, dropIdx: number) => void;
  isReorderTarget: boolean;
  onReorderHover: (idx: number | null) => void;
  readOnly?: boolean;
}

function SlotCard({ resp, idx, slot, cards, pillars, onRemove, onUpdateResponse, onReorder, isReorderTarget, onReorderHover, readOnly }: SlotCardProps) {
  const card = cards.find(c => c.id === resp.card_id);
  const pillar = card ? pillars.find(p => p.id === card.pillar_id) : null;
  const pillarColor = getPillarCssColor(pillar?.slug || "", pillar?.color);
  const pillarColorAlpha = (a: number) => getPillarCssColorAlpha(pillar?.slug || "", pillar?.color, a);
  const fmt = (resp.format || "normal") as CardFormat;
  const phaseLabel = card ? (PHASE_LABELS[card.phase] || card.phase) : "";

  if (!card) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      draggable={!readOnly && slot.slot_type === "ranked"}
      onDragStart={(e: any) => {
        if (!e.dataTransfer) return;
        e.dataTransfer.setData("card-id", card.id);
        e.dataTransfer.setData("source-response-id", resp.id);
        e.dataTransfer.setData("source-slot-id", slot.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e: any) => {
        if (e.dataTransfer?.types.includes("source-slot-id")) {
          e.preventDefault();
          e.stopPropagation();
          onReorderHover(idx);
        }
      }}
      onDragLeave={() => onReorderHover(null)}
      onDrop={(e: any) => {
        const srcSlotId = e.dataTransfer?.getData("source-slot-id");
        const dragRespId = e.dataTransfer?.getData("source-response-id");
        if (srcSlotId === slot.id && dragRespId) {
          e.preventDefault();
          e.stopPropagation();
          onReorder(dragRespId, idx);
        }
      }}
      className={cn(
        "rounded-xl bg-card border border-border mb-1 group",
        !readOnly && slot.slot_type === "ranked" && "cursor-grab active:cursor-grabbing",
        isReorderTarget && "ring-2 ring-primary/50"
      )}
    >
      {/* Compact format */}
      {fmt === "compact" && (
        <div className="flex items-center gap-2 px-2 py-1.5">
          {slot.slot_type === "ranked" && (
            <span className="text-[10px] font-black text-muted-foreground w-4 text-center">{idx + 1}</span>
          )}
          <div className="h-4 w-1 rounded-full shrink-0" style={{ background: pillarColor }} />
          <span className="text-xs font-medium flex-1 truncate">{card.title}</span>
          <span
            className="text-[8px] font-bold uppercase px-1 py-0.5 rounded shrink-0"
            style={{ background: pillarColorAlpha(0.1), color: pillarColor }}
          >
            {pillar?.name}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <MaturitySelector value={resp.maturity} onChange={(v) => onUpdateResponse?.(resp.id, { maturity: v })} readOnly={readOnly} compact />
            <FormatSelector value={fmt} onChange={(f) => onUpdateResponse?.(resp.id, { format: f })} readOnly={readOnly} />
            {!readOnly && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onRemove(resp.id); }}
                className="p-0.5 rounded hover:bg-destructive/10"
              >
                <X className="h-3 w-3 text-destructive" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Normal format */}
      {fmt === "normal" && (
        <div className="p-2">
          <div className="flex items-center gap-2">
            {slot.slot_type === "ranked" && (
              <span className="text-xs font-black text-muted-foreground w-5 text-center">{idx + 1}</span>
            )}
            <div className="h-6 w-1.5 rounded-full shrink-0" style={{ background: pillarColor }} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium truncate block">{card.title}</span>
              {card.subtitle && <span className="text-[10px] text-muted-foreground truncate block">{card.subtitle}</span>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!readOnly && (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onRemove(resp.id); }}
                  className="p-0.5 rounded-lg hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-destructive" />
                </button>
              )}
              <FormatSelector value={fmt} onChange={(f) => onUpdateResponse?.(resp.id, { format: f })} readOnly={readOnly} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 pl-7">
            <span
              className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md"
              style={{ background: pillarColorAlpha(0.1), color: pillarColor }}
            >
              {pillar?.name}
            </span>
            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">
              {phaseLabel}
            </span>
            <div className="ml-auto">
              <MaturitySelector value={resp.maturity} onChange={(v) => onUpdateResponse?.(resp.id, { maturity: v })} readOnly={readOnly} />
            </div>
          </div>
        </div>
      )}

      {/* Expanded format */}
      {fmt === "expanded" && (
        <div className="p-3">
          <div className="flex items-center gap-2 mb-1">
            {slot.slot_type === "ranked" && (
              <span className="text-xs font-black text-muted-foreground w-5 text-center">{idx + 1}</span>
            )}
            <div className="h-7 w-1.5 rounded-full shrink-0" style={{ background: pillarColor }} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium block">{card.title}</span>
              {card.subtitle && <span className="text-[10px] text-muted-foreground block">{card.subtitle}</span>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!readOnly && (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onRemove(resp.id); }}
                  className="p-0.5 rounded-lg hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-destructive" />
                </button>
              )}
              <FormatSelector value={fmt} onChange={(f) => onUpdateResponse?.(resp.id, { format: f })} readOnly={readOnly} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 pl-7 mb-2">
            <span
              className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md"
              style={{ background: pillarColorAlpha(0.1), color: pillarColor }}
            >
              {pillar?.name}
            </span>
            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">
              {phaseLabel}
            </span>
          </div>
          {(card.objective || card.definition) && (
            <p className="text-[10px] text-muted-foreground/70 line-clamp-3 pl-7">{card.objective || card.definition}</p>
          )}
          <div className="pl-7 mt-2">
            <MaturitySelector value={resp.maturity} onChange={(v) => onUpdateResponse?.(resp.id, { maturity: v })} readOnly={readOnly} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
