import { useState, useRef, useEffect } from "react";
import { Trash2, Check, Minimize2, Maximize2, Circle, Square } from "lucide-react";
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
  item, isSelected, isDragging, creatorName,
  onPointerDown, onUpdateContent, onUpdateColor, onDelete,
}: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState((item.content?.text as string) || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stickySize = (item.content?.sticky_size as string) || "medium";
  const stickyShape = (item.content?.sticky_shape as string) || "square";
  const sizeConfig = STICKY_SIZES[stickySize as keyof typeof STICKY_SIZES] || STICKY_SIZES.medium;
  const colorConfig = STICKY_COLORS.find(c => c.name === item.color) || STICKY_COLORS[0];
  const isRound = stickyShape === "round";

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => { e.stopPropagation(); setIsEditing(true); };
  const handleBlur = () => {
    setIsEditing(false);
    if (text !== item.content?.text) onUpdateContent({ text });
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setIsEditing(false); setText((item.content?.text as string) || ""); }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleBlur(); }
  };
  const cycleSize = () => {
    const sizes = Object.keys(STICKY_SIZES);
    onUpdateContent({ sticky_size: sizes[(sizes.indexOf(stickySize) + 1) % sizes.length] });
  };
  const toggleShape = () => {
    onUpdateContent({ sticky_shape: isRound ? "square" : "round" });
  };

  const dimension = isRound ? Math.max(sizeConfig.width, sizeConfig.minHeight) : sizeConfig.width;

  return (
    <div
      className={cn(
        "absolute shadow-md cursor-grab active:cursor-grabbing select-none animate-canvas-in",
        colorConfig.bg,
        isRound ? "rounded-full" : "rounded-lg",
        isSelected && "ring-2 ring-foreground/20",
        isDragging && "shadow-elevated opacity-90"
      )}
      style={{
        left: item.x,
        top: item.y,
        width: isRound ? dimension : sizeConfig.width,
        height: isRound ? dimension : undefined,
        minHeight: isRound ? undefined : sizeConfig.minHeight,
        zIndex: item.z_index,
        transform: isRound ? undefined : `rotate(${((item.z_index % 5) - 2) * 1.5}deg)`,
      }}
      onPointerDown={onPointerDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Folded corner (only square) */}
      {!isRound && (
        <div className="absolute top-0 right-0 w-6 h-6" style={{ background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.05) 50%)" }} />
      )}

      <div className={cn(
        sizeConfig.padding,
        isRound && "flex flex-col items-center justify-center h-full text-center"
      )}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full bg-transparent resize-none outline-none font-body leading-relaxed",
              isRound ? "min-h-[40px] text-center" : "min-h-[60px]",
              sizeConfig.font, colorConfig.text
            )}
            placeholder="Éditer..."
          />
        ) : (
          <p className={cn(
            "font-body leading-relaxed whitespace-pre-wrap",
            isRound ? "min-h-[40px]" : "min-h-[60px]",
            sizeConfig.font, colorConfig.text,
            !text && "opacity-50"
          )}>
            {text || "Double-cliquez..."}
          </p>
        )}

        {stickySize !== "small" && !isRound && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/10">
            <span className={cn("text-[10px] font-medium", colorConfig.text)}>{creatorName}</span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      {isSelected && !isEditing && (
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-lg bg-background shadow-lg border border-border whitespace-nowrap animate-canvas-in"
          style={{ zIndex: (item.z_index || 0) + 1 }}
        >
          {STICKY_COLORS.map(color => (
            <button
              key={color.name}
              onClick={(e) => { e.stopPropagation(); onUpdateColor(color.name); }}
              className={cn("h-5 w-5 rounded-full border-2 transition-transform hover:scale-110", color.bg, item.color === color.name ? "border-foreground" : "border-transparent")}
            >
              {item.color === color.name && <Check className="h-3 w-3 mx-auto text-foreground" />}
            </button>
          ))}
          <div className="w-px h-4 bg-border mx-0.5" />
          <button onClick={(e) => { e.stopPropagation(); toggleShape(); }} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title={isRound ? "Carré" : "Rond"}>
            {isRound ? <Square className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); cycleSize(); }} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title={`Taille: ${stickySize}`}>
            {stickySize === "small" ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-destructive/10 text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
