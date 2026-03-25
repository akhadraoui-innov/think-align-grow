import { AdminShell } from "@/components/admin/AdminShell";
import { useObservability, ObsFilters } from "@/hooks/useObservability";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, Search, Package, Filter } from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ASSET_TYPE_LABELS: Record<string, string> = {
  path: "Parcours", quiz: "Quiz", exercise: "Exercice",
  practice: "Pratique", persona: "Persona", campaign: "Campagne",
};

const ASSET_TYPE_COLORS: Record<string, string> = {
  path: "hsl(var(--primary))", quiz: "hsl(262, 80%, 55%)",
  exercise: "hsl(174, 70%, 42%)", practice: "hsl(32, 90%, 55%)",
  persona: "hsl(340, 75%, 55%)", campaign: "hsl(210, 80%, 55%)",
};

export default function AdminObservabilityCatalogue() {
  const { catalogue, profileMap, orgMap, orgs, isLoading, filters, setFilters } = useObservability();
  const [search, setSearch] = useState("");

  const updateFilter = (patch: Partial<ObsFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const filtered = catalogue.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Fetch version history per asset on expand
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

  return (
    <AdminShell>
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Catalogue des Assets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Inventaire complet des contenus pédagogiques avec historique de versioning
          </p>
        </div>

        {/* Filters */}
        <Card className="border-dashed">
          <CardContent className="py-3 px-4">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="relative w-[260px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un asset…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <Select
                value={filters.orgIds[0] || "all"}
                onValueChange={(v) => updateFilter({ orgIds: v === "all" ? [] : [v] })}
              >
                <SelectTrigger className="w-[200px] h-8 text-xs">
                  <SelectValue placeholder="Organisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les organisations</SelectItem>
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.assetTypes[0] || "all"}
                onValueChange={(v) => updateFilter({ assetTypes: v === "all" ? [] : [v] })}
              >
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Type d'asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Catalogue Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              {filtered.length} asset{filtered.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun asset trouvé</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Nom</TableHead>
                    <TableHead className="text-xs">Organisation</TableHead>
                    <TableHead className="text-xs">Statut</TableHead>
                    <TableHead className="text-xs text-center">Versions</TableHead>
                    <TableHead className="text-xs text-center">Contributeurs</TableHead>
                    <TableHead className="text-xs">Dernière modif.</TableHead>
                    <TableHead className="text-xs">Créé le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((asset) => {
                    const isOpen = expandedAssetId === asset.asset_id;
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
                              <TableCell className="p-2 font-medium text-xs text-foreground max-w-[200px] truncate">
                                {asset.name || "Sans nom"}
                              </TableCell>
                              <TableCell className="p-2 text-xs text-muted-foreground">
                                {asset.organization_id ? orgMap.get(asset.organization_id)?.name || "—" : "—"}
                              </TableCell>
                              <TableCell className="p-2">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {asset.status || "—"}
                                </Badge>
                              </TableCell>
                              <TableCell className="p-2 text-xs text-center font-semibold">{asset.version_count}</TableCell>
                              <TableCell className="p-2 text-xs text-center">{asset.contributor_count}</TableCell>
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
                                  {asset.version_count === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">Aucune modification enregistrée</p>
                                  ) : versionsForAsset.isLoading ? (
                                    <Skeleton className="h-12 w-full" />
                                  ) : (versionsForAsset.data ?? []).length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">Aucun historique de version</p>
                                  ) : (
                                    (versionsForAsset.data ?? []).map((v) => {
                                      const profile = v.changed_by ? profileMap.get(v.changed_by) : null;
                                      const initials = (profile?.display_name || profile?.email || "?")
                                        .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

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
                                              {profile?.display_name || profile?.email || "Système"}
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
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
