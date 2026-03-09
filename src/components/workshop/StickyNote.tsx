import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CanvasItem } from "@/hooks/useCanvasItems";

const STICKY_COLORS = [
  { name: "yellow", bg: "bg-yellow-200", text: "text-yellow-900" },
  { name: "pink", bg: "bg-pink-200", text: "text-pink-900" },
  { name: "green", bg: "bg-green-200", text: "text-green-900" },
  { name: "blue", bg: "bg-blue-200", text: "text-blue-900" },
  { name: "purple", bg: "bg-purple-200", text: "text-purple-900" },
];

interface StickyNoteProps {
  item: CanvasItem;
  isSelected: boolean;
  isDragging: boolean;
  creatorName: string;
  onPointerDown: (e: React.PointerEvent) => void;
  onUpdateContent: (content: Record<string, any>) => void;
  onUpdateColor: (color: string) => void;
  onDelete: () => void;
}

export function StickyNote({
  item,
  isSelected,
  isDragging,
  creatorName,
  onPointerDown,
  onUpdateContent,
  onUpdateColor,
  onDelete,
}: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState((item.content?.text as string) || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const colorConfig = STICKY_COLORS.find(c => c.name === item.color) || STICKY_COLORS[0];

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (text !== item.content?.text) {
      onUpdateContent({ text });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsEditing(false);
      setText((item.content?.text as string) || "");
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  return (
    <motion.div
      className={cn(
        "absolute w-[180px] min-h-[140px] rounded-lg shadow-md cursor-grab active:cursor-grabbing select-none",
        colorConfig.bg,
        isSelected && "ring-2 ring-foreground/20",
        isDragging && "shadow-elevated opacity-90"
      )}
      style={{
        left: item.x,
        top: item.y,
        zIndex: item.z_index,
        transform: `rotate(${((item.z_index % 5) - 2) * 1.5}deg)`,
      }}
      onPointerDown={onPointerDown}
      onDoubleClick={handleDoubleClick}
      initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
      animate={{ scale: 1, opacity: 1, rotate: ((item.z_index % 5) - 2) * 1.5 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Folded corner effect */}
      <div 
        className="absolute top-0 right-0 w-6 h-6"
        style={{
          background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.05) 50%)",
        }}
      />

      {/* Content */}
      <div className="p-3">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full min-h-[80px] bg-transparent resize-none outline-none font-body text-sm leading-relaxed",
              colorConfig.text
            )}
            placeholder="Double-cliquez pour éditer..."
          />
        ) : (
          <p className={cn(
            "min-h-[80px] font-body text-sm leading-relaxed whitespace-pre-wrap",
            colorConfig.text,
            !text && "opacity-50"
          )}>
            {text || "Double-cliquez pour éditer..."}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/10">
          <span className={cn("text-[10px] font-medium", colorConfig.text)}>
            {creatorName}
          </span>
        </div>
      </div>

      {/* Selected state toolbar */}
      {isSelected && !isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-1 p-1 rounded-lg bg-background shadow-lg border border-border"
        >
          {/* Color picker */}
          {STICKY_COLORS.map(color => (
            <button
              key={color.name}
              onClick={(e) => {
                e.stopPropagation();
                onUpdateColor(color.name);
              }}
              className={cn(
                "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
                color.bg,
                item.color === color.name ? "border-foreground" : "border-transparent"
              )}
            >
              {item.color === color.name && (
                <Check className="h-3 w-3 mx-auto text-foreground" />
              )}
            </button>
          ))}

          <div className="w-px h-4 bg-border mx-1" />

          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
