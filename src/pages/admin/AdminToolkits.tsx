import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
// DataTable replaced by editorial grid + table view
import { useAdminToolkits } from "@/hooks/useAdminToolkits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Plus, Loader2, Sparkles, FileText, Eye, Package, Wand2, Users, Settings2, Brain, Check, Clock, CircleDot, PartyPopper, ArrowRight, RotateCcw, LayoutGrid, List, Pencil, Trash2, Image as ImageIcon, Layers, CreditCard, Search, Gamepad2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { StepDialog, type StepDef } from "@/components/admin/StepDialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-muted text-muted-foreground border-border" },
  published: { label: "Publié", className: "bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30" },
  archived: { label: "Archivé", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

type TimelineEntry = {
  id: string;
  label: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
};

type GenerationState = {
  phase: "idle" | "generating" | "complete" | "error";
  toolkitId?: string;
  toolkitName?: string;
  toolkitEmoji?: string;
  pillarNames: string[];
  timeline: TimelineEntry[];
  totalCards: number;
  totalQuiz: number;
  totalPillars: number;
  errorMessage?: string;
};

const initialGenState: GenerationState = {
  phase: "idle",
  pillarNames: [],
  timeline: [],
  totalCards: 0,
  totalQuiz: 0,
  totalPillars: 0,
};

export default function AdminToolkits() {
  const navigate = useNavigate();
  const { toolkits, isLoading, counts, create, remove } = useAdminToolkits();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filters & view mode
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [coverLoadingId, setCoverLoadingId] = useState<string | null>(null);

  // Manual create dialog
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", icon_emoji: "🚀", status: "draft" as const });

  // AI generate dialog
  const [aiOpen, setAiOpen] = useState(false);
  const [genState, setGenState] = useState<GenerationState>(initialGenState);
  const [genDialogOpen, setGenDialogOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [aiForm, setAiForm] = useState({
    name: "",
    slug: "",
    icon_emoji: "🎯",
    description: "",
    target_audience: "",
    objectives: "",
    pillar_count: 8,
    cards_per_pillar: 20,
    language: "fr",
    difficulty_level: "intermediate",
    generate_quiz: true,
  });

  const triggerCover = useCallback(async (toolkit_id: string) => {
    setCoverLoadingId(toolkit_id);
    try {
      await supabase.functions.invoke("academy-generate", { body: { action: "generate-toolkit-cover", toolkit_id } });
      queryClient.invalidateQueries({ queryKey: ["admin-toolkits"] });
      toast({ title: "Couverture générée" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setCoverLoadingId(null);
    }
  }, [queryClient, toast]);

  const [batchLoading, setBatchLoading] = useState(false);
  const handleBatchCovers = async () => {
    setBatchLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("academy-generate", { body: { action: "generate-all-toolkit-covers" } });
      if (error) throw error;
      toast({ title: "Génération lancée", description: `${data?.queued || 0} couvertures en cours. Rafraîchissez dans 1-2 minutes.` });
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["admin-toolkits"] }), 30000);
    } catch (e: any) {
      toast({ title: "Erreur batch couvertures", description: e.message, variant: "destructive" });
    } finally { setBatchLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.name || !form.slug) return;
    try {
      const created: any = await create.mutateAsync(form);
      const newId = created?.id || created?.data?.id;
      toast({ title: "Toolkit créé", description: "Génération de la couverture en cours…" });
      setOpen(false);
      setForm({ name: "", slug: "", description: "", icon_emoji: "🚀", status: "draft" });
      if (newId) triggerCover(newId);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  // Update timeline helper
  const updateTimeline = useCallback((id: string, updates: Partial<TimelineEntry>) => {
    setGenState(prev => ({
      ...prev,
      timeline: prev.timeline.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  }, []);

  const addTimeline = useCallback((entry: TimelineEntry) => {
    setGenState(prev => ({ ...prev, timeline: [...prev.timeline, entry] }));
  }, []);

  const handleGenerate = async () => {
    if (!aiForm.name || !aiForm.slug) return;

    // Close step dialog, open generation dialog
    setAiOpen(false);
    setGenDialogOpen(true);
    setElapsed(0);
    setGenState({
      phase: "generating",
      toolkitName: aiForm.name,
      toolkitEmoji: aiForm.icon_emoji,
      pillarNames: [],
      timeline: [{ id: "toolkit", label: "Création du toolkit", status: "active" }],
      totalCards: 0,
      totalQuiz: 0,
      totalPillars: 0,
    });

    // Start elapsed timer
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non connecté");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-toolkit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(aiForm),
      });

      if (!response.ok && !response.headers.get("content-type")?.includes("text/event-stream")) {
        const err = await response.json().catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));

          if (data.type === "progress") {
            switch (data.step) {
              case "toolkit_created":
                updateTimeline("toolkit", { status: "done", detail: "✓" });
                setGenState(prev => ({ ...prev, toolkitId: data.toolkit_id }));
                addTimeline({ id: "pillars", label: "Génération des piliers", status: "active" });
                break;

              case "pillars_generated":
                updateTimeline("pillars", { status: "done", detail: `${data.pillars.length} piliers` });
                setGenState(prev => ({ ...prev, pillarNames: data.pillars, totalPillars: data.pillars.length }));
                break;

              case "cards_generating":
                addTimeline({ id: `cards-${data.index}`, label: `${data.pillar}`, status: "active", detail: "Génération des cartes..." });
                break;

              case "cards_done":
                updateTimeline(`cards-${genStateRef.current.timeline.findIndex(t => t.label === data.pillar && t.status === "active") > -1 ? genStateRef.current.timeline.findIndex(t => t.label === data.pillar && t.status === "active") : 0}`, { status: "done" });
                // Find the right entry by pillar name
                setGenState(prev => {
                  const idx = prev.timeline.findIndex(t => t.label === data.pillar && t.status === "active");
                  if (idx === -1) return { ...prev, totalCards: prev.totalCards + data.count };
                  const newTimeline = [...prev.timeline];
                  newTimeline[idx] = { ...newTimeline[idx], status: "done", detail: `${data.count} cartes` };
                  return { ...prev, timeline: newTimeline, totalCards: prev.totalCards + data.count };
                });
                break;

              case "quiz_generating":
                addTimeline({ id: `quiz-${data.pillar}`, label: `Quiz — ${data.pillar}`, status: "active" });
                break;

              case "quiz_done":
                setGenState(prev => {
                  const idx = prev.timeline.findIndex(t => t.id === `quiz-${data.pillar}`);
                  if (idx === -1) return { ...prev, totalQuiz: prev.totalQuiz + data.count };
                  const newTimeline = [...prev.timeline];
                  newTimeline[idx] = { ...newTimeline[idx], status: "done", detail: `${data.count} questions` };
                  return { ...prev, timeline: newTimeline, totalQuiz: prev.totalQuiz + data.count };
                });
                break;
            }
          } else if (data.type === "complete") {
            if (timerRef.current) clearInterval(timerRef.current);
            setGenState(prev => ({
              ...prev,
              phase: "complete",
              toolkitId: data.toolkit_id,
              totalPillars: data.pillars,
              totalCards: data.cards,
              totalQuiz: data.quiz,
            }));
            queryClient.invalidateQueries({ queryKey: ["admin-toolkits"] });
            if (data.toolkit_id) triggerCover(data.toolkit_id);
          } else if (data.type === "error") {
            throw new Error(data.message);
          }
        }
      }
    } catch (e: any) {
      if (timerRef.current) clearInterval(timerRef.current);
      setGenState(prev => ({ ...prev, phase: "error", errorMessage: e.message }));
      toast({ title: "Erreur de génération", description: e.message, variant: "destructive" });
    }
  };

  // Ref to access genState in stream handler
  const genStateRef = useRef(genState);
  useEffect(() => { genStateRef.current = genState; }, [genState]);

  // Cleanup timer
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec.toString().padStart(2, "0")}s` : `${sec}s`;
  };

  const progressPercent = genState.phase === "complete" ? 100 :
    genState.totalPillars > 0
      ? Math.round((genState.timeline.filter(t => t.status === "done").length / (genState.totalPillars + 2 + (aiForm.generate_quiz ? genState.totalPillars : 0))) * 100)
      : 10;

  const statusInfo = STATUS_MAP[form.status] || STATUS_MAP.draft;

  // Manual create steps
  const steps: StepDef[] = [
    {
      title: "Identité",
      description: "Nommez votre toolkit",
      icon: Sparkles,
      canProceed: !!form.name.trim() && !!form.slug.trim(),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-[60px_1fr] gap-3">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Emoji</label>
              <Input value={form.icon_emoji} onChange={(e) => setForm((f) => ({ ...f, icon_emoji: e.target.value }))} className="text-center text-lg" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Nom *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }))}
                placeholder="Bootstrap in Business"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Slug *</label>
            <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="bootstrap-in-business" />
          </div>
        </div>
      ),
    },
    {
      title: "Détails",
      description: "Description et statut",
      icon: FileText,
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="resize-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Statut</label>
            <Select value={form.status} onValueChange={(v: any) => setForm((f) => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      title: "Récapitulatif",
      description: "Vérifiez avant de créer",
      icon: Eye,
      content: (
        <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Toolkit</span>
            <span className="text-sm font-medium text-foreground">{form.icon_emoji} {form.name || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Slug</span>
            <span className="text-sm font-mono text-foreground">{form.slug || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Statut</span>
            <Badge variant="outline" className={`text-xs ${statusInfo.className}`}>{statusInfo.label}</Badge>
          </div>
          {form.description && (
            <div>
              <span className="text-xs text-muted-foreground">Description</span>
              <p className="text-sm text-foreground mt-1 line-clamp-3">{form.description}</p>
            </div>
          )}
        </div>
      ),
    },
  ];

  // AI generation steps
  const aiSteps: StepDef[] = [
    {
      title: "Thématique",
      description: "Identité du toolkit",
      icon: Sparkles,
      canProceed: !!aiForm.name.trim() && !!aiForm.slug.trim(),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-[60px_1fr] gap-3">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Emoji</label>
              <Input value={aiForm.icon_emoji} onChange={(e) => setAiForm((f) => ({ ...f, icon_emoji: e.target.value }))} className="text-center text-lg" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Nom du toolkit *</label>
              <Input
                value={aiForm.name}
                onChange={(e) => setAiForm((f) => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }))}
                placeholder="Ex: Leadership & Management"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Slug</label>
            <Input value={aiForm.slug} onChange={(e) => setAiForm((f) => ({ ...f, slug: e.target.value }))} />
          </div>
        </div>
      ),
    },
    {
      title: "Contexte",
      description: "Audience et objectifs",
      icon: Users,
      canProceed: !!aiForm.description.trim(),
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Description du domaine *</label>
            <Textarea
              value={aiForm.description}
              onChange={(e) => setAiForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="resize-none"
              placeholder="Décrivez le domaine couvert par ce toolkit, les compétences clés à développer..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Audience cible</label>
            <Input
              value={aiForm.target_audience}
              onChange={(e) => setAiForm((f) => ({ ...f, target_audience: e.target.value }))}
              placeholder="Ex: Managers, entrepreneurs, étudiants MBA..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Objectifs pédagogiques</label>
            <Textarea
              value={aiForm.objectives}
              onChange={(e) => setAiForm((f) => ({ ...f, objectives: e.target.value }))}
              rows={2}
              className="resize-none"
              placeholder="Ex: Maîtriser les fondamentaux du leadership, développer l'intelligence émotionnelle..."
            />
          </div>
        </div>
      ),
    },
    {
      title: "Structure",
      description: "Piliers et cartes",
      icon: Settings2,
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Nombre de piliers</label>
              <span className="text-sm font-bold text-primary">{aiForm.pillar_count}</span>
            </div>
            <Slider
              value={[aiForm.pillar_count]}
              onValueChange={([v]) => setAiForm((f) => ({ ...f, pillar_count: v }))}
              min={4}
              max={12}
              step={1}
            />
            <p className="text-xs text-muted-foreground">Recommandé : 8-10 piliers pour une couverture complète</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Cartes par pilier</label>
              <span className="text-sm font-bold text-primary">{aiForm.cards_per_pillar}</span>
            </div>
            <Slider
              value={[aiForm.cards_per_pillar]}
              onValueChange={([v]) => setAiForm((f) => ({ ...f, cards_per_pillar: v }))}
              min={8}
              max={24}
              step={4}
            />
            <p className="text-xs text-muted-foreground">Réparties en 4 phases : Fondations, Modèle, Croissance, Exécution</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">
              Total estimé : <span className="font-bold text-foreground">{aiForm.pillar_count * aiForm.cards_per_pillar} cartes</span>
              {aiForm.generate_quiz && <> + <span className="font-bold text-foreground">{aiForm.pillar_count * 4} questions quiz</span></>}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Options",
      description: "Langue et niveau",
      icon: Brain,
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Langue</label>
            <Select value={aiForm.language} onValueChange={(v) => setAiForm((f) => ({ ...f, language: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Niveau de difficulté</label>
            <Select value={aiForm.difficulty_level} onValueChange={(v) => setAiForm((f) => ({ ...f, difficulty_level: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Débutant</SelectItem>
                <SelectItem value="intermediate">Intermédiaire</SelectItem>
                <SelectItem value="advanced">Avancé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Générer le quiz</p>
              <p className="text-xs text-muted-foreground">4 questions par pilier</p>
            </div>
            <Switch checked={aiForm.generate_quiz} onCheckedChange={(v) => setAiForm((f) => ({ ...f, generate_quiz: v }))} />
          </div>
        </div>
      ),
    },
    {
      title: "Récapitulatif",
      description: "Lancer la génération",
      icon: Eye,
      content: (
        <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Toolkit</span>
            <span className="text-sm font-medium text-foreground">{aiForm.icon_emoji} {aiForm.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Audience</span>
            <span className="text-sm text-foreground">{aiForm.target_audience || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Structure</span>
            <span className="text-sm font-medium text-foreground">{aiForm.pillar_count} piliers × {aiForm.cards_per_pillar} cartes</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total cartes</span>
            <span className="text-sm font-bold text-primary">{aiForm.pillar_count * aiForm.cards_per_pillar}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Quiz</span>
            <Badge variant="outline" className="text-xs">{aiForm.generate_quiz ? "Oui" : "Non"}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Langue</span>
            <span className="text-sm text-foreground">{aiForm.language === "fr" ? "🇫🇷 Français" : "🇬🇧 English"}</span>
          </div>
        </div>
      ),
    },
  ];

  const missingCovers = toolkits.filter((t: any) => !t.cover_image_url).length;

  const filtered = toolkits.filter((t: any) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!t.name?.toLowerCase().includes(s) && !t.slug?.toLowerCase().includes(s) && !t.description?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement "${name}" ?`)) return;
    remove.mutate(id, {
      onSuccess: () => toast({ title: "Toolkit supprimé" }),
      onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        {/* ═══ HEADER ═══ */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Toolkits</h1>
            <p className="text-sm text-muted-foreground mt-1">Gérer les toolkits et leur contenu</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {missingCovers > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2">
                <Wand2 className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground">{missingCovers} sans couverture</span>
                <Button size="sm" variant="default" className="gap-2" onClick={handleBatchCovers} disabled={batchLoading}>
                  {batchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Générer toutes
                </Button>
              </div>
            )}
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouveau toolkit
            </Button>
            <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground" onClick={() => setAiOpen(true)}>
              <Wand2 className="h-4 w-4" />
              Générer par IA
            </Button>
          </div>
        </div>

        {/* ═══ FILTERS ═══ */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un toolkit..."
              className="pl-9 h-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="published">Publié</SelectItem>
              <SelectItem value="archived">Archivé</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-md ml-auto">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-r-none" onClick={() => setViewMode("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-l-none" onClick={() => setViewMode("table")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ═══ CONTENT ═══ */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse h-[380px]">
                <div className="h-36 bg-muted rounded-t-2xl" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">{search || filterStatus !== "all" ? "Aucun toolkit ne correspond aux filtres" : "Aucun toolkit créé"}</p>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t: any) => {
              const s = STATUS_MAP[t.status] || STATUS_MAP.draft;
              const pillars = counts.pillarsByToolkit[t.id] || 0;
              const cards = counts.cardsByToolkit[t.id] || 0;
              const isCoverLoading = coverLoadingId === t.id;
              return (
                <Card
                  key={t.id}
                  className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 rounded-2xl overflow-hidden border border-border/50 flex flex-col h-[380px]"
                  onClick={() => navigate(`/admin/toolkits/${t.id}`)}
                >
                  {/* Cover hero */}
                  <div className="relative h-36 overflow-hidden flex-shrink-0 bg-muted">
                    {t.cover_image_url ? (
                      <img
                        src={`${t.cover_image_url}?v=${new Date(t.updated_at || t.created_at).getTime()}`}
                        alt={t.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/10 to-muted flex items-center justify-center">
                        <span className="text-5xl opacity-70">{t.icon_emoji || "🚀"}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <Badge variant="outline" className={`text-[10px] backdrop-blur-sm ${s.className}`}>{s.label}</Badge>
                      {pillars > 0 && (
                        <Badge variant="outline" className="text-[10px] backdrop-blur-sm bg-background/70 border-border/50">
                          <Layers className="h-2.5 w-2.5 mr-1" />{pillars}
                        </Badge>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 backdrop-blur-sm"
                        title={t.cover_image_url ? "Régénérer la couverture" : "Générer la couverture"}
                        disabled={isCoverLoading}
                        onClick={(e) => { e.stopPropagation(); triggerCover(t.id); }}
                      >
                        {isCoverLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 backdrop-blur-sm"
                        title="Éditer"
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/toolkits/${t.id}`); }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 backdrop-blur-sm text-destructive"
                        title="Supprimer"
                        onClick={(e) => { e.stopPropagation(); handleDelete(t.id, t.name); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-4 min-h-0">
                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                      <span className="mr-1">{t.icon_emoji}</span>{t.name}
                    </h3>
                    <p className="text-[10px] font-mono text-muted-foreground/70 mb-2 truncate">{t.slug}</p>
                    {t.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-auto">{t.description}</p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/40 mt-2">
                      <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {pillars} piliers</span>
                      <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> {cards} cartes</span>
                      <span>{format(new Date(t.created_at), "dd MMM", { locale: fr })}</span>
                    </div>
                  </div>
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
                    <TableHead>Toolkit</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-center">Piliers</TableHead>
                    <TableHead className="text-center">Cartes</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="w-[120px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t: any) => {
                    const s = STATUS_MAP[t.status] || STATUS_MAP.draft;
                    const isCoverLoading = coverLoadingId === t.id;
                    return (
                      <TableRow
                        key={t.id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => navigate(`/admin/toolkits/${t.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-16 rounded-lg overflow-hidden bg-muted shrink-0 relative flex items-center justify-center">
                              {t.cover_image_url ? (
                                <img
                                  src={`${t.cover_image_url}?v=${new Date(t.updated_at || t.created_at).getTime()}`}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-lg">{t.icon_emoji || "🚀"}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{t.name}</p>
                              <p className="text-xs text-muted-foreground font-mono truncate">{t.slug}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${s.className}`}>{s.label}</Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">{counts.pillarsByToolkit[t.id] || 0}</TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">{counts.cardsByToolkit[t.id] || 0}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(t.created_at), "dd MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title={t.cover_image_url ? "Régénérer la couverture" : "Générer la couverture"}
                              disabled={isCoverLoading}
                              onClick={(e) => { e.stopPropagation(); triggerCover(t.id); }}
                            >
                              {isCoverLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              title="Supprimer"
                              onClick={(e) => { e.stopPropagation(); handleDelete(t.id, t.name); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

        {/* Step dialogs (mounted outside list) */}
        <StepDialog
          open={open}
          onOpenChange={setOpen}
          steps={steps}
          onComplete={handleCreate}
          completing={create.isPending}
          title="Nouveau toolkit"
          icon={Package}
          completeLabel="Créer le toolkit"
        />
        <StepDialog
          open={aiOpen}
          onOpenChange={setAiOpen}
          steps={aiSteps}
          onComplete={handleGenerate}
          completing={false}
          title="Générer un toolkit par IA"
          icon={Wand2}
          completeLabel="✨ Lancer la génération"
        />

        {/* Generation Progress Dialog */}
        <Dialog open={genDialogOpen} onOpenChange={(v) => { if (genState.phase !== "generating") setGenDialogOpen(v); }}>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <DialogTitle className="sr-only">Génération en cours</DialogTitle>
            <AnimatePresence mode="wait">
              {genState.phase === "generating" && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col gap-4"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Wand2 className="h-6 w-6 text-primary-foreground animate-pulse" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {genState.toolkitEmoji} {genState.toolkitName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formatElapsed(elapsed)}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary">{progressPercent}%</span>
                  </div>

                  <Progress value={progressPercent} className="h-2" />

                  {/* Timeline */}
                  <div className="overflow-y-auto max-h-[50vh] pr-1 space-y-1">
                    {genState.timeline.map((entry, i) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 py-1.5 px-2 rounded-lg"
                      >
                        <div className="shrink-0">
                          {entry.status === "done" && (
                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <Check className="h-3 w-3 text-primary" />
                            </div>
                          )}
                          {entry.status === "active" && (
                            <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center">
                              <CircleDot className="h-3 w-3 text-accent animate-pulse" />
                            </div>
                          )}
                          {entry.status === "pending" && (
                            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                            </div>
                          )}
                          {entry.status === "error" && (
                            <div className="h-5 w-5 rounded-full bg-destructive/10 flex items-center justify-center">
                              <span className="text-xs text-destructive">✕</span>
                            </div>
                          )}
                        </div>
                        <span className={`text-sm flex-1 ${entry.status === "done" ? "text-foreground" : entry.status === "active" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {entry.label}
                        </span>
                        {entry.detail && (
                          <span className="text-xs text-muted-foreground shrink-0">{entry.detail}</span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {genState.phase === "complete" && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center gap-5 py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                  >
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl shadow-lg">
                      {genState.toolkitEmoji || "🚀"}
                    </div>
                  </motion.div>

                  <div>
                    <h2 className="text-xl font-display font-bold text-foreground">Toolkit généré !</h2>
                    <p className="text-sm text-muted-foreground mt-1">{genState.toolkitName}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 w-full">
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{genState.totalPillars}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">Piliers</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{genState.totalCards}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">Cartes</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{genState.totalQuiz}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">Quiz</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Généré en {formatElapsed(elapsed)}
                  </p>

                  <div className="flex flex-col w-full gap-2">
                    <Button
                      className="w-full gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground"
                      onClick={() => {
                        setGenDialogOpen(false);
                        setGenState(initialGenState);
                        if (genState.toolkitId) navigate(`/admin/toolkits/${genState.toolkitId}`);
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                      Découvrir le toolkit
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full gap-2 text-muted-foreground"
                      onClick={() => {
                        setGenDialogOpen(false);
                        setGenState(initialGenState);
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Retour à la liste
                    </Button>
                  </div>
                </motion.div>
              )}

              {genState.phase === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center text-center gap-4 py-4"
                >
                  <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                    <span className="text-3xl">⚠️</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-foreground">Erreur de génération</h2>
                    <p className="text-sm text-muted-foreground mt-1">{genState.errorMessage}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {genState.totalCards > 0
                      ? `${genState.totalCards} cartes ont été générées avant l'erreur.`
                      : "Aucune donnée n'a été générée."}
                    {genState.toolkitId && " Le toolkit partiel est consultable."}
                  </p>
                  <div className="flex flex-col w-full gap-2">
                    {genState.toolkitId && (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => {
                          setGenDialogOpen(false);
                          setGenState(initialGenState);
                          navigate(`/admin/toolkits/${genState.toolkitId}`);
                        }}
                      >
                        Voir le toolkit partiel
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full gap-2 text-muted-foreground"
                      onClick={() => {
                        setGenDialogOpen(false);
                        setGenState(initialGenState);
                      }}
                    >
                      Fermer
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}
