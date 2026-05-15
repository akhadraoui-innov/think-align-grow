import { memo } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChallengeVote } from "@/hooks/useChallengeReactions";

interface Props {
  artifactId: string;
  votes: ChallengeVote[];
  me: string | null;
  onToggle: (artifactId: string) => void;
}

function VotePillImpl({ artifactId, votes, me, onToggle }: Props) {
  const total = votes.reduce((s, v) => s + (v.weight || 1), 0);
  const mine = votes.some(v => v.user_id === me);
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onToggle(artifactId); }}
      className={cn(
        "h-7 px-2.5 rounded-full text-xs flex items-center gap-1.5 ring-1 transition-all font-bold",
        mine ? "bg-amber-500/15 ring-amber-400 text-amber-700 dark:text-amber-400" : "bg-muted/50 ring-border text-muted-foreground hover:bg-muted",
      )}
      title={mine ? "Retirer mon vote" : "Voter pour prioriser"}
    >
      <Star className={cn("h-3.5 w-3.5", mine && "fill-current")} />
      <span className="tabular-nums">{total}</span>
    </button>
  );
}
