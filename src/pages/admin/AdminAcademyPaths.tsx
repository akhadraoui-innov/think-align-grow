import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Route, Plus, Pencil, Trash2, Save, Clock, BookOpen, Sparkles,
  Loader2, Search, LayoutGrid, List, GraduationCap, Target,
  Users, FileText, HelpCircle, CheckCircle2, AlertTriangle, Award, ImageIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PathForm {
  name: string;
  description: string;
  difficulty: string;
  estimated_hours: number;
  status: string;
  certificate_enabled: boolean;
  persona_id: string;
  function_id: string;
}

const emptyForm: PathForm = {
  name: "",
  description: "",
  difficulty: "intermediate",
  estimated_hours: 0,
  status: "draft",
  certificate_enabled: false,
  persona_id: "",
  function_id: "",
};

const difficultyConfig: Record<string, { gradient: string; label: string; color: string; border: string; coverGradient: string }> = {
  beginner: { gradient: "from-emerald-500/10 to-teal-500/5", label: "Débutant", color: "text-emerald-600", border: "border-l-emerald-500", coverGradient: "from-emerald-500/80 to-teal-600/80" },
  intermediate: { gradient: "from-blue-500/10 to-indigo-500/5", label: "Intermédiaire", color: "text-blue-600", border: "border-l-blue-500", coverGradient: "from-blue-500/80 to-indigo-600/80" },
  advanced: { gradient: "from-purple-500/10 to-pink-500/5", label: "Avancé", color: "text-purple-600", border: "border-l-purple-500", coverGradient: "from-purple-500/80 to-pink-600/80" },
};

export default function AdminAcademyPaths() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PathForm>(emptyForm);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState<"guided" | "corporate" | "chat">("guided");
  const [aiForm, setAiForm] = useState({ name: "", description: "", difficulty: "intermediate", module_count: 5, persona_id: "", function_id: "" });
  const [aiChat, setAiChat] = useState("");

  const { data: paths = [], isLoading } = useQuery({
    queryKey: ["admin-academy-paths"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_paths")
        .select("*, academy_personae(id, name), academy_functions:function_id(id, name, department)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: personae = [] } = useQuery({
    queryKey: ["admin-academy-personae-select"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_personae").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: functions = [] } = useQuery({
    queryKey: ["admin-functions-select"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_functions").select("id, name, department").order("name");
      return data || [];
    },
  });

  const { data: moduleCounts = {} } = useQuery({
    queryKey: ["admin-academy-path-module-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_path_modules").select("path_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => { counts[r.path_id] = (counts[r.path_id] || 0) + 1; });
      return counts;
    },
  });

  const { data: contentCounts = {} } = useQuery({
    queryKey: ["admin-academy-path-content-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_contents").select("module_id");
      const counts: Record<string, boolean> = {};
      (data || []).forEach((r: any) => { counts[r.module_id] = true; });
      return counts;
    },
  });

  // Filtered paths
  const filtered = paths.filter((p: any) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterDifficulty !== "all" && p.difficulty !== filterDifficulty) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  const publishedCount = paths.filter((p: any) => p.status === "published").length;
  const draftCount = paths.filter((p: any) => p.status === "draft").length;
  const totalHours = paths.reduce((s: number, p: any) => s + (p.estimated_hours || 0), 0);
  const totalModules = Object.values(moduleCounts as Record<string, number>).reduce((s, v) => s + v, 0);

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name,
        description: form.description,
        difficulty: form.difficulty,
        estimated_hours: form.estimated_hours,
        status: form.status,
        certificate_enabled: form.certificate_enabled,
        persona_id: form.persona_id || null,
        function_id: form.function_id || null,
      };
      if (editId) {
        const { error } = await supabase.from("academy_paths").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("academy_paths").insert({ ...payload, created_by: user!.id, generation_mode: "manual" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-paths"] });
      toast.success(editId ? "Parcours mis à jour" : "Parcours créé");
      setOpen(false);
      setEditId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academy_paths").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-paths"] });
      toast.success("Parcours supprimé");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const generateAI = useMutation({
    mutationFn: async () => {
      const body: any = {
        action: "generate-path",
        name: aiForm.name,
        description: aiMode === "chat" ? aiChat : aiForm.description,
        difficulty: aiForm.difficulty,
        module_count: aiForm.module_count,
        persona_id: aiForm.persona_id || null,
        function_id: aiForm.function_id || null,
      };
      const { data, error } = await supabase.functions.invoke("academy-generate", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-academy-paths"] });
      toast.success(`Parcours généré avec ${data.module_count} modules`);
      setAiOpen(false);
      if (data.path_id) navigate(`/admin/academy/paths/${data.path_id}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openEdit(p: any) {
    setEditId(p.id);
    setForm({
      name: p.name,
      description: p.description || "",
      difficulty: p.difficulty || "intermediate",
      estimated_hours: p.estimated_hours || 0,
      status: p.status,
      certificate_enabled: p.certificate_enabled,
      persona_id: p.persona_id || "",
      function_id: p.function_id || "",
    });
    setOpen(true);
  }

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        {/* ═══ HEADER ═══ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold">Parcours de formation</h1>
                <p className="text-xs text-muted-foreground">Structurez et gérez vos parcours pédagogiques</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => { setAiOpen(true); setAiMode("guided"); }}>
                <Sparkles className="h-4 w-4 mr-1" /> Générer par IA
              </Button>
              <Button size="sm" onClick={() => { setEditId(null); setForm(emptyForm); setOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Nouveau parcours
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total", value: paths.length, icon: Route },
              { label: "Publiés", value: publishedCount, icon: CheckCircle2 },
              { label: "Modules", value: totalModules, icon: BookOpen },
              { label: "Heures", value: `${totalHours}h`, icon: Clock },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-card">
                <s.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un parcours..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Difficulté" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="beginner">Débutant</SelectItem>
                <SelectItem value="intermediate">Intermédiaire</SelectItem>
                <SelectItem value="advanced">Avancé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center border rounded-md">
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-r-none" onClick={() => setViewMode("grid")}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-l-none" onClick={() => setViewMode("table")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ═══ CONTENT ═══ */}
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-4 bg-muted rounded w-2/3 mb-2" /><div className="h-3 bg-muted rounded w-full" /></CardContent></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center text-muted-foreground">
              <Route className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">{search || filterDifficulty !== "all" || filterStatus !== "all" ? "Aucun parcours ne correspond aux filtres" : "Aucun parcours créé"}</p>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p: any) => {
              const diff = difficultyConfig[p.difficulty || "intermediate"] || difficultyConfig.intermediate;
              const mc = (moduleCounts as any)[p.id] || 0;
              const funcName = (p as any).academy_functions?.name;
              const personaName = (p as any).academy_personae?.name;

              return (
                <Card
                  key={p.id}
                  className={`group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-l-4 ${diff.border}`}
                  onClick={() => navigate(`/admin/academy/paths/${p.id}`)}
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{p.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); openEdit(p); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={(e) => { e.stopPropagation(); remove.mutate(p.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={p.status === "published" ? "default" : "secondary"} className="text-[10px]">{p.status}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${diff.color}`}>{diff.label}</Badge>
                      {p.certificate_enabled && <Award className="h-3 w-3 text-amber-500" />}
                    </div>

                    {/* Targets */}
                    {(funcName || personaName) && (
                      <div className="flex items-center gap-2 flex-wrap text-[10px]">
                        {funcName && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted">
                            <Target className="h-2.5 w-2.5" /> {funcName}
                          </span>
                        )}
                        {personaName && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted">
                            <Users className="h-2.5 w-2.5" /> {personaName}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {mc} modules</span>
                      {p.estimated_hours > 0 && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.estimated_hours}h</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcours</TableHead>
                    <TableHead>Difficulté</TableHead>
                    <TableHead className="text-center">Modules</TableHead>
                    <TableHead className="text-center">Heures</TableHead>
                    <TableHead>Fonction</TableHead>
                    <TableHead>Persona</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p: any) => {
                    const diff = difficultyConfig[p.difficulty || "intermediate"] || difficultyConfig.intermediate;
                    return (
                      <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/academy/paths/${p.id}`)}>
                        <TableCell>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                        </TableCell>
                        <TableCell><Badge variant="outline" className={`text-[10px] ${diff.color}`}>{diff.label}</Badge></TableCell>
                        <TableCell className="text-center text-sm">{(moduleCounts as any)[p.id] || 0}</TableCell>
                        <TableCell className="text-center text-sm">{p.estimated_hours || "—"}</TableCell>
                        <TableCell className="text-xs">{(p as any).academy_functions?.name || "—"}</TableCell>
                        <TableCell className="text-xs">{(p as any).academy_personae?.name || "—"}</TableCell>
                        <TableCell><Badge variant={p.status === "published" ? "default" : "secondary"} className="text-[10px]">{p.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(p); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); remove.mutate(p.id); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ═══ CREATE/EDIT DIALOG ═══ */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier le parcours" : "Nouveau parcours"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Intégrer l'IA dans votre stratégie commerciale" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Objectifs, contenu, public cible..." rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Difficulté</Label>
                <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Débutant</SelectItem>
                    <SelectItem value="intermediate">Intermédiaire</SelectItem>
                    <SelectItem value="advanced">Avancé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Heures</Label>
                <Input type="number" min={0} value={form.estimated_hours} onChange={e => setForm({ ...form, estimated_hours: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="published">Publié</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fonction cible</Label>
                <Select value={form.function_id || "none"} onValueChange={v => setForm({ ...form, function_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {functions.map((f: any) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Persona cible</Label>
                <Select value={form.persona_id || "none"} onValueChange={v => setForm({ ...form, persona_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {personae.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Certificat</Label>
              <Switch checked={form.certificate_enabled} onCheckedChange={v => setForm({ ...form, certificate_enabled: v })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={() => upsert.mutate()} disabled={!form.name || upsert.isPending}>
                <Save className="h-4 w-4 mr-1" /> {editId ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ AI GENERATION DIALOG — 3 MODES ═══ */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Générer un parcours par IA
            </DialogTitle>
          </DialogHeader>

          <Tabs value={aiMode} onValueChange={(v) => setAiMode(v as any)} className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="guided" className="gap-1.5">
                <Route className="h-3.5 w-3.5" /> Guidé
              </TabsTrigger>
              <TabsTrigger value="corporate" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Brief corporate
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Chat libre
              </TabsTrigger>
            </TabsList>

            {/* GUIDED */}
            <TabsContent value="guided" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>🎯 Nom du parcours</Label>
                  <Input value={aiForm.name} onChange={e => setAiForm({ ...aiForm, name: e.target.value })} placeholder="Ex: L'IA au service du manager de terrain" />
                </div>
                <div className="space-y-1.5">
                  <Label>📊 Difficulté</Label>
                  <Select value={aiForm.difficulty} onValueChange={v => setAiForm({ ...aiForm, difficulty: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">🟢 Débutant</SelectItem>
                      <SelectItem value="intermediate">🔵 Intermédiaire</SelectItem>
                      <SelectItem value="advanced">🟣 Avancé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>📝 Description / Objectifs</Label>
                <Textarea value={aiForm.description} onChange={e => setAiForm({ ...aiForm, description: e.target.value })} rows={4} placeholder="Décrivez les objectifs pédagogiques, le contexte, le public cible..." />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>📚 Nombre de modules</Label>
                  <Input type="number" min={3} max={12} value={aiForm.module_count} onChange={e => setAiForm({ ...aiForm, module_count: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>💼 Fonction cible</Label>
                  <Select value={aiForm.function_id || "none"} onValueChange={v => setAiForm({ ...aiForm, function_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      {functions.map((f: any) => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>🎭 Persona cible</Label>
                  <Select value={aiForm.persona_id || "none"} onValueChange={v => setAiForm({ ...aiForm, persona_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {personae.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* CORPORATE */}
            <TabsContent value="corporate" className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nom du parcours</Label>
                <Input value={aiForm.name} onChange={e => setAiForm({ ...aiForm, name: e.target.value })} placeholder="Titre du parcours" />
              </div>
              <div className="space-y-1.5">
                <Label>Brief pédagogique complet</Label>
                <Textarea
                  value={aiForm.description}
                  onChange={e => setAiForm({ ...aiForm, description: e.target.value })}
                  rows={10}
                  placeholder={"Collez ici votre brief complet :\n\n• Contexte et enjeux\n• Public cible et prérequis\n• Objectifs pédagogiques\n• Compétences visées\n• Contraintes (durée, format...)\n• Livrables attendus"}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Fonction</Label>
                  <Select value={aiForm.function_id || "none"} onValueChange={v => setAiForm({ ...aiForm, function_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      {functions.map((f: any) => (<SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Persona</Label>
                  <Select value={aiForm.persona_id || "none"} onValueChange={v => setAiForm({ ...aiForm, persona_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {personae.map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* CHAT */}
            <TabsContent value="chat" className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nom du parcours</Label>
                <Input value={aiForm.name} onChange={e => setAiForm({ ...aiForm, name: e.target.value })} placeholder="Titre" />
              </div>
              <div className="space-y-1.5">
                <Label>Décrivez librement ce que vous voulez</Label>
                <Textarea
                  value={aiChat}
                  onChange={e => setAiChat(e.target.value)}
                  rows={8}
                  placeholder={"Décrivez en langage naturel le parcours que vous souhaitez créer.\n\nExemple : \"Je veux un parcours de 6 modules pour des managers qui n'ont jamais utilisé l'IA. Il faut commencer par les bases, puis passer à des cas pratiques sur la prise de décision et terminer par un projet concret.\""}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setAiOpen(false)}>Annuler</Button>
            <Button
              onClick={() => generateAI.mutate()}
              disabled={!aiForm.name || (aiMode !== "chat" ? !aiForm.description : !aiChat) || generateAI.isPending}
            >
              {generateAI.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              {generateAI.isPending ? "Génération..." : "Générer le parcours"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
