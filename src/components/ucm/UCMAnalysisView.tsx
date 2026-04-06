import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyzeUCM } from "@/hooks/useUCMProject";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { usePermissions } from "@/hooks/usePermissions";

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

  // Fetch ALL versions (not just is_current) for this UC
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

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{useCaseName}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {(analysisSections || []).map((section: any) => {
          const existing = getAnalysis(section.code);
          const versions = getVersions(section.code);
          return (
            <div key={section.code} className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <span>{section.icon}</span>
                  <span className="text-sm font-medium">{section.title}</span>
                  {existing && (
                    <Badge variant="secondary" className="text-xs">
                      {existing.mode} — v{existing.version}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {versions.length > 1 && (
                    <Select
                      value={String(selectedVersions[section.code] ?? "")}
                      onValueChange={(v) => setSelectedVersions((p) => ({ ...p, [section.code]: Number(v) }))}
                    >
                      <SelectTrigger className="h-7 w-20 text-xs">
                        <SelectValue placeholder="Version" />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map((v: number) => (
                          <SelectItem key={v} value={String(v)}>v{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    size="sm" variant="outline"
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
                    size="sm" variant="outline"
                    disabled={analyzeUCM.isPending || !canDetailed}
                    title={!canDetailed ? "Permission requise : ucm.uc.analyze_detailed" : ""}
                    onClick={() => analyzeUCM.mutate(
                      { use_case_id: useCaseId, section_id: section.code, mode: "detailed", project_id: projectId },
                      { onSuccess: () => toast.success("Analyse détaillée générée"), onError: (e) => toast.error(e.message) }
                    )}
                  >
                    Détaillé
                  </Button>
                </div>
              </div>
              {existing && (
                <div className="p-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{existing.content || ""}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
