import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import { useAdminChallenges } from "@/hooks/useAdminChallenges";
import { useAdminToolkits } from "@/hooks/useAdminToolkits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Swords, Sparkles, Settings, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { StepDialog, type StepDef } from "@/components/admin/StepDialog";

const DIFFICULTY_MAP: Record<string, { label: string; className: string }> = {
  beginner: { label: "Débutant", className: "bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30" },
  intermediate: { label: "Intermédiaire", className: "bg-primary/10 text-primary border-primary/30" },
  advanced: { label: "Avancé", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export default function AdminDesignInnovation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { templates, sessionCounts, isLoading, create } = useAdminChallenges();
  const { toolkits } = useAdminToolkits();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", difficulty: "intermediate", toolkit_id: "" });

  const handleCreate = async () => {
    if (!form.name || !form.toolkit_id) return;
    setCreating(true);
    try {
      const result = await create.mutateAsync({
        name: form.name,
        description: form.description || null,
        difficulty: form.difficulty,
        toolkit_id: form.toolkit_id,
      });
      toast({ title: "Template créé" });
      setOpen(false);
      setForm({ name: "", description: "", difficulty: "intermediate", toolkit_id: "" });
      navigate(`/admin/design-innovation/${result.id}`);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const selectedToolkit = toolkits.find((t) => t.id === form.toolkit_id);
  const diffLabel = DIFFICULTY_MAP[form.difficulty]?.label || form.difficulty;

  const steps: StepDef[] = [
    {
      title: "Identité",
      description: "Nommez votre template de challenge",
      icon: Sparkles,
      canProceed: !!form.name.trim(),
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Nom *</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Diagnostic Business Model" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Description du template..." className="resize-none" />
          </div>
        </div>
      ),
    },
    {
      title: "Configuration",
      description: "Associez un toolkit et un niveau",
      icon: Settings,
      canProceed: !!form.toolkit_id,
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Toolkit *</label>
            <Select value={form.toolkit_id} onValueChange={(v) => setForm((f) => ({ ...f, toolkit_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Choisir un toolkit..." /></SelectTrigger>
              <SelectContent>
                {toolkits.map((tk) => (
                  <SelectItem key={tk.id} value={tk.id}>
                    {tk.icon_emoji || "🚀"} {tk.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Difficulté</label>
            <Select value={form.difficulty} onValueChange={(v) => setForm((f) => ({ ...f, difficulty: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Débutant</SelectItem>
                <SelectItem value="intermediate">Intermédiaire</SelectItem>
                <SelectItem value="advanced">Avancé</SelectItem>
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
            <span className="text-xs text-muted-foreground">Nom</span>
            <span className="text-sm font-medium text-foreground">{form.name || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Toolkit</span>
            <span className="text-sm font-medium text-foreground">
              {selectedToolkit ? `${selectedToolkit.icon_emoji || "🚀"} ${selectedToolkit.name}` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Difficulté</span>
            <Badge variant="outline" className={`text-[10px] ${DIFFICULTY_MAP[form.difficulty]?.className || ""}`}>
              {diffLabel}
            </Badge>
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

  const columns = [
    {
      key: "name",
      label: "Nom",
      sortable: true,
      render: (row: any) => (
        <div>
          <span className="font-semibold text-foreground text-sm">{row.name}</span>
          {row.description && (
            <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "toolkit",
      label: "Toolkit",
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <span className="text-sm">
            {row.toolkits?.icon_emoji || "🚀"} {row.toolkits?.name || "—"}
          </span>
          {row.toolkits?.status && (
            <Badge variant="outline" className={`text-[9px] px-1 py-0 ${row.toolkits.status === "published" ? "bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30" : "bg-muted text-muted-foreground border-border"}`}>
              {row.toolkits.status === "published" ? "Publié" : "Brouillon"}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "difficulty",
      label: "Difficulté",
      render: (row: any) => {
        const d = DIFFICULTY_MAP[row.difficulty] || DIFFICULTY_MAP.intermediate;
        return <Badge variant="outline" className={`text-[10px] ${d.className}`}>{d.label}</Badge>;
      },
    },
    {
      key: "subjects",
      label: "Sujets",
      render: (row: any) => (
        <span className="text-sm font-mono text-muted-foreground">
          {row.challenge_subjects?.length || 0}
        </span>
      ),
    },
    {
      key: "sessions",
      label: "Sessions",
      render: (row: any) => (
        <span className="text-sm font-mono text-muted-foreground">
          {sessionCounts[row.id] || 0}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Créé le",
      sortable: true,
      render: (row: any) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.created_at), "dd MMM yyyy", { locale: fr })}
        </span>
      ),
    },
  ];

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Swords className="h-6 w-6 text-primary" />
              Design Innovation
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gérer les templates de challenges et diagnostics
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            data={templates}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Rechercher un template..."
            onRowClick={(row) => navigate(`/admin/design-innovation/${row.id}`)}
            actions={
              <>
                <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4" /> Nouveau template
                </Button>
                <StepDialog
                  open={open}
                  onOpenChange={setOpen}
                  steps={steps}
                  onComplete={handleCreate}
                  completing={creating}
                  title="Nouveau template"
                  icon={Swords}
                  completeLabel="Créer le template"
                />
              </>
            }
          />
        )}
      </div>
    </AdminShell>
  );
}
