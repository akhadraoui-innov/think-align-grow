import { AdminShell } from "@/components/admin/AdminShell";
import { useObservability, ObsFilters } from "@/hooks/useObservability";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, Package, Filter, Table2, LayoutGrid, Clock, Columns3, BarChart3 } from "lucide-react";
import { useState, useMemo } from "react";
import {
  ViewMode, ASSET_TYPE_LABELS, STATUS_LABELS, DIFFICULTY_LABELS, GEN_MODE_LABELS,
  CatalogueAsset, getSnapshotField,
} from "@/components/admin/catalogue/CatalogueTypes";
import { CatalogueTableView } from "@/components/admin/catalogue/CatalogueTableView";
import { CatalogueGridView } from "@/components/admin/catalogue/CatalogueGridView";
import { CatalogueTimelineView } from "@/components/admin/catalogue/CatalogueTimelineView";
import { CatalogueKanbanView } from "@/components/admin/catalogue/CatalogueKanbanView";
import { CatalogueTreemapView } from "@/components/admin/catalogue/CatalogueTreemapView";

export default function AdminObservabilityCatalogue() {
  const { catalogue, profileMap, orgMap, orgs, isLoading, filters, setFilters } = useObservability();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [statusFilter, setStatusFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [genModeFilter, setGenModeFilter] = useState("all");

  const updateFilter = (patch: Partial<ObsFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  // Unique values for filters
  const filterOptions = useMemo(() => {
    const statuses = new Set<string>();
    const difficulties = new Set<string>();
    const genModes = new Set<string>();
    catalogue.forEach((a: CatalogueAsset) => {
      if (a.status) statuses.add(a.status);
      const d = getSnapshotField(a, "difficulty");
      if (d) difficulties.add(d);
      const g = getSnapshotField(a, "generation_mode");
      if (g) genModes.add(g);
    });
    return { statuses: Array.from(statuses), difficulties: Array.from(difficulties), genModes: Array.from(genModes) };
  }, [catalogue]);

  const filtered = useMemo(() => {
    return catalogue.filter((a: CatalogueAsset) => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && (a.status || "draft") !== statusFilter) return false;
      if (difficultyFilter !== "all" && getSnapshotField(a, "difficulty") !== difficultyFilter) return false;
      if (genModeFilter !== "all" && getSnapshotField(a, "generation_mode") !== genModeFilter) return false;
      return true;
    });
  }, [catalogue, search, statusFilter, difficultyFilter, genModeFilter]);

  const handleTreemapFilter = (type: string) => {
    updateFilter({ assetTypes: [type] });
  };

  return (
    <AdminShell>
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Catalogue des Assets</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Inventaire complet des contenus pédagogiques avec historique de versioning
            </p>
          </div>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as ViewMode)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="table" aria-label="Tableau"><Table2 className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Grille"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="timeline" aria-label="Timeline"><Clock className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label="Kanban"><Columns3 className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="treemap" aria-label="Treemap"><BarChart3 className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
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
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  {filterOptions.statuses.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s] || s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filterOptions.difficulties.length > 0 && (
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-[150px] h-8 text-xs">
                    <SelectValue placeholder="Difficulté" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes difficultés</SelectItem>
                    {filterOptions.difficulties.map((d) => (
                      <SelectItem key={d} value={d}>{DIFFICULTY_LABELS[d] || d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {filterOptions.genModes.length > 0 && (
                <Select value={genModeFilter} onValueChange={setGenModeFilter}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="Génération" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous modes</SelectItem>
                    {filterOptions.genModes.map((g) => (
                      <SelectItem key={g} value={g}>{GEN_MODE_LABELS[g] || g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
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
            ) : viewMode === "table" ? (
              <CatalogueTableView assets={filtered} orgMap={orgMap} profileMap={profileMap} />
            ) : viewMode === "grid" ? (
              <CatalogueGridView assets={filtered} orgMap={orgMap} />
            ) : viewMode === "timeline" ? (
              <CatalogueTimelineView assets={filtered} orgMap={orgMap} />
            ) : viewMode === "kanban" ? (
              <CatalogueKanbanView assets={filtered} orgMap={orgMap} />
            ) : (
              <CatalogueTreemapView assets={filtered} onFilterType={handleTreemapFilter} />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
