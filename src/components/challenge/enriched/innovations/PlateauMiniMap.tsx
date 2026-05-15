import { useMemo } from "react";
import type { ChallengeArtifact } from "@/hooks/useChallengeArtifacts";
import { cn } from "@/lib/utils";

interface Props {
  artifacts: ChallengeArtifact[];
  worldW: number;
  worldH: number;
  pan: { x: number; y: number };
  zoom: number;
  viewportW: number;
  viewportH: number;
  onJump?: (worldX: number, worldY: number) => void;
  className?: string;
}

const MAP_W = 160;
const MAP_H = 110;

/** Innovation Phase D — Mini-carte du plateau */
export function PlateauMiniMap({ artifacts, worldW, worldH, pan, zoom, viewportW, viewportH, onJump, className }: Props) {
  const sx = MAP_W / worldW;
  const sy = MAP_H / worldH;

  const dots = useMemo(() => artifacts
    .filter(a => a.position && !a.parent_artifact_id && a.status !== "archived")
    .map(a => {
      const p = a.position as any;
      return { id: a.id, x: (p?.x ?? 0) * sx, y: (p?.y ?? 0) * sy, kind: a.kind };
    }), [artifacts, sx, sy]);

  // Viewport rectangle in world coords
  const viewW = (viewportW / zoom) * sx;
  const viewH = (viewportH / zoom) * sy;
  const viewX = (-pan.x / zoom) * sx;
  const viewY = (-pan.y / zoom) * sy;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onJump) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    onJump(cx / sx, cy / sy);
  };

  const colorOf = (kind: string) => {
    if (kind === "postit") return "fill-amber-400";
    if (kind === "voice") return "fill-rose-400";
    if (kind === "question") return "fill-violet-400";
    if (kind === "image") return "fill-sky-400";
    if (kind === "sticker") return "fill-emerald-400";
    return "fill-muted-foreground";
  };

  return (
    <div className={cn("absolute bottom-3 right-3 z-10 bg-background/95 backdrop-blur rounded-md border border-border shadow-md p-1.5", className)}>
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Mini-carte</span>
      </div>
      <svg
        width={MAP_W}
        height={MAP_H}
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        onClick={handleClick}
        className="rounded border border-border bg-muted/30 cursor-pointer"
      >
        {dots.map(d => (
          <circle key={d.id} cx={d.x} cy={d.y} r={1.6} className={colorOf(d.kind)} />
        ))}
        <rect
          x={Math.max(0, viewX)}
          y={Math.max(0, viewY)}
          width={Math.min(viewW, MAP_W)}
          height={Math.min(viewH, MAP_H)}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={1.2}
          rx={2}
        />
      </svg>
    </div>
  );
}
