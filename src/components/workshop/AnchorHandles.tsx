import { cn } from "@/lib/utils";

export type AnchorPosition = "top" | "right" | "bottom" | "left";

interface AnchorHandlesProps {
  width: number;
  height: number;
  onAnchorClick: (anchor: AnchorPosition) => void;
  activeAnchor?: AnchorPosition | null;
}

const ANCHORS: { id: AnchorPosition; style: React.CSSProperties }[] = [
  { id: "top", style: { top: -5, left: "50%", transform: "translateX(-50%)" } },
  { id: "right", style: { top: "50%", right: -5, transform: "translateY(-50%)" } },
  { id: "bottom", style: { bottom: -5, left: "50%", transform: "translateX(-50%)" } },
  { id: "left", style: { top: "50%", left: -5, transform: "translateY(-50%)" } },
];

export function AnchorHandles({ width, height, onAnchorClick, activeAnchor }: AnchorHandlesProps) {
  return (
    <>
      {ANCHORS.map(a => (
        <button
          key={a.id}
          className={cn(
            "absolute w-3 h-3 rounded-full border-2 border-primary bg-background z-50 cursor-crosshair transition-transform hover:scale-150 pointer-events-auto",
            activeAnchor === a.id && "bg-primary scale-125"
          )}
          style={a.style}
          onClick={(e) => { e.stopPropagation(); onAnchorClick(a.id); }}
        />
      ))}
    </>
  );
}

export function getAnchorCoords(
  item: { x: number; y: number; width?: number | null; height?: number | null; type: string },
  anchor: AnchorPosition
): { x: number; y: number } {
  const w = item.width || (item.type === "sticky" ? 180 : item.type === "icon" ? 48 : 240);
  const h = item.height || (item.type === "sticky" ? 140 : item.type === "icon" ? 48 : 120);
  switch (anchor) {
    case "top": return { x: item.x + w / 2, y: item.y };
    case "right": return { x: item.x + w, y: item.y + h / 2 };
    case "bottom": return { x: item.x + w / 2, y: item.y + h };
    case "left": return { x: item.x, y: item.y + h / 2 };
  }
}
