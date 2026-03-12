import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import { useAdminToolkits } from "@/hooks/useAdminToolkits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2, Sparkles, FileText, Eye, Package, Wand2, Users, Settings2, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { StepDialog, type StepDef } from "@/components/admin/StepDialog";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-muted text-muted-foreground border-border" },
  published: { label: "Publié", className: "bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30" },
  archived: { label: "Archivé", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

const GENERATING_MESSAGES = [
  "Création du toolkit...",
  "Analyse du domaine...",
  "Génération des piliers...",
  "Rédaction des cartes...",
  "Structuration pédagogique...",
  "Calibrage des niveaux...",
  "Génération du quiz...",
  "Finalisation...",
];

export default function AdminToolkits() {
  const navigate = useNavigate();
  const { toolkits, isLoading, counts, create, generateWithAI } = useAdminToolkits();
  const { toast } = useToast();

  // Manual create dialog
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", icon_emoji: "🚀", status: "draft" as const });

  // AI generate dialog
  const [aiOpen, setAiOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genMsgIdx, setGenMsgIdx] = useState(0);
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

  const handleCreate = async () => {
    if (!form.name || !form.slug) return;
    try {
      await create.mutateAsync(form);
      toast({ title: "Toolkit créé" });
      setOpen(false);
      setForm({ name: "", slug: "", description: "", icon_emoji: "🚀", status: "draft" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const handleGenerate = async () => {
    if (!aiForm.name || !aiForm.slug) return;
    setGenerating(true);
    setGenMsgIdx(0);
    const interval = setInterval(() => {
      setGenMsgIdx((i) => (i + 1) % GENERATING_MESSAGES.length);
    }, 4000);
    try {
      const result = await generateWithAI.mutateAsync(aiForm);
      clearInterval(interval);
      setGenerating(false);
      setAiOpen(false);
      toast({ title: "Toolkit généré !", description: `${result.pillars_count} piliers créés avec succès.` });
      navigate(`/admin/toolkits/${result.toolkit_id}`);
    } catch (e: any) {
      clearInterval(interval);
      setGenerating(false);
      toast({ title: "Erreur de génération", description: e.message, variant: "destructive" });
    }
  };

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
        <div className="space-y-4">
          {generating ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Wand2 className="h-8 w-8 text-primary-foreground animate-pulse" />
                </div>
                <div className="absolute -inset-2 rounded-3xl border-2 border-primary/20 animate-ping" />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={genMsgIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm font-medium text-foreground"
                >
                  {GENERATING_MESSAGES[genMsgIdx]}
                </motion.p>
              </AnimatePresence>
              <p className="text-xs text-muted-foreground">Cela peut prendre 30 à 60 secondes...</p>
            </div>
          ) : (
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
          )}
        </div>
      ),
    },
  ];

  const columns = [
    {
      key: "name",
      label: "Nom",
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-lg bg-muted shrink-0">
            {row.icon_emoji || "🚀"}
          </div>
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (row: any) => {
        const s = STATUS_MAP[row.status] || STATUS_MAP.draft;
        return <Badge variant="outline" className={`text-xs ${s.className}`}>{s.label}</Badge>;
      },
    },
    {
      key: "pillars",
      label: "Piliers",
      render: (row: any) => <span className="text-sm text-muted-foreground">{counts.pillarsByToolkit[row.id] || 0}</span>,
    },
    {
      key: "cards",
      label: "Cartes",
      render: (row: any) => <span className="text-sm text-muted-foreground">{counts.cardsByToolkit[row.id] || 0}</span>,
    },
    {
      key: "created_at",
      label: "Créé le",
      sortable: true,
      render: (row: any) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.created_at), "dd MMM yyyy", { locale: fr })}
        </span>
      ),
    },
  ];

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Toolkits</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérer les toolkits et leur contenu</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            data={toolkits}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Rechercher un toolkit..."
            onRowClick={(row) => navigate(`/admin/toolkits/${row.id}`)}
            actions={
              <>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Nouveau toolkit
                </Button>
                <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground" onClick={() => setAiOpen(true)}>
                  <Wand2 className="h-4 w-4" />
                  Générer par IA
                </Button>
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
                  onOpenChange={(v) => { if (!generating) setAiOpen(v); }}
                  steps={aiSteps}
                  onComplete={handleGenerate}
                  completing={generating}
                  title="Générer un toolkit par IA"
                  icon={Wand2}
                  completeLabel="✨ Lancer la génération"
                />
              </>
            }
          />
        )}
      </div>
    </AdminShell>
  );
}
