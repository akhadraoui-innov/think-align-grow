import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Search, Eye, Copy, Pencil, Library, HelpCircle, Dumbbell, MessageSquare } from "lucide-react";
import { toast } from "sonner";

// ─── Types ───
type OrgInfo = { id: string; name: string };

type AssetContext = {
  moduleTitle: string;
  pathName: string | null;
  orgName: string | null;
  orgId: string | null;
};

// ─── Helpers ───
function extractContext(mod: any): AssetContext {
  const moduleTitle = mod?.title ?? "—";
  const pm = mod?.academy_path_modules;
  const firstPath = Array.isArray(pm) && pm.length > 0 ? pm[0]?.academy_paths : null;
  return {
    moduleTitle,
    pathName: firstPath?.name ?? null,
    orgName: firstPath?.organizations?.name ?? null,
    orgId: firstPath?.organization_id ?? null,
  };
}

// ─── Hooks ───
function useOrganizations() {
  return useQuery({
    queryKey: ["admin-orgs-list"],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id, name").order("name");
      return (data ?? []) as OrgInfo[];
    },
  });
}

function useModulesForDuplicate() {
  return useQuery({
    queryKey: ["admin-modules-list"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_modules").select("id, title").order("title");
      return data ?? [];
    },
  });
}

const MODULE_SELECT = "*, academy_modules!inner(title, academy_path_modules(academy_paths(name, organization_id, organizations(name))))";

function useQuizzes() {
  return useQuery({
    queryKey: ["admin-asset-quizzes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_quizzes")
        .select(`${MODULE_SELECT}, academy_quiz_questions(id)`)
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

// ─── Filter bar ───
function FilterBar({
  search, setSearch, orgFilter, setOrgFilter, orgs,
}: {
  search: string; setSearch: (v: string) => void;
  orgFilter: string; setOrgFilter: (v: string) => void;
  orgs: OrgInfo[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>
      <Select value={orgFilter} onValueChange={setOrgFilter}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Toutes les organisations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes</SelectItem>
          <SelectItem value="public">Public uniquement</SelectItem>
          {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Org badge ───
function OrgBadge({ orgName }: { orgName: string | null }) {
  return orgName
    ? <Badge variant="outline">{orgName}</Badge>
    : <Badge variant="secondary">Public</Badge>;
}

// ─── Quiz Tab ───
function QuizTab({ search, orgFilter, orgs }: { search: string; orgFilter: string; orgs: OrgInfo[] }) {
  const { data: quizzes = [], isLoading } = useQuizzes();
  const { data: modules = [] } = useModulesForDuplicate();
  const qc = useQueryClient();
  const [viewItem, setViewItem] = useState<any>(null);
  const [dupItem, setDupItem] = useState<any>(null);
  const [dupTarget, setDupTarget] = useState("");
  const [editItem, setEditItem] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editScore, setEditScore] = useState(70);

  const filtered = quizzes.filter((q: any) => {
    const ctx = extractContext(q.academy_modules);
    const matchSearch = !search || q.title?.toLowerCase().includes(search.toLowerCase()) || ctx.moduleTitle.toLowerCase().includes(search.toLowerCase());
    const matchOrg = orgFilter === "all" || (orgFilter === "public" ? !ctx.orgId : ctx.orgId === orgFilter);
    return matchSearch && matchOrg;
  });

  const duplicateMut = useMutation({
    mutationFn: async ({ quiz, targetModuleId }: { quiz: any; targetModuleId: string }) => {
      const { data: newQuiz, error } = await supabase.from("academy_quizzes").insert({
        module_id: targetModuleId,
        title: `${quiz.title} (copie)`,
        description: quiz.description,
        passing_score: quiz.passing_score,
        generation_mode: "manual",
        organization_id: quiz.organization_id,
      }).select().single();
      if (error) throw error;
      // Copy questions
      const { data: questions } = await supabase.from("academy_quiz_questions").select("*").eq("quiz_id", quiz.id);
      if (questions?.length) {
        const copies = questions.map(({ id, quiz_id, ...rest }: any) => ({ ...rest, quiz_id: newQuiz.id }));
        const { error: qErr } = await supabase.from("academy_quiz_questions").insert(copies);
        if (qErr) throw qErr;
      }
    },
    onSuccess: () => { toast.success("Quiz dupliqué"); setDupItem(null); setDupTarget(""); qc.invalidateQueries({ queryKey: ["admin-asset-quizzes"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const editMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("academy_quizzes").update({ title: editTitle, description: editDesc, passing_score: editScore }).eq("id", editItem.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Quiz mis à jour"); setEditItem(null); qc.invalidateQueries({ queryKey: ["admin-asset-quizzes"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-muted-foreground text-sm py-8 text-center">Chargement…</div>;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Module source</TableHead>
            <TableHead>Parcours</TableHead>
            <TableHead>Organisation</TableHead>
            <TableHead className="text-center">Questions</TableHead>
            <TableHead className="text-center">Score min.</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucun quiz trouvé</TableCell></TableRow>
          )}
          {filtered.map((q: any) => {
            const ctx = extractContext(q.academy_modules);
            return (
              <TableRow key={q.id}>
                <TableCell className="font-medium">{q.title || "Sans titre"}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{ctx.moduleTitle}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{ctx.pathName ?? "—"}</TableCell>
                <TableCell><OrgBadge orgName={ctx.orgName} /></TableCell>
                <TableCell className="text-center">{q.academy_quiz_questions?.length ?? 0}</TableCell>
                <TableCell className="text-center">{q.passing_score}%</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setViewItem(q)}><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDupItem(q)}><Copy className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditItem(q); setEditTitle(q.title); setEditDesc(q.description); setEditScore(q.passing_score); }}><Pencil className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewItem?.title}</DialogTitle>
            <DialogDescription>{viewItem?.description}</DialogDescription>
          </DialogHeader>
          <div className="text-sm space-y-2">
            <p><strong>Score minimum :</strong> {viewItem?.passing_score}%</p>
            <p><strong>Questions :</strong> {viewItem?.academy_quiz_questions?.length ?? 0}</p>
            <p><strong>Mode :</strong> {viewItem?.generation_mode}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={!!dupItem} onOpenChange={() => setDupItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dupliquer « {dupItem?.title} »</DialogTitle>
            <DialogDescription>Choisir le module cible pour la copie</DialogDescription>
          </DialogHeader>
          <Select value={dupTarget} onValueChange={setDupTarget}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un module…" /></SelectTrigger>
            <SelectContent>
              {modules.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button disabled={!dupTarget || duplicateMut.isPending} onClick={() => duplicateMut.mutate({ quiz: dupItem, targetModuleId: dupTarget })}>
              {duplicateMut.isPending ? "Duplication…" : "Dupliquer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le quiz</DialogTitle>
            <DialogDescription>Mettre à jour les informations du quiz</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Titre</Label><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} /></div>
            <div><Label>Description</Label><Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} /></div>
            <div><Label>Score minimum (%)</Label><Input type="number" value={editScore} onChange={e => setEditScore(+e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button disabled={editMut.isPending} onClick={() => editMut.mutate()}>
              {editMut.isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Exercises Tab ───
function ExercisesTab({ search, orgFilter }: { search: string; orgFilter: string }) {
  const { data: exercises = [], isLoading } = useExercises();
  const { data: modules = [] } = useModulesForDuplicate();
  const qc = useQueryClient();
  const [viewItem, setViewItem] = useState<any>(null);
  const [dupItem, setDupItem] = useState<any>(null);
  const [dupTarget, setDupTarget] = useState("");
  const [editItem, setEditItem] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editAiEnabled, setEditAiEnabled] = useState(false);

  const filtered = exercises.filter((ex: any) => {
    const ctx = extractContext(ex.academy_modules);
    const matchSearch = !search || ex.title?.toLowerCase().includes(search.toLowerCase()) || ctx.moduleTitle.toLowerCase().includes(search.toLowerCase());
    const matchOrg = orgFilter === "all" || (orgFilter === "public" ? !ctx.orgId : ctx.orgId === orgFilter);
    return matchSearch && matchOrg;
  });

  const duplicateMut = useMutation({
    mutationFn: async ({ exercise, targetModuleId }: { exercise: any; targetModuleId: string }) => {
      const { error } = await supabase.from("academy_exercises").insert({
        module_id: targetModuleId,
        title: `${exercise.title} (copie)`,
        instructions: exercise.instructions,
        expected_output_type: exercise.expected_output_type,
        ai_evaluation_enabled: exercise.ai_evaluation_enabled,
        evaluation_criteria: exercise.evaluation_criteria,
        generation_mode: "manual",
        organization_id: exercise.organization_id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Exercice dupliqué"); setDupItem(null); setDupTarget(""); qc.invalidateQueries({ queryKey: ["admin-asset-exercises"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const editMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("academy_exercises").update({ title: editTitle, instructions: editInstructions, ai_evaluation_enabled: editAiEnabled }).eq("id", editItem.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Exercice mis à jour"); setEditItem(null); qc.invalidateQueries({ queryKey: ["admin-asset-exercises"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-muted-foreground text-sm py-8 text-center">Chargement…</div>;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Module source</TableHead>
            <TableHead>Parcours</TableHead>
            <TableHead>Organisation</TableHead>
            <TableHead className="text-center">Éval. IA</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun exercice trouvé</TableCell></TableRow>
          )}
          {filtered.map((ex: any) => {
            const ctx = extractContext(ex.academy_modules);
            return (
              <TableRow key={ex.id}>
                <TableCell className="font-medium">{ex.title}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{ctx.moduleTitle}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{ctx.pathName ?? "—"}</TableCell>
                <TableCell><OrgBadge orgName={ctx.orgName} /></TableCell>
                <TableCell className="text-center">{ex.ai_evaluation_enabled ? <Badge>IA</Badge> : "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setViewItem(ex)}><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDupItem(ex)}><Copy className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditItem(ex); setEditTitle(ex.title); setEditInstructions(ex.instructions); setEditAiEnabled(ex.ai_evaluation_enabled); }}><Pencil className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewItem?.title}</DialogTitle>
            <DialogDescription>Détail de l'exercice</DialogDescription>
          </DialogHeader>
          <div className="text-sm space-y-3">
            <div><strong>Instructions :</strong><pre className="mt-1 whitespace-pre-wrap bg-muted p-3 rounded-lg text-xs">{viewItem?.instructions}</pre></div>
            <p><strong>Type de rendu :</strong> {viewItem?.expected_output_type}</p>
            <p><strong>Évaluation IA :</strong> {viewItem?.ai_evaluation_enabled ? "Oui" : "Non"}</p>
          </div>
        </DialogContent>
      </Dialog>

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

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'exercice</DialogTitle>
            <DialogDescription>Mettre à jour le contenu de l'exercice</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Titre</Label><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} /></div>
            <div><Label>Instructions</Label><Textarea rows={6} value={editInstructions} onChange={e => setEditInstructions(e.target.value)} /></div>
            <div className="flex items-center gap-2"><Switch checked={editAiEnabled} onCheckedChange={setEditAiEnabled} /><Label>Évaluation IA</Label></div>
          </div>
          <DialogFooter>
            <Button disabled={editMut.isPending} onClick={() => editMut.mutate()}>
              {editMut.isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Practices Tab ───
function PracticesTab({ search, orgFilter }: { search: string; orgFilter: string }) {
  const { data: practices = [], isLoading } = usePractices();
  const { data: modules = [] } = useModulesForDuplicate();
  const qc = useQueryClient();
  const [viewItem, setViewItem] = useState<any>(null);
  const [dupItem, setDupItem] = useState<any>(null);
  const [dupTarget, setDupTarget] = useState("");
  const [editItem, setEditItem] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editScenario, setEditScenario] = useState("");
  const [editMaxExchanges, setEditMaxExchanges] = useState(10);

  const filtered = practices.filter((pr: any) => {
    const ctx = extractContext(pr.academy_modules);
    const matchSearch = !search || pr.title?.toLowerCase().includes(search.toLowerCase()) || ctx.moduleTitle.toLowerCase().includes(search.toLowerCase());
    const matchOrg = orgFilter === "all" || (orgFilter === "public" ? !ctx.orgId : ctx.orgId === orgFilter);
    return matchSearch && matchOrg;
  });

  const duplicateMut = useMutation({
    mutationFn: async ({ practice, targetModuleId }: { practice: any; targetModuleId: string }) => {
      const { error } = await supabase.from("academy_practices").insert({
        module_id: targetModuleId,
        title: `${practice.title} (copie)`,
        scenario: practice.scenario,
        system_prompt: practice.system_prompt,
        max_exchanges: practice.max_exchanges,
        difficulty: practice.difficulty,
        evaluation_rubric: practice.evaluation_rubric,
        generation_mode: "manual",
        organization_id: practice.organization_id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pratique dupliquée"); setDupItem(null); setDupTarget(""); qc.invalidateQueries({ queryKey: ["admin-asset-practices"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const editMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("academy_practices").update({ title: editTitle, scenario: editScenario, max_exchanges: editMaxExchanges }).eq("id", editItem.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pratique mise à jour"); setEditItem(null); qc.invalidateQueries({ queryKey: ["admin-asset-practices"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-muted-foreground text-sm py-8 text-center">Chargement…</div>;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Module source</TableHead>
            <TableHead>Parcours</TableHead>
            <TableHead>Organisation</TableHead>
            <TableHead className="text-center">Échanges max</TableHead>
            <TableHead className="text-center">Difficulté</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucune pratique trouvée</TableCell></TableRow>
          )}
          {filtered.map((pr: any) => {
            const ctx = extractContext(pr.academy_modules);
            return (
              <TableRow key={pr.id}>
                <TableCell className="font-medium">{pr.title}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{ctx.moduleTitle}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{ctx.pathName ?? "—"}</TableCell>
                <TableCell><OrgBadge orgName={ctx.orgName} /></TableCell>
                <TableCell className="text-center">{pr.max_exchanges}</TableCell>
                <TableCell className="text-center"><Badge variant="outline">{pr.difficulty ?? "—"}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setViewItem(pr)}><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDupItem(pr)}><Copy className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditItem(pr); setEditTitle(pr.title); setEditScenario(pr.scenario); setEditMaxExchanges(pr.max_exchanges); }}><Pencil className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewItem?.title}</DialogTitle>
            <DialogDescription>Détail de la pratique IA</DialogDescription>
          </DialogHeader>
          <div className="text-sm space-y-3">
            <div><strong>Scénario :</strong><pre className="mt-1 whitespace-pre-wrap bg-muted p-3 rounded-lg text-xs">{viewItem?.scenario}</pre></div>
            <div><strong>Prompt système :</strong><pre className="mt-1 whitespace-pre-wrap bg-muted p-3 rounded-lg text-xs">{viewItem?.system_prompt}</pre></div>
            <p><strong>Échanges max :</strong> {viewItem?.max_exchanges}</p>
            <p><strong>Difficulté :</strong> {viewItem?.difficulty ?? "—"}</p>
          </div>
        </DialogContent>
      </Dialog>

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

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la pratique</DialogTitle>
            <DialogDescription>Mettre à jour le contenu de la pratique</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Titre</Label><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} /></div>
            <div><Label>Scénario</Label><Textarea rows={4} value={editScenario} onChange={e => setEditScenario(e.target.value)} /></div>
            <div><Label>Échanges max</Label><Input type="number" value={editMaxExchanges} onChange={e => setEditMaxExchanges(+e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button disabled={editMut.isPending} onClick={() => editMut.mutate()}>
              {editMut.isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Page ───
export default function AdminAcademyAssets() {
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("all");
  const { data: orgs = [] } = useOrganizations();

  return (
    <AdminShell title="Actifs pédagogiques" subtitle="Bibliothèque centralisée des quiz, exercices et pratiques">
      <FilterBar search={search} setSearch={setSearch} orgFilter={orgFilter} setOrgFilter={setOrgFilter} orgs={orgs} />

      <Tabs defaultValue="quizzes">
        <TabsList>
          <TabsTrigger value="quizzes" className="gap-1.5"><HelpCircle className="h-3.5 w-3.5" />Quiz</TabsTrigger>
          <TabsTrigger value="exercises" className="gap-1.5"><Dumbbell className="h-3.5 w-3.5" />Exercices</TabsTrigger>
          <TabsTrigger value="practices" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" />Pratiques</TabsTrigger>
        </TabsList>
        <TabsContent value="quizzes"><QuizTab search={search} orgFilter={orgFilter} orgs={orgs} /></TabsContent>
        <TabsContent value="exercises"><ExercisesTab search={search} orgFilter={orgFilter} /></TabsContent>
        <TabsContent value="practices"><PracticesTab search={search} orgFilter={orgFilter} /></TabsContent>
      </Tabs>
    </AdminShell>
  );
}
