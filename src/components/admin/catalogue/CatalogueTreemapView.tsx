import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMemo } from "react";
import { CatalogueAsset, ASSET_TYPE_LABELS, ASSET_TYPE_COLORS } from "./CatalogueTypes";

interface Props {
  assets: CatalogueAsset[];
  onFilterType?: (type: string) => void;
}

export function CatalogueTreemapView({ assets, onFilterType }: Props) {
  const blocks = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach((a) => {
      counts[a.asset_type] = (counts[a.asset_type] || 0) + 1;
    });
    const total = assets.length || 1;
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({
        type,
        count,
        pct: Math.max(8, (count / total) * 100),
        label: ASSET_TYPE_LABELS[type] || type,
        color: ASSET_TYPE_COLORS[type] || "hsl(var(--muted))",
      }));
  }, [assets]);

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2 min-h-[200px]">
        {blocks.map((block) => (
          <Tooltip key={block.type}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onFilterType?.(block.type)}
                className="rounded-lg transition-all hover:opacity-80 flex flex-col items-center justify-center text-white font-semibold cursor-pointer"
                style={{
                  backgroundColor: block.color,
                  flexBasis: `${block.pct}%`,
                  flexGrow: 1,
                  minHeight: `${Math.max(80, block.pct * 1.5)}px`,
                  minWidth: "100px",
                }}
              >
                <span className="text-lg">{block.count}</span>
                <span className="text-[10px] opacity-90">{block.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{block.count} {block.label}(s) — cliquer pour filtrer</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
