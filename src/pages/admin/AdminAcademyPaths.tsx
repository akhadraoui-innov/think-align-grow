import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Route, Plus, ArrowLeft, Pencil, Trash2, Save, Clock, BookOpen } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

interface PathForm {
  name: string;
  description: string;
  difficulty: string;
  estimated_hours: number;
  status: string;
  certificate_enabled: boolean;
  persona_id: string;
}

const emptyForm: PathForm = {
  name: "",
  description: "",
  difficulty: "intermediate",
  estimated_hours: 0,
  status: "draft",
  certificate_enabled: false,
  persona_id: "",
};

export default function AdminAcademyPaths() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PathForm>(emptyForm);

  const { data: paths = [], isLoading } = useQuery({
    queryKey: ["admin-academy-paths"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_paths")
        .select("*, academy_personae(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: personae = [] } = useQuery({
    queryKey: ["admin-academy-personae-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_personae")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: moduleCounts = {} } = useQuery({
    queryKey: ["admin-academy-path-module-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_path_modules")
        .select("path_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => { counts[r.path_id] = (counts[r.path_id] || 0) + 1; });
      return counts;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name,
        description: form.description,
        difficulty: form.difficulty,
        estimated_hours: form.estimated_hours,
        status: form.status,
        certificate_enabled: form.certificate_enabled,
        persona_id: form.persona_id || null,
      };
      if (editId) {
        const { error } = await supabase.from("academy_paths").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("academy_paths").insert({ ...payload, created_by: user!.id, generation_mode: "manual" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-paths"] });
      toast.success(editId ? "Parcours mis à jour" : "Parcours créé");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academy_paths").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-paths"] });
      toast.success("Parcours supprimé");
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(p: any) {
    setEditId(p.id);
    setForm({
      name: p.name,
      description: p.description || "",
      difficulty: p.difficulty || "intermediate",
      estimated_hours: p.estimated_hours || 0,
      status: p.status,
      certificate_enabled: p.certificate_enabled,
      persona_id: p.persona_id || "",
    });
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
    setEditId(null);
  }

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/academy")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Route className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-display font-bold">Parcours de formation</h1>
            <Badge variant="secondary">{paths.length}</Badge>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Nouveau parcours
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
        ) : paths.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Route className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun parcours créé.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {paths.map((p: any) => (
              <Card key={p.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/admin/academy/paths/${p.id}`)}>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      {p.academy_personae?.name && <span>🎯 {p.academy_personae.name}</span>}
                      {(moduleCounts as any)[p.id] > 0 && (
                        <span className="flex items-center gap-0.5"><BookOpen className="h-3 w-3" /> {(moduleCounts as any)[p.id]} modules</span>
                      )}
                      {p.estimated_hours > 0 && (
                        <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {p.estimated_hours}h</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={p.status === "published" ? "default" : "secondary"}>{p.status}</Badge>
                    {p.difficulty && <Badge variant="outline" className="text-[10px]">{p.difficulty}</Badge>}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(p.id)}>
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
            <DialogTitle>{editId ? "Modifier le parcours" : "Nouveau parcours"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom du parcours</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Intégrer l'IA dans votre stratégie commerciale" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Objectifs, contenu, public cible..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Difficulté</Label>
                <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}>
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
                <Input type="number" min={0} value={form.estimated_hours} onChange={e => setForm({ ...form, estimated_hours: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Persona cible</Label>
              <Select value={form.persona_id} onValueChange={v => setForm({ ...form, persona_id: v })}>
                <SelectTrigger><SelectValue placeholder="Aucun (global)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun (global)</SelectItem>
                  {personae.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
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
              <Switch checked={form.certificate_enabled} onCheckedChange={v => setForm({ ...form, certificate_enabled: v })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}>Annuler</Button>
              <Button onClick={() => upsert.mutate()} disabled={!form.name || upsert.isPending}>
                <Save className="h-4 w-4 mr-2" /> {editId ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
