import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Check, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUCMSectors } from "@/hooks/useUCMProject";
import { UCMPageHeader } from "./UCMPageHeader";
import { cn } from "@/lib/utils";

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

  const currentFunctions = selectedFunctions.length ? selectedFunctions : (project.selected_functions || []);
  const allFns = sectorFunctions ? Object.values(sectorFunctions).flat() : [];
  const totalFns = allFns.length;

  return (
    <div className="p-6 overflow-auto flex-1">
      <div className="max-w-4xl mx-auto space-y-6">
        <UCMPageHeader
          icon={<Target className="h-5 w-5 text-primary" />}
          title="Périmètre"
          subtitle="Sélectionnez le secteur d'activité et les fonctions métier"
          badge={activeSectorId ? currentSector?.label : undefined}
        />

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="h-6 w-6 rounded-md bg-accent/10 flex items-center justify-center text-xs">🎯</span>
              Secteur d'activité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(sectorGroups).map(([group, items]) => (
                <div key={group}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{group}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(items as any[]).map((s) => {
                      const active = s.id === activeSectorId;
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelectedSector(s.id);
                            setSelectedFunctions([]);
                            updateProject.mutate({ sector_id: s.id, sector_label: s.label });
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                            active
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background border-border text-foreground hover:border-primary/40 hover:bg-primary/5"
                          )}
                        >
                          <span>{s.icon}</span>
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {sectorFunctions && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center text-xs">⚙️</span>
                  Fonctions métier
                  <Badge variant="secondary" className="text-[10px] font-bold ml-1">
                    {currentFunctions.length} / {totalFns}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setSelectedFunctions(allFns);
                      updateProject.mutate({ selected_functions: allFns });
                    }}
                  >
                    <Check className="h-3 w-3 mr-1" /> Tout
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setSelectedFunctions([]);
                      updateProject.mutate({ selected_functions: [] });
                    }}
                  >
                    <X className="h-3 w-3 mr-1" /> Aucun
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(sectorFunctions).map(([cat, fns]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {cat.replace(/_/g, " ")}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {(fns as string[]).filter(fn => currentFunctions.includes(fn)).length}/{(fns as string[]).length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(fns as string[]).map((fn) => {
                      const sel = currentFunctions.includes(fn);
                      return (
                        <button
                          key={fn}
                          onClick={() => {
                            const next = sel ? currentFunctions.filter((f: string) => f !== fn) : [...currentFunctions, fn];
                            setSelectedFunctions(next);
                            updateProject.mutate({ selected_functions: next });
                          }}
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium transition-all border",
                            sel
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                          )}
                        >
                          {fn}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
