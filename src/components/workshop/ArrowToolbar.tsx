import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CanvasItem } from "@/hooks/useCanvasItems";

const ARROW_STYLES = [
  { id: "solid", label: "Solide", preview: "─────▶" },
  { id: "dashed", label: "Pointillé", preview: "- - - -▶" },
  { id: "dotted", label: "Pointé", preview: "· · · · ▶" },
  { id: "thick", label: "Épais", preview: "━━━━▶" },
];

const ARROW_COLORS_LIST = [
  { id: "default", label: "Gris", class: "bg-muted-foreground" },
  { id: "primary", label: "Principal", class: "bg-primary" },
  { id: "red", label: "Rouge", class: "bg-destructive" },
  { id: "green", label: "Vert", class: "bg-pillar-finance" },
  { id: "blue", label: "Bleu", class: "bg-pillar-thinking" },
  { id: "orange", label: "Orange", class: "bg-pillar-business" },
];

interface ArrowToolbarProps {
  item: CanvasItem;
  onUpdateContent: (content: Record<string, any>) => void;
  onDelete: () => void;
  position: { x: number; y: number };
  scale: number;
}

export function ArrowToolbar({ item, onUpdateContent, onDelete, position, scale }: ArrowToolbarProps) {
  const currentStyle = (item.content?.arrow_style as string) || "solid";
  const currentColor = (item.content?.arrow_color as string) || "default";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute z-50 flex items-center gap-2 p-2 rounded-xl bg-background shadow-lg border border-border"
      style={{
        left: position.x,
        top: position.y - 56,
        transform: `scale(${1 / scale})`,
        transformOrigin: "bottom center",
      }}
    >
      {/* Styles */}
      <div className="flex items-center gap-1">
        {ARROW_STYLES.map(s => (
          <button
            key={s.id}
            onClick={(e) => { e.stopPropagation(); onUpdateContent({ arrow_style: s.id }); }}
            className={cn(
              "px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-colors",
              currentStyle === s.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
            )}
            title={s.label}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Colors */}
      <div className="flex items-center gap-1">
        {ARROW_COLORS_LIST.map(c => (
          <button
            key={c.id}
            onClick={(e) => { e.stopPropagation(); onUpdateContent({ arrow_color: c.id }); }}
            className={cn(
              "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
              c.class,
              currentColor === c.id ? "border-foreground ring-1 ring-foreground" : "border-transparent"
            )}
            title={c.label}
          />
        ))}
      </div>

      <div className="w-px h-6 bg-border" />

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}
