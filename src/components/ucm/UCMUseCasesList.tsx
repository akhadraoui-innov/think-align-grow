import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, CheckCircle2, Circle, FileText, Layers } from "lucide-react";
import { useGenerateUCM } from "@/hooks/useUCMProject";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UCMContextForm } from "@/components/ucm/UCMContextForm";
import { useUCMQuotas } from "@/hooks/useUCMQuotas";
import { useActiveOrg } from "@/contexts/OrgContext";
import { cn } from "@/lib/utils";

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

interface Props {
  projectId: string;
  useCases: any[];
}

export function UCMUseCasesList({ projectId, useCases }: Props) {
  const generateUCM = useGenerateUCM();
  const qc = useQueryClient();
  const quotas = useUCMQuotas();
  const { activeOrgId } = useActiveOrg();
  const [contextUC, setContextUC] = useState<{ id: string; name: string } | null>(null);

  const toggleUCSelection = useMutation({
    mutationFn: async ({ ucId, selected }: { ucId: string; selected: boolean }) => {
      const { error } = await supabase.from("ucm_use_cases").update({ is_selected: selected }).eq("id", ucId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ucm-use-cases", projectId] }),
  });

  const selectedCount = useCases.filter((uc: any) => uc.is_selected).length;

  return (
    <>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Use Cases</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {useCases.length} générés · {selectedCount} sélectionnés
            </p>
          </div>
          <Button
            onClick={() => generateUCM.mutate(projectId, {
              onSuccess: () => toast.success("10 use cases générés !"),
              onError: (e) => toast.error(e.message),
            })}
            disabled={generateUCM.isPending || !quotas.canGenerate}
            className="shadow-sm"
          >
            {generateUCM.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Générer 10 UC
          </Button>
        </div>

        {useCases.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Layers className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-base font-semibold text-muted-foreground">Aucun use case</h3>
              <p className="text-sm text-muted-foreground mt-1">Générez vos premiers use cases IA</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {useCases.map((uc: any) => (
              <Card
                key={uc.id}
                className={cn(
                  "transition-all hover:shadow-md",
                  uc.is_selected ? "border-primary/40 bg-primary/[0.03]" : "hover:border-border/80"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleUCSelection.mutate({ ucId: uc.id, selected: !uc.is_selected })}
                      className="mt-0.5 shrink-0"
                    >
                      {uc.is_selected ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/40" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{uc.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{uc.description}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        <span className={cn("h-2 w-2 rounded-full", PRIORITY_DOT[uc.priority] || "bg-muted")} />
                        <Badge variant={uc.priority === "high" ? "default" : "outline"} className="text-[10px]">
                          {uc.priority}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{uc.complexity}</Badge>
                        <Badge variant="outline" className="text-[10px]">{uc.impact_level}</Badge>
                        <Badge variant="outline" className="text-[10px]">{uc.horizon}</Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setContextUC({ id: uc.id, name: uc.name })}
                      title="Enrichir le contexte"
                      className="shrink-0"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {contextUC && activeOrgId && (
        <UCMContextForm
          open={!!contextUC}
          onOpenChange={(open) => { if (!open) setContextUC(null); }}
          useCaseId={contextUC.id}
          useCaseName={contextUC.name}
          organizationId={activeOrgId}
        />
      )}
    </>
  );
}
