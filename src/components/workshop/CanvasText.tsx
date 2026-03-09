import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { CanvasItem } from "@/hooks/useCanvasItems";

const TEXT_SIZES = {
  heading: "text-3xl font-display font-black uppercase tracking-tight",
  subheading: "text-xl font-display font-bold uppercase tracking-tight",
  body: "text-sm font-body",
  caption: "text-xs font-body text-muted-foreground",
};

interface CanvasTextProps {
  item: CanvasItem;
  isSelected: boolean;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onUpdateContent: (content: Record<string, any>) => void;
  onDelete: () => void;
}

export function CanvasText({
  item,
  isSelected,
  isDragging,
  onPointerDown,
  onUpdateContent,
  onDelete,
}: CanvasTextProps) {
  const textStyle = (item.content?.text_style as string) || "heading";
  const text = (item.content?.text as string) || "Texte";
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editText !== text) {
      onUpdateContent({ text: editText });
    }
  };

  const cycleStyle = () => {
    const styles = Object.keys(TEXT_SIZES);
    const idx = styles.indexOf(textStyle);
    const next = styles[(idx + 1) % styles.length];
    onUpdateContent({ text_style: next });
  };

  return (
    <motion.div
      className={cn(
        "absolute cursor-grab active:cursor-grabbing select-none min-w-[60px]",
        isSelected && "ring-2 ring-primary/20 rounded-lg",
        isDragging && "opacity-80"
      )}
      style={{
        left: item.x,
        top: item.y,
        zIndex: item.z_index,
      }}
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => { if (e.key === "Escape") handleBlur(); }}
          className={cn(
            "bg-transparent outline-none resize-none min-w-[120px]",
            TEXT_SIZES[textStyle as keyof typeof TEXT_SIZES]
          )}
          rows={1}
        />
      ) : (
        <span className={TEXT_SIZES[textStyle as keyof typeof TEXT_SIZES]}>
          {text}
        </span>
      )}

      {isSelected && !isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-9 left-0 flex items-center gap-1 p-1 rounded-lg bg-background shadow-lg border border-border"
        >
          <button
            onClick={(e) => { e.stopPropagation(); cycleStyle(); }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Changer le style"
          >
            <Type className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded hover:bg-destructive/10 text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
