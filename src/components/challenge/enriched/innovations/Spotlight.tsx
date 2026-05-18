import { Eye, X } from "lucide-react";
import { useSpotlight } from "@/hooks/useSpotlight";

interface BannerProps {
  active: boolean;
  isHost: boolean;
  sessionId: string;
}

export function SpotlightBanner({ active, isHost, sessionId }: BannerProps) {
  const { clear } = useSpotlight(sessionId);
  if (!active) return null;
  return (
    <div className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shrink-0">
      <Eye className="h-3.5 w-3.5" />
      L'animateur attire votre attention
      {isHost && (
        <button onClick={clear} className="ml-auto p-1 rounded hover:bg-amber-500/20" title="Désactiver">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

interface ToggleProps {
  sessionId: string;
  target: { artifactId?: string | null; subjectId?: string | null; slotId?: string | null };
  active: boolean;
}

export function SpotlightToggleButton({ sessionId, target, active }: ToggleProps) {
  const { setSpotlight, clear } = useSpotlight(sessionId);
  const onClick = () => {
    if (active) clear();
    else setSpotlight({ artifactId: target.artifactId ?? null, subjectId: target.subjectId ?? null, slotId: target.slotId ?? null });
  };
  return (
    <button
      onClick={onClick}
      title={active ? "Désactiver spotlight" : "Activer spotlight"}
      className={`p-1 rounded hover:bg-muted ${active ? "text-amber-600" : "text-muted-foreground"}`}
    >
      <Eye className="h-3.5 w-3.5" />
    </button>
  );
}
