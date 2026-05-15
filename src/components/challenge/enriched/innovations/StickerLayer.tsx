import { useState } from "react";
import { Smile, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChallengeArtifact } from "@/hooks/useChallengeArtifacts";

const STICKERS = ["👍", "🔥", "⭐", "❓", "💡", "⚠️", "❤️", "🚀", "🎯", "✅", "❌", "🤔", "💪", "👀", "🙌", "📌"];

interface PaletteProps {
  open: boolean;
  onPick: (emoji: string) => void;
  onClose: () => void;
}

/** Innovation #7 — Palette d'autocollants : drag emoji vers le plateau */
export function StickerPalette({ open, onPick, onClose }: PaletteProps) {
  if (!open) return null;
  return (
    <div className="absolute top-12 right-3 z-20 w-56 bg-background border border-border rounded-lg shadow-xl p-2 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between px-1 pb-1.5 mb-1 border-b border-border">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Autocollants</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-muted text-muted-foreground"><X className="h-3 w-3" /></button>
      </div>
      <div className="grid grid-cols-8 gap-0.5">
        {STICKERS.map(s => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="aspect-square text-lg rounded hover:bg-muted hover:scale-110 transition-transform"
            title={`Coller ${s}`}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="px-1 pt-1.5 text-[9px] text-muted-foreground italic">Choisis un autocollant puis clique sur le plateau pour le placer.</p>
    </div>
  );
}

interface ToggleProps {
  open: boolean;
  pendingEmoji: string | null;
  onToggle: () => void;
}

export function StickerToggle({ open, pendingEmoji, onToggle }: ToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "h-7 px-2 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors",
        open || pendingEmoji
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted",
      )}
      title={pendingEmoji ? `Cliquer sur le plateau pour coller ${pendingEmoji}` : "Coller un autocollant"}
    >
      {pendingEmoji ? <span className="text-sm leading-none">{pendingEmoji}</span> : <Smile className="h-3.5 w-3.5" />}
      Sticker
    </button>
  );
}

interface StickerProps {
  artifact: ChallengeArtifact;
  selected: boolean;
  onSelect: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

/** Stickers rendered on the plateau as small floating emojis */
export function StickerChip({ artifact, selected, onSelect, onPointerDown, onPointerMove, onPointerUp }: StickerProps) {
  const pos = (artifact.position as any) || { x: 100, y: 100 };
  return (
    <div
      data-art-id={artifact.id}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={onSelect}
      className={cn(
        "absolute select-none cursor-grab active:cursor-grabbing text-3xl leading-none transition-transform hover:scale-110",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-full scale-125",
      )}
      style={{ left: pos.x, top: pos.y }}
      title={artifact.emoji ?? ""}
    >
      {artifact.emoji ?? "📌"}
    </div>
  );
}
