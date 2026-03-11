import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import { useOrganizations } from "@/hooks/useOrganizations";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
            <p className="font-medium text-foreground">{row.name}</p>
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
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouvelle organisation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une organisation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Nom</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }))}
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input
                        value={form.slug}
                        onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                        placeholder="acme-corp"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Couleur principale</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={form.primary_color}
                          onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
                          className="h-9 w-9 rounded-lg border border-border cursor-pointer"
                        />
                        <Input
                          value={form.primary_color}
                          onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <Button onClick={handleCreate} disabled={create.isPending} className="w-full">
                      {create.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
