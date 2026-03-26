import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronRight, Play } from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CatalogueAsset, ASSET_TYPE_LABELS, ASSET_TYPE_COLORS,
  getDisplayOrg, getDisplayVersion, getDisplayContributors,
} from "./CatalogueTypes";

interface Props {
  assets: CatalogueAsset[];
  orgMap: Map<string, { name: string; logo_url: string | null; primary_color: string | null }>;
  profileMap: Map<string, { display_name: string | null; avatar_url: string | null; email: string | null }>;
  onTestPractice?: (assetId: string, name: string) => void;
}

export function CatalogueTableView({ assets, orgMap, profileMap, onTestPractice }: Props) {
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);

  const versionsForAsset = useQuery({
    queryKey: ["obs-asset-versions", expandedAssetId],
    queryFn: async () => {
      if (!expandedAssetId) return [];
      const { data, error } = await supabase
        .from("academy_asset_versions")
        .select("id, version_number, change_summary, changed_by, created_at")
        .eq("asset_id", expandedAssetId)
        .order("version_number", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!expandedAssetId,
  });

  const expandedAsset = expandedAssetId ? assets.find((a) => a.asset_id === expandedAssetId) : null;

  // Build version list: real versions + synthetic v1.0 if needed
  const buildVersionList = () => {
    const realVersions = versionsForAsset.data ?? [];
    if (!expandedAsset) return realVersions;

    const hasV1 = realVersions.some((v) => v.version_number <= 1);
    if (!hasV1) {
      const creatorId = expandedAsset.last_modified_by 
        || expandedAsset.contributor_ids?.[0] 
        || (expandedAsset.snapshot as any)?.created_by 
        || null;
      return [
        ...realVersions,
        {
          id: `synthetic-${expandedAsset.asset_id}`,
          version_number: 1,
          change_summary: "Création initiale",
          changed_by: creatorId,
          created_at: expandedAsset.created_at,
        },
      ];
    }
    return realVersions;
  };

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead className="text-xs">Type</TableHead>
            <TableHead className="text-xs">Nom</TableHead>
            <TableHead className="text-xs">Organisation</TableHead>
            <TableHead className="text-xs">Statut</TableHead>
            <TableHead className="text-xs text-center">Version</TableHead>
            <TableHead className="text-xs text-center">Contributeurs</TableHead>
            <TableHead className="text-xs">Dernière modif.</TableHead>
            <TableHead className="text-xs">Créé le</TableHead>
            <TableHead className="text-xs w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => {
            const isOpen = expandedAssetId === asset.asset_id;
            const displayName = asset.name || "Sans nom";
            return (
              <Collapsible
                key={asset.id}
                asChild
                open={isOpen}
                onOpenChange={(open) => setExpandedAssetId(open ? asset.asset_id : null)}
              >
                <>
                  <CollapsibleTrigger asChild>
                    <TableRow className="cursor-pointer hover:bg-muted/50 group">
                      <TableCell className="p-2">
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                      </TableCell>
                      <TableCell className="p-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 font-normal"
                          style={{
                            borderColor: ASSET_TYPE_COLORS[asset.asset_type],
                            color: ASSET_TYPE_COLORS[asset.asset_type],
                          }}
                        >
                          {ASSET_TYPE_LABELS[asset.asset_type] || asset.asset_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-2 font-medium text-xs text-foreground max-w-[350px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate">{displayName}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[400px]">
                            <p className="text-xs">{displayName}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="p-2 text-xs text-muted-foreground">
                        {getDisplayOrg(asset, orgMap)}
                      </TableCell>
                      <TableCell className="p-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {asset.status || "draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-2 text-xs text-center font-semibold">v{getDisplayVersion(asset)}.0</TableCell>
                      <TableCell className="p-2 text-xs text-center">{getDisplayContributors(asset)}</TableCell>
                      <TableCell className="p-2 text-xs text-muted-foreground">
                        {formatDistanceToNow(parseISO(asset.last_modified_at), { addSuffix: true, locale: fr })}
                      </TableCell>
                      <TableCell className="p-2 text-xs text-muted-foreground">
                        {format(parseISO(asset.created_at), "dd/MM/yyyy")}
                      </TableCell>
                    </TableRow>
                  </CollapsibleTrigger>
                  <CollapsibleContent asChild>
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                      <TableCell colSpan={9} className="p-0">
                        <div className="px-6 py-3 ml-8 border-l-2 border-primary/20 space-y-2">
                          {versionsForAsset.isLoading ? (
                            <Skeleton className="h-12 w-full" />
                          ) : (
                            buildVersionList().map((v) => {
                              const changedById = v.changed_by 
                                || (expandedAsset?.snapshot as any)?.created_by 
                                || expandedAsset?.last_modified_by 
                                || expandedAsset?.contributor_ids?.[0] 
                                || null;
                              const profile = changedById ? profileMap.get(changedById) : null;
                               const displayName = profile?.display_name || profile?.email || (changedById ? changedById.slice(0, 8) : "--");
                               const initials = (profile?.display_name || profile?.email || "--")
                                 .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                               return (
                                 <div key={v.id} className="flex items-start gap-3 text-xs">
                                   <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 font-mono">
                                     v{v.version_number}
                                   </Badge>
                                   <Avatar className="h-5 w-5 shrink-0">
                                     <AvatarImage src={profile?.avatar_url || undefined} />
                                     <AvatarFallback className="text-[8px] bg-muted">{initials}</AvatarFallback>
                                   </Avatar>
                                   <div className="min-w-0 flex-1">
                                     <span className="font-medium text-foreground">
                                       {displayName}
                                     </span>
                                    {v.change_summary && (
                                      <span className="text-muted-foreground ml-1.5">— {v.change_summary}</span>
                                    )}
                                  </div>
                                  <span className="text-muted-foreground/60 shrink-0">
                                    {formatDistanceToNow(parseISO(v.created_at), { addSuffix: true, locale: fr })}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </>
              </Collapsible>
            );
          })}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
