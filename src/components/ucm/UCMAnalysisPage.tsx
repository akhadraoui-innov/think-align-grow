import { useParams, useSearchParams, Link } from "react-router-dom";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyzeUCM, useUCMAnalysisSections } from "@/hooks/useUCMProject";
import { toast } from "sonner";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { usePermissions } from "@/hooks/usePermissions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SECTION_COLORS: Record<string, string> = {
  process: "text-blue-600 border-blue-500",
  data: "text-emerald-600 border-emerald-500",
  tech: "text-violet-600 border-violet-500",
  impact: "text-amber-600 border-amber-500",
  roadmap: "text-primary border-primary",
  risks: "text-red-600 border-red-500",
};

interface Props {
  projectId: string;
  useCases: any[];
  analyses: any[];
}

export function UCMAnalysisPage({ projectId, useCases, analyses }: Props) {
  const { ucId } = useParams<{ ucId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: analysisSections } = useUCMAnalysisSections();
  const analyzeUCM = useAnalyzeUCM();
  const perms = usePermissions();
  const canDetailed = perms.has("ucm.uc.analyze_detailed");

  const uc = useCases.find((u: any) => u.id === ucId);
  const selectedUCs = useCases.filter((u: any) => u.is_selected);
  const ucIndex = selectedUCs.findIndex((u: any) => u.id === ucId);
  const prevUC = ucIndex > 0 ? selectedUCs[ucIndex - 1] : null;
  const nextUC = ucIndex < selectedUCs.length - 1 ? selectedUCs[ucIndex + 1] : null;

  const activeSection = searchParams.get("section") || (analysisSections?.[0]?.code ?? "process");

  const { data: allVersions } = useQuery({
    queryKey: ["ucm-analysis-versions", ucId],
    enabled: !!ucId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ucm_analyses")
        .select("*")
        .eq("use_case_id", ucId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  if (!uc) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Use case introuvable</p>
      </div>
    );
  }

  const currentAnalysis = (() => {
    if (selectedVersion !== null) {
      return allVersions?.find((a: any) => a.section_id === activeSection && a.version === selectedVersion);
    }
    return analyses.find((a: any) => a.use_case_id === ucId && a.section_id === activeSection);
  })();

  const versions = (allVersions || [])
    .filter((a: any) => a.section_id === activeSection)
    .map((a: any) => a.version)
    .filter((v: number, i: number, arr: number[]) => arr.indexOf(v) === i)
    .sort((a: number, b: number) => b - a);

  const analyzedSections = analyses
    .filter((a: any) => a.use_case_id === ucId)
    .map((a: any) => a.section_id);

  const sections = analysisSections || [];

  return (
    <div className="flex flex-col h-full">
      {/* UC Header */}
      <div className="border-b bg-gradient-to-r from-primary/[0.03] to-transparent px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 text-[10px] font-bold uppercase",
                uc.priority === "high" ? "border-red-300 text-red-600 bg-red-50" :
                uc.priority === "medium" ? "border-amber-300 text-amber-600 bg-amber-50" :
                "border-emerald-300 text-emerald-600 bg-emerald-50"
              )}
            >
              {uc.priority}
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">
              UC {ucIndex + 1}/{selectedUCs.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {prevUC && (
              <Link to={`/portal/ucm/${projectId}/uc/${prevUC.id}`}>
                <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
              </Link>
            )}
            {nextUC && (
              <Link to={`/portal/ucm/${projectId}/uc/${nextUC.id}`}>
                <Button variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button>
              </Link>
            )}
          </div>
        </div>
        <h1 className="text-lg font-bold mt-2 text-foreground">{uc.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">{uc.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          <Badge variant="outline" className="text-[10px]">{uc.complexity}</Badge>
          <Badge variant="outline" className="text-[10px]">{uc.impact_level}</Badge>
          <Badge variant="outline" className="text-[10px]">{uc.horizon}</Badge>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="border-b px-6 shrink-0">
        <div className="flex items-center gap-0.5 overflow-x-auto -mb-px">
          {sections.map((section: any) => {
            const isActive = activeSection === section.code;
            const done = analyzedSections.includes(section.code);
            const colorClass = SECTION_COLORS[section.code] || "";

            return (
              <button
                key={section.code}
                onClick={() => {
                  setSearchParams({ section: section.code });
                  setSelectedVersion(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap",
                  isActive
                    ? `${colorClass} border-current`
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{section.icon}</span>
                <span>{section.title}</span>
                {done && <span className="text-primary text-[10px]">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action bar */}
      <div className="px-6 py-3 border-b bg-muted/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={currentAnalysis?.mode === "brief" ? "default" : "outline"}
            disabled={analyzeUCM.isPending}
            onClick={() => {
              analyzeUCM.mutate(
                { use_case_id: ucId!, section_id: activeSection, mode: "brief", project_id: projectId },
                { onSuccess: () => toast.success("Brief généré"), onError: (e) => toast.error(e.message) }
              );
            }}
            className="text-xs h-8"
          >
            {analyzeUCM.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
            ⚡ Fiche décision
          </Button>
          <Button
            size="sm"
            variant={currentAnalysis?.mode === "detailed" ? "default" : "outline"}
            disabled={analyzeUCM.isPending || !canDetailed}
            title={!canDetailed ? "Permission requise" : ""}
            onClick={() => {
              analyzeUCM.mutate(
                { use_case_id: ucId!, section_id: activeSection, mode: "detailed", project_id: projectId },
                { onSuccess: () => toast.success("Analyse détaillée générée"), onError: (e) => toast.error(e.message) }
              );
            }}
            className="text-xs h-8"
          >
            💻 Analyse complète
          </Button>
        </div>

        {versions.length > 1 && (
          <Select
            value={selectedVersion !== null ? String(selectedVersion) : ""}
            onValueChange={(v) => setSelectedVersion(v ? Number(v) : null)}
          >
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue placeholder="Version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((v: number) => (
                <SelectItem key={v} value={String(v)}>v{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {currentAnalysis ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="text-[10px]">
                  {currentAnalysis.mode} · v{currentAnalysis.version}
                </Badge>
              </div>
              <EnrichedMarkdown content={currentAnalysis.content || ""} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary/60" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Analyse non générée</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Cliquez sur "Fiche décision" ou "Analyse complète" pour générer l'analyse de cette dimension
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
