import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CanvasItem } from "@/hooks/useCanvasItems";
import type { AnchorPosition } from "./AnchorHandles";

const ARROW_STYLES = [
  { id: "solid", label: "Solide" },
  { id: "dashed", label: "Pointillé" },
  { id: "dotted", label: "Pointé" },
  { id: "thick", label: "Épais" },
];

const ARROW_COLORS_LIST = [
  { id: "default", label: "Gris", class: "bg-muted-foreground" },
  { id: "primary", label: "Principal", class: "bg-primary" },
  { id: "red", label: "Rouge", class: "bg-destructive" },
  { id: "green", label: "Vert", class: "bg-pillar-finance" },
  { id: "blue", label: "Bleu", class: "bg-pillar-thinking" },
  { id: "orange", label: "Orange", class: "bg-pillar-business" },
];

const ANCHOR_OPTIONS: { id: AnchorPosition; label: string; icon: string }[] = [
  { id: "top", label: "Haut", icon: "↑" },
  { id: "right", label: "Droite", icon: "→" },
  { id: "bottom", label: "Bas", icon: "↓" },
  { id: "left", label: "Gauche", icon: "←" },
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
  const currentFromAnchor = (item.content?.from_anchor as string) || "bottom";
  const currentToAnchor = (item.content?.to_anchor as string) || "top";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute z-[9999] flex items-center gap-2 p-2 rounded-xl bg-background shadow-lg border border-border pointer-events-auto"
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

      {/* Anchor: From */}
      <div className="flex items-center gap-0.5">
        <span className="text-[8px] text-muted-foreground font-medium mr-0.5">De</span>
        {ANCHOR_OPTIONS.map(a => (
          <button
            key={`from-${a.id}`}
            onClick={(e) => { e.stopPropagation(); onUpdateContent({ from_anchor: a.id }); }}
            className={cn(
              "w-5 h-5 rounded text-xs flex items-center justify-center transition-colors",
              currentFromAnchor === a.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
            )}
            title={`Départ: ${a.label}`}
          >
            {a.icon}
          </button>
        ))}
      </div>

      {/* Anchor: To */}
      <div className="flex items-center gap-0.5">
        <span className="text-[8px] text-muted-foreground font-medium mr-0.5">À</span>
        {ANCHOR_OPTIONS.map(a => (
          <button
            key={`to-${a.id}`}
            onClick={(e) => { e.stopPropagation(); onUpdateContent({ to_anchor: a.id }); }}
            className={cn(
              "w-5 h-5 rounded text-xs flex items-center justify-center transition-colors",
              currentToAnchor === a.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
            )}
            title={`Arrivée: ${a.label}`}
          >
            {a.icon}
          </button>
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
