import { AdminShell } from "@/components/admin/AdminShell";
import { useObservability, ObsFilters } from "@/hooks/useObservability";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const ASSET_TYPE_LABELS: Record<string, string> = {
  path: "Parcours", quiz: "Quiz", exercise: "Exercice",
  practice: "Pratique", persona: "Persona", campaign: "Campagne",
};

export default function AdminObservabilityMatrix() {
  const { coverageMatrix, filters, setFilters, orgs, isLoading, ASSET_TYPES } = useObservability();

  const updateFilter = (patch: Partial<ObsFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const maxMatrixValue = Math.max(
    1,
    ...coverageMatrix.flatMap((row) =>
      ASSET_TYPES.map((t) => (row as any)[t] || 0)
    )
  );

  return (
    <AdminShell>
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Matrice de couverture</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Répartition des assets par organisation et type
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="py-3 px-4">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Matrice Organisation × Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : coverageMatrix.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune donnée cross-org disponible
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left font-semibold p-2 text-muted-foreground">Organisation</th>
                      {ASSET_TYPES.map((t) => (
                        <th key={t} className="text-center font-semibold p-2 text-muted-foreground">
                          {ASSET_TYPE_LABELS[t]}
                        </th>
                      ))}
                      <th className="text-center font-semibold p-2 text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverageMatrix.map((row) => {
                      const total = ASSET_TYPES.reduce((sum, t) => sum + ((row as any)[t] || 0), 0);
                      return (
                        <tr key={row.orgId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-2 font-medium text-foreground">{row.orgName}</td>
                          {ASSET_TYPES.map((t) => {
                            const val = (row as any)[t] || 0;
                            const opacity = val === 0 ? 0 : Math.max(0.1, Math.min(0.8, val / maxMatrixValue));
                            return (
                              <td
                                key={t}
                                className="text-center p-2 rounded"
                                style={{
                                  backgroundColor: val > 0 ? `hsl(var(--primary) / ${opacity})` : undefined,
                                }}
                              >
                                <span className={cn("font-bold", val > 0 ? "text-foreground" : "text-muted-foreground/40")}>
                                  {val}
                                </span>
                              </td>
                            );
                          })}
                          <td className="text-center p-2 font-bold text-foreground">{total}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
