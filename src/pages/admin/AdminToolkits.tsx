import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import { useAdminToolkits } from "@/hooks/useAdminToolkits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-muted text-muted-foreground border-border" },
  published: { label: "Publié", className: "bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30" },
  archived: { label: "Archivé", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export default function AdminToolkits() {
  const navigate = useNavigate();
  const { toolkits, isLoading, counts, create } = useAdminToolkits();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", icon_emoji: "🚀", status: "draft" as const });

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
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouveau toolkit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un toolkit</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-[60px_1fr] gap-3">
                      <div className="space-y-2">
                        <Label>Emoji</Label>
                        <Input value={form.icon_emoji} onChange={(e) => setForm((f) => ({ ...f, icon_emoji: e.target.value }))} className="text-center text-lg" />
                      </div>
                      <div className="space-y-2">
                        <Label>Nom</Label>
                        <Input
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }))}
                          placeholder="Bootstrap in Business"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="bootstrap-in-business" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label>Statut</Label>
                      <Select value={form.status} onValueChange={(v: any) => setForm((f) => ({ ...f, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="published">Publié</SelectItem>
                          <SelectItem value="archived">Archivé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreate} disabled={create.isPending} className="w-full">
                      {create.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Créer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            }
          />
        )}
      </div>
    </AdminShell>
  );
}
