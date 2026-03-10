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

/** Calculate real dimensions for a canvas item based on its type and content */
export function getItemDimensions(item: {
  width?: number | null; height?: number | null;
  type: string; content?: Record<string, any> | null;
}): { w: number; h: number } {
  if (item.width && item.height) return { w: item.width, h: item.height };
  switch (item.type) {
    case "card": {
      const mode = (item.content as any)?.display_mode || "preview";
      const w = mode === "section" ? 220 : mode === "full" ? 420 : mode === "gamified" ? 240 : 280;
      // Heights are approximate based on rendered content
      const h = mode === "section" ? 90 : mode === "gamified" ? 320 : mode === "full" ? 450 : 280;
      return { w, h };
    }
    case "sticky": {
      const size = (item.content as any)?.sticky_size || "medium";
      const shape = (item.content as any)?.sticky_shape || "square";
      if (shape === "round") {
        const d = size === "small" ? 120 : size === "large" ? 260 : 180;
        return { w: d, h: d };
      }
      const sizes: Record<string, { w: number; h: number }> = {
        small: { w: 120, h: 80 }, medium: { w: 180, h: 140 }, large: { w: 260, h: 200 },
      };
      return sizes[size] || sizes.medium;
    }
    case "icon": return { w: 48, h: 48 };
    case "text": return { w: 200, h: 40 };
    case "group": return { w: item.width || 400, h: item.height || 300 };
    default: return { w: 240, h: 120 };
  }
}

export function getAnchorCoords(
  item: { x: number; y: number; width?: number | null; height?: number | null; type: string; content?: Record<string, any> | null },
  anchor: AnchorPosition
): { x: number; y: number } {
  const { w, h } = getItemDimensions(item);
  switch (anchor) {
    case "top": return { x: item.x + w / 2, y: item.y };
    case "right": return { x: item.x + w, y: item.y + h / 2 };
    case "bottom": return { x: item.x + w / 2, y: item.y + h };
    case "left": return { x: item.x, y: item.y + h / 2 };
  }
}
