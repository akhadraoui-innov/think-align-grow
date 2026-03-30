import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { FlowNode, FlowLayer } from "./flowData";
import { LAYER_CONFIG } from "./flowData";

interface FlowNodeCardProps {
  node: FlowNode;
  isSelected: boolean;
  isFiltered: boolean;
  onClick: () => void;
}

export function FlowNodeCard({ node, isSelected, isFiltered, onClick }: FlowNodeCardProps) {
  const layer = LAYER_CONFIG[node.layer];
  const Icon = node.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-300 cursor-pointer text-center",
        "hover:scale-105 hover:shadow-xl hover:z-10",
        isFiltered
          ? "opacity-15 pointer-events-none scale-95"
          : isSelected
            ? cn("shadow-xl scale-105 z-10 ring-2 ring-offset-2 ring-offset-background", layer.border, layer.bg, "ring-current", layer.text)
            : cn("bg-card/80 backdrop-blur-sm border-border/50 hover:border-current", `hover:${layer.text}`),
      )}
    >
      {/* Pulse indicator for selected */}
      {isSelected && (
        <span className={cn("absolute -top-1 -right-1 flex h-3 w-3")}>
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", layer.bg.replace("/10", "/40"))} />
          <span className={cn("relative inline-flex rounded-full h-3 w-3", layer.bg.replace("/10", "/60"))} />
        </span>
      )}

      {/* Icon */}
      <div className={cn(
        "h-11 w-11 rounded-xl flex items-center justify-center transition-colors",
        isSelected ? layer.bg : "bg-muted/60 group-hover:" + layer.bg.split(" ")[0],
      )}>
        <Icon className={cn("h-5.5 w-5.5 transition-colors", isSelected ? layer.text : "text-muted-foreground group-hover:" + layer.text.split(" ")[0])} />
      </div>

      {/* Label */}
      <span className={cn(
        "text-xs font-bold leading-tight transition-colors",
        isSelected ? layer.text : "text-foreground/80",
      )}>
        {node.label}
      </span>

      {/* Layer badge */}
      <Badge
        variant="outline"
        className={cn(
          "text-[9px] px-1.5 py-0 h-4 font-semibold border transition-colors",
          isSelected ? cn(layer.border, layer.text) : "border-border/50 text-muted-foreground/60",
        )}
      >
        {LAYER_CONFIG[node.layer].label.split(" ")[0]}
      </Badge>
    </button>
  );
}
