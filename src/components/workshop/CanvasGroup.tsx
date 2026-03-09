import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { CanvasItem } from "@/hooks/useCanvasItems";

interface CanvasGroupProps {
  item: CanvasItem;
  isSelected: boolean;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onUpdateContent: (content: Record<string, any>) => void;
  onUpdateSize: (width: number, height: number) => void;
  onDelete: () => void;
}

export function CanvasGroup({
  item,
  isSelected,
  isDragging,
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
      setIsEditingTitle(false);
      if (e.key === "Enter" && title !== item.content?.title) {
        onUpdateContent({ title });
      }
    }
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: width,
      startH: height,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    const newW = Math.max(200, resizeRef.current.startW + dx);
    const newH = Math.max(150, resizeRef.current.startH + dy);
    onUpdateSize(newW, newH);
  };

  const handleResizeEnd = () => {
    resizeRef.current = null;
  };

  return (
    <motion.div
      className={cn(
        "absolute rounded-2xl border-2 border-dashed cursor-grab active:cursor-grabbing select-none",
        isSelected ? "border-primary bg-primary/5" : "border-muted-foreground/30 bg-muted/10",
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
        className="absolute -top-4 left-4 px-2 py-0.5 bg-background rounded border border-border"
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
      </div>

      {/* Delete button */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-4 right-4 p-1 bg-background rounded border border-border hover:bg-destructive/10 text-destructive transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
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
