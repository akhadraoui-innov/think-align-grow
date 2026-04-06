import { useParams } from "react-router-dom";
import { PortalShell } from "@/components/portal/PortalShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, CheckCircle2, Circle, FileText, MessageCircle, Play } from "lucide-react";
import { useUCMProject, useUCMUseCases, useUCMSectors, useUCMAnalyses, useUCMGlobalSections, useGenerateUCM, useAnalyzeUCM, useSynthesizeUCM, useUCMAnalysisSections } from "@/hooks/useUCMProject";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { PageTransition } from "@/components/ui/PageTransition";
import { UCMChat } from "@/components/ucm/UCMChat";
import { UCMContextForm } from "@/components/ucm/UCMContextForm";
import { UCMAnalysisView } from "@/components/ucm/UCMAnalysisView";
import { usePermissions } from "@/hooks/usePermissions";
import { useUCMQuotas } from "@/hooks/useUCMQuotas";
import { useActiveOrg } from "@/contexts/OrgContext";

export default function PortalUCMProject() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useUCMProject(id);
  const { data: useCases } = useUCMUseCases(id);
  const { data: sectors } = useUCMSectors();
  const { data: analyses } = useUCMAnalyses(id);
  const { data: globalSections } = useUCMGlobalSections(id);
  const { data: analysisSections } = useUCMAnalysisSections();
  const generateUCM = useGenerateUCM();
  const analyzeUCM = useAnalyzeUCM();
  const synthesizeUCM = useSynthesizeUCM();
  const qc = useQueryClient();
  const perms = usePermissions();
  const quotas = useUCMQuotas();
  const { activeOrgId } = useActiveOrg();

  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [contextUC, setContextUC] = useState<{ id: string; name: string } | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  const updateProject = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase.from("ucm_projects").update(updates).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ucm-project", id] }),
  });

  const toggleUCSelection = useMutation({
    mutationFn: async ({ ucId, selected }: { ucId: string; selected: boolean }) => {
      const { error } = await supabase.from("ucm_use_cases").update({ is_selected: selected }).eq("id", ucId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ucm-use-cases", id] }),
  });

  const runBatchAnalysis = async () => {
    const selected = (useCases || []).filter((uc: any) => uc.is_selected);
    const sections = analysisSections || [];
    const total = selected.length * sections.length;
    setBatchProgress({ current: 0, total });

    for (let i = 0; i < selected.length; i++) {
      for (let j = 0; j < sections.length; j++) {
        try {
          await analyzeUCM.mutateAsync({
            use_case_id: selected[i].id,
            section_id: sections[j].code,
            mode: "brief",
            project_id: id!,
          });
        } catch (e: any) {
          toast.error(`Erreur ${selected[i].name} × ${sections[j].title}: ${e.message}`);
        }
        setBatchProgress({ current: i * sections.length + j + 1, total });
      }
    }
    setBatchProgress(null);
    toast.success(`Batch terminé : ${total} analyses`);
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!project) return null;

  const sectorGroups = (sectors || []).reduce((acc: Record<string, any[]>, s: any) => {
    const g = s.group_name || "Autre";
    if (!acc[g]) acc[g] = [];
    acc[g].push(s);
    return acc;
  }, {});

  const currentSector = sectors?.find((s: any) => s.id === (selectedSector || project.sector_id));
  const sectorFunctions = currentSector?.functions as Record<string, string[]> | undefined;
  const selectedUCs = (useCases || []).filter((uc: any) => uc.is_selected);
  const canChat = perms.has("ucm.chat.use");
  const canSynthesize = perms.has("ucm.global.generate");

  return (
      <PageTransition>
        <div className="p-6 max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{project.company || "Nouveau projet"}</h1>
              <p className="text-muted-foreground">{project.sector_label || "Secteur non défini"}</p>
            </div>
            {quotas.limits && Object.keys(quotas.limits).length > 0 && (
              <div className="text-xs text-muted-foreground space-x-3">
                <span>Analyses : {(quotas.usage as any).analysis_generations || 0}/{(quotas.limits as any).max_analyses_per_month || "∞"}</span>
                <span>Exports : {(quotas.usage as any).exports || 0}/{(quotas.limits as any).max_exports_per_month || "∞"}</span>
              </div>
            )}
          </div>

          <Tabs defaultValue="context">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="context">1. Contexte</TabsTrigger>
              <TabsTrigger value="scope">2. Périmètre</TabsTrigger>
              <TabsTrigger value="usecases">3. Use Cases</TabsTrigger>
              <TabsTrigger value="analysis">4. Analyses</TabsTrigger>
              <TabsTrigger value="synthesis">5. Synthèse</TabsTrigger>
              <TabsTrigger value="chat" disabled={!canChat}>6. Chat</TabsTrigger>
            </TabsList>

            {/* Step 1: Context */}
            <TabsContent value="context" className="space-y-4 mt-4">
              <Card>
                <CardHeader><CardTitle>Contexte du projet</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Entreprise</label>
                    <Input defaultValue={project.company} onBlur={(e) => updateProject.mutate({ company: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Contexte général</label>
                    <Textarea defaultValue={project.context || ""} onBlur={(e) => updateProject.mutate({ context: e.target.value })} rows={3} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Immersion détaillée</label>
                    <Textarea defaultValue={project.immersion || ""} onBlur={(e) => updateProject.mutate({ immersion: e.target.value })} rows={5} placeholder="Décrivez en détail l'entreprise, ses enjeux, son organisation..." />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 2: Scope */}
            <TabsContent value="scope" className="space-y-4 mt-4">
              <Card>
                <CardHeader><CardTitle>Secteur d'activité</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(sectorGroups).map(([group, items]) => (
                      <div key={group}>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{group}</p>
                        <div className="flex flex-wrap gap-2">
                          {(items as any[]).map((s) => (
                            <Button
                              key={s.id}
                              variant={s.id === (selectedSector || project.sector_id) ? "default" : "outline"}
                              size="sm"
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
                <Card>
                  <CardHeader><CardTitle>Fonctions métier</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(sectorFunctions).map(([cat, fns]) => (
                      <div key={cat}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{cat.replace(/_/g, " ")}</p>
                        <div className="flex flex-wrap gap-2">
                          {(fns as string[]).map((fn) => {
                            const sel = (selectedFunctions.length ? selectedFunctions : project.selected_functions || []).includes(fn);
                            return (
                              <Badge
                                key={fn}
                                variant={sel ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => {
                                  const current = selectedFunctions.length ? selectedFunctions : (project.selected_functions || []);
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
            </TabsContent>

            {/* Step 3: Use Cases */}
            <TabsContent value="usecases" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Use Cases ({useCases?.length || 0})</h3>
                <Button
                  onClick={() => {
                    generateUCM.mutate(id!, { onSuccess: () => toast.success("10 use cases générés !"), onError: (e) => toast.error(e.message) });
                  }}
                  disabled={generateUCM.isPending || !quotas.canGenerate}
                >
                  {generateUCM.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Générer 10 UC
                </Button>
              </div>
              <div className="space-y-3">
                {(useCases || []).map((uc: any) => (
                  <Card key={uc.id} className={uc.is_selected ? "border-primary/50 bg-primary/5" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggleUCSelection.mutate({ ucId: uc.id, selected: !uc.is_selected })}>
                          {uc.is_selected ? <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" /> : <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />}
                        </button>
                        <div className="flex-1">
                          <h4 className="font-semibold">{uc.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{uc.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <Badge variant="outline" className="text-xs">{uc.priority}</Badge>
                            <Badge variant="outline" className="text-xs">{uc.complexity}</Badge>
                            <Badge variant="outline" className="text-xs">{uc.impact_level}</Badge>
                            <Badge variant="outline" className="text-xs">{uc.horizon}</Badge>
                          </div>
                        </div>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => setContextUC({ id: uc.id, name: uc.name })}
                          title="Enrichir le contexte"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Step 4: Analysis */}
            <TabsContent value="analysis" className="space-y-4 mt-4">
              {selectedUCs.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{selectedUCs.length} UC sélectionné(s)</p>
                  <div className="flex items-center gap-3">
                    {batchProgress && (
                      <span className="text-xs text-muted-foreground">
                        {batchProgress.current}/{batchProgress.total}
                      </span>
                    )}
                    <Button
                      onClick={runBatchAnalysis}
                      disabled={!!batchProgress || !quotas.canAnalyze}
                    >
                      {batchProgress ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      Analyser tout (brief)
                    </Button>
                  </div>
                </div>
              )}
              {selectedUCs.map((uc: any) => (
                <UCMAnalysisView
                  key={uc.id}
                  useCaseId={uc.id}
                  useCaseName={uc.name}
                  projectId={id!}
                  analysisSections={analysisSections || []}
                  currentAnalyses={analyses || []}
                />
              ))}
              {selectedUCs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Sélectionnez des use cases à l'étape 3 pour lancer les analyses</p>
              )}
            </TabsContent>

            {/* Step 5: Synthesis */}
            <TabsContent value="synthesis" className="space-y-4 mt-4">
              {["g_exec", "g_synergies", "g_roadmap", "g_archi", "g_business", "g_change", "g_next"].map((code) => {
                const titles: Record<string, string> = {
                  g_exec: "Executive Summary", g_synergies: "Synergies", g_roadmap: "Roadmap Programme",
                  g_archi: "Architecture Cible", g_business: "Business Case", g_change: "Transformation", g_next: "Next Steps",
                };
                const existing = globalSections?.find((s: any) => s.section_id === code);
                return (
                  <Card key={code}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{titles[code]}</CardTitle>
                        <Button
                          size="sm"
                          disabled={synthesizeUCM.isPending || !canSynthesize}
                          title={!canSynthesize ? "Permission requise" : ""}
                          onClick={() => synthesizeUCM.mutate(
                            { project_id: id!, section_id: code },
                            { onSuccess: () => toast.success(`${titles[code]} généré`), onError: (e) => toast.error(e.message) }
                          )}
                        >
                          {synthesizeUCM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardHeader>
                    {existing && (
                      <CardContent>
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{existing.content || ""}</ReactMarkdown>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </TabsContent>

            {/* Step 6: Chat */}
            <TabsContent value="chat" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5" /> Consultant IA</CardTitle></CardHeader>
                <CardContent>
                  <UCMChat projectId={id!} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>

      {contextUC && activeOrgId && (
        <UCMContextForm
          open={!!contextUC}
          onOpenChange={(open) => { if (!open) setContextUC(null); }}
          useCaseId={contextUC.id}
          useCaseName={contextUC.name}
          organizationId={activeOrgId}
        />
      )}
    </PortalShell>
  );
}
