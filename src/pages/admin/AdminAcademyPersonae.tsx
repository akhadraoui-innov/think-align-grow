import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, ArrowLeft, Pencil, Trash2, X, Save } from "lucide-react";
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

interface PersonaForm {
  name: string;
  description: string;
  status: string;
  characteristics: {
    seniority: string;
    department: string;
    goals: string[];
    pain_points: string[];
  };
}

const emptyForm: PersonaForm = {
  name: "",
  description: "",
  status: "draft",
  characteristics: { seniority: "", department: "", goals: [], pain_points: [] },
};

export default function AdminAcademyPersonae() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PersonaForm>(emptyForm);
  const [goalsText, setGoalsText] = useState("");
  const [painText, setPainText] = useState("");

  const { data: personae = [], isLoading } = useQuery({
    queryKey: ["admin-academy-personae"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_personae")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const chars = {
        ...form.characteristics,
        goals: goalsText.split("\n").map(s => s.trim()).filter(Boolean),
        pain_points: painText.split("\n").map(s => s.trim()).filter(Boolean),
      };
      if (editId) {
        const { error } = await supabase
          .from("academy_personae")
          .update({ name: form.name, description: form.description, status: form.status, characteristics: chars })
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("academy_personae")
          .insert({ name: form.name, description: form.description, status: form.status, characteristics: chars, created_by: user!.id, generation_mode: "manual" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-personae"] });
      toast.success(editId ? "Persona mis à jour" : "Persona créé");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academy_personae").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-personae"] });
      toast.success("Persona supprimé");
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setGoalsText("");
    setPainText("");
    setOpen(true);
  }

  function openEdit(p: any) {
    setEditId(p.id);
    const chars = p.characteristics || {};
    setForm({
      name: p.name,
      description: p.description || "",
      status: p.status,
      characteristics: { seniority: chars.seniority || "", department: chars.department || "", goals: chars.goals || [], pain_points: chars.pain_points || [] },
    });
    setGoalsText((chars.goals || []).join("\n"));
    setPainText((chars.pain_points || []).join("\n"));
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
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-display font-bold">Personae</h1>
            <Badge variant="secondary">{personae.length}</Badge>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Nouveau persona
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
        ) : personae.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun persona créé.</p>
              <p className="text-xs mt-1">Créez des profils cibles pour personnaliser vos parcours.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {personae.map((p: any) => {
              const chars = p.characteristics || {};
              return (
                <Card key={p.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                      {(chars.seniority || chars.department) && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {[chars.seniority, chars.department].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={p.status === "published" ? "default" : "secondary"}>{p.status}</Badge>
                      <Badge variant="outline" className="text-[10px]">{p.generation_mode}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier le persona" : "Nouveau persona"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Directeur Commercial PME" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Profil type, contexte, enjeux..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Séniorité</Label>
                <Input value={form.characteristics.seniority} onChange={e => setForm({ ...form, characteristics: { ...form.characteristics, seniority: e.target.value } })} placeholder="Ex: C-Level, Manager" />
              </div>
              <div className="space-y-1.5">
                <Label>Département</Label>
                <Input value={form.characteristics.department} onChange={e => setForm({ ...form, characteristics: { ...form.characteristics, department: e.target.value } })} placeholder="Ex: Commercial, RH" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Objectifs (un par ligne)</Label>
              <Textarea value={goalsText} onChange={e => setGoalsText(e.target.value)} placeholder="Accélérer le closing&#10;Améliorer le pipe" rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Points de douleur (un par ligne)</Label>
              <Textarea value={painText} onChange={e => setPainText(e.target.value)} placeholder="Manque de données fiables&#10;Cycle de vente trop long" rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                </SelectContent>
              </Select>
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
