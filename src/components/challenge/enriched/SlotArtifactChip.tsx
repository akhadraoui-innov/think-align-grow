import { StickyNote, Mic, HelpCircle, Image as ImageIcon, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CRITICALITY_META } from "./constants";
import type { ChallengeArtifact } from "@/hooks/useChallengeArtifacts";

interface Props {
  artifact: ChallengeArtifact;
  onClick?: () => void;
  onDetach?: () => void;
  readOnly?: boolean;
}

const fmtDuration = (ms?: number | null) => {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function SlotArtifactChip({ artifact, onClick, onDetach, readOnly }: Props) {
  const { kind } = artifact;

  // Detach button (shared)
  const Detach = !readOnly && onDetach ? (
    <button
      onClick={(e) => { e.stopPropagation(); onDetach(); }}
      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground shadow-sm"
      title="Détacher"
    >
      <X className="h-2.5 w-2.5" />
    </button>
  ) : null;

  // ── IMAGE ─────────────────────────────────────────────
  if (kind === "image") {
    const url = artifact.content as string | null;
    const alt = (artifact.ai_meta?.alt as string) || "image";
    const isSticker = artifact.ai_meta?.kind === "sticker" || (!url && artifact.emoji);
    return (
      <div
        onClick={onClick}
        title={alt}
        className="group relative w-[72px] cursor-pointer rounded-lg overflow-hidden ring-1 ring-rose-300/60 dark:ring-rose-700/60 bg-rose-50 dark:bg-rose-950/30 hover:ring-2 hover:ring-rose-500/70 transition-all hover:shadow-md"
      >
        {isSticker ? (
          <div className="h-[56px] flex items-center justify-center text-3xl bg-gradient-to-br from-rose-100 to-rose-200/60 dark:from-rose-950/40 dark:to-rose-900/30">
            {artifact.emoji || "🖼️"}
          </div>
        ) : url ? (
          <img src={url} alt={alt} loading="lazy" className="h-[56px] w-full object-cover" />
        ) : (
          <div className="h-[56px] grid place-items-center text-rose-400"><ImageIcon className="h-5 w-5" /></div>
        )}
        <div className="px-1.5 py-0.5 text-[9px] font-medium text-rose-900 dark:text-rose-200 truncate">{alt}</div>
        {Detach}
      </div>
    );
  }

  // ── POSTIT ────────────────────────────────────────────
  if (kind === "postit") {
    const meta = artifact.criticality ? CRITICALITY_META[artifact.criticality] : CRITICALITY_META.medium;
    return (
      <div
        onClick={onClick}
        title={artifact.content || "post-it"}
        className={cn(
          "group relative flex items-center gap-1.5 rounded-md ring-1 px-2 py-1 text-[11px] cursor-pointer hover:shadow-md transition-all max-w-[200px]",
          meta.bg, meta.ring, meta.text,
        )}
      >
        <span className={cn("h-2 w-2 rounded-full shrink-0", meta.dot)} />
        <StickyNote className="h-3 w-3 shrink-0 opacity-70" />
        {artifact.emoji && <span className="text-xs leading-none">{artifact.emoji}</span>}
        <span className="font-medium truncate">{artifact.content || "(vide)"}</span>
        {Detach}
      </div>
    );
  }

  // ── VOICE ─────────────────────────────────────────────
  if (kind === "voice") {
    const dur = fmtDuration(artifact.audio_duration_ms);
    const txt = artifact.transcription || "(audio)";
    return (
      <div
        onClick={onClick}
        title={txt}
        className="group relative flex items-center gap-1.5 rounded-md ring-1 ring-violet-300/60 dark:ring-violet-700/60 bg-violet-50 dark:bg-violet-950/30 px-2 py-1 text-[11px] cursor-pointer hover:shadow-md transition-all max-w-[220px] text-violet-900 dark:text-violet-200"
      >
        <Mic className="h-3 w-3 shrink-0 opacity-80" />
        <div className="flex items-end gap-[2px] h-3 shrink-0" aria-hidden>
          {[3, 6, 4, 8, 5].map((h, i) => (
            <span key={i} className="w-[2px] rounded-sm bg-violet-500/70 dark:bg-violet-400/70" style={{ height: `${h * 1.2}px` }} />
          ))}
        </div>
        {dur && <span className="font-bold tabular-nums text-[10px] opacity-80">{dur}</span>}
        <span className="font-medium truncate">{txt}</span>
        {Detach}
      </div>
    );
  }

  // ── QUESTION ──────────────────────────────────────────
  if (kind === "question") {
    const answered = (artifact.ai_meta as any)?.status === "answered";
    return (
      <div
        onClick={onClick}
        title={artifact.content || "question"}
        className="group relative flex items-center gap-1.5 rounded-md ring-1 ring-sky-300/60 dark:ring-sky-700/60 bg-sky-50 dark:bg-sky-950/30 px-2 py-1 text-[11px] cursor-pointer hover:shadow-md transition-all max-w-[220px] text-sky-900 dark:text-sky-200"
      >
        <HelpCircle className="h-3 w-3 shrink-0 text-primary" />
        <span className="font-medium truncate">{artifact.content || "(question)"}</span>
        {answered && (
          <span className="shrink-0 inline-flex items-center gap-0.5 rounded-sm bg-primary/15 text-primary px-1 py-[1px] text-[8px] font-bold uppercase tracking-wider">
            <Sparkles className="h-2 w-2" /> IA
          </span>
        )}
        {Detach}
      </div>
    );
  }

  // Fallback (sticker / link_note / vote_summary)
  return (
    <div
      onClick={onClick}
      className="group relative flex items-center gap-1.5 rounded-md ring-1 ring-border bg-muted/40 px-2 py-1 text-[11px] cursor-pointer hover:shadow-sm transition-shadow"
    >
      <span className="font-medium truncate max-w-[140px]">{artifact.content || artifact.kind}</span>
      {Detach}
    </div>
  );
}
