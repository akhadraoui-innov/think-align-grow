import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus, ArrowLeft, Pencil, Trash2, Save, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CampaignForm {
  name: string;
  description: string;
  path_id: string;
  organization_id: string;
  status: string;
  starts_at: string;
  ends_at: string;
}

const emptyForm: CampaignForm = {
  name: "",
  description: "",
  path_id: "",
  organization_id: "",
  status: "draft",
  starts_at: new Date().toISOString().slice(0, 10),
  ends_at: "",
};

export default function AdminAcademyCampaigns() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignForm>(emptyForm);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["admin-academy-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_campaigns")
        .select("*, academy_paths(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: paths = [] } = useQuery({
    queryKey: ["admin-academy-paths-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_paths")
        .select("id, name, status")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ["admin-orgs-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name,
        description: form.description,
        path_id: form.path_id,
        organization_id: form.organization_id,
        status: form.status,
        starts_at: form.starts_at,
        ends_at: form.ends_at || null,
      };
      if (editId) {
        const { error } = await supabase.from("academy_campaigns").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("academy_campaigns").insert({ ...payload, created_by: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-campaigns"] });
      toast.success(editId ? "Campagne mise à jour" : "Campagne créée");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academy_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-campaigns"] });
      toast.success("Campagne supprimée");
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(c: any) {
    setEditId(c.id);
    setForm({
      name: c.name,
      description: c.description || "",
      path_id: c.path_id,
      organization_id: c.organization_id,
      status: c.status,
      starts_at: c.starts_at ? c.starts_at.slice(0, 10) : "",
      ends_at: c.ends_at ? c.ends_at.slice(0, 10) : "",
    });
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
    setEditId(null);
  }

  const statusColor = (s: string) => {
    if (s === "active") return "default";
    if (s === "completed") return "secondary";
    return "outline";
  };

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/academy")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Megaphone className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-display font-bold">Campagnes de formation</h1>
            <Badge variant="secondary">{campaigns.length}</Badge>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Nouvelle campagne
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4"><div className="h-4 bg-muted rounded w-1/3" /></CardContent>
              </Card>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Megaphone className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucune campagne créée.</p>
              <p className="text-xs mt-1">Déployez des parcours de formation ciblés.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c: any) => (
              <Card key={c.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.academy_paths?.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{c.starts_at ? format(new Date(c.starts_at), "d MMM yyyy", { locale: fr }) : "—"}</span>
                      {c.ends_at && <span>→ {format(new Date(c.ends_at), "d MMM yyyy", { locale: fr })}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={statusColor(c.status) as any}>{c.status}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier la campagne" : "Nouvelle campagne"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom de la campagne</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Formation IA Q1 2026" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Parcours de formation</Label>
              <Select value={form.path_id || "none"} onValueChange={v => setForm({ ...form, path_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Choisir un parcours" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Choisir —</SelectItem>
                  {paths.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.status !== "published" && `(${p.status})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Organisation</Label>
              <Select value={form.organization_id || "none"} onValueChange={v => setForm({ ...form, organization_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Choisir une organisation" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Choisir —</SelectItem>
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date de début</Label>
                <Input type="date" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Date de fin (optionnel)</Label>
                <Input type="date" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}>Annuler</Button>
              <Button onClick={() => upsert.mutate()} disabled={!form.name || !form.path_id || !form.organization_id || upsert.isPending}>
                <Save className="h-4 w-4 mr-2" /> {editId ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
