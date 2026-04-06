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
import { Save, GripVertical } from "lucide-react";
import { useState } from "react";

interface AnalysisSection {
  id: string;
  code: string;
  title: string;
  icon: string;
  brief_instruction: string;
  detailed_instruction: string;
  is_active: boolean;
  sort_order: number;
}

interface GlobalSection {
  id: string;
  code: string;
  title: string;
  icon: string;
  instruction: string;
  is_active: boolean;
  sort_order: number;
}

function SectionEditor({ section, onSave, type }: { section: AnalysisSection | GlobalSection; onSave: (s: any) => void; type: "analysis" | "global" }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(section);

  const handleSave = () => {
    onSave(form);
    setEditing(false);
  };

  return (
    <Card className={`border ${!form.is_active ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="text-xl">{form.icon}</span>
            {editing ? (
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-64" />
            ) : (
              <CardTitle className="text-base">{form.title}</CardTitle>
            )}
            <Badge variant="outline" className="font-mono text-xs">{form.code}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Actif</span>
              <Switch checked={form.is_active} onCheckedChange={v => { setForm({ ...form, is_active: v }); if (!editing) onSave({ ...form, is_active: v }); }} />
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
            <div>
              <label className="text-sm font-medium">Icône (emoji)</label>
              <Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className="w-20" />
            </div>
            <div>
              <label className="text-sm font-medium">Ordre</label>
              <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="w-20" />
            </div>
          </div>
          {type === "analysis" ? (
            <>
              <div>
                <label className="text-sm font-medium">Instruction Fiche Décision (brief)</label>
                <Textarea value={(form as AnalysisSection).brief_instruction} onChange={e => setForm({ ...form, brief_instruction: e.target.value })} rows={4} />
              </div>
              <div>
                <label className="text-sm font-medium">Instruction Analyse Complète (detailed)</label>
                <Textarea value={(form as AnalysisSection).detailed_instruction} onChange={e => setForm({ ...form, detailed_instruction: e.target.value })} rows={6} />
              </div>
            </>
          ) : (
            <div>
              <label className="text-sm font-medium">Instruction de synthèse</label>
              <Textarea value={(form as GlobalSection).instruction} onChange={e => setForm({ ...form, instruction: e.target.value })} rows={6} />
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

  return (
    <AdminShell>
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Prompts & Instructions IA</h1>
            <p className="text-muted-foreground">Gérez les instructions qui guident les analyses et synthèses IA</p>
          </div>

          <Tabs defaultValue="analysis">
            <TabsList>
              <TabsTrigger value="analysis">Sections d'analyse ({analysisSections.length})</TabsTrigger>
              <TabsTrigger value="global">Sections de synthèse ({globalSections.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-3 mt-4">
              <p className="text-sm text-muted-foreground">
                Ces sections définissent les 6 dimensions d'analyse appliquées à chaque use case. Chaque section a une instruction « fiche décision » (brief) et une instruction « analyse complète » (detailed).
              </p>
              {analysisSections.map(s => (
                <SectionEditor key={s.id} section={s} type="analysis" onSave={d => updateAnalysis.mutate(d)} />
              ))}
            </TabsContent>

            <TabsContent value="global" className="space-y-3 mt-4">
              <p className="text-sm text-muted-foreground">
                Ces sections définissent les 7 volets de la synthèse globale du projet (Executive Summary, Synergies, Roadmap, etc.).
              </p>
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
