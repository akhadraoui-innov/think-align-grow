import { cn } from "@/lib/utils";
import type { ChallengeArtifact } from "@/hooks/useChallengeArtifacts";

export function ImageTile({ artifact, className, compact }: { artifact: ChallengeArtifact; className?: string; compact?: boolean }) {
  const isSticker = artifact.ai_meta?.kind === "sticker" || (!artifact.content && artifact.emoji);
  const url = artifact.content as string | null;
  const alt = (artifact.ai_meta?.alt as string) || artifact.content || "image";

  if (isSticker) {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-muted/40 to-muted rounded-md", compact ? "h-16 text-3xl" : "h-32 text-6xl", className)}>
        {artifact.emoji || "🖼️"}
      </div>
    );
  }

  if (!url) return <div className={cn("h-16 rounded bg-muted/40 grid place-items-center text-xs text-muted-foreground", className)}>image</div>;

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className={cn("w-full object-cover rounded-md bg-muted", compact ? "h-20" : "max-h-64", className)}
    />
  );
}
