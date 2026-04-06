import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Sparkles, RefreshCw, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyzeUCM } from "@/hooks/useUCMProject";
import { toast } from "sonner";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

const SECTION_COLORS: Record<string, string> = {
  process: "border-l-blue-500",
  data: "border-l-emerald-500",
  tech: "border-l-violet-500",
  impact: "border-l-amber-500",
  roadmap: "border-l-primary",
  risks: "border-l-red-500",
};

const SECTION_BG: Record<string, string> = {
  process: "bg-blue-500/5",
  data: "bg-emerald-500/5",
  tech: "bg-violet-500/5",
  impact: "bg-amber-500/5",
  roadmap: "bg-primary/5",
  risks: "bg-red-500/5",
};

interface Props {
  useCaseId: string;
  useCaseName: string;
  projectId: string;
  analysisSections: any[];
  currentAnalyses: any[];
}

export function UCMAnalysisView({ useCaseId, useCaseName, projectId, analysisSections, currentAnalyses }: Props) {
  const analyzeUCM = useAnalyzeUCM();
  const perms = usePermissions();
  const canDetailed = perms.has("ucm.uc.analyze_detailed");

  const { data: allVersions } = useQuery({
    queryKey: ["ucm-analysis-versions", useCaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ucm_analyses")
        .select("*")
        .eq("use_case_id", useCaseId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [selectedVersions, setSelectedVersions] = useState<Record<string, number>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const getAnalysis = (sectionCode: string) => {
    const ver = selectedVersions[sectionCode];
    if (ver !== undefined) {
      return allVersions?.find((a: any) => a.section_id === sectionCode && a.version === ver);
    }
    return currentAnalyses.find((a: any) => a.use_case_id === useCaseId && a.section_id === sectionCode);
  };

  const getVersions = (sectionCode: string) => {
    return (allVersions || [])
      .filter((a: any) => a.section_id === sectionCode)
      .map((a: any) => a.version)
      .filter((v: number, i: number, arr: number[]) => arr.indexOf(v) === i)
      .sort((a: number, b: number) => b - a);
  };

  const analyzedCount = (analysisSections || []).filter((s: any) => getAnalysis(s.code)).length;
  const totalSections = (analysisSections || []).length;
  const progressPct = totalSections > 0 ? (analyzedCount / totalSections) * 100 : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{useCaseName}</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{analyzedCount}/{totalSections}</span>
            <Progress value={progressPct} className="w-24 h-2" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {(analysisSections || []).map((section: any) => {
          const existing = getAnalysis(section.code);
          const versions = getVersions(section.code);
          const colorClass = SECTION_COLORS[section.code] || "border-l-border";
          const bgClass = SECTION_BG[section.code] || "";
          const isOpen = openSections[section.code] ?? !!existing;

          return (
            <Collapsible
              key={section.code}
              open={isOpen}
              onOpenChange={(open) => setOpenSections((p) => ({ ...p, [section.code]: open }))}
            >
              <div className={cn("border rounded-lg overflow-hidden border-l-4", colorClass)}>
                <CollapsibleTrigger asChild>
                  <div className={cn("flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors", existing ? bgClass : "")}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{section.icon}</span>
                      <span className="text-sm font-semibold">{section.title}</span>
                      {existing && (
                        <Badge variant="secondary" className="text-[10px]">
                          {existing.mode} · v{existing.version}
                        </Badge>
                      )}
                      {!existing && <Badge variant="outline" className="text-[10px] text-muted-foreground">non analysé</Badge>}
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {versions.length > 1 && (
                        <Select
                          value={String(selectedVersions[section.code] ?? "")}
                          onValueChange={(v) => setSelectedVersions((p) => ({ ...p, [section.code]: Number(v) }))}
                        >
                          <SelectTrigger className="h-7 w-20 text-xs">
                            <SelectValue placeholder="Ver." />
                          </SelectTrigger>
                          <SelectContent>
                            {versions.map((v: number) => (
                              <SelectItem key={v} value={String(v)}>v{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        size="sm" variant="outline" className="h-7 text-xs"
                        disabled={analyzeUCM.isPending}
                        onClick={() => analyzeUCM.mutate(
                          { use_case_id: useCaseId, section_id: section.code, mode: "brief", project_id: projectId },
                          { onSuccess: () => toast.success("Brief généré"), onError: (e) => toast.error(e.message) }
                        )}
                      >
                        {existing ? <RefreshCw className="h-3 w-3 mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                        Brief
                      </Button>
                      <Button
                        size="sm" variant="outline" className="h-7 text-xs"
                        disabled={analyzeUCM.isPending || !canDetailed}
                        title={!canDetailed ? "Permission requise" : ""}
                        onClick={() => analyzeUCM.mutate(
                          { use_case_id: useCaseId, section_id: section.code, mode: "detailed", project_id: projectId },
                          { onSuccess: () => toast.success("Analyse détaillée générée"), onError: (e) => toast.error(e.message) }
                        )}
                      >
                        Détaillé
                      </Button>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {existing ? (
                    <div className="p-5 border-t">
                      <EnrichedMarkdown content={existing.content || ""} />
                    </div>
                  ) : (
                    <div className="p-5 border-t text-center text-sm text-muted-foreground">
                      Cliquez sur "Brief" ou "Détaillé" pour générer cette analyse
                    </div>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}
