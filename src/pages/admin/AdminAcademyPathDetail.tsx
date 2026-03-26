import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Plus, Save, BookOpen, Loader2,
  FileText, HelpCircle, Clock, Award, Target, Bot, Dumbbell, GraduationCap,
  Users, BarChart3, Info, Image, Zap, RefreshCw
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PathModulesTab, moduleTypeConfig } from "@/components/admin/path-detail/PathModulesTab";
import { PathInfoTab } from "@/components/admin/path-detail/PathInfoTab";
import { PathEnrollmentsTab } from "@/components/admin/path-detail/PathEnrollmentsTab";
import { PathStatsTab } from "@/components/admin/path-detail/PathStatsTab";

const difficultyConfig: Record<string, { gradient: string; label: string; color: string }> = {
  beginner: { gradient: "from-emerald-500/20 to-teal-500/10", label: "Débutant", color: "text-emerald-600" },
  intermediate: { gradient: "from-blue-500/20 to-indigo-500/10", label: "Intermédiaire", color: "text-blue-600" },
  advanced: { gradient: "from-purple-500/20 to-pink-500/10", label: "Avancé", color: "text-purple-600" },
};

interface ModuleForm {
  title: string;
  description: string;
  module_type: string;
  estimated_minutes: number;
  status: string;
}

const emptyModule: ModuleForm = {
  title: "",
  description: "",
  module_type: "lesson",
  estimated_minutes: 30,
  status: "draft",
};

export default function AdminAcademyPathDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [moduleOpen, setModuleOpen] = useState(false);
  const [editModuleId, setEditModuleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleForm>(emptyModule);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [infoForm, setInfoForm] = useState<any>(null);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, step: "" });

  // ─── Queries ────────────────────────────────────────────────
  const { data: path, isLoading } = useQuery({
    queryKey: ["admin-academy-path", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_paths")
        .select("*, academy_personae!academy_paths_persona_id_fkey(id, name), academy_functions!academy_paths_function_id_fkey(id, name, department), organizations!academy_paths_organization_id_fkey(id, name)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: pathModules = [] } = useQuery({
    queryKey: ["admin-academy-path-modules", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_path_modules")
        .select("*, academy_modules(*)")
        .eq("path_id", id!)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const moduleIds = pathModules.map((pm: any) => pm.academy_modules?.id).filter(Boolean);

  const { data: contents = [] } = useQuery({
    queryKey: ["admin-path-contents", id],
    enabled: moduleIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_contents").select("*").in("module_id", moduleIds).order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ["admin-path-quizzes", id],
    enabled: moduleIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_quizzes").select("*, academy_quiz_questions(*)").in("module_id", moduleIds).order("sort_order", { referencedTable: "academy_quiz_questions" });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ["admin-path-exercises", id],
    enabled: moduleIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_exercises").select("*").in("module_id", moduleIds);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: practices = [] } = useQuery({
    queryKey: ["admin-path-practices", id],
    enabled: moduleIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_practices").select("*").in("module_id", moduleIds);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: enrollmentCount = 0 } = useQuery({
    queryKey: ["admin-path-enrollment-count", id],
    enabled: !!id,
    queryFn: async () => {
      const { count, error } = await supabase.from("academy_enrollments").select("id", { count: "exact", head: true }).eq("path_id", id!);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["admin-path-enrollments", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_enrollments").select("*").eq("path_id", id!).order("enrolled_at", { ascending: false });
      if (error) throw error;
      const userIds = [...new Set((data || []).map((e: any) => e.user_id))];
      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, email, avatar_url").in("user_id", userIds);
        for (const p of profiles || []) profileMap[p.user_id] = p;
      }
      return (data || []).map((e: any) => ({ ...e, profile: profileMap[e.user_id] || null }));
    },
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["admin-path-progress", id],
    enabled: moduleIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_progress").select("*").in("module_id", moduleIds);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: personae = [] } = useQuery({
    queryKey: ["admin-personae-select"],
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

  const { data: organizations = [] } = useQuery({
    queryKey: ["admin-orgs-select"],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id, name").order("name");
      return data || [];
    },
  });

  // ─── Computed ──────────────────────────────────────────────
  const modulesWithContent = moduleIds.filter((mid: string) => contents.some((c: any) => c.module_id === mid)).length;
  const modulesWithQuiz = moduleIds.filter((mid: string) => quizzes.some((q: any) => q.module_id === mid)).length;
  const totalDuration = pathModules.reduce((sum: number, pm: any) => sum + (pm.academy_modules?.estimated_minutes || 0), 0);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId);
      return next;
    });
  };

  // ─── Mutations ──────────────────────────────────────────────
  const createModule = useMutation({
    mutationFn: async () => {
      const { data: mod, error: modErr } = await supabase.from("academy_modules").insert({
        title: moduleForm.title, description: moduleForm.description, module_type: moduleForm.module_type,
        estimated_minutes: moduleForm.estimated_minutes, status: moduleForm.status, generation_mode: "manual",
      }).select("id").single();
      if (modErr) throw modErr;
      const { error: linkErr } = await supabase.from("academy_path_modules").insert({ path_id: id!, module_id: mod.id, sort_order: pathModules.length });
      if (linkErr) throw linkErr;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-academy-path-modules", id] }); toast.success("Module créé"); setModuleOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateModule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("academy_modules").update({
        title: moduleForm.title, description: moduleForm.description, module_type: moduleForm.module_type,
        estimated_minutes: moduleForm.estimated_minutes, status: moduleForm.status,
      }).eq("id", editModuleId!);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-academy-path-modules", id] }); toast.success("Module mis à jour"); setModuleOpen(false); setEditModuleId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const removeModule = useMutation({
    mutationFn: async (pmId: string) => {
      const { error } = await supabase.from("academy_path_modules").delete().eq("id", pmId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-academy-path-modules", id] }); toast.success("Module retiré"); },
    onError: (e: any) => toast.error(e.message),
  });

  const makeMutation = (action: string, successMsg: string, invalidateKey: string) => useMutation({
    mutationFn: async (moduleId: string) => {
      toast.info(`Génération en cours...`);
      const { data, error } = await supabase.functions.invoke("academy-generate", { body: { action, module_id: moduleId, ...(action === "generate-quiz" ? { question_count: 5 } : {}) } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [invalidateKey, id] }); toast.success(successMsg); },
    onError: (e: any) => toast.error(e.message),
  });

  const genContent = makeMutation("generate-content", "Contenu généré", "admin-path-contents");
  const genQuiz = makeMutation("generate-quiz", "Quiz généré", "admin-path-quizzes");
  const genIllustrations = makeMutation("generate-illustrations", "Illustrations générées", "admin-path-contents");
  const genExercise = makeMutation("generate-exercise", "Exercice généré", "admin-path-exercises");
  const genPractice = makeMutation("generate-practice", "Pratique IA générée", "admin-path-practices");

  const batchGenerateAll = async () => {
    if (pathModules.length === 0) return;
    setBatchGenerating(true);
    const modules = pathModules.map((pm: any) => pm.academy_modules).filter(Boolean);
    const total = modules.length * 5;
    let current = 0;

    try {
      for (const mod of modules) {
        const invokeWithRetry = async (body: any, label: string) => {
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/academy-generate`;
              const session = (await supabase.auth.getSession()).data.session;
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 120000);
              const resp = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
                body: JSON.stringify(body),
                signal: controller.signal,
              });
              clearTimeout(timeout);
              if (!resp.ok) { const t = await resp.text(); console.error(`${label} error:`, t); if (attempt === 0 && resp.status >= 500) continue; }
              return;
            } catch (e: any) { console.error(`${label} attempt ${attempt + 1} error:`, e); if (attempt === 0) continue; }
          }
        };

        for (const [action, label] of [
          ["generate-content", "Contenu"], ["generate-quiz", "Quiz"], ["generate-illustrations", "Illustrations"],
          ["generate-exercise", "Exercice"], ["generate-practice", "Pratique IA"],
        ] as const) {
          current++;
          setBatchProgress({ current, total, step: `${label}: ${mod.title}` });
          await invokeWithRetry({ action, module_id: mod.id, ...(action === "generate-quiz" ? { question_count: 6 } : {}) }, label);
        }
      }

      for (const key of ["admin-path-contents", "admin-path-quizzes", "admin-path-exercises", "admin-path-practices"]) {
        qc.invalidateQueries({ queryKey: [key, id] });
      }
      toast.success("Génération complète terminée !");
    } catch (e: any) { toast.error(`Erreur batch: ${e.message}`); }
    finally { setBatchGenerating(false); setBatchProgress({ current: 0, total: 0, step: "" }); }
  };

  const updatePathInfo = useMutation({
    mutationFn: async () => {
      if (!infoForm) return;
      const { error } = await supabase.from("academy_paths").update({
        name: infoForm.name, description: infoForm.description, difficulty: infoForm.difficulty,
        estimated_hours: infoForm.estimated_hours, status: infoForm.status, certificate_enabled: infoForm.certificate_enabled,
        persona_id: infoForm.persona_id || null, function_id: infoForm.function_id || null,
        organization_id: infoForm.organization_id || null, tags: infoForm.tags,
      } as any).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-academy-path", id] }); toast.success("Parcours mis à jour"); },
    onError: (e: any) => toast.error(e.message),
  });

  const openCreateModule = () => { setEditModuleId(null); setModuleForm(emptyModule); setModuleOpen(true); };
  const openEditModule = (m: any) => {
    setEditModuleId(m.id);
    setModuleForm({ title: m.title, description: m.description || "", module_type: m.module_type, estimated_minutes: m.estimated_minutes || 30, status: m.status });
    setModuleOpen(true);
  };

  const initInfoForm = (p: any) => ({
    name: p.name, description: p.description || "", difficulty: p.difficulty || "intermediate",
    estimated_hours: p.estimated_hours || 0, status: p.status, certificate_enabled: p.certificate_enabled,
    persona_id: p.academy_personae?.id || "", function_id: p.academy_functions?.id || "",
    organization_id: p.organizations?.id || "", tags: Array.isArray(p.tags) ? p.tags as string[] : [],
  });

  if (path && !infoForm) setInfoForm(initInfoForm(path));

  // ─── Loading / Not found ────────────────────────────────────
  if (isLoading) {
    return (
      <AdminShell>
        <div className="p-6 animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-6 bg-muted rounded w-1/3" />
        </div>
      </AdminShell>
    );
  }

  if (!path) {
    return (
      <AdminShell>
        <div className="p-6 text-center text-muted-foreground">
          <p>Parcours introuvable.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/admin/academy/paths")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
        </div>
      </AdminShell>
    );
  }

  const diff = difficultyConfig[path.difficulty || "intermediate"] || difficultyConfig.intermediate;
  const funcData = (path as any).academy_functions;
  const personaData = (path as any).academy_personae;

  return (
    <AdminShell>
      <div className="space-y-0">
        {/* ═══ HERO HEADER ═══ */}
        <div className={`bg-gradient-to-br ${diff.gradient} border-b`}>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin/academy/paths")} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className={`h-5 w-5 ${diff.color}`} />
                  <h1 className="text-xl font-display font-bold truncate">{path.name}</h1>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{path.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={path.status === "published" ? "default" : "secondary"} className="text-xs">{path.status}</Badge>
                <Badge variant="outline" className={`text-xs ${diff.color}`}>{diff.label}</Badge>
                {path.certificate_enabled && (
                  <Badge variant="outline" className="text-xs text-amber-600">
                    <Award className="h-3 w-3 mr-1" /> Certificat
                  </Badge>
                )}
              </div>
            </div>

            {/* Targets */}
            <div className="flex items-center gap-4 text-xs">
              {funcData && (
                <button onClick={() => navigate(`/admin/academy/functions/${funcData.id}`)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 hover:bg-background/90 transition-colors">
                  <Target className="h-3 w-3 text-primary" />
                  <span className="font-medium">{funcData.name}</span>
                  {funcData.department && <span className="text-muted-foreground">({funcData.department})</span>}
                </button>
              )}
              {personaData && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60">
                  <Users className="h-3 w-3 text-primary" />
                  <span className="font-medium">{personaData.name}</span>
                </span>
              )}
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Modules", value: pathModules.length, icon: BookOpen },
                { label: "Contenu", value: `${modulesWithContent}/${moduleIds.length}`, icon: FileText },
                { label: "Quiz", value: `${modulesWithQuiz}/${moduleIds.length}`, icon: HelpCircle },
                { label: "Durée", value: `${totalDuration} min`, icon: Clock },
                { label: "Inscrits", value: enrollmentCount, icon: Users },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/70 backdrop-blur-sm">
                  <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-semibold">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ TABS ═══ */}
        <div className="p-6">
          <Tabs defaultValue="modules" className="space-y-6">
            <TabsList className="h-10">
              <TabsTrigger value="modules" className="gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Modules
              </TabsTrigger>
              <TabsTrigger value="info" className="gap-1.5">
                <Info className="h-3.5 w-3.5" /> Informations
              </TabsTrigger>
              <TabsTrigger value="enrollments" className="gap-1.5">
                <Users className="h-3.5 w-3.5" /> Inscriptions
                {enrollmentCount > 0 && <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">{enrollmentCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" /> Statistiques
              </TabsTrigger>
            </TabsList>

            <TabsContent value="modules">
              <PathModulesTab
                pathModules={pathModules} contents={contents} quizzes={quizzes}
                exercises={exercises} practices={practices} progress={progress}
                expandedModules={expandedModules} toggleModule={toggleModule}
                batchGenerating={batchGenerating} batchProgress={batchProgress}
                batchGenerateAll={batchGenerateAll}
                openCreateModule={openCreateModule} openEditModule={openEditModule}
                removeModule={removeModule}
                genContent={genContent} genQuiz={genQuiz} genIllustrations={genIllustrations}
                genExercise={genExercise} genPractice={genPractice}
              />
            </TabsContent>

            <TabsContent value="info">
              <PathInfoTab
                path={path} id={id!} isEditing={isEditing} setIsEditing={setIsEditing}
                infoForm={infoForm} setInfoForm={setInfoForm} updatePathInfo={updatePathInfo}
                personae={personae} functions={functions} organizations={organizations}
                tagInput={tagInput} setTagInput={setTagInput} initInfoForm={initInfoForm}
              />
            </TabsContent>

            <TabsContent value="enrollments">
              <PathEnrollmentsTab enrollments={enrollments} progress={progress} moduleIds={moduleIds} />
            </TabsContent>

            <TabsContent value="stats">
              <PathStatsTab enrollments={enrollments} enrollmentCount={enrollmentCount} pathModules={pathModules} progress={progress} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ═══ MODULE CREATE/EDIT DIALOG ═══ */}
      <Dialog open={moduleOpen} onOpenChange={setModuleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editModuleId ? "Modifier le module" : "Nouveau module"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Titre</Label>
              <Input value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="Ex: Introduction à l'IA générative" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={moduleForm.description} onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })} rows={3} placeholder="Objectifs et contenu du module..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={moduleForm.module_type} onValueChange={v => setModuleForm({ ...moduleForm, module_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson">📖 Leçon</SelectItem>
                    <SelectItem value="quiz">❓ Quiz</SelectItem>
                    <SelectItem value="exercise">💪 Exercice</SelectItem>
                    <SelectItem value="practice">🤖 Pratique IA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Durée (min)</Label>
                <Input type="number" min={0} value={moduleForm.estimated_minutes} onChange={e => setModuleForm({ ...moduleForm, estimated_minutes: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select value={moduleForm.status} onValueChange={v => setModuleForm({ ...moduleForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="published">Publié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {moduleForm.module_type && (
              <div className={`rounded-lg p-3 ${moduleTypeConfig[moduleForm.module_type]?.bg || ""}`}>
                <p className="text-xs font-medium flex items-center gap-1.5">
                  {(() => { const T = moduleTypeConfig[moduleForm.module_type]?.icon; return T ? <T className="h-3.5 w-3.5" /> : null; })()}
                  {moduleTypeConfig[moduleForm.module_type]?.label}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {moduleForm.module_type === "lesson" && "Contenu pédagogique en markdown avec sections"}
                  {moduleForm.module_type === "quiz" && "Questions à choix multiples avec score"}
                  {moduleForm.module_type === "exercise" && "Exercice pratique avec évaluation"}
                  {moduleForm.module_type === "practice" && "Conversation IA avec scénario et évaluation"}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModuleOpen(false)}>Annuler</Button>
              <Button onClick={() => editModuleId ? updateModule.mutate() : createModule.mutate()} disabled={!moduleForm.title || createModule.isPending || updateModule.isPending}>
                <Save className="h-4 w-4 mr-1" /> {editModuleId ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
