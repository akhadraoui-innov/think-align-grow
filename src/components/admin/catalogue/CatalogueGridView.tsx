import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { GitBranch, Users, Calendar } from "lucide-react";
import {
  CatalogueAsset, ASSET_TYPE_LABELS, ASSET_TYPE_COLORS,
  getDisplayOrg, getDisplayVersion, getDisplayContributors, getSnapshotField,
} from "./CatalogueTypes";

interface Props {
  assets: CatalogueAsset[];
  orgMap: Map<string, { name: string; logo_url: string | null; primary_color: string | null }>;
}

export function CatalogueGridView({ assets, orgMap }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {assets.map((asset) => {
        const difficulty = getSnapshotField(asset, "difficulty");
        const tags = (asset.snapshot as any)?.tags;
        const tagList = Array.isArray(tags) ? tags.filter((t: unknown) => typeof t === "string").slice(0, 3) : [];

        return (
          <Card key={asset.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
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
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {asset.status || "draft"}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
                  {asset.name || "Sans nom"}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {getDisplayOrg(asset, orgMap)}
                </p>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3" /> v{getDisplayVersion(asset)}.0
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {getDisplayContributors(asset)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {format(parseISO(asset.created_at), "dd/MM/yy")}
                </span>
              </div>

              {(difficulty || tagList.length > 0) && (
                <div className="flex flex-wrap gap-1">
                  {difficulty && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0">{difficulty}</Badge>
                  )}
                  {tagList.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground">{tag}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
