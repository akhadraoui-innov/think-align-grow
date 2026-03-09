import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, GripHorizontal, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { CanvasItem } from "@/hooks/useCanvasItems";

const GROUP_STYLES = [
  { id: "dashed", label: "Pointillés", border: "border-dashed", bg: "bg-muted/10" },
  { id: "solid", label: "Solide", border: "border-solid", bg: "bg-muted/10" },
  { id: "filled", label: "Rempli", border: "border-solid", bg: "bg-primary/5" },
  { id: "highlight", label: "Surligné", border: "border-solid border-primary/50", bg: "bg-primary/10" },
];

const GROUP_COLORS = [
  { name: "default", border: "border-muted-foreground/30", bg: "bg-muted/10", label: "hsl(var(--muted-foreground))" },
  { name: "primary", border: "border-primary/50", bg: "bg-primary/5", label: "hsl(var(--primary))" },
  { name: "finance", border: "border-pillar-finance/50", bg: "bg-pillar-finance/5", label: "hsl(var(--pillar-finance))" },
  { name: "business", border: "border-pillar-business/50", bg: "bg-pillar-business/5", label: "hsl(var(--pillar-business))" },
  { name: "innovation", border: "border-pillar-innovation/50", bg: "bg-pillar-innovation/5", label: "hsl(var(--pillar-innovation))" },
  { name: "thinking", border: "border-pillar-thinking/50", bg: "bg-pillar-thinking/5", label: "hsl(var(--pillar-thinking))" },
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

export function CanvasGroup({
  item,
  isSelected,
  isDragging,
  childCount,
  onPointerDown,
  onUpdateContent,
  onUpdateSize,
  onDelete,
}: CanvasGroupProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState((item.content?.title as string) || "Groupe");
  const inputRef = useRef<HTMLInputElement>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const width = item.width || 300;
  const height = item.height || 200;
  const groupStyle = (item.content?.group_style as string) || "dashed";
  const groupColor = (item.content?.group_color as string) || "default";

  const styleConfig = GROUP_STYLES.find(s => s.id === groupStyle) || GROUP_STYLES[0];
  const colorConfig = GROUP_COLORS.find(c => c.name === groupColor) || GROUP_COLORS[0];

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTitle(true);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title !== item.content?.title) {
      onUpdateContent({ title });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Escape") {
      handleTitleBlur();
    }
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: width, startH: height };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    onUpdateSize(Math.max(200, resizeRef.current.startW + dx), Math.max(150, resizeRef.current.startH + dy));
  };

  const handleResizeEnd = () => { resizeRef.current = null; };

  const cycleStyle = () => {
    const idx = GROUP_STYLES.findIndex(s => s.id === groupStyle);
    const next = GROUP_STYLES[(idx + 1) % GROUP_STYLES.length];
    onUpdateContent({ group_style: next.id });
  };

  const cycleColor = () => {
    const idx = GROUP_COLORS.findIndex(c => c.name === groupColor);
    const next = GROUP_COLORS[(idx + 1) % GROUP_COLORS.length];
    onUpdateContent({ group_color: next.name });
  };

  return (
    <motion.div
      className={cn(
        "absolute rounded-2xl border-2 cursor-grab active:cursor-grabbing select-none",
        styleConfig.border,
        groupStyle === "dashed" ? "border-dashed" : "border-solid",
        colorConfig.border,
        colorConfig.bg,
        isSelected && "ring-2 ring-primary/20",
        isDragging && "opacity-80"
      )}
      style={{
        left: item.x,
        top: item.y,
        width,
        height,
        zIndex: item.z_index,
      }}
      onPointerDown={onPointerDown}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {/* Title */}
      <div 
        className="absolute -top-4 left-4 px-2 py-0.5 bg-background rounded border border-border flex items-center gap-2"
        onDoubleClick={handleTitleDoubleClick}
      >
        {isEditingTitle ? (
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="bg-transparent outline-none font-display font-bold text-xs uppercase tracking-wider w-32"
          />
        ) : (
          <span className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
        )}
        {childCount > 0 && (
          <span className="text-[9px] font-bold text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
            {childCount}
          </span>
        )}
      </div>

      {/* Controls */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-4 right-4 flex items-center gap-1 p-0.5 bg-background rounded border border-border"
        >
          <button
            onClick={(e) => { e.stopPropagation(); cycleStyle(); }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={`Style: ${styleConfig.label}`}
          >
            <GripHorizontal className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); cycleColor(); }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Couleur"
          >
            <Palette className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </motion.div>
      )}

      {/* Resize handle */}
      {isSelected && (
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-center justify-center"
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
