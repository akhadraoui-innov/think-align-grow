
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, ArrowLeft, Save, Target, Cpu, Wrench, BarChart3, Route, Loader2, Info, ListChecks, Brain, Link2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function AdminAcademyFunctionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(null);
  const [dirty, setDirty] = useState(false);

  const { data: fn, isLoading } = useQuery({
    queryKey: ["admin-function-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_functions" as any).select("*").eq("id", id).single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  const { data: linkedPaths = [] } = useQuery({
    queryKey: ["admin-function-paths", id],
    queryFn: async () => {
      const { data } = await supabase.from("academy_paths").select("id, name, status, difficulty, estimated_hours").eq("function_id", id!);
      return data || [];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (fn && !form) {
      setForm({
        name: fn.name || "",
        description: fn.description || "",
        department: fn.department || "",
        seniority: fn.seniority || "",
        industry: fn.industry || "",
        company_size: fn.company_size || "",
        status: fn.status || "draft",
        responsibilities: fn.responsibilities || [],
        tools_used: fn.tools_used || [],
        kpis: fn.kpis || [],
        ai_use_cases: fn.ai_use_cases || [],
      });
    }
  }, [fn, form]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("academy_functions" as any).update(form).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-function-detail", id] });
      toast.success("Fonction mise à jour");
      setDirty(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateField = (key: string, value: any) => {
    setForm((f: any) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  if (isLoading || !form) {
    return <><div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></>;
  }

  const difficultyColors: Record<string, string> = {
    beginner: "bg-emerald-500/10 text-emerald-700",
    intermediate: "bg-amber-500/10 text-amber-700",
    advanced: "bg-red-500/10 text-red-700",
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/portal/academie/functions")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold">{form.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                {form.department && <Badge variant="outline" className="text-[10px]">{form.department}</Badge>}
                {form.seniority && <Badge variant="outline" className="text-[10px]">{form.seniority}</Badge>}
                <Badge variant={form.status === "published" ? "default" : "secondary"} className="text-[10px]">{form.status}</Badge>
              </div>
            </div>
          </div>
          {dirty && (
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2">
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </Button>
          )}
        </div>

        <Tabs defaultValue="info">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="info" className="gap-1.5"><Info className="h-3.5 w-3.5" /> Informations</TabsTrigger>
            <TabsTrigger value="responsibilities" className="gap-1.5"><ListChecks className="h-3.5 w-3.5" /> Responsabilités & KPIs</TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5"><Brain className="h-3.5 w-3.5" /> IA & Outils</TabsTrigger>
            <TabsTrigger value="paths" className="gap-1.5"><Link2 className="h-3.5 w-3.5" /> Parcours liés</TabsTrigger>
          </TabsList>

          {/* INFO TAB */}
          <TabsContent value="info">
            <Card>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Nom du poste</Label>
                    <Input value={form.name} onChange={e => updateField("name", e.target.value)} className="text-base font-medium" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={e => updateField("description", e.target.value)} rows={4} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Département</Label>
                    <Input value={form.department} onChange={e => updateField("department", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Séniorité</Label>
                    <Input value={form.seniority} onChange={e => updateField("seniority", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Industrie</Label>
                    <Input value={form.industry} onChange={e => updateField("industry", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Taille entreprise</Label>
                    <Input value={form.company_size} onChange={e => updateField("company_size", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Statut</Label>
                    <Select value={form.status} onValueChange={v => updateField("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="published">Publié</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RESPONSIBILITIES TAB */}
          <TabsContent value="responsibilities">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Responsabilités</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(form.responsibilities as string[]).map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 group">
                      <div className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <Input
                        value={r}
                        onChange={e => {
                          const arr = [...form.responsibilities];
                          arr[i] = e.target.value;
                          updateField("responsibilities", arr);
                        }}
                        className="text-sm border-transparent hover:border-input focus:border-input bg-transparent"
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive shrink-0"
                        onClick={() => updateField("responsibilities", form.responsibilities.filter((_: any, j: number) => j !== i))}>×</Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="text-xs mt-2" onClick={() => updateField("responsibilities", [...form.responsibilities, ""])}>
                    + Ajouter
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> KPIs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(form.kpis as string[]).map((k: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 group">
                      <div className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <Input
                        value={k}
                        onChange={e => {
                          const arr = [...form.kpis];
                          arr[i] = e.target.value;
                          updateField("kpis", arr);
                        }}
                        className="text-sm border-transparent hover:border-input focus:border-input bg-transparent"
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive shrink-0"
                        onClick={() => updateField("kpis", form.kpis.filter((_: any, j: number) => j !== i))}>×</Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="text-xs mt-2" onClick={() => updateField("kpis", [...form.kpis, ""])}>
                    + Ajouter
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI TAB */}
          <TabsContent value="ai">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Cpu className="h-4 w-4 text-violet-500" /> Cas d'usage IA</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(form.ai_use_cases as string[]).map((c: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 group p-2.5 rounded-lg bg-violet-500/5 border border-violet-200/30">
                      <Cpu className="h-3.5 w-3.5 mt-1 shrink-0 text-violet-500" />
                      <Input
                        value={c}
                        onChange={e => {
                          const arr = [...form.ai_use_cases];
                          arr[i] = e.target.value;
                          updateField("ai_use_cases", arr);
                        }}
                        className="text-sm border-transparent hover:border-input focus:border-input bg-transparent"
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive shrink-0"
                        onClick={() => updateField("ai_use_cases", form.ai_use_cases.filter((_: any, j: number) => j !== i))}>×</Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="text-xs mt-2" onClick={() => updateField("ai_use_cases", [...form.ai_use_cases, ""])}>
                    + Ajouter un cas d'usage
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> Outils utilisés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(form.tools_used as string[]).map((t: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs gap-1 cursor-pointer hover:bg-destructive/10"
                        onClick={() => updateField("tools_used", form.tools_used.filter((_: any, j: number) => j !== i))}>
                        {t} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ajouter un outil…"
                      onKeyDown={e => {
                        if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                          updateField("tools_used", [...form.tools_used, (e.target as HTMLInputElement).value.trim()]);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                      className="text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PATHS TAB */}
          <TabsContent value="paths">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Route className="h-4 w-4 text-primary" />
                  Parcours liés à cette fonction
                  <Badge variant="secondary" className="text-[10px]">{linkedPaths.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {linkedPaths.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Aucun parcours lié à cette fonction</p>
                ) : (
                  <div className="divide-y">
                    {linkedPaths.map((p: any) => (
                      <div key={p.id} className="py-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2"
                        onClick={() => navigate(`/portal/academie/paths/${p.id}`)}>
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.estimated_hours}h estimées</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {p.difficulty && <Badge variant="outline" className={cn("text-[10px]", difficultyColors[p.difficulty])}>{p.difficulty}</Badge>}
                          <Badge variant={p.status === "published" ? "default" : "secondary"} className="text-[10px]">{p.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
