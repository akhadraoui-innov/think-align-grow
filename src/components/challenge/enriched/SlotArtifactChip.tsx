import { StickyNote, Mic, HelpCircle, Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChallengeArtifact } from "@/hooks/useChallengeArtifacts";

const KIND_META: Record<string, { icon: any; label: string; color: string }> = {
  postit: { icon: StickyNote, label: "Post-it", color: "bg-amber-100 text-amber-900 ring-amber-300/60 dark:bg-amber-950/40 dark:text-amber-200" },
  voice: { icon: Mic, label: "Vocal", color: "bg-violet-100 text-violet-900 ring-violet-300/60 dark:bg-violet-950/40 dark:text-violet-200" },
  question: { icon: HelpCircle, label: "Question", color: "bg-sky-100 text-sky-900 ring-sky-300/60 dark:bg-sky-950/40 dark:text-sky-200" },
  image: { icon: ImageIcon, label: "Image", color: "bg-rose-100 text-rose-900 ring-rose-300/60 dark:bg-rose-950/40 dark:text-rose-200" },
};

interface Props {
  artifact: ChallengeArtifact;
  onClick?: () => void;
  onDetach?: () => void;
  readOnly?: boolean;
}

export function SlotArtifactChip({ artifact, onClick, onDetach, readOnly }: Props) {
  const meta = KIND_META[artifact.kind] || KIND_META.postit;
  const Icon = meta.icon;
  const preview =
    artifact.kind === "voice"
      ? artifact.transcription || "(audio)"
      : artifact.kind === "image"
      ? (artifact.ai_meta?.alt as string) || "image"
      : artifact.content || "";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-1.5 rounded-md ring-1 px-2 py-1 text-[11px] cursor-pointer hover:shadow-sm transition-shadow",
        meta.color,
      )}
      title={preview}
    >
      <Icon className="h-3 w-3 shrink-0 opacity-80" />
      {artifact.emoji && <span className="text-xs leading-none">{artifact.emoji}</span>}
      <span className="font-medium truncate max-w-[140px]">{preview || meta.label}</span>
      {!readOnly && onDetach && (
        <button
          onClick={(e) => { e.stopPropagation(); onDetach(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10"
          title="Détacher"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}
