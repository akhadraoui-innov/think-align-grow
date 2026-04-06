import { useParams, Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, CheckCircle2, Circle, FileText, MessageCircle, Play, ChevronRight, Building2, Target, Layers, BarChart3, FileSearch, Bot } from "lucide-react";
import { useUCMProject, useUCMUseCases, useUCMSectors, useUCMAnalyses, useUCMGlobalSections, useGenerateUCM, useAnalyzeUCM, useSynthesizeUCM, useUCMAnalysisSections } from "@/hooks/useUCMProject";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { UCMChat } from "@/components/ucm/UCMChat";
import { UCMContextForm } from "@/components/ucm/UCMContextForm";
import { UCMAnalysisView } from "@/components/ucm/UCMAnalysisView";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { usePermissions } from "@/hooks/usePermissions";
import { useUCMQuotas } from "@/hooks/useUCMQuotas";
import { useActiveOrg } from "@/contexts/OrgContext";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "context", label: "Contexte", icon: Building2 },
  { key: "scope", label: "Périmètre", icon: Target },
  { key: "usecases", label: "Use Cases", icon: Layers },
  { key: "analysis", label: "Analyses", icon: BarChart3 },
  { key: "synthesis", label: "Synthèse", icon: FileSearch },
  { key: "chat", label: "Consultant", icon: Bot },
];

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

  const [activeStep, setActiveStep] = useState("context");
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

  // Step completion logic
  const stepComplete: Record<string, boolean> = {
    context: !!(project.company && project.context),
    scope: !!project.sector_id,
    usecases: (useCases || []).length > 0,
    analysis: (analyses || []).length > 0,
    synthesis: (globalSections || []).length > 0,
    chat: false,
  };

  const completedCount = Object.values(stepComplete).filter(Boolean).length;

  return (
    <>
      <PageTransition>
        <div className="flex flex-col h-full">
          {/* Sticky breadcrumb + stepper */}
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 px-6 py-3 text-sm">
              <Link to="/portal/ucm" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                AI Value Builder
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold text-foreground">{project.company || "Nouveau projet"}</span>
              <Badge variant="secondary" className="ml-2 text-xs">{project.status}</Badge>
              {project.sector_label && (
                <Badge variant="outline" className="ml-1 text-xs">{(project as any).ucm_sectors?.icon} {project.sector_label}</Badge>
              )}
              <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                <span>{completedCount}/6 étapes</span>
                {quotas.limits && (
                  <>
                    <span className="text-border">|</span>
                    <span>Analyses : {(quotas.usage as any).analysis_generations || 0}/{(quotas.limits as any).max_analyses_per_month || "∞"}</span>
                  </>
                )}
              </div>
            </div>

            {/* Workflow stepper */}
            <div className="px-6 pb-3 flex items-center gap-1">
              {STEPS.map((step, i) => {
                const complete = stepComplete[step.key];
                const active = activeStep === step.key;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <button
                      onClick={() => setActiveStep(step.key)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all w-full",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : complete
                            ? "bg-primary/10 text-primary hover:bg-primary/15"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <div className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                        active
                          ? "bg-primary-foreground/20"
                          : complete
                            ? "bg-primary/20"
                            : "bg-muted-foreground/20"
                      )}>
                        {complete && !active ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      <span className="hidden lg:inline truncate">{step.label}</span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div className={cn("h-px w-3 mx-0.5 shrink-0", complete ? "bg-primary/40" : "bg-border")} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6 max-w-5xl mx-auto w-full space-y-6">
            <Tabs value={activeStep} onValueChange={setActiveStep}>
              {/* Step 1: Context */}
              <TabsContent value="context" className="space-y-4 mt-0">
                <Card className="border-l-4 border-l-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Contexte & Immersion
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <label className="text-sm font-semibold mb-1.5 block">Entreprise</label>
                      <Input defaultValue={project.company} onBlur={(e) => updateProject.mutate({ company: e.target.value })} className="text-base" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-1.5 block">Contexte général</label>
                      <Textarea defaultValue={project.context || ""} onBlur={(e) => updateProject.mutate({ context: e.target.value })} rows={3} placeholder="Décrivez le contexte de transformation IA…" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-1.5 block">Immersion détaillée</label>
                      <Textarea defaultValue={project.immersion || ""} onBlur={(e) => updateProject.mutate({ immersion: e.target.value })} rows={5} placeholder="Organisation, enjeux stratégiques, maturité digitale…" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Step 2: Scope */}
              <TabsContent value="scope" className="space-y-4 mt-0">
                <Card className="border-l-4 border-l-violet-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-violet-500" />
                      Secteur d'activité
                    </CardTitle>
                  </CardHeader>
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
                    <CardHeader><CardTitle className="text-base">Fonctions métier</CardTitle></CardHeader>
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
              <TabsContent value="usecases" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Use Cases</h3>
                    <p className="text-sm text-muted-foreground">{useCases?.length || 0} générés · {selectedUCs.length} sélectionnés</p>
                  </div>
                  <Button
                    onClick={() => generateUCM.mutate(id!, { onSuccess: () => toast.success("10 use cases générés !"), onError: (e) => toast.error(e.message) })}
                    disabled={generateUCM.isPending || !quotas.canGenerate}
                  >
                    {generateUCM.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Générer 10 UC
                  </Button>
                </div>
                <div className="space-y-3">
                  {(useCases || []).map((uc: any) => (
                    <Card key={uc.id} className={cn("transition-all", uc.is_selected ? "border-primary/50 bg-primary/5 shadow-sm" : "hover:border-border/80")}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <button onClick={() => toggleUCSelection.mutate({ ucId: uc.id, selected: !uc.is_selected })} className="mt-0.5">
                            {uc.is_selected ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">{uc.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{uc.description}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <Badge variant={uc.priority === "high" ? "default" : "outline"} className="text-xs">{uc.priority}</Badge>
                              <Badge variant="outline" className="text-xs">{uc.complexity}</Badge>
                              <Badge variant="outline" className="text-xs">{uc.impact_level}</Badge>
                              <Badge variant="outline" className="text-xs">{uc.horizon}</Badge>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => setContextUC({ id: uc.id, name: uc.name })} title="Enrichir le contexte">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Step 4: Analysis */}
              <TabsContent value="analysis" className="space-y-4 mt-0">
                {selectedUCs.length > 0 && (
                  <Card className="bg-muted/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{selectedUCs.length} use case(s) sélectionné(s)</p>
                        <p className="text-sm text-muted-foreground">{(analyses || []).length} analyses existantes</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {batchProgress && (
                          <div className="flex items-center gap-2">
                            <Progress value={(batchProgress.current / batchProgress.total) * 100} className="w-32 h-2" />
                            <span className="text-xs text-muted-foreground">{batchProgress.current}/{batchProgress.total}</span>
                          </div>
                        )}
                        <Button onClick={runBatchAnalysis} disabled={!!batchProgress || !quotas.canAnalyze}>
                          {batchProgress ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                          Analyser tout (brief)
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
                      <p className="text-muted-foreground">Sélectionnez des use cases à l'étape 3 pour lancer les analyses</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Step 5: Synthesis */}
              <TabsContent value="synthesis" className="space-y-4 mt-0">
                {["g_exec", "g_synergies", "g_roadmap", "g_archi", "g_business", "g_change", "g_next"].map((code) => {
                  const titles: Record<string, string> = {
                    g_exec: "Executive Summary", g_synergies: "Synergies", g_roadmap: "Roadmap Programme",
                    g_archi: "Architecture Cible", g_business: "Business Case", g_change: "Transformation", g_next: "Next Steps",
                  };
                  const icons: Record<string, string> = {
                    g_exec: "📋", g_synergies: "🔗", g_roadmap: "🗺️", g_archi: "🏗️", g_business: "💰", g_change: "🔄", g_next: "🚀",
                  };
                  const existing = globalSections?.find((s: any) => s.section_id === code);
                  return (
                    <Card key={code} className={cn("transition-all", existing ? "border-l-4 border-l-primary" : "")}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <span>{icons[code]}</span>
                            {titles[code]}
                            {existing && <Badge variant="secondary" className="text-xs ml-2">v{existing.version}</Badge>}
                          </CardTitle>
                          <Button
                            size="sm"
                            variant={existing ? "outline" : "default"}
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
                          <EnrichedMarkdown content={existing.content || ""} />
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </TabsContent>

              {/* Step 6: Chat */}
              <TabsContent value="chat" className="mt-0">
                <Card className="border-l-4 border-l-emerald-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-emerald-500" />
                      Consultant IA
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Posez des questions sur le projet — l'IA a accès à tout le contexte</p>
                  </CardHeader>
                  <CardContent>
                    <UCMChat projectId={id!} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
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
    </>
  );
}
