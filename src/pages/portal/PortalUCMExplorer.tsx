import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Lightbulb } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveOrg } from "@/contexts/OrgContext";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/ui/PageTransition";
import { UCMPageHeader } from "@/components/ucm/UCMPageHeader";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-emerald-500",
};

export default function PortalUCMExplorer() {
  const { activeOrgId } = useActiveOrg();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterComplexity, setFilterComplexity] = useState("all");
  const [filterSector, setFilterSector] = useState("all");

  const { data: useCases, isLoading } = useQuery({
    queryKey: ["ucm-all-uc", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ucm_use_cases")
        .select("*, ucm_projects(id, company, sector_label)")
        .eq("organization_id", activeOrgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const sectors = useMemo(() => {
    const s = new Set<string>();
    (useCases || []).forEach((uc: any) => {
      if (uc.ucm_projects?.sector_label) s.add(uc.ucm_projects.sector_label);
    });
    return Array.from(s).sort();
  }, [useCases]);

  const filtered = (useCases || []).filter((uc: any) => {
    if (search && !uc.name.toLowerCase().includes(search.toLowerCase()) && !uc.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPriority !== "all" && uc.priority !== filterPriority) return false;
    if (filterComplexity !== "all" && uc.complexity !== filterComplexity) return false;
    if (filterSector !== "all" && uc.ucm_projects?.sector_label !== filterSector) return false;
    return true;
  });

  return (
    <PageTransition>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/[0.06] via-background to-accent/[0.04] border p-6">
          <UCMPageHeader
            icon={<Lightbulb className="h-5 w-5 text-primary" />}
            title="UC Explorer"
            subtitle="Parcourez tous les use cases générés à travers vos projets"
            badge={filtered.length}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-9" />
          </div>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Priorité" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="high">Haute</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="low">Basse</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterComplexity} onValueChange={setFilterComplexity}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Complexité" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="low">Faible</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="high">Élevée</SelectItem>
            </SelectContent>
          </Select>
          {sectors.length > 1 && (
            <Select value={filterSector} onValueChange={setFilterSector}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Secteur" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous secteurs</SelectItem>
                {sectors.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Lightbulb className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-base font-semibold text-muted-foreground">Aucun use case trouvé</h3>
              <p className="text-sm text-muted-foreground mt-1">Modifiez vos filtres ou créez un nouveau projet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((uc: any) => (
              <Card
                key={uc.id}
                className={cn(
                  "border-l-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group",
                  priorityColors[uc.priority] || "border-l-border"
                )}
                onClick={() => {
                  if (uc.ucm_projects?.id) navigate(`/portal/ucm/${uc.ucm_projects.id}/uc/${uc.id}`);
                }}
              >
                <CardContent className="p-4">
                  <h4 className="font-semibold group-hover:text-primary transition-colors">{uc.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{uc.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <Badge variant={uc.priority === "high" ? "default" : "outline"} className="text-xs">{uc.priority}</Badge>
                    <Badge variant="outline" className="text-xs">{uc.complexity}</Badge>
                    <Badge variant="outline" className="text-xs">{uc.impact_level}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {uc.ucm_projects?.company} · {uc.ucm_projects?.sector_label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
