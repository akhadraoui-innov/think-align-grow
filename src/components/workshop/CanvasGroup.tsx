import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, GripHorizontal, Palette, Shapes } from "lucide-react";
import { cn } from "@/lib/utils";
import { CanvasItem } from "@/hooks/useCanvasItems";

const GROUP_SHAPES = [
  { id: "rectangle", label: "Rectangle" },
  { id: "rounded", label: "Arrondi" },
  { id: "circle", label: "Cercle" },
  { id: "triangle", label: "Triangle" },
  { id: "hexagon", label: "Hexagone" },
  { id: "diamond", label: "Losange" },
];

const GROUP_COLORS = [
  { name: "default", border: "hsl(var(--muted-foreground))", bg: "hsla(var(--muted-foreground), 0.05)" },
  { name: "primary", border: "hsl(var(--primary))", bg: "hsla(var(--primary), 0.05)" },
  { name: "finance", border: "hsl(var(--pillar-finance))", bg: "hsla(var(--pillar-finance), 0.05)" },
  { name: "business", border: "hsl(var(--pillar-business))", bg: "hsla(var(--pillar-business), 0.05)" },
  { name: "innovation", border: "hsl(var(--pillar-innovation))", bg: "hsla(var(--pillar-innovation), 0.05)" },
  { name: "thinking", border: "hsl(var(--pillar-thinking))", bg: "hsla(var(--pillar-thinking), 0.05)" },
];

interface CanvasGroupProps {
  item: CanvasItem;
  isSelected: boolean;
  isDragging: boolean;
  childCount: number;
  onPointerDown: (e: React.PointerEvent) => void;
  onUpdateContent: (content: Record<string, any>) => void;
  onUpdateSize: (width: number, height: number) => void;
  onDelete: () => void;
}

function getShapeClipPath(shape: string): string | undefined {
  switch (shape) {
    case "triangle": return "polygon(50% 0%, 0% 100%, 100% 100%)";
    case "hexagon": return "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
    case "diamond": return "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
    default: return undefined;
  }
}

function getShapeBorderRadius(shape: string): string | undefined {
  switch (shape) {
    case "circle": return "50%";
    case "rounded": return "2rem";
    case "rectangle": return "1rem";
    default: return undefined;
  }
}

export function CanvasGroup({
  item, isSelected, isDragging, childCount,
  onPointerDown, onUpdateContent, onUpdateSize, onDelete,
}: CanvasGroupProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState((item.content?.title as string) || "Groupe");
  const inputRef = useRef<HTMLInputElement>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const width = item.width || 300;
  const height = item.height || 200;
  const groupShape = (item.content?.group_shape as string) || "rectangle";
  const groupColor = (item.content?.group_color as string) || "default";
  const isDashed = (item.content?.group_style as string) === "dashed" || !item.content?.group_style;

  const colorConfig = GROUP_COLORS.find(c => c.name === groupColor) || GROUP_COLORS[0];
  const clipPath = getShapeClipPath(groupShape);
  const borderRadius = getShapeBorderRadius(groupShape);
  const isClipped = !!clipPath; // triangle, hexagon, diamond use clip-path

  // For circle shape, force equal dimensions
  const finalWidth = groupShape === "circle" ? Math.max(width, height) : width;
  const finalHeight = groupShape === "circle" ? Math.max(width, height) : height;

  useEffect(() => {
    if (isEditingTitle && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [isEditingTitle]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title !== item.content?.title) onUpdateContent({ title });
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: finalWidth, startH: finalHeight };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handleResizeMove = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    const newW = Math.max(200, resizeRef.current.startW + dx);
    const newH = Math.max(150, resizeRef.current.startH + dy);
    onUpdateSize(groupShape === "circle" ? Math.max(newW, newH) : newW, groupShape === "circle" ? Math.max(newW, newH) : newH);
  };
  const handleResizeEnd = () => { resizeRef.current = null; };

  const cycleShape = () => {
    const idx = GROUP_SHAPES.findIndex(s => s.id === groupShape);
    onUpdateContent({ group_shape: GROUP_SHAPES[(idx + 1) % GROUP_SHAPES.length].id });
  };

  const cycleColor = () => {
    const idx = GROUP_COLORS.findIndex(c => c.name === groupColor);
    onUpdateContent({ group_color: GROUP_COLORS[(idx + 1) % GROUP_COLORS.length].name });
  };

  const toggleDashed = () => {
    onUpdateContent({ group_style: isDashed ? "solid" : "dashed" });
  };

  return (
    <motion.div
      className={cn(
        "absolute cursor-grab active:cursor-grabbing select-none",
        isSelected && "ring-2 ring-primary/20",
        isDragging && "opacity-80"
      )}
      style={{
        left: item.x,
        top: item.y,
        width: finalWidth,
        height: finalHeight,
        zIndex: item.z_index,
      }}
      onPointerDown={onPointerDown}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {/* Shape */}
      <div
        className="absolute inset-0"
        style={{
          clipPath,
          borderRadius,
          border: isClipped ? undefined : `2px ${isDashed ? "dashed" : "solid"} ${colorConfig.border}`,
          backgroundColor: colorConfig.bg,
        }}
      />

      {/* For clipped shapes, use an SVG outline */}
      {isClipped && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${finalWidth} ${finalHeight}`}>
          {groupShape === "triangle" && (
            <polygon
              points={`${finalWidth/2},0 0,${finalHeight} ${finalWidth},${finalHeight}`}
              fill="none"
              stroke={colorConfig.border}
              strokeWidth={2}
              strokeDasharray={isDashed ? "8,6" : undefined}
            />
          )}
          {groupShape === "hexagon" && (
            <polygon
              points={`${finalWidth*0.25},0 ${finalWidth*0.75},0 ${finalWidth},${finalHeight/2} ${finalWidth*0.75},${finalHeight} ${finalWidth*0.25},${finalHeight} 0,${finalHeight/2}`}
              fill="none"
              stroke={colorConfig.border}
              strokeWidth={2}
              strokeDasharray={isDashed ? "8,6" : undefined}
            />
          )}
          {groupShape === "diamond" && (
            <polygon
              points={`${finalWidth/2},0 ${finalWidth},${finalHeight/2} ${finalWidth/2},${finalHeight} 0,${finalHeight/2}`}
              fill="none"
              stroke={colorConfig.border}
              strokeWidth={2}
              strokeDasharray={isDashed ? "8,6" : undefined}
            />
          )}
        </svg>
      )}

      {/* Title label */}
      <div 
        className="absolute -top-4 left-4 px-2 py-0.5 bg-background rounded border border-border flex items-center gap-2 z-10"
        onDoubleClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
      >
        {isEditingTitle ? (
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") handleTitleBlur(); }}
            className="bg-transparent outline-none font-display font-bold text-xs uppercase tracking-wider w-32"
          />
        ) : (
          <span className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
        )}
        {childCount > 0 && (
          <span className="text-[9px] font-bold text-primary bg-primary/10 rounded-full px-1.5 py-0.5">{childCount}</span>
        )}
        <span className="text-[8px] text-muted-foreground/60 uppercase tracking-wider">
          {GROUP_SHAPES.find(s => s.id === groupShape)?.label}
        </span>
      </div>

      {/* Controls */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-4 right-4 flex items-center gap-1 p-0.5 bg-background rounded border border-border z-10"
        >
          <button onClick={(e) => { e.stopPropagation(); cycleShape(); }} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Forme">
            <Shapes className="h-3 w-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); toggleDashed(); }} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={isDashed ? "Solide" : "Pointillé"}>
            <GripHorizontal className="h-3 w-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); cycleColor(); }} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Couleur">
            <Palette className="h-3 w-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors">
            <Trash2 className="h-3 w-3" />
          </button>
        </motion.div>
      )}

      {/* Resize handle */}
      {isSelected && (
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-center justify-center z-10"
          onPointerDown={handleResizeStart}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
          onPointerLeave={handleResizeEnd}
        >
          <GripHorizontal className="h-4 w-4 text-muted-foreground rotate-45" />
        </div>
      )}
    </motion.div>
  );
}
