import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Lightbulb } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveOrg } from "@/contexts/OrgContext";
import { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-emerald-500",
};

export default function PortalUCMExplorer() {
  const { activeOrgId } = useActiveOrg();
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterComplexity, setFilterComplexity] = useState("all");

  const { data: useCases, isLoading } = useQuery({
    queryKey: ["ucm-all-uc", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ucm_use_cases")
        .select("*, ucm_projects(company, sector_label)")
        .eq("organization_id", activeOrgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = (useCases || []).filter((uc: any) => {
    if (search && !uc.name.toLowerCase().includes(search.toLowerCase()) && !uc.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPriority !== "all" && uc.priority !== filterPriority) return false;
    if (filterComplexity !== "all" && uc.complexity !== filterComplexity) return false;
    return true;
  });

  return (
    <PageTransition>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" /> UC Explorer
            <Badge variant="secondary" className="ml-2">{filtered.length}</Badge>
          </h1>
          <div className="flex items-center gap-2">
            <div className="relative w-60">
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
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((uc: any) => (
              <Card key={uc.id} className={cn("border-l-4 hover:shadow-md transition-all", priorityColors[uc.priority] || "border-l-border")}>
                <CardContent className="p-4">
                  <h4 className="font-semibold">{uc.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{uc.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <Badge variant={uc.priority === "high" ? "default" : "outline"} className="text-xs">{uc.priority}</Badge>
                    <Badge variant="outline" className="text-xs">{uc.complexity}</Badge>
                    <Badge variant="outline" className="text-xs">{uc.impact_level}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{(uc as any).ucm_projects?.company} · {(uc as any).ucm_projects?.sector_label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
