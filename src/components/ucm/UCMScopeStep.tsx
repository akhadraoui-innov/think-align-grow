import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUCMSectors } from "@/hooks/useUCMProject";

interface Props {
  project: any;
  projectId: string;
}

export function UCMScopeStep({ project, projectId }: Props) {
  const { data: sectors } = useUCMSectors();
  const qc = useQueryClient();
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);

  const updateProject = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase.from("ucm_projects").update(updates).eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ucm-project", projectId] }),
  });

  const sectorGroups = (sectors || []).reduce((acc: Record<string, any[]>, s: any) => {
    const g = s.group_name || "Autre";
    if (!acc[g]) acc[g] = [];
    acc[g].push(s);
    return acc;
  }, {});

  const activeSectorId = selectedSector || project.sector_id;
  const currentSector = sectors?.find((s: any) => s.id === activeSectorId);
  const sectorFunctions = currentSector?.functions as Record<string, string[]> | undefined;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Périmètre</h2>
        <p className="text-sm text-muted-foreground mt-1">Sélectionnez le secteur d'activité et les fonctions métier</p>
      </div>

      <Card className="border-l-4 border-l-accent shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-accent" />
            Secteur d'activité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(sectorGroups).map(([group, items]) => (
              <div key={group}>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{group}</p>
                <div className="flex flex-wrap gap-2">
                  {(items as any[]).map((s) => (
                    <Button
                      key={s.id}
                      variant={s.id === activeSectorId ? "default" : "outline"}
                      size="sm"
                      className="transition-all"
                      onClick={() => {
                        setSelectedSector(s.id);
                        setSelectedFunctions([]);
                        updateProject.mutate({ sector_id: s.id, sector_label: s.label });
                      }}
                    >
                      {s.icon} {s.label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {sectorFunctions && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Fonctions métier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(sectorFunctions).map(([cat, fns]) => (
              <div key={cat}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">{cat.replace(/_/g, " ")}</p>
                <div className="flex flex-wrap gap-2">
                  {(fns as string[]).map((fn) => {
                    const current = selectedFunctions.length ? selectedFunctions : (project.selected_functions || []);
                    const sel = current.includes(fn);
                    return (
                      <Badge
                        key={fn}
                        variant={sel ? "default" : "outline"}
                        className="cursor-pointer transition-all hover:scale-105"
                        onClick={() => {
                          const next = sel ? current.filter((f: string) => f !== fn) : [...current, fn];
                          setSelectedFunctions(next);
                          updateProject.mutate({ selected_functions: next });
                        }}
                      >
                        {fn}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
