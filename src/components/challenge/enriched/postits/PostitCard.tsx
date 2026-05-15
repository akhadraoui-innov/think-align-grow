import { Trash2, CheckCircle2 } from "lucide-react";
import { CRITICALITY_META } from "../constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChallengeArtifact } from "@/hooks/useChallengeArtifacts";

interface Props {
  artifact: ChallengeArtifact;
  canEdit: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onResolve?: () => void;
  selected?: boolean;
}

export function PostitCard({ artifact, canEdit, onClick, onDelete, onResolve, selected }: Props) {
  const meta = artifact.criticality ? CRITICALITY_META[artifact.criticality] : CRITICALITY_META.low;
  const isResolved = artifact.status === "resolved";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative text-left w-full rounded-lg ring-1 transition-all p-3 hover:shadow-md hover:-translate-y-0.5 focus:outline-none",
        meta.bg, meta.ring, meta.text,
        selected && "ring-2 shadow-lg",
        isResolved && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        {artifact.emoji && <span className="text-lg leading-none">{artifact.emoji}</span>}
        <p className={cn("text-sm font-medium whitespace-pre-wrap break-words flex-1", isResolved && "line-through")}>
          {artifact.content || <em className="opacity-60">(vide)</em>}
        </p>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wider font-bold opacity-80">
        <span className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
          {meta.label}
        </span>
        {artifact.category && <span className="opacity-70">{artifact.category}</span>}
      </div>
      {canEdit && (
        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isResolved && onResolve && (
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onResolve(); }}>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </button>
  );
}
