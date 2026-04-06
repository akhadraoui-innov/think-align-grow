import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Search, Globe, Info } from "lucide-react";
import { useState } from "react";

interface AnalysisSection {
  id: string; code: string; title: string; icon: string;
  brief_instruction: string; detailed_instruction: string;
  is_active: boolean; sort_order: number;
}

interface GlobalSection {
  id: string; code: string; title: string; icon: string;
  instruction: string; is_active: boolean; sort_order: number;
}

const SECTION_COLORS: Record<string, string> = {
  business_value: "border-l-emerald-500",
  complexity: "border-l-red-500",
  data_readiness: "border-l-blue-500",
  change_impact: "border-l-amber-500",
  roi_timeline: "border-l-violet-500",
  risk_analysis: "border-l-orange-500",
  executive_summary: "border-l-primary",
  synergies: "border-l-cyan-500",
  roadmap: "border-l-emerald-500",
  investments: "border-l-amber-500",
  risks: "border-l-red-500",
  kpis: "border-l-violet-500",
  recommendations: "border-l-blue-500",
};

function SectionEditor({ section, onSave, type }: { section: AnalysisSection | GlobalSection; onSave: (s: any) => void; type: "analysis" | "global" }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(section);
  const [modified, setModified] = useState(false);

  const handleChange = (updates: any) => {
    setForm({ ...form, ...updates });
    setModified(true);
  };

  const handleSave = () => {
    onSave(form);
    setEditing(false);
    setModified(false);
  };

  const colorClass = SECTION_COLORS[form.code] || "border-l-muted-foreground";

  return (
    <Card className={`border-l-4 ${colorClass} ${!form.is_active ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
              <span className="text-xl">{form.icon}</span>
            </div>
            {editing ? (
              <Input value={form.title} onChange={e => handleChange({ title: e.target.value })} className="w-64" />
            ) : (
              <CardTitle className="text-base">{form.title}</CardTitle>
            )}
            <Badge variant="outline" className="font-mono text-[10px] bg-muted/30">{form.code}</Badge>
            {modified && editing && <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">Modifié</Badge>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Actif</span>
              <Switch checked={form.is_active} onCheckedChange={v => { handleChange({ is_active: v }); if (!editing) onSave({ ...form, is_active: v }); }} />
            </div>
            {editing ? (
              <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" />Enregistrer</Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Modifier</Button>
            )}
          </div>
        </div>
      </CardHeader>
      {editing && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Icône (emoji)</label>
              <Input value={form.icon} onChange={e => handleChange({ icon: e.target.value })} className="w-20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Ordre</label>
              <Input type="number" value={form.sort_order} onChange={e => handleChange({ sort_order: parseInt(e.target.value) || 0 })} className="w-20" />
            </div>
          </div>
          {type === "analysis" ? (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Instruction Fiche Décision (brief)</label>
                  <span className="text-[10px] text-muted-foreground">{((form as AnalysisSection).brief_instruction || "").length} car.</span>
                </div>
                <Textarea value={(form as AnalysisSection).brief_instruction} onChange={e => handleChange({ brief_instruction: e.target.value })} rows={4} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Instruction Analyse Complète (detailed)</label>
                  <span className="text-[10px] text-muted-foreground">{((form as AnalysisSection).detailed_instruction || "").length} car.</span>
                </div>
                <Textarea value={(form as AnalysisSection).detailed_instruction} onChange={e => handleChange({ detailed_instruction: e.target.value })} rows={6} />
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Instruction de synthèse</label>
                <span className="text-[10px] text-muted-foreground">{((form as GlobalSection).instruction || "").length} car.</span>
              </div>
              <Textarea value={(form as GlobalSection).instruction} onChange={e => handleChange({ instruction: e.target.value })} rows={6} />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function AdminUCMPrompts() {
  const qc = useQueryClient();

  const { data: analysisSections = [] } = useQuery({
    queryKey: ["ucm-analysis-sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ucm_analysis_sections").select("*").order("sort_order");
      if (error) throw error;
      return data as AnalysisSection[];
    },
  });

  const { data: globalSections = [] } = useQuery({
    queryKey: ["ucm-global-sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ucm_global_analysis_sections").select("*").order("sort_order");
      if (error) throw error;
      return data as GlobalSection[];
    },
  });

  const updateAnalysis = useMutation({
    mutationFn: async (s: AnalysisSection) => {
      const { error } = await supabase.from("ucm_analysis_sections").update({
        title: s.title, icon: s.icon, brief_instruction: s.brief_instruction,
        detailed_instruction: s.detailed_instruction, is_active: s.is_active, sort_order: s.sort_order,
      }).eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ucm-analysis-sections"] }); toast.success("Section mise à jour"); },
  });

  const updateGlobal = useMutation({
    mutationFn: async (s: GlobalSection) => {
      const { error } = await supabase.from("ucm_global_analysis_sections").update({
        title: s.title, icon: s.icon, instruction: s.instruction,
        is_active: s.is_active, sort_order: s.sort_order,
      }).eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ucm-global-sections"] }); toast.success("Section mise à jour"); },
  });

  const totalSections = analysisSections.length + globalSections.length;

  return (
    <AdminShell>
      <PageTransition>
        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-display">Prompts & Instructions IA</h1>
              <Badge variant="outline" className="font-mono text-xs">{totalSections} sections</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Gérez les instructions qui guident les analyses et synthèses IA</p>
          </div>

          <Tabs defaultValue="analysis">
            <TabsList className="h-10">
              <TabsTrigger value="analysis" className="gap-2 px-4">
                <Search className="h-4 w-4" />
                Sections d'analyse ({analysisSections.length})
              </TabsTrigger>
              <TabsTrigger value="global" className="gap-2 px-4">
                <Globe className="h-4 w-4" />
                Sections de synthèse ({globalSections.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-3 mt-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Ces sections définissent les 6 dimensions d'analyse appliquées à chaque use case. Chaque section a une instruction « fiche décision » (brief) et une instruction « analyse complète » (detailed).
                </p>
              </div>
              {analysisSections.map(s => (
                <SectionEditor key={s.id} section={s} type="analysis" onSave={d => updateAnalysis.mutate(d)} />
              ))}
            </TabsContent>

            <TabsContent value="global" className="space-y-3 mt-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Ces sections définissent les 7 volets de la synthèse globale du projet (Executive Summary, Synergies, Roadmap, etc.).
                </p>
              </div>
              {globalSections.map(s => (
                <SectionEditor key={s.id} section={s} type="global" onSave={d => updateGlobal.mutate(d)} />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>
    </AdminShell>
  );
}
