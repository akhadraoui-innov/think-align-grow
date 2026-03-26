import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { Play } from "lucide-react";
import {
  CatalogueAsset, ASSET_TYPE_LABELS, ASSET_TYPE_COLORS, STATUS_LABELS, getDisplayOrg,
} from "./CatalogueTypes";

interface Props {
  assets: CatalogueAsset[];
  orgMap: Map<string, { name: string; logo_url: string | null; primary_color: string | null }>;
  onTestPractice?: (assetId: string, name: string) => void;
}

const COLUMNS = ["draft", "published", "active"];

export function CatalogueKanbanView({ assets, orgMap, onTestPractice }: Props) {
  const columns = useMemo(() => {
    const result: Record<string, CatalogueAsset[]> = {};
    COLUMNS.forEach((c) => (result[c] = []));
    assets.forEach((a) => {
      const status = a.status || "draft";
      const col = COLUMNS.includes(status) ? status : "draft";
      result[col].push(a);
    });
    return result;
  }, [assets]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => (
        <div key={col} className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              {STATUS_LABELS[col] || col}
            </h3>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{columns[col].length}</Badge>
          </div>
          <div className="space-y-2 min-h-[100px] bg-muted/30 rounded-lg p-2">
            {columns[col].map((asset) => (
              <Card key={asset.id} className="shadow-sm">
                <CardContent className="p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 font-normal"
                      style={{
                        borderColor: ASSET_TYPE_COLORS[asset.asset_type],
                        color: ASSET_TYPE_COLORS[asset.asset_type],
                      }}
                    >
                      {ASSET_TYPE_LABELS[asset.asset_type] || asset.asset_type}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-foreground leading-tight line-clamp-2">
                    {asset.name || "Sans nom"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{getDisplayOrg(asset, orgMap)}</p>
                </CardContent>
              </Card>
            ))}
            {columns[col].length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-6 italic">Aucun asset</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
