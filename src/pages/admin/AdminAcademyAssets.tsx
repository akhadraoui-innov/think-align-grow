import { useState, useMemo, Fragment } from "react";
import { VersionHistory } from "@/components/admin/VersionHistory";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Search, Copy, Pencil, Library, HelpCircle, Dumbbell, MessageSquare, ChevronRight, Sparkles, BookOpen, AlertCircle, X, Plus, TrendingUp, Clock, History, ChevronDown, Play } from "lucide-react";
import { PracticeTestDialog } from "@/components/admin/PracticeTestDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ───
type OrgInfo = { id: string; name: string };

type AssetContext = {
  moduleTitle: string;
  moduleId: string;
  pathName: string | null;
  orgName: string | null;
  orgId: string | null;
};

type Filters = {
  search: string;
  orgFilter: string;
  pathFilter: string;
  difficultyFilter: string;
  modeFilter: string;
  tagFilter: string;
};

type ActiveTab = "quizzes" | "exercises" | "practices";

type AssetStats = Record<string, { attempts: number; completed: number; avgScore: number | null }>;

// ─── Helpers ───
function extractContext(mod: any): AssetContext {
  const moduleTitle = mod?.title ?? "—";
  const moduleId = mod?.id ?? "";
  const pm = mod?.academy_path_modules;
  const firstPath = Array.isArray(pm) && pm.length > 0 ? pm[0]?.academy_paths : null;
  return {
    moduleTitle,
    moduleId,
    pathName: firstPath?.name ?? null,
    orgName: firstPath?.organizations?.name ?? null,
    orgId: firstPath?.organization_id ?? null,
  };
}

function isNewAsset(createdAt: string): boolean {
  const created = new Date(createdAt);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return created > sevenDaysAgo;
}

function applyFilters(items: any[], filters: Filters, activeTab: ActiveTab) {
  return items.filter((item: any) => {
    const ctx = extractContext(item.academy_modules);
    const s = filters.search.toLowerCase();
    const matchSearch = !s || 
      item.title?.toLowerCase().includes(s) || 
      ctx.moduleTitle.toLowerCase().includes(s) ||
      item.description?.toLowerCase().includes(s) ||
      item.instructions?.toLowerCase().includes(s) ||
      item.scenario?.toLowerCase().includes(s) ||
      (Array.isArray(item.academy_quiz_questions) && item.academy_quiz_questions.some((q: any) => q.question?.toLowerCase().includes(s)));
    const matchOrg = filters.orgFilter === "all" || (filters.orgFilter === "public" ? !ctx.orgId : ctx.orgId === filters.orgFilter);
    const matchPath = filters.pathFilter === "all" || ctx.pathName === filters.pathFilter;
    const matchDifficulty = activeTab !== "practices" || filters.difficultyFilter === "all" || item.difficulty === filters.difficultyFilter;
    const matchMode = filters.modeFilter === "all" || item.generation_mode === filters.modeFilter;
    const matchTags = filters.tagFilter === "all" || (Array.isArray(item.tags) && item.tags.includes(filters.tagFilter));
    return matchSearch && matchOrg && matchPath && matchDifficulty && matchMode && matchTags;
  });
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  intermediate: "bg-blue-500/10 text-blue-700 border-blue-200",
  advanced: "bg-orange-500/10 text-orange-700 border-orange-200",
  expert: "bg-red-500/10 text-red-700 border-red-200",
};

// ─── Hooks ───
function useOrganizations() {
  return useQuery({
    queryKey: ["admin-orgs-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("id, name").order("name");
      if (error) throw error;
      return (data ?? []) as OrgInfo[];
    },
  });
}

function useModulesForDuplicate() {
  return useQuery({
    queryKey: ["admin-modules-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_modules").select("id, title").order("title");
      if (error) throw error;
      return data ?? [];
    },
  });
}

const MODULE_SELECT = "*, academy_modules!inner(id, title, academy_path_modules(academy_paths(name, organization_id, organizations(name))))";

function useQuizzes() {
  return useQuery({
    queryKey: ["admin-asset-quizzes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_quizzes")
        .select(`${MODULE_SELECT}, academy_quiz_questions(id, question)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useExercises() {
  return useQuery({
    queryKey: ["admin-asset-exercises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_exercises")
        .select(MODULE_SELECT)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function usePractices() {
  return useQuery({
    queryKey: ["admin-asset-practices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_practices")
        .select(MODULE_SELECT)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useAssetStats(): { data: AssetStats; isLoading: boolean } {
  const query = useQuery({
    queryKey: ["admin-asset-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_progress")
        .select("module_id, status, score");
      if (error) throw error;
      const stats: AssetStats = {};
      (data ?? []).forEach((row: any) => {
        if (!stats[row.module_id]) {
          stats[row.module_id] = { attempts: 0, completed: 0, avgScore: null };
        }
        const s = stats[row.module_id];
        s.attempts++;
        if (row.status === "completed") s.completed++;
        if (row.score != null) {
          s.avgScore = s.avgScore == null ? row.score : (s.avgScore * (s.attempts - 1) + row.score) / s.attempts;
        }
      });
      return stats;
    },
    staleTime: 60_000,
  });
  return { data: query.data ?? {}, isLoading: query.isLoading };
}

// ─── Tag editing hook ───
function useUpdateTags(table: "academy_quizzes" | "academy_exercises" | "academy_practices", queryKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const { error } = await supabase.from(table).update({ tags } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
    onError: (e: any) => toast.error(e.message),
  });
}

// ─── Version history (shared component) ───
// Re-exported from shared component for backward compat

// ─── Filter bar ───
function FilterBar({
  filters, setFilter, orgs, paths, showDifficulty, allTags,
}: {
  filters: Filters;
  setFilter: (key: keyof Filters, val: string) => void;
  orgs: OrgInfo[];
  paths: string[];
  showDifficulty: boolean;
  allTags: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher dans titres, contenus…" value={filters.search} onChange={e => setFilter("search", e.target.value)} className="pl-9" />
      </div>
      <Select value={filters.orgFilter} onValueChange={v => setFilter("orgFilter", v)}>
        <SelectTrigger className="w-[200px]"><SelectValue placeholder="Organisation" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les orgs</SelectItem>
          <SelectItem value="public">Public uniquement</SelectItem>
          {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.pathFilter} onValueChange={v => setFilter("pathFilter", v)}>
        <SelectTrigger className="w-[200px]"><SelectValue placeholder="Parcours" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les parcours</SelectItem>
          {paths.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
        </SelectContent>
      </Select>
      {showDifficulty && (
        <Select value={filters.difficultyFilter} onValueChange={v => setFilter("difficultyFilter", v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Difficulté" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toute difficulté</SelectItem>
            <SelectItem value="beginner">Débutant</SelectItem>
            <SelectItem value="intermediate">Intermédiaire</SelectItem>
            <SelectItem value="advanced">Avancé</SelectItem>
            <SelectItem value="expert">Expert</SelectItem>
          </SelectContent>
        </Select>
      )}
      <Select value={filters.modeFilter} onValueChange={v => setFilter("modeFilter", v)}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Mode" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les modes</SelectItem>
          <SelectItem value="ai">IA</SelectItem>
          <SelectItem value="manual">Manuel</SelectItem>
        </SelectContent>
      </Select>
      {allTags.length > 0 && (
        <Select value={filters.tagFilter} onValueChange={v => setFilter("tagFilter", v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tag" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les tags</SelectItem>
            {allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

// ─── Shared components ───
function OrgBadge({ orgName }: { orgName: string | null }) {
  return orgName
    ? <Badge variant="outline">{orgName}</Badge>
    : <Badge variant="secondary">Public</Badge>;
}

function DifficultyBadge({ difficulty }: { difficulty: string | null }) {
  if (!difficulty) return <span className="text-muted-foreground">—</span>;
  return <Badge variant="outline" className={cn("text-xs", DIFFICULTY_COLORS[difficulty])}>{difficulty}</Badge>;
}

function ModeBadge({ mode }: { mode: string }) {
  return mode === "ai"
    ? <Badge variant="outline" className="gap-1 text-xs"><Sparkles className="h-3 w-3" />IA</Badge>
    : <Badge variant="outline" className="gap-1 text-xs"><BookOpen className="h-3 w-3" />Manuel</Badge>;
}

function StatusBadges({ createdAt, stats }: { createdAt: string; stats?: { attempts: number } }) {
  return (
    <div className="flex gap-1">
      {isNewAsset(createdAt) && (
        <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0">
          <Clock className="h-2.5 w-2.5 mr-0.5" />Nouveau
        </Badge>
      )}
      {stats && stats.attempts > 10 && (
        <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0">
          <TrendingUp className="h-2.5 w-2.5 mr-0.5" />Populaire
        </Badge>
      )}
    </div>
  );
}

function StatsSection({ stats }: { stats?: { attempts: number; completed: number; avgScore: number | null } }) {
  if (!stats || stats.attempts === 0) return <p className="text-xs text-muted-foreground">Aucune donnée d'utilisation</p>;
  const completionRate = stats.attempts > 0 ? Math.round((stats.completed / stats.attempts) * 100) : 0;
  return (
    <div className="flex gap-6 text-xs">
      <span><strong>Tentatives :</strong> {stats.attempts}</span>
      <span><strong>Complétion :</strong> {completionRate}%</span>
      {stats.avgScore != null && <span><strong>Score moyen :</strong> {Math.round(stats.avgScore)}%</span>}
    </div>
  );
}

function InlineTagEditor({ tags, onUpdate, isPending }: { tags: string[]; onUpdate: (tags: string[]) => void; isPending: boolean }) {
  const [newTag, setNewTag] = useState("");
  const addTag = () => {
    const t = newTag.trim();
    if (t && !tags.includes(t)) {
      onUpdate([...tags, t]);
      setNewTag("");
    }
  };
  const removeTag = (tag: string) => onUpdate(tags.filter(t => t !== tag));

  return (
    <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
      <p className="text-xs font-semibold text-muted-foreground">Tags</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="gap-1 text-xs pr-1">
            {tag}
            <button onClick={() => removeTag(tag)} disabled={isPending} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <div className="flex items-center gap-1">
          <Input
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Ajouter…"
            className="h-6 w-28 text-xs"
          />
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={addTag} disabled={isPending || !newTag.trim()}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// VersionHistory is now imported from shared component

function DetailRow({ expanded, colSpan, children }: { expanded: boolean; colSpan: number; children: React.ReactNode }) {
  if (!expanded) return null;
  return (
    <TableRow className="bg-muted/30 hover:bg-muted/30">
      <TableCell colSpan={colSpan} className="p-4">
        <div className="animate-accordion-down">{children}</div>
      </TableCell>
    </TableRow>
  );
}

function ErrorBanner({ error }: { error: Error | null }) {
  if (!error) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>Erreur de chargement : {error.message}</span>
    </div>
  );
}

// ─── Quiz Tab ───
function QuizTab({ data, filters, isError, error, stats }: { data: any[]; filters: Filters; isError: boolean; error: Error | null; stats: AssetStats }) {
  const { data: modules = [] } = useModulesForDuplicate();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dupItem, setDupItem] = useState<any>(null);
  const [dupTarget, setDupTarget] = useState("");
  const updateTags = useUpdateTags("academy_quizzes", "admin-asset-quizzes");

  const filtered = applyFilters(data, filters, "quizzes");

  const duplicateMut = useMutation({
    mutationFn: async ({ quiz, targetModuleId }: { quiz: any; targetModuleId: string }) => {
      const { data: newQuiz, error } = await supabase.from("academy_quizzes").insert({
        module_id: targetModuleId, title: `${quiz.title} (copie)`, description: quiz.description,
        passing_score: quiz.passing_score, generation_mode: "manual", organization_id: quiz.organization_id, tags: quiz.tags ?? [],
      }).select().single();
      if (error) throw error;
      const { data: questions } = await supabase.from("academy_quiz_questions").select("*").eq("quiz_id", quiz.id);
      if (questions?.length) {
        const copies = questions.map(({ id, quiz_id, ...rest }: any) => ({ ...rest, quiz_id: newQuiz.id }));
        await supabase.from("academy_quiz_questions").insert(copies);
      }
    },
    onSuccess: () => { toast.success("Quiz dupliqué"); setDupItem(null); setDupTarget(""); qc.invalidateQueries({ queryKey: ["admin-asset-quizzes"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <ErrorBanner error={isError ? error : null} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Titre</TableHead>
            <TableHead>Module</TableHead>
            <TableHead>Parcours</TableHead>
            <TableHead>Organisation</TableHead>
            <TableHead className="text-center">Questions</TableHead>
            <TableHead className="text-center">Mode</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun quiz trouvé</TableCell></TableRow>
          )}
          {filtered.map((q: any) => {
            const ctx = extractContext(q.academy_modules);
            const isOpen = expandedId === q.id;
            const moduleStats = stats[ctx.moduleId];
            return (
              <Fragment key={q.id}>
                <TableRow className="cursor-pointer" onClick={() => setExpandedId(isOpen ? null : q.id)}>
                  <TableCell className="w-8 px-2">
                    <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{q.title || "Sans titre"}</span>
                      <StatusBadges createdAt={q.created_at} stats={moduleStats} />
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{ctx.moduleTitle}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{ctx.pathName ?? "—"}</TableCell>
                  <TableCell><OrgBadge orgName={ctx.orgName} /></TableCell>
                  <TableCell className="text-center">{q.academy_quiz_questions?.length ?? 0}</TableCell>
                  <TableCell className="text-center"><ModeBadge mode={q.generation_mode} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => setDupItem(q)}><Copy className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/academy/modules/${q.module_id}`)}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
                <DetailRow expanded={isOpen} colSpan={8}>
                  <div className="grid gap-3 text-sm">
                    <div><strong>Description :</strong> {q.description || "—"}</div>
                    <div className="flex gap-6">
                      <span><strong>Score min. :</strong> {q.passing_score}%</span>
                      <span><strong>Questions :</strong> {q.academy_quiz_questions?.length ?? 0}</span>
                      <span><strong>Mode :</strong> {q.generation_mode}</span>
                    </div>
                    <StatsSection stats={moduleStats} />
                    <InlineTagEditor
                      tags={q.tags ?? []}
                      onUpdate={tags => updateTags.mutate({ id: q.id, tags })}
                      isPending={updateTags.isPending}
                    />
                    <VersionHistory assetType="quiz" assetId={q.id} />
                  </div>
                </DetailRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!dupItem} onOpenChange={() => setDupItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dupliquer « {dupItem?.title} »</DialogTitle>
            <DialogDescription>Choisir le module cible pour la copie</DialogDescription>
          </DialogHeader>
          <Select value={dupTarget} onValueChange={setDupTarget}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un module…" /></SelectTrigger>
            <SelectContent>{modules.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}</SelectContent>
          </Select>
          <DialogFooter>
            <Button disabled={!dupTarget || duplicateMut.isPending} onClick={() => duplicateMut.mutate({ quiz: dupItem, targetModuleId: dupTarget })}>
              {duplicateMut.isPending ? "Duplication…" : "Dupliquer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Exercises Tab ───
function ExercisesTab({ data, filters, isError, error, stats }: { data: any[]; filters: Filters; isError: boolean; error: Error | null; stats: AssetStats }) {
  const { data: modules = [] } = useModulesForDuplicate();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dupItem, setDupItem] = useState<any>(null);
  const [dupTarget, setDupTarget] = useState("");
  const updateTags = useUpdateTags("academy_exercises", "admin-asset-exercises");

  const filtered = applyFilters(data, filters, "exercises");

  const duplicateMut = useMutation({
    mutationFn: async ({ exercise, targetModuleId }: { exercise: any; targetModuleId: string }) => {
      const { error } = await supabase.from("academy_exercises").insert({
        module_id: targetModuleId, title: `${exercise.title} (copie)`, instructions: exercise.instructions,
        expected_output_type: exercise.expected_output_type, ai_evaluation_enabled: exercise.ai_evaluation_enabled,
        evaluation_criteria: exercise.evaluation_criteria, generation_mode: "manual", organization_id: exercise.organization_id, tags: exercise.tags ?? [],
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Exercice dupliqué"); setDupItem(null); setDupTarget(""); qc.invalidateQueries({ queryKey: ["admin-asset-exercises"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <ErrorBanner error={isError ? error : null} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Titre</TableHead>
            <TableHead>Module</TableHead>
            <TableHead>Parcours</TableHead>
            <TableHead>Organisation</TableHead>
            <TableHead className="text-center">Éval. IA</TableHead>
            <TableHead className="text-center">Mode</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun exercice trouvé</TableCell></TableRow>
          )}
          {filtered.map((ex: any) => {
            const ctx = extractContext(ex.academy_modules);
            const isOpen = expandedId === ex.id;
            const moduleStats = stats[ctx.moduleId];
            return (
              <Fragment key={ex.id}>
                <TableRow className="cursor-pointer" onClick={() => setExpandedId(isOpen ? null : ex.id)}>
                  <TableCell className="w-8 px-2">
                    <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{ex.title}</span>
                      <StatusBadges createdAt={ex.created_at} stats={moduleStats} />
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{ctx.moduleTitle}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{ctx.pathName ?? "—"}</TableCell>
                  <TableCell><OrgBadge orgName={ctx.orgName} /></TableCell>
                  <TableCell className="text-center">{ex.ai_evaluation_enabled ? <Badge>IA</Badge> : "—"}</TableCell>
                  <TableCell className="text-center"><ModeBadge mode={ex.generation_mode} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => setDupItem(ex)}><Copy className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/academy/modules/${ex.module_id}`)}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
                <DetailRow expanded={isOpen} colSpan={8}>
                  <div className="grid gap-3 text-sm">
                    <div>
                      <strong>Instructions :</strong>
                      <pre className="mt-1 whitespace-pre-wrap bg-background p-3 rounded-lg text-xs border">{ex.instructions}</pre>
                    </div>
                    <div className="flex gap-6">
                      <span><strong>Type rendu :</strong> {ex.expected_output_type}</span>
                      <span><strong>Éval. IA :</strong> {ex.ai_evaluation_enabled ? "Oui" : "Non"}</span>
                      <span><strong>Mode :</strong> {ex.generation_mode}</span>
                    </div>
                    <StatsSection stats={moduleStats} />
                    <InlineTagEditor
                      tags={ex.tags ?? []}
                      onUpdate={tags => updateTags.mutate({ id: ex.id, tags })}
                      isPending={updateTags.isPending}
                    />
                    <VersionHistory assetType="exercise" assetId={ex.id} />
                  </div>
                </DetailRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!dupItem} onOpenChange={() => setDupItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dupliquer « {dupItem?.title} »</DialogTitle>
            <DialogDescription>Choisir le module cible</DialogDescription>
          </DialogHeader>
          <Select value={dupTarget} onValueChange={setDupTarget}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un module…" /></SelectTrigger>
            <SelectContent>{modules.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}</SelectContent>
          </Select>
          <DialogFooter>
            <Button disabled={!dupTarget || duplicateMut.isPending} onClick={() => duplicateMut.mutate({ exercise: dupItem, targetModuleId: dupTarget })}>
              {duplicateMut.isPending ? "Duplication…" : "Dupliquer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Practices Tab ───
function PracticesTab({ data, filters, isError, error, stats }: { data: any[]; filters: Filters; isError: boolean; error: Error | null; stats: AssetStats }) {
  const { data: modules = [] } = useModulesForDuplicate();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dupItem, setDupItem] = useState<any>(null);
  const [dupTarget, setDupTarget] = useState("");
  const [testModuleId, setTestModuleId] = useState<string | null>(null);
  const updateTags = useUpdateTags("academy_practices", "admin-asset-practices");

  const filtered = applyFilters(data, filters, "practices");

  const duplicateMut = useMutation({
    mutationFn: async ({ practice, targetModuleId }: { practice: any; targetModuleId: string }) => {
      const { error } = await supabase.from("academy_practices").insert({
        module_id: targetModuleId, title: `${practice.title} (copie)`, scenario: practice.scenario,
        system_prompt: practice.system_prompt, max_exchanges: practice.max_exchanges, difficulty: practice.difficulty,
        evaluation_rubric: practice.evaluation_rubric, generation_mode: "manual", organization_id: practice.organization_id, tags: practice.tags ?? [],
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pratique dupliquée"); setDupItem(null); setDupTarget(""); qc.invalidateQueries({ queryKey: ["admin-asset-practices"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <ErrorBanner error={isError ? error : null} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Titre</TableHead>
            <TableHead>Module</TableHead>
            <TableHead>Parcours</TableHead>
            <TableHead>Organisation</TableHead>
            <TableHead className="text-center">Difficulté</TableHead>
            <TableHead className="text-center">Mode</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucune pratique trouvée</TableCell></TableRow>
          )}
          {filtered.map((pr: any) => {
            const ctx = extractContext(pr.academy_modules);
            const isOpen = expandedId === pr.id;
            const moduleStats = stats[ctx.moduleId];
            return (
              <Fragment key={pr.id}>
                <TableRow className="cursor-pointer" onClick={() => setExpandedId(isOpen ? null : pr.id)}>
                  <TableCell className="w-8 px-2">
                    <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{pr.title}</span>
                      <StatusBadges createdAt={pr.created_at} stats={moduleStats} />
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{ctx.moduleTitle}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{ctx.pathName ?? "—"}</TableCell>
                  <TableCell><OrgBadge orgName={ctx.orgName} /></TableCell>
                  <TableCell className="text-center"><DifficultyBadge difficulty={pr.difficulty} /></TableCell>
                  <TableCell className="text-center"><ModeBadge mode={pr.generation_mode} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => setTestModuleId(pr.module_id)} title="Tester le Practice Studio"><Play className="h-4 w-4 text-violet-500" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDupItem(pr)}><Copy className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/academy/modules/${pr.module_id}`)}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
                <DetailRow expanded={isOpen} colSpan={8}>
                  <div className="grid gap-3 text-sm">
                    <div>
                      <strong>Scénario :</strong>
                      <pre className="mt-1 whitespace-pre-wrap bg-background p-3 rounded-lg text-xs border">{pr.scenario}</pre>
                    </div>
                    <div>
                      <strong>Prompt système :</strong>
                      <pre className="mt-1 whitespace-pre-wrap bg-background p-3 rounded-lg text-xs border">{pr.system_prompt}</pre>
                    </div>
                    <div className="flex gap-6">
                      <span><strong>Échanges max :</strong> {pr.max_exchanges}</span>
                      <span><strong>Difficulté :</strong> {pr.difficulty ?? "—"}</span>
                      <span><strong>Mode :</strong> {pr.generation_mode}</span>
                    </div>
                    <StatsSection stats={moduleStats} />
                    <InlineTagEditor
                      tags={pr.tags ?? []}
                      onUpdate={tags => updateTags.mutate({ id: pr.id, tags })}
                      isPending={updateTags.isPending}
                    />
                    <VersionHistory assetType="practice" assetId={pr.id} />
                  </div>
                </DetailRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!dupItem} onOpenChange={() => setDupItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dupliquer « {dupItem?.title} »</DialogTitle>
            <DialogDescription>Choisir le module cible</DialogDescription>
          </DialogHeader>
          <Select value={dupTarget} onValueChange={setDupTarget}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un module…" /></SelectTrigger>
            <SelectContent>{modules.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}</SelectContent>
          </Select>
          <DialogFooter>
            <Button disabled={!dupTarget || duplicateMut.isPending} onClick={() => duplicateMut.mutate({ practice: dupItem, targetModuleId: dupTarget })}>
              {duplicateMut.isPending ? "Duplication…" : "Dupliquer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PracticeTestDialog
        moduleId={testModuleId}
        open={!!testModuleId}
        onOpenChange={(open) => { if (!open) setTestModuleId(null); }}
        title={testModuleId ? filtered.find((p: any) => p.module_id === testModuleId)?.title : undefined}
      />
    </>
  );
}

// ─── Main Page ───
export default function AdminAcademyAssets() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("quizzes");
  const [filters, setFilters] = useState<Filters>({
    search: "", orgFilter: "all", pathFilter: "all", difficultyFilter: "all", modeFilter: "all", tagFilter: "all",
  });
  const { data: orgs = [] } = useOrganizations();
  const quizzesQuery = useQuizzes();
  const exercisesQuery = useExercises();
  const practicesQuery = usePractices();
  const { data: assetStats } = useAssetStats();

  const quizzes = quizzesQuery.data ?? [];
  const exercises = exercisesQuery.data ?? [];
  const practices = practicesQuery.data ?? [];

  const isLoading = quizzesQuery.isLoading || exercisesQuery.isLoading || practicesQuery.isLoading;

  const setFilter = (key: keyof Filters, val: string) => setFilters(prev => ({ ...prev, [key]: val }));

  const handleTabChange = (tab: string) => {
    const newTab = tab as ActiveTab;
    if (newTab !== "practices" && filters.difficultyFilter !== "all") {
      setFilters(prev => ({ ...prev, difficultyFilter: "all" }));
    }
    setActiveTab(newTab);
  };

  const paths = useMemo(() => {
    const allItems = [...quizzes, ...exercises, ...practices];
    const names = new Set<string>();
    allItems.forEach((item: any) => {
      const ctx = extractContext(item.academy_modules);
      if (ctx.pathName) names.add(ctx.pathName);
    });
    return Array.from(names).sort();
  }, [quizzes, exercises, practices]);

  const allTags = useMemo(() => {
    const allItems = [...quizzes, ...exercises, ...practices];
    const tagSet = new Set<string>();
    allItems.forEach((item: any) => {
      if (Array.isArray(item.tags)) item.tags.forEach((t: string) => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [quizzes, exercises, practices]);

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Library className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Actifs pédagogiques</h1>
            <p className="text-sm text-muted-foreground">Bibliothèque centralisée des quiz, exercices et pratiques</p>
          </div>
        </div>

        <FilterBar filters={filters} setFilter={setFilter} orgs={orgs} paths={paths} showDifficulty={activeTab === "practices"} allTags={allTags} />

        {isLoading ? (
          <div className="text-muted-foreground text-sm py-8 text-center">Chargement…</div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="quizzes" className="gap-1.5"><HelpCircle className="h-3.5 w-3.5" />Quiz ({quizzes.length})</TabsTrigger>
              <TabsTrigger value="exercises" className="gap-1.5"><Dumbbell className="h-3.5 w-3.5" />Exercices ({exercises.length})</TabsTrigger>
              <TabsTrigger value="practices" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" />Pratiques ({practices.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="quizzes">
              <QuizTab data={quizzes} filters={filters} isError={quizzesQuery.isError} error={quizzesQuery.error} stats={assetStats} />
            </TabsContent>
            <TabsContent value="exercises">
              <ExercisesTab data={exercises} filters={filters} isError={exercisesQuery.isError} error={exercisesQuery.error} stats={assetStats} />
            </TabsContent>
            <TabsContent value="practices">
              <PracticesTab data={practices} filters={filters} isError={practicesQuery.isError} error={practicesQuery.error} stats={assetStats} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminShell>
  );
}
