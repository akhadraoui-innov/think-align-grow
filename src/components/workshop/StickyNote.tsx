import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, Check, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CanvasItem } from "@/hooks/useCanvasItems";

const STICKY_COLORS = [
  { name: "yellow", bg: "bg-yellow-200", text: "text-yellow-900" },
  { name: "pink", bg: "bg-pink-200", text: "text-pink-900" },
  { name: "green", bg: "bg-green-200", text: "text-green-900" },
  { name: "blue", bg: "bg-blue-200", text: "text-blue-900" },
  { name: "purple", bg: "bg-purple-200", text: "text-purple-900" },
  { name: "orange", bg: "bg-orange-200", text: "text-orange-900" },
];

const STICKY_SIZES = {
  small: { width: 120, minHeight: 80, font: "text-[10px]", padding: "p-2" },
  medium: { width: 180, minHeight: 140, font: "text-sm", padding: "p-3" },
  large: { width: 260, minHeight: 200, font: "text-base", padding: "p-4" },
};

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

  const stickySize = (item.content?.sticky_size as string) || "medium";
  const sizeConfig = STICKY_SIZES[stickySize as keyof typeof STICKY_SIZES] || STICKY_SIZES.medium;
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

  const cycleSize = () => {
    const sizes = Object.keys(STICKY_SIZES);
    const idx = sizes.indexOf(stickySize);
    const next = sizes[(idx + 1) % sizes.length];
    onUpdateContent({ sticky_size: next });
  };

  return (
    <motion.div
      className={cn(
        "absolute rounded-lg shadow-md cursor-grab active:cursor-grabbing select-none",
        colorConfig.bg,
        isSelected && "ring-2 ring-foreground/20",
        isDragging && "shadow-elevated opacity-90"
      )}
      style={{
        left: item.x,
        top: item.y,
        width: sizeConfig.width,
        minHeight: sizeConfig.minHeight,
        zIndex: item.z_index,
        transform: `rotate(${((item.z_index % 5) - 2) * 1.5}deg)`,
      }}
      onPointerDown={onPointerDown}
      onDoubleClick={handleDoubleClick}
      initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
      animate={{ scale: 1, opacity: 1, rotate: ((item.z_index % 5) - 2) * 1.5 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Folded corner */}
      <div 
        className="absolute top-0 right-0 w-6 h-6"
        style={{ background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.05) 50%)" }}
      />

      <div className={sizeConfig.padding}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full min-h-[60px] bg-transparent resize-none outline-none font-body leading-relaxed",
              sizeConfig.font, colorConfig.text
            )}
            placeholder="Double-cliquez pour éditer..."
          />
        ) : (
          <p className={cn(
            "min-h-[60px] font-body leading-relaxed whitespace-pre-wrap",
            sizeConfig.font, colorConfig.text,
            !text && "opacity-50"
          )}>
            {text || "Double-cliquez pour éditer..."}
          </p>
        )}

        {/* Footer */}
        {stickySize !== "small" && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/10">
            <span className={cn("text-[10px] font-medium", colorConfig.text)}>
              {creatorName}
            </span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      {isSelected && !isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-1 p-1 rounded-lg bg-background shadow-lg border border-border"
        >
          {STICKY_COLORS.map(color => (
            <button
              key={color.name}
              onClick={(e) => { e.stopPropagation(); onUpdateColor(color.name); }}
              className={cn(
                "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
                color.bg,
                item.color === color.name ? "border-foreground" : "border-transparent"
              )}
            >
              {item.color === color.name && <Check className="h-3 w-3 mx-auto text-foreground" />}
            </button>
          ))}
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={(e) => { e.stopPropagation(); cycleSize(); }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={`Taille: ${stickySize}`}
          >
            {stickySize === "small" ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
