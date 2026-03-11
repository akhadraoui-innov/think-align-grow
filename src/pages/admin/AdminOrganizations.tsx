import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import { useOrganizations } from "@/hooks/useOrganizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Building2, Sparkles, Palette, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { StepDialog, type StepDef } from "@/components/admin/StepDialog";

export default function AdminOrganizations() {
  const navigate = useNavigate();
  const { organizations, isLoading, create } = useOrganizations();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", primary_color: "#E8552D" });

  const handleCreate = async () => {
    if (!form.name || !form.slug) return;
    try {
      await create.mutateAsync(form);
      toast({ title: "Organisation créée" });
      setOpen(false);
      setForm({ name: "", slug: "", primary_color: "#E8552D" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const steps: StepDef[] = [
    {
      title: "Identité",
      description: "Nommez l'organisation",
      icon: Sparkles,
      canProceed: !!form.name.trim() && !!form.slug.trim(),
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Nom *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }))}
              placeholder="Acme Corp"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Slug *</label>
            <Input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="acme-corp"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Personnalisation",
      description: "Couleur de marque",
      icon: Palette,
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Couleur principale</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
                className="h-10 w-10 rounded-xl border border-border cursor-pointer"
              />
              <Input
                value={form.primary_color}
                onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>
          {/* Preview */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-muted/30">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: form.primary_color }}
            >
              {form.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{form.name || "Aperçu"}</p>
              <p className="text-xs text-muted-foreground">/{form.slug || "slug"}</p>
            </div>
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
            <span className="text-xs text-muted-foreground">Slug</span>
            <span className="text-sm font-mono text-foreground">{form.slug || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Couleur</span>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded" style={{ backgroundColor: form.primary_color }} />
              <span className="text-sm font-mono text-foreground">{form.primary_color}</span>
            </div>
          </div>
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
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: row.primary_color || "#E8552D" }}
          >
            {row.name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{row.name}</p>
              {(row as any).is_platform_owner && (
                <Badge variant="outline" className="text-[9px] bg-destructive/10 text-destructive border-destructive/30">SaaS</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Créée le",
      sortable: true,
      render: (row: any) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.created_at), "dd MMM yyyy", { locale: fr })}
        </span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: () => (
        <Badge variant="outline" className="bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30 text-xs">
          Actif
        </Badge>
      ),
    },
  ];

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Organisations</h1>
            <p className="text-sm text-muted-foreground mt-1">Gérer les organisations clientes</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            data={organizations}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Rechercher une organisation..."
            onRowClick={(row) => navigate(`/admin/organizations/${row.id}`)}
            actions={
              <>
                <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Nouvelle organisation
                </Button>
                <StepDialog
                  open={open}
                  onOpenChange={setOpen}
                  steps={steps}
                  onComplete={handleCreate}
                  completing={create.isPending}
                  title="Nouvelle organisation"
                  icon={Building2}
                  gradient="business"
                  completeLabel="Créer l'organisation"
                />
              </>
            }
          />
        )}
      </div>
    </AdminShell>
  );
}
