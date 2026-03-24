import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Plus, Trash2, Save, BookOpen, Pencil, Sparkles, Loader2,
  FileText, HelpCircle, ChevronDown, ChevronRight, Users, BarChart3,
  Clock, Award, Target, Bot, Dumbbell, GraduationCap, CheckCircle2,
  AlertTriangle, RefreshCw, Info, Eye, Lightbulb, Link2, ListOrdered,
  PenTool, Theater, Image, Zap
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
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";

const quizTypeConfig: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  mcq: { icon: HelpCircle, label: "QCM", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
  true_false: { icon: CheckCircle2, label: "Vrai / Faux", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  ordering: { icon: ListOrdered, label: "Ordonner", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
  matching: { icon: Link2, label: "Associer", color: "text-cyan-600", bg: "bg-cyan-100 dark:bg-cyan-900/30" },
  fill_blank: { icon: PenTool, label: "Compléter", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
  scenario: { icon: Theater, label: "Scénario", color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-900/30" },
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

const difficultyConfig: Record<string, { gradient: string; label: string; color: string }> = {
  beginner: { gradient: "from-emerald-500/20 to-teal-500/10", label: "Débutant", color: "text-emerald-600" },
  intermediate: { gradient: "from-blue-500/20 to-indigo-500/10", label: "Intermédiaire", color: "text-blue-600" },
  advanced: { gradient: "from-purple-500/20 to-pink-500/10", label: "Avancé", color: "text-purple-600" },
};

const moduleTypeConfig: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  lesson: { icon: BookOpen, label: "Leçon", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
  quiz: { icon: HelpCircle, label: "Quiz", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
  exercise: { icon: Dumbbell, label: "Exercice", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  practice: { icon: Bot, label: "Pratique IA", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
};

export default function AdminAcademyPathDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [moduleOpen, setModuleOpen] = useState(false);
  const [editModuleId, setEditModuleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleForm>(emptyModule);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState<any>(null);

  // ─── Queries ────────────────────────────────────────────────
  const { data: path, isLoading } = useQuery({
    queryKey: ["admin-academy-path", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_paths")
        .select("*, academy_personae!academy_paths_persona_id_fkey(id, name), academy_functions!academy_paths_function_id_fkey(id, name, department)")
        .eq("id", id!)
        .maybeSingle();
      if (error) {
        console.error("PathDetail query error:", error);
        throw error;
      }
      console.log("PathDetail data:", data);
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
      const { data, error } = await supabase
        .from("academy_contents")
        .select("*")
        .in("module_id", moduleIds)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ["admin-path-quizzes", id],
    enabled: moduleIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_quizzes")
        .select("*, academy_quiz_questions(*)")
        .in("module_id", moduleIds)
        .order("sort_order", { referencedTable: "academy_quiz_questions" });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: enrollmentCount = 0 } = useQuery({
    queryKey: ["admin-path-enrollment-count", id],
    enabled: !!id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("academy_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("path_id", id!);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["admin-path-enrollments", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_enrollments")
        .select("*")
        .eq("path_id", id!)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["admin-path-progress", id],
    enabled: moduleIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_progress")
        .select("*")
        .in("module_id", moduleIds);
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

  // ─── Helpers ────────────────────────────────────────────────
  const getModuleContents = (moduleId: string) => contents.filter((c: any) => c.module_id === moduleId);
  const getModuleQuiz = (moduleId: string) => quizzes.find((q: any) => q.module_id === moduleId);
  const getModuleProgress = (moduleId: string) => progress.filter((p: any) => p.module_id === moduleId);

  const modulesWithContent = moduleIds.filter((mid: string) => contents.some((c: any) => c.module_id === mid)).length;
  const modulesWithQuiz = moduleIds.filter((mid: string) => quizzes.some((q: any) => q.module_id === mid)).length;
  const totalDuration = pathModules.reduce((sum: number, pm: any) => sum + (pm.academy_modules?.estimated_minutes || 0), 0);
  const completedProgress = progress.filter((p: any) => p.status === "completed");
  const avgScore = completedProgress.length > 0
    ? Math.round(completedProgress.reduce((s: number, p: any) => s + (p.score || 0), 0) / completedProgress.length)
    : 0;

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  // ─── Mutations ──────────────────────────────────────────────
  const createModule = useMutation({
    mutationFn: async () => {
      const { data: mod, error: modErr } = await supabase
        .from("academy_modules")
        .insert({
          title: moduleForm.title,
          description: moduleForm.description,
          module_type: moduleForm.module_type,
          estimated_minutes: moduleForm.estimated_minutes,
          status: moduleForm.status,
          generation_mode: "manual",
        })
        .select("id")
        .single();
      if (modErr) throw modErr;
      const { error: linkErr } = await supabase
        .from("academy_path_modules")
        .insert({ path_id: id!, module_id: mod.id, sort_order: pathModules.length });
      if (linkErr) throw linkErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-path-modules", id] });
      toast.success("Module créé");
      setModuleOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateModule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("academy_modules")
        .update({
          title: moduleForm.title,
          description: moduleForm.description,
          module_type: moduleForm.module_type,
          estimated_minutes: moduleForm.estimated_minutes,
          status: moduleForm.status,
        })
        .eq("id", editModuleId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-path-modules", id] });
      toast.success("Module mis à jour");
      setModuleOpen(false);
      setEditModuleId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeModule = useMutation({
    mutationFn: async (pmId: string) => {
      const { error } = await supabase.from("academy_path_modules").delete().eq("id", pmId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-path-modules", id] });
      toast.success("Module retiré");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const genContent = useMutation({
    mutationFn: async (moduleId: string) => {
      toast.info("Génération du contenu...");
      const { data, error } = await supabase.functions.invoke("academy-generate", {
        body: { action: "generate-content", module_id: moduleId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-path-contents", id] });
      toast.success(`${data.section_count} sections générées`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const genQuiz = useMutation({
    mutationFn: async (moduleId: string) => {
      toast.info("Génération du quiz...");
      const { data, error } = await supabase.functions.invoke("academy-generate", {
        body: { action: "generate-quiz", module_id: moduleId, question_count: 5 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-path-quizzes", id] });
      toast.success(`Quiz généré (${data.question_count} questions)`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const genIllustrations = useMutation({
    mutationFn: async (moduleId: string) => {
      toast.info("Génération des illustrations...");
      const { data, error } = await supabase.functions.invoke("academy-generate", {
        body: { action: "generate-illustrations", module_id: moduleId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-path-contents", id] });
      toast.success(`${data.illustration_count} illustration(s) générée(s)`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, step: "" });

  const batchGenerateAll = async () => {
    if (pathModules.length === 0) return;
    setBatchGenerating(true);
    const modules = pathModules.map((pm: any) => pm.academy_modules).filter(Boolean);
    const total = modules.length * 3; // content + quiz + illustrations per module
    let current = 0;

    try {
      for (const mod of modules) {
        // Generate content
        current++;
        setBatchProgress({ current, total, step: `Contenu: ${mod.title}` });
        try {
          await supabase.functions.invoke("academy-generate", {
            body: { action: "generate-content", module_id: mod.id },
          });
        } catch (e: any) { console.error("Content gen error:", e); }

        // Generate quiz
        current++;
        setBatchProgress({ current, total, step: `Quiz: ${mod.title}` });
        try {
          await supabase.functions.invoke("academy-generate", {
            body: { action: "generate-quiz", module_id: mod.id, question_count: 6 },
          });
        } catch (e: any) { console.error("Quiz gen error:", e); }

        // Generate illustrations
        current++;
        setBatchProgress({ current, total, step: `Illustrations: ${mod.title}` });
        try {
          await supabase.functions.invoke("academy-generate", {
            body: { action: "generate-illustrations", module_id: mod.id },
          });
        } catch (e: any) { console.error("Illustration gen error:", e); }
      }

      qc.invalidateQueries({ queryKey: ["admin-path-contents", id] });
      qc.invalidateQueries({ queryKey: ["admin-path-quizzes", id] });
      toast.success("Génération complète terminée !");
    } catch (e: any) {
      toast.error(`Erreur batch: ${e.message}`);
    } finally {
      setBatchGenerating(false);
      setBatchProgress({ current: 0, total: 0, step: "" });
    }
  };

  const updatePathInfo = useMutation({
    mutationFn: async () => {
      if (!infoForm) return;
      const { error } = await supabase.from("academy_paths").update({
        name: infoForm.name,
        description: infoForm.description,
        difficulty: infoForm.difficulty,
        estimated_hours: infoForm.estimated_hours,
        status: infoForm.status,
        certificate_enabled: infoForm.certificate_enabled,
        persona_id: infoForm.persona_id || null,
        function_id: infoForm.function_id || null,
      }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-path", id] });
      toast.success("Parcours mis à jour");
      setEditingInfo(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openCreateModule() {
    setEditModuleId(null);
    setModuleForm(emptyModule);
    setModuleOpen(true);
  }

  function openEditModule(m: any) {
    setEditModuleId(m.id);
    setModuleForm({
      title: m.title,
      description: m.description || "",
      module_type: m.module_type,
      estimated_minutes: m.estimated_minutes || 30,
      status: m.status,
    });
    setModuleOpen(true);
  }

  function startEditInfo() {
    if (!path) return;
    setInfoForm({
      name: path.name,
      description: path.description || "",
      difficulty: path.difficulty || "intermediate",
      estimated_hours: path.estimated_hours || 0,
      status: path.status,
      certificate_enabled: path.certificate_enabled,
      persona_id: (path as any).academy_personae?.id || "",
      function_id: (path as any).academy_functions?.id || "",
    });
    setEditingInfo(true);
  }

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
                <Badge variant={path.status === "published" ? "default" : "secondary"} className="text-xs">
                  {path.status}
                </Badge>
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
                <button
                  onClick={() => navigate(`/admin/academy/functions/${funcData.id}`)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 hover:bg-background/90 transition-colors"
                >
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

            {/* ═══ TAB: MODULES (TIMELINE) ═══ */}
            <TabsContent value="modules" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Parcours pédagogique</h2>
                <div className="flex items-center gap-2">
                  {pathModules.length > 0 && (
                    <Button size="sm" variant="outline" onClick={batchGenerateAll} disabled={batchGenerating}
                      className="border-primary/30 text-primary">
                      {batchGenerating ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> {batchProgress.step} ({batchProgress.current}/{batchProgress.total})</>
                      ) : (
                        <><Zap className="h-3.5 w-3.5 mr-1" /> Tout générer (contenu + quiz + illustrations)</>
                      )}
                    </Button>
                  )}
                  <Button size="sm" onClick={openCreateModule}>
                    <Plus className="h-4 w-4 mr-1" /> Ajouter un module
                  </Button>
                </div>
              </div>
              {batchGenerating && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">{batchProgress.step}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{batchProgress.current}/{batchProgress.total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0}%` }} />
                  </div>
                </div>
              )}

              {pathModules.length === 0 ? (
                <Card className="border-dashed border-2">
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Aucun module dans ce parcours</p>
                    <p className="text-xs mt-1">Ajoutez des modules pour structurer la formation</p>
                    <Button size="sm" className="mt-4" onClick={openCreateModule}>
                      <Plus className="h-4 w-4 mr-1" /> Premier module
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="relative">
                  {/* Timeline connector line */}
                  <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-border" />

                  <div className="space-y-3">
                    {pathModules.map((pm: any, idx: number) => {
                      const mod = pm.academy_modules;
                      if (!mod) return null;
                      const typeConf = moduleTypeConfig[mod.module_type] || moduleTypeConfig.lesson;
                      const TypeIcon = typeConf.icon;
                      const modContents = getModuleContents(mod.id);
                      const modQuiz = getModuleQuiz(mod.id);
                      const modProgress = getModuleProgress(mod.id);
                      const isExpanded = expandedModules.has(mod.id);
                      const hasContent = modContents.length > 0;
                      const questionCount = modQuiz?.academy_quiz_questions?.length || 0;
                      const completedCount = modProgress.filter((p: any) => p.status === "completed").length;

                      return (
                        <Collapsible key={pm.id} open={isExpanded} onOpenChange={() => toggleModule(mod.id)}>
                          <div className="relative pl-12">
                            {/* Timeline dot */}
                            <div className={`absolute left-0 top-4 z-10 flex h-[46px] w-[46px] items-center justify-center rounded-xl ${typeConf.bg} border-2 border-background shadow-sm`}>
                              <TypeIcon className={`h-5 w-5 ${typeConf.color}`} />
                            </div>

                            <Card className={`transition-all ${isExpanded ? "shadow-md ring-1 ring-primary/20" : "hover:shadow-sm"}`}>
                              <CollapsibleTrigger asChild>
                                <CardContent className="p-4 cursor-pointer">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-muted-foreground">MODULE {idx + 1}</span>
                                        <Badge variant="outline" className="text-[10px]">{typeConf.label}</Badge>
                                        <Badge variant={mod.status === "published" ? "default" : "secondary"} className="text-[10px]">{mod.status}</Badge>
                                        {mod.estimated_minutes && (
                                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                            <Clock className="h-2.5 w-2.5" /> {mod.estimated_minutes} min
                                          </span>
                                        )}
                                      </div>
                                      <p className="font-medium text-sm">{mod.title}</p>
                                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{mod.description}</p>

                                      {/* Content indicators */}
                                      <div className="flex items-center gap-3 mt-2">
                                        {hasContent ? (
                                          <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Contenu ({modContents.length} sections)
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-amber-600 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> Pas de contenu
                                          </span>
                                        )}
                                        {questionCount > 0 ? (
                                          <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Quiz ({questionCount} questions)
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-muted-foreground">— Pas de quiz</span>
                                        )}
                                        {completedCount > 0 && (
                                          <span className="text-[10px] text-muted-foreground">
                                            {completedCount} complété{completedCount > 1 ? "s" : ""}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                    </div>
                                  </div>
                                </CardContent>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <Separator />
                                <CardContent className="p-4 space-y-4 bg-muted/30">
                                  {/* Actions */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); genContent.mutate(mod.id); }}
                                      disabled={genContent.isPending}>
                                      {genContent.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                                      {hasContent ? "Régénérer contenu" : "Générer contenu"}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); genQuiz.mutate(mod.id); }}
                                      disabled={genQuiz.isPending}>
                                      {genQuiz.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <HelpCircle className="h-3.5 w-3.5 mr-1" />}
                                      {questionCount > 0 ? "Régénérer quiz" : "Générer quiz"}
                                    </Button>
                                    {hasContent && (
                                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); genIllustrations.mutate(mod.id); }}
                                        disabled={genIllustrations.isPending}>
                                        {genIllustrations.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Image className="h-3.5 w-3.5 mr-1" />}
                                        Illustrations
                                      </Button>
                                    )}
                                    <div className="flex-1" />
                                    <Button size="sm" variant="ghost" onClick={() => openEditModule(mod)}>
                                      <Pencil className="h-3.5 w-3.5 mr-1" /> Éditer
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeModule.mutate(pm.id)}>
                                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Retirer
                                    </Button>
                                  </div>

                                  {/* Content preview */}
                                  {hasContent && (
                                    <div className="space-y-3">
                                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contenu du module</h4>
                                      {modContents.map((c: any, ci: number) => {
                                        const contentId = `content-${c.id}`;
                                        const isFullView = expandedModules.has(contentId);
                                        return (
                                          <div key={c.id} className="rounded-xl border bg-background overflow-hidden">
                                            <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/30">
                                              <Badge variant="outline" className="text-[10px]">Section {ci + 1}</Badge>
                                              <Badge variant="outline" className="text-[10px]">{c.content_type}</Badge>
                                              <span className="text-[10px] text-muted-foreground ml-auto">{(c.body?.length || 0).toLocaleString()} car.</span>
                                            </div>
                                            <div className={`p-4 ${!isFullView ? "max-h-96 overflow-y-auto" : ""}`}>
                                              <EnrichedMarkdown content={c.body || ""} />
                                            </div>
                                            {c.body?.length > 500 && (
                                              <button
                                                onClick={(e) => { e.stopPropagation(); toggleModule(contentId); }}
                                                className="w-full text-center py-2 border-t text-xs text-primary hover:bg-muted/30 transition-colors font-medium"
                                              >
                                                {isFullView ? "Réduire ↑" : "Voir tout le contenu ↓"}
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Quiz preview enrichi */}
                                  {modQuiz && questionCount > 0 && (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quiz — {modQuiz.title}</h4>
                                        <Badge variant="secondary" className="text-[10px]">{questionCount} questions</Badge>
                                        <Badge variant="outline" className="text-[10px]">Seuil : {modQuiz.passing_score}%</Badge>
                                      </div>
                                      <div className="space-y-2">
                                        {(modQuiz.academy_quiz_questions || []).map((q: any, qi: number) => {
                                          const qType = quizTypeConfig[q.question_type] || quizTypeConfig.mcq;
                                          const QIcon = qType.icon;
                                          const questionExpandId = `quiz-q-${q.id}`;
                                          const isQExpanded = expandedModules.has(questionExpandId);
                                          const options = q.options || {};
                                          const correctAnswer = q.correct_answer;
                                          const hint = typeof options === "object" && options.hint ? options.hint : null;

                                          return (
                                            <div key={q.id} className="rounded-xl border bg-background overflow-hidden">
                                              <button
                                                onClick={(e) => { e.stopPropagation(); toggleModule(questionExpandId); }}
                                                className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/20 transition-colors"
                                              >
                                                <div className={`flex items-center justify-center h-7 w-7 rounded-lg shrink-0 ${qType.bg}`}>
                                                  <QIcon className={`h-3.5 w-3.5 ${qType.color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[10px] font-bold text-muted-foreground">Q{qi + 1}</span>
                                                    <Badge className={`text-[9px] px-1.5 py-0 ${qType.bg} ${qType.color} border-0`}>{qType.label}</Badge>
                                                    <span className="text-[10px] text-muted-foreground">{q.points || 1} pt{(q.points || 1) > 1 ? "s" : ""}</span>
                                                  </div>
                                                  <p className="text-xs font-medium line-clamp-2">{q.question}</p>
                                                </div>
                                                {isQExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />}
                                              </button>

                                              {isQExpanded && (
                                                <div className="px-4 pb-4 pt-1 border-t space-y-3 bg-muted/10">
                                                  {/* Options display by type */}
                                                  {(q.question_type === "mcq" || q.question_type === "true_false") && Array.isArray(options.choices || options) && (
                                                    <div className="space-y-1.5">
                                                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Options</p>
                                                      {(options.choices || options).map((opt: any, oi: number) => {
                                                        const optLabel = typeof opt === "string" ? opt : opt.label || opt.text || JSON.stringify(opt);
                                                        const isCorrect = Array.isArray(correctAnswer) ? correctAnswer.includes(oi) || correctAnswer.includes(optLabel) : correctAnswer === oi || correctAnswer === optLabel || correctAnswer === opt;
                                                        return (
                                                          <div key={oi} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs border ${isCorrect ? "border-emerald-500/50 bg-emerald-500/10" : "border-transparent bg-muted/30"}`}>
                                                            {isCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                                                            <span className={isCorrect ? "font-medium" : ""}>{optLabel}</span>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  )}

                                                  {q.question_type === "ordering" && Array.isArray(options.items || options) && (
                                                    <div className="space-y-1.5">
                                                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Ordre correct</p>
                                                      {(Array.isArray(correctAnswer) ? correctAnswer : options.items || options).map((item: any, oi: number) => (
                                                        <div key={oi} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs border bg-muted/20">
                                                          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{oi + 1}</span>
                                                          <span>{typeof item === "string" ? item : item.label || JSON.stringify(item)}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}

                                                  {q.question_type === "matching" && (
                                                    <div className="space-y-1.5">
                                                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Paires</p>
                                                      {(Array.isArray(correctAnswer) ? correctAnswer : options.pairs || []).map((pair: any, pi: number) => (
                                                        <div key={pi} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs border bg-muted/20">
                                                          <span className="font-medium">{pair.left || pair[0]}</span>
                                                          <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                                                          <span>{pair.right || pair[1]}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}

                                                  {q.question_type === "fill_blank" && (
                                                    <div className="space-y-1.5">
                                                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Réponse attendue</p>
                                                      <div className="rounded-lg px-3 py-2 text-xs border bg-emerald-500/10 border-emerald-500/50 font-medium">
                                                        {Array.isArray(correctAnswer) ? correctAnswer.join(" / ") : String(correctAnswer)}
                                                      </div>
                                                    </div>
                                                  )}

                                                  {q.question_type === "scenario" && (
                                                    <div className="space-y-1.5">
                                                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Scénario</p>
                                                      {options.context && <p className="text-xs text-muted-foreground italic rounded-lg bg-muted/30 p-3">{options.context}</p>}
                                                      {Array.isArray(options.choices) && options.choices.map((opt: any, oi: number) => {
                                                        const optLabel = typeof opt === "string" ? opt : opt.label || opt.text || JSON.stringify(opt);
                                                        const isCorrect = correctAnswer === oi || correctAnswer === optLabel;
                                                        return (
                                                          <div key={oi} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs border ${isCorrect ? "border-emerald-500/50 bg-emerald-500/10" : "border-transparent bg-muted/30"}`}>
                                                            {isCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                                                            <span className={isCorrect ? "font-medium" : ""}>{optLabel}</span>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  )}

                                                  {/* Hint */}
                                                  {hint && (
                                                    <div className="flex items-start gap-2 rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
                                                      <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                                      <p className="text-xs text-amber-700 dark:text-amber-400">{hint}</p>
                                                    </div>
                                                  )}

                                                  {/* Explanation */}
                                                  {q.explanation && (
                                                    <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                                                      <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">Explication</p>
                                                      <p className="text-xs text-blue-700 dark:text-blue-300">{q.explanation}</p>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {!hasContent && questionCount === 0 && (
                                    <div className="text-center py-6 text-muted-foreground">
                                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                      <p className="text-xs">Aucun contenu généré. Utilisez les boutons ci-dessus pour générer le contenu et/ou le quiz.</p>
                                    </div>
                                  )}
                                </CardContent>
                              </CollapsibleContent>
                            </Card>
                          </div>
                        </Collapsible>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ═══ TAB: INFORMATIONS ═══ */}
            <TabsContent value="info" className="space-y-4">
              {!editingInfo ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Détails du parcours</h2>
                    <Button size="sm" variant="outline" onClick={startEditInfo}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Modifier
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card><CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Nom</p>
                      <p className="text-sm font-medium">{path.name}</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Difficulté</p>
                      <p className={`text-sm font-medium ${diff.color}`}>{diff.label}</p>
                    </CardContent></Card>
                    <Card className="sm:col-span-2"><CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{path.description || "—"}</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Fonction cible</p>
                      <p className="text-sm font-medium">{funcData?.name || "—"}</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Persona cible</p>
                      <p className="text-sm font-medium">{personaData?.name || "—"}</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Durée estimée</p>
                      <p className="text-sm font-medium">{path.estimated_hours || 0}h</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Certificat</p>
                      <p className="text-sm font-medium">{path.certificate_enabled ? "Activé" : "Désactivé"}</p>
                    </CardContent></Card>
                  </div>
                </div>
              ) : infoForm && (
                <div className="space-y-4 max-w-2xl">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Modifier le parcours</h2>
                  <div className="space-y-1.5">
                    <Label>Nom</Label>
                    <Input value={infoForm.name} onChange={e => setInfoForm({ ...infoForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea value={infoForm.description} onChange={e => setInfoForm({ ...infoForm, description: e.target.value })} rows={4} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Difficulté</Label>
                      <Select value={infoForm.difficulty} onValueChange={v => setInfoForm({ ...infoForm, difficulty: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Débutant</SelectItem>
                          <SelectItem value="intermediate">Intermédiaire</SelectItem>
                          <SelectItem value="advanced">Avancé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Durée estimée (heures)</Label>
                      <Input type="number" min={0} value={infoForm.estimated_hours} onChange={e => setInfoForm({ ...infoForm, estimated_hours: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Fonction cible</Label>
                      <Select value={infoForm.function_id || "none"} onValueChange={v => setInfoForm({ ...infoForm, function_id: v === "none" ? "" : v })}>
                        <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucune</SelectItem>
                          {functions.map((f: any) => (
                            <SelectItem key={f.id} value={f.id}>{f.name}{f.department ? ` (${f.department})` : ""}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Persona cible</Label>
                      <Select value={infoForm.persona_id || "none"} onValueChange={v => setInfoForm({ ...infoForm, persona_id: v === "none" ? "" : v })}>
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
                  <div className="space-y-1.5">
                    <Label>Statut</Label>
                    <Select value={infoForm.status} onValueChange={v => setInfoForm({ ...infoForm, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="published">Publié</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Certificat activé</Label>
                    <Switch checked={infoForm.certificate_enabled} onCheckedChange={v => setInfoForm({ ...infoForm, certificate_enabled: v })} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-background py-3 border-t">
                    <Button variant="outline" onClick={() => setEditingInfo(false)}>Annuler</Button>
                    <Button onClick={() => updatePathInfo.mutate()} disabled={updatePathInfo.isPending}>
                      <Save className="h-4 w-4 mr-1" /> Enregistrer
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ═══ TAB: INSCRIPTIONS ═══ */}
            <TabsContent value="enrollments" className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Inscriptions ({enrollments.length})
              </h2>
              {enrollments.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center text-muted-foreground text-sm">
                    Aucune inscription pour ce parcours.
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Utilisateur</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Statut</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Complété le</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollments.map((e: any) => (
                            <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="p-3 text-xs font-mono">{e.user_id.slice(0, 8)}...</td>
                              <td className="p-3 text-xs">{new Date(e.enrolled_at).toLocaleDateString("fr-FR")}</td>
                              <td className="p-3">
                                <Badge variant={e.status === "completed" ? "default" : "secondary"} className="text-[10px]">{e.status}</Badge>
                              </td>
                              <td className="p-3 text-xs">{e.completed_at ? new Date(e.completed_at).toLocaleDateString("fr-FR") : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ═══ TAB: STATISTIQUES ═══ */}
            <TabsContent value="stats" className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Statistiques</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-5 text-center">
                    <p className="text-3xl font-bold text-primary">
                      {enrollmentCount > 0 ? Math.round((enrollments.filter((e: any) => e.status === "completed").length / enrollmentCount) * 100) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Taux de complétion</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 text-center">
                    <p className="text-3xl font-bold text-primary">{avgScore}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Score moyen</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 text-center">
                    <p className="text-3xl font-bold text-primary">
                      {completedProgress.length > 0
                        ? Math.round(completedProgress.reduce((s: number, p: any) => s + (p.time_spent_seconds || 0), 0) / completedProgress.length / 60)
                        : 0} min
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Temps moyen par module</p>
                  </CardContent>
                </Card>
              </div>

              {/* Per-module breakdown */}
              {pathModules.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 text-xs font-medium text-muted-foreground">Module</th>
                          <th className="text-center p-3 text-xs font-medium text-muted-foreground">Complétés</th>
                          <th className="text-center p-3 text-xs font-medium text-muted-foreground">Score moy.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pathModules.map((pm: any) => {
                          const mod = pm.academy_modules;
                          if (!mod) return null;
                          const mp = getModuleProgress(mod.id);
                          const mc = mp.filter((p: any) => p.status === "completed");
                          const ms = mc.length > 0 ? Math.round(mc.reduce((s: number, p: any) => s + (p.score || 0), 0) / mc.length) : 0;
                          return (
                            <tr key={pm.id} className="border-b last:border-0">
                              <td className="p-3 text-xs font-medium">{mod.title}</td>
                              <td className="p-3 text-xs text-center">{mc.length}</td>
                              <td className="p-3 text-xs text-center">{mc.length > 0 ? `${ms}%` : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
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

            {/* Type preview */}
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
              <Button
                onClick={() => editModuleId ? updateModule.mutate() : createModule.mutate()}
                disabled={!moduleForm.title || createModule.isPending || updateModule.isPending}
              >
                <Save className="h-4 w-4 mr-1" /> {editModuleId ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
