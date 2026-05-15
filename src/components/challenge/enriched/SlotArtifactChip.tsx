import { memo, useMemo, useState } from "react";
import { StickyNote, Mic, HelpCircle, Image as ImageIcon, X, Sparkles, Plus, Maximize2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CRITICALITY_META } from "./constants";
import { ImageLightbox } from "./images/ImageLightbox";
import { VoicePlayer } from "./voice/VoicePlayer";
import type { ChallengeArtifact } from "@/hooks/useChallengeArtifacts";

interface Props {
  artifact: ChallengeArtifact;
  onClick?: () => void;
  onDetach?: () => void;
  onContinue?: () => void;
  readOnly?: boolean;
  childrenArtifacts?: ChallengeArtifact[];
}

const fmtDuration = (ms?: number | null) => {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// Stable pseudo-random rotation by id for paper-postit feel
function rotForId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 5) - 2) * 0.6; // -1.2° .. +1.2°
}

const IMG_SIZES = { S: 88, M: 144, L: 220 } as const;
type ImgSize = keyof typeof IMG_SIZES;

function SlotArtifactChipImpl({ artifact, onClick, onDetach, onContinue, readOnly, childrenArtifacts = [] }: Props) {
  const { kind } = artifact;
  const threadCount = childrenArtifacts.length;

  const Detach = !readOnly && onDetach ? (
    <button
      onClick={(e) => { e.stopPropagation(); onDetach(); }}
      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground shadow-sm z-10"
      title="Détacher"
    >
      <X className="h-2.5 w-2.5" />
    </button>
  ) : null;

  const Continue = !readOnly && onContinue ? (
    <button
      onClick={(e) => { e.stopPropagation(); onContinue(); }}
      className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 mt-1"
      title="Ajouter une réponse / précision"
    >
      <Plus className="h-2.5 w-2.5" /> Continuer
      {threadCount > 0 && <span className="ml-1 rounded bg-primary/15 px-1 tabular-nums">{threadCount}</span>}
    </button>
  ) : null;

  // ── POST-IT papier ─────────────────────────────────────
  if (kind === "postit") {
    const meta = artifact.criticality ? CRITICALITY_META[artifact.criticality] : CRITICALITY_META.medium;
    const rot = useMemo(() => rotForId(artifact.id), [artifact.id]);
    return (
      <div
        onClick={onClick}
        title={artifact.content || "post-it"}
        className={cn(
          "group relative cursor-pointer transition-all hover:z-10 hover:scale-[1.04]",
          "w-[124px] h-[124px] shrink-0",
        )}
        style={{ transform: `rotate(${rot}deg)` }}
      >
        <div className={cn(
          "absolute inset-0 rounded-[3px] ring-1 shadow-[2px_3px_8px_-2px_rgba(0,0,0,0.18)] hover:shadow-[3px_5px_12px_-2px_rgba(0,0,0,0.25)] p-2 flex flex-col",
          meta.bg, meta.ring, meta.text,
        )}>
          <div className="flex items-center gap-1 mb-1">
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", meta.dot)} />
            <StickyNote className="h-2.5 w-2.5 opacity-60" />
            {artifact.emoji && <span className="text-[11px] leading-none">{artifact.emoji}</span>}
            {threadCount > 0 && (
              <span className="ml-auto text-[9px] font-bold tabular-nums opacity-70">+{threadCount}</span>
            )}
          </div>
          <p className="text-[10.5px] leading-tight font-medium flex-1 line-clamp-5 break-words">
            {artifact.content || <em className="opacity-50">(vide)</em>}
          </p>
          {Continue}
        </div>
        {Detach}
      </div>
    );
  }

  // ── VOICE — bloc lisible avec player ─────────────────
  if (kind === "voice") {
    const dur = fmtDuration(artifact.audio_duration_ms);
    const txt = artifact.transcription;
    return (
      <div
        onClick={onClick}
        className="group relative w-[240px] rounded-md ring-1 ring-violet-300/60 dark:ring-violet-700/60 bg-violet-50 dark:bg-violet-950/30 p-2 cursor-pointer hover:shadow-md transition-all text-violet-900 dark:text-violet-200"
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <Mic className="h-3 w-3 opacity-80" />
          <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">Vocal</span>
          {dur && <span className="ml-auto text-[10px] font-bold tabular-nums opacity-80">{dur}</span>}
        </div>
        {artifact.audio_url ? (
          <div onClick={(e) => e.stopPropagation()}>
            <VoicePlayer storagePath={artifact.audio_url} durationMs={artifact.audio_duration_ms} />
          </div>
        ) : (
          <Loader2 className="h-3 w-3 animate-spin" />
        )}
        {txt && (
          <div className="mt-1.5 text-[10.5px] leading-snug max-h-[64px] overflow-y-auto rounded bg-violet-100/60 dark:bg-violet-900/30 p-1.5">
            {txt}
          </div>
        )}
        {Continue}
        {Detach}
      </div>
    );
  }

  // ── IMAGE — redimensionnable + lightbox ─────────────
  if (kind === "image") {
    const url = artifact.content as string | null;
    const alt = (artifact.ai_meta?.alt as string) || "image";
    const isSticker = artifact.ai_meta?.kind === "sticker" || (!url && artifact.emoji);
    const initialSize = (artifact.ai_meta?.display_size as ImgSize) || "M";
    const [size, setSize] = useState<ImgSize>(initialSize);
    const [open, setOpen] = useState(false);
    const w = IMG_SIZES[size];
    return (
      <>
        <div
          onClick={onClick}
          title={alt}
          className="group relative cursor-pointer rounded-lg overflow-hidden ring-1 ring-rose-300/60 dark:ring-rose-700/60 bg-rose-50 dark:bg-rose-950/30 hover:ring-2 hover:ring-rose-500/70 transition-all hover:shadow-md"
          style={{ width: w }}
        >
          {isSticker ? (
            <div className="grid place-items-center bg-gradient-to-br from-rose-100 to-rose-200/60 dark:from-rose-950/40 dark:to-rose-900/30" style={{ height: w * 0.78 }}>
              <span style={{ fontSize: w * 0.5 }}>{artifact.emoji || "🖼️"}</span>
            </div>
          ) : url ? (
            <img src={url} alt={alt} loading="lazy" className="w-full object-cover" style={{ height: w * 0.78 }} />
          ) : (
            <div className="grid place-items-center text-rose-400" style={{ height: w * 0.78 }}><ImageIcon className="h-5 w-5" /></div>
          )}
          <div className="px-1.5 py-0.5 text-[9px] font-medium text-rose-900 dark:text-rose-200 truncate">{alt}</div>
          <div className="absolute top-1 left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {(["S", "M", "L"] as ImgSize[]).map(s => (
              <button
                key={s}
                onClick={(e) => { e.stopPropagation(); setSize(s); }}
                className={cn(
                  "h-4 w-4 rounded text-[8px] font-bold leading-none",
                  size === s ? "bg-rose-600 text-white" : "bg-white/80 text-rose-700 hover:bg-white",
                )}
              >{s}</button>
            ))}
            {url && !isSticker && (
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(true); }}
                className="h-4 w-4 rounded bg-white/80 text-rose-700 hover:bg-white grid place-items-center"
                title="Plein écran"
              >
                <Maximize2 className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
          {Detach}
        </div>
        {url && <ImageLightbox open={open} onClose={() => setOpen(false)} url={url} alt={alt} />}
      </>
    );
  }

  // ── QUESTION ─────────────────────────────────────────
  if (kind === "question") {
    const answered = (artifact.ai_meta as any)?.status === "answered";
    return (
      <div
        onClick={onClick}
        title={artifact.content || "question"}
        className="group relative w-[200px] rounded-md ring-1 ring-sky-300/60 dark:ring-sky-700/60 bg-sky-50 dark:bg-sky-950/30 px-2.5 py-2 text-[11px] cursor-pointer hover:shadow-md transition-all text-sky-900 dark:text-sky-200"
      >
        <div className="flex items-center gap-1.5 mb-1">
          <HelpCircle className="h-3 w-3 text-primary" />
          <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">Question</span>
          {answered && (
            <span className="ml-auto inline-flex items-center gap-0.5 rounded-sm bg-primary/15 text-primary px-1 py-[1px] text-[8px] font-bold uppercase tracking-wider">
              <Sparkles className="h-2 w-2" /> IA
            </span>
          )}
        </div>
        <p className="font-medium line-clamp-3 leading-snug">{artifact.content || "(question)"}</p>
        {Continue}
        {Detach}
      </div>
    );
  }

  return (
    <div onClick={onClick} className="group relative flex items-center gap-1.5 rounded-md ring-1 ring-border bg-muted/40 px-2 py-1 text-[11px] cursor-pointer">
      <span className="font-medium truncate max-w-[140px]">{artifact.content || artifact.kind}</span>
      {Detach}
    </div>
  );
}
