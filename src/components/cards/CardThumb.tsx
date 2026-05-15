import { Clock, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "ready" | "generating" | "queued" | "failed" | "pending" | "idle" | string | null | undefined;

interface CardThumbProps {
  imageUrl?: string | null;
  imageStatus?: Status;
  imageAttempts?: number;
  imageError?: string | null;
  title?: string | null;
  pillarColor?: string | null;
  className?: string;
  onRetry?: () => void;
  showAdminBadges?: boolean;
}

/**
 * Lightweight thumbnail for cards with graceful states:
 *  - ready    → real image
 *  - generating → shimmer + initial letter on pillar gradient
 *  - queued   → static skeleton + clock
 *  - failed   → muted bg + alert (clickable to retry in admin)
 *  - pending/idle → SVG placeholder tinted with pillar color
 *
 * No network cost for non-ready states. Uses semantic tokens.
 */
export function CardThumb({
  imageUrl,
  imageStatus,
  imageAttempts,
  imageError,
  title,
  pillarColor,
  className,
  onRetry,
  showAdminBadges,
}: CardThumbProps) {
  const initial = (title || "•").trim().charAt(0).toUpperCase();
  const tint = pillarColor || "hsl(var(--primary))";
  const status: Status = imageStatus || (imageUrl ? "ready" : "pending");

  const wrapper = cn(
    "relative w-full aspect-square overflow-hidden rounded-lg bg-muted/40 border border-border/40",
    className,
  );

  if (status === "ready" && imageUrl) {
    return (
      <div className={wrapper}>
        <img
          src={imageUrl}
          alt={title || ""}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    );
  }

  if (status === "generating") {
    return (
      <div
        className={cn(wrapper, "flex items-center justify-center")}
        style={{ background: `linear-gradient(135deg, ${tint}1a, ${tint}33)` }}
      >
        <div className="absolute inset-0 animate-pulse" style={{ background: `radial-gradient(circle at 30% 30%, ${tint}40, transparent 60%)` }} />
        <div className="relative z-10 flex flex-col items-center gap-1">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-xl font-display font-bold text-white shadow-lg"
            style={{ background: tint }}
          >
            {initial}
          </div>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground/60" />
        </div>
      </div>
    );
  }

  if (status === "queued") {
    return (
      <div className={cn(wrapper, "flex items-center justify-center")}>
        <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/60" />
        <div className="relative z-10 flex flex-col items-center gap-1 text-muted-foreground">
          <Clock className="h-5 w-5" />
          <span className="text-[10px] uppercase tracking-wider">En file</span>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    const Tag = onRetry ? "button" : "div";
    return (
      <Tag
        type={onRetry ? "button" : undefined}
        onClick={onRetry}
        className={cn(wrapper, "flex items-center justify-center", onRetry && "cursor-pointer hover:bg-destructive/10 transition-colors")}
        title={imageError || "Génération échouée"}
      >
        <div className="flex flex-col items-center gap-1 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {showAdminBadges && typeof imageAttempts === "number" && (
            <span className="text-[10px] font-mono">{imageAttempts}/3</span>
          )}
          {onRetry && <span className="text-[10px] uppercase tracking-wider">Relancer</span>}
        </div>
      </Tag>
    );
  }

  // pending / idle → branded placeholder
  return (
    <div
      className={cn(wrapper, "flex items-center justify-center")}
      style={{ background: `linear-gradient(135deg, ${tint}10, ${tint}25)` }}
    >
      <div className="relative z-10 flex flex-col items-center gap-1.5 text-foreground/70">
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center text-lg font-display font-bold text-white"
          style={{ background: tint }}
        >
          {initial}
        </div>
        <Sparkles className="h-3 w-3 opacity-60" />
      </div>
    </div>
  );
}
