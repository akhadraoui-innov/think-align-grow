import { PortalShell } from "@/components/portal/PortalShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Lightbulb } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveOrg } from "@/contexts/OrgContext";
import { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";

export default function PortalUCMExplorer() {
  const { activeOrgId } = useActiveOrg();
  const [search, setSearch] = useState("");

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

  const filtered = (useCases || []).filter((uc: any) =>
    !search || uc.name.toLowerCase().includes(search.toLowerCase()) || uc.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
      <PageTransition>
        <div className="p-6 max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-primary" /> UC Explorer
            </h1>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((uc: any) => (
                <Card key={uc.id}>
                  <CardContent className="p-4">
                    <h4 className="font-semibold">{uc.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{uc.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="outline" className="text-xs">{uc.priority}</Badge>
                      <Badge variant="outline" className="text-xs">{uc.complexity}</Badge>
                      <Badge variant="outline" className="text-xs">{uc.impact_level}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{(uc as any).ucm_projects?.company} • {(uc as any).ucm_projects?.sector_label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageTransition>
    </PortalShell>
  );
}
