import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Trash2, icons } from "lucide-react";
import { cn } from "@/lib/utils";
import { CanvasItem } from "@/hooks/useCanvasItems";

const ICON_SIZES = { sm: 32, md: 48, lg: 64 };
const ICON_COLORS = [
  { name: "default", class: "text-foreground" },
  { name: "primary", class: "text-primary" },
  { name: "red", class: "text-destructive" },
  { name: "green", class: "text-pillar-finance" },
  { name: "blue", class: "text-pillar-thinking" },
  { name: "orange", class: "text-pillar-business" },
  { name: "purple", class: "text-pillar-innovation" },
];

interface CanvasIconProps {
  item: CanvasItem;
  isSelected: boolean;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onUpdateContent: (content: Record<string, any>) => void;
  onDelete: () => void;
}

export function CanvasIcon({
  item,
  isSelected,
  isDragging,
  onPointerDown,
  onUpdateContent,
  onDelete,
}: CanvasIconProps) {
  const iconName = (item.content?.icon_name as string) || "Star";
  const iconColor = (item.content?.icon_color as string) || "default";
  const iconSize = (item.content?.icon_size as string) || "md";
  const label = (item.content?.label as string) || "";
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelText, setLabelText] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingLabel && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingLabel]);

  const LucideIcon = (icons as any)[iconName] || icons.Star;
  const colorClass = ICON_COLORS.find(c => c.name === iconColor)?.class || "text-foreground";
  const size = ICON_SIZES[iconSize as keyof typeof ICON_SIZES] || 48;

  const handleLabelBlur = () => {
    setIsEditingLabel(false);
    if (labelText !== label) {
      onUpdateContent({ label: labelText });
    }
  };

  return (
    <motion.div
      className={cn(
        "absolute flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing select-none",
        isSelected && "ring-2 ring-primary/30 rounded-xl",
        isDragging && "opacity-80"
      )}
      style={{
        left: item.x,
        top: item.y,
        zIndex: item.z_index,
      }}
      onPointerDown={onPointerDown}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
    >
      <div className={cn("p-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm", isSelected && "border-primary")}>
        <LucideIcon className={cn(colorClass)} size={size} strokeWidth={1.5} />
      </div>

      {/* Label */}
      <div
        className="max-w-[100px] text-center"
        onDoubleClick={(e) => { e.stopPropagation(); setIsEditingLabel(true); }}
      >
        {isEditingLabel ? (
          <input
            ref={inputRef}
            value={labelText}
            onChange={(e) => setLabelText(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") handleLabelBlur(); }}
            className="bg-transparent outline-none text-[10px] font-bold text-center w-full"
          />
        ) : (
          label && (
            <span className="text-[10px] font-bold text-muted-foreground truncate block">
              {label}
            </span>
          )
        )}
      </div>

      {/* Toolbar */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-lg bg-background shadow-lg border border-border"
        >
          {ICON_COLORS.slice(0, 5).map(c => (
            <button
              key={c.name}
              onClick={(e) => { e.stopPropagation(); onUpdateContent({ icon_color: c.name }); }}
              className={cn("h-4 w-4 rounded-full border", c.class, iconColor === c.name ? "border-foreground ring-1 ring-foreground" : "border-transparent")}
              style={{ backgroundColor: "currentColor" }}
            />
          ))}
          <div className="w-px h-4 bg-border mx-0.5" />
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

// Icon picker for toolbar
export const ICON_LIBRARY = [
  "Star", "Heart", "Lightbulb", "Target", "Rocket", "Zap", "Trophy", "Flag",
  "AlertTriangle", "CheckCircle", "XCircle", "HelpCircle", "Info",
  "Users", "User", "UserPlus", "Building2", "Briefcase",
  "TrendingUp", "TrendingDown", "BarChart3", "PieChart", "Activity",
  "DollarSign", "CreditCard", "Wallet", "Coins",
  "Globe", "MapPin", "Navigation", "Compass",
  "Clock", "Calendar", "Timer", "Hourglass",
  "MessageCircle", "Mail", "Phone", "Video",
  "Lock", "Unlock", "Shield", "Key",
  "Settings", "Tool", "Wrench", "Hammer",
  "BookOpen", "FileText", "Clipboard", "Archive",
  "Cloud", "Sun", "Moon", "Flame",
  "Gift", "Award", "Medal", "Crown",
  "Puzzle", "Layers", "Grid3X3", "LayoutDashboard",
] as const;
