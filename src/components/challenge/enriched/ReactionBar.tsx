import { cn } from "@/lib/utils";
import type { ChallengeReaction } from "@/hooks/useChallengeReactions";

const QUICK = ["👍", "❤️", "🔥", "🎯", "🤔", "💡"];

interface Props {
  artifactId: string;
  reactions: ChallengeReaction[];
  me: string | null;
  onToggle: (artifactId: string, emoji: string) => void;
  compact?: boolean;
}

export function ReactionBar({ artifactId, reactions, me, onToggle, compact }: Props) {
  const counts: Record<string, { n: number; mine: boolean }> = {};
  for (const r of reactions) {
    counts[r.emoji] ??= { n: 0, mine: false };
    counts[r.emoji].n++;
    if (r.user_id === me) counts[r.emoji].mine = true;
  }
  const used = Object.keys(counts);
  const palette = compact ? QUICK.slice(0, 3) : QUICK;

  return (
    <div className="flex flex-wrap gap-1 items-center" onClick={(e) => e.stopPropagation()}>
      {used.map(e => (
        <button
          key={e}
          type="button"
          onClick={() => onToggle(artifactId, e)}
          className={cn(
            "h-6 px-1.5 rounded-full text-xs flex items-center gap-1 ring-1 transition-colors",
            counts[e].mine ? "bg-primary/15 ring-primary text-primary font-bold" : "bg-muted/50 ring-border hover:bg-muted",
          )}
        >
          <span>{e}</span><span className="text-[10px] tabular-nums">{counts[e].n}</span>
        </button>
      ))}
      <div className="flex gap-0.5 opacity-60 hover:opacity-100 transition-opacity">
        {palette.filter(e => !used.includes(e)).map(e => (
          <button
            key={e}
            type="button"
            onClick={() => onToggle(artifactId, e)}
            className="h-6 w-6 rounded-full text-sm hover:bg-muted flex items-center justify-center"
            title={`Réagir ${e}`}
          >{e}</button>
        ))}
      </div>
    </div>
  );
}
