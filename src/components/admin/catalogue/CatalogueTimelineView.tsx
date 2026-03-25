import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo } from "react";
import {
  CatalogueAsset, ASSET_TYPE_LABELS, ASSET_TYPE_COLORS, getDisplayOrg,
} from "./CatalogueTypes";

interface Props {
  assets: CatalogueAsset[];
  orgMap: Map<string, { name: string; logo_url: string | null; primary_color: string | null }>;
}

export function CatalogueTimelineView({ assets, orgMap }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, CatalogueAsset[]>();
    const sorted = [...assets].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    sorted.forEach((a) => {
      const day = format(parseISO(a.created_at), "dd MMMM yyyy", { locale: fr });
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(a);
    });
    return Array.from(map.entries());
  }, [assets]);

  return (
    <div className="space-y-6">
      {grouped.map(([day, items]) => (
        <div key={day}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{day}</h3>
          <div className="space-y-0 relative ml-3 border-l-2 border-border pl-5">
            {items.map((asset) => (
              <div key={asset.id} className="relative pb-4">
                <div
                  className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-background"
                  style={{ backgroundColor: ASSET_TYPE_COLORS[asset.asset_type] || "hsl(var(--muted-foreground))" }}
                />
                <div className="flex items-start gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 font-normal shrink-0"
                    style={{
                      borderColor: ASSET_TYPE_COLORS[asset.asset_type],
                      color: ASSET_TYPE_COLORS[asset.asset_type],
                    }}
                  >
                    {ASSET_TYPE_LABELS[asset.asset_type] || asset.asset_type}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground leading-tight">{asset.name || "Sans nom"}</p>
                    <p className="text-[11px] text-muted-foreground">{getDisplayOrg(asset, orgMap)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
