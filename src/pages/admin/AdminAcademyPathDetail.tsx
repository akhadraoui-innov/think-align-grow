import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, Save, GripVertical, BookOpen, Pencil } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ModuleForm {
  title: string;
  description: string;
  module_type: string;
  estimated_minutes: number;
  status: string;
}

const emptyModule: ModuleForm = {
  title: "",
  description: "",
  module_type: "lesson",
  estimated_minutes: 30,
  status: "draft",
};

export default function AdminAcademyPathDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [moduleOpen, setModuleOpen] = useState(false);
  const [editModuleId, setEditModuleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleForm>(emptyModule);

  const { data: path, isLoading } = useQuery({
    queryKey: ["admin-academy-path", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_paths")
        .select("*, academy_personae(name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: pathModules = [] } = useQuery({
    queryKey: ["admin-academy-path-modules", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_path_modules")
        .select("*, academy_modules(*)")
        .eq("path_id", id!)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const createModule = useMutation({
    mutationFn: async () => {
      // Create the module
      const { data: mod, error: modErr } = await supabase
        .from("academy_modules")
        .insert({
          title: moduleForm.title,
          description: moduleForm.description,
          module_type: moduleForm.module_type,
          estimated_minutes: moduleForm.estimated_minutes,
          status: moduleForm.status,
          generation_mode: "manual",
        })
        .select("id")
        .single();
      if (modErr) throw modErr;

      // Link to path
      const { error: linkErr } = await supabase
        .from("academy_path_modules")
        .insert({
          path_id: id!,
          module_id: mod.id,
          sort_order: pathModules.length,
        });
      if (linkErr) throw linkErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-path-modules", id] });
      toast.success("Module créé et ajouté au parcours");
      setModuleOpen(false);
      setEditModuleId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateModule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("academy_modules")
        .update({
          title: moduleForm.title,
          description: moduleForm.description,
          module_type: moduleForm.module_type,
          estimated_minutes: moduleForm.estimated_minutes,
          status: moduleForm.status,
        })
        .eq("id", editModuleId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-path-modules", id] });
      toast.success("Module mis à jour");
      setModuleOpen(false);
      setEditModuleId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeModule = useMutation({
    mutationFn: async (pmId: string) => {
      const { error } = await supabase.from("academy_path_modules").delete().eq("id", pmId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-path-modules", id] });
      toast.success("Module retiré du parcours");
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openCreateModule() {
    setEditModuleId(null);
    setModuleForm(emptyModule);
    setModuleOpen(true);
  }

  function openEditModule(m: any) {
    setEditModuleId(m.id);
    setModuleForm({
      title: m.title,
      description: m.description || "",
      module_type: m.module_type,
      estimated_minutes: m.estimated_minutes || 30,
      status: m.status,
    });
    setModuleOpen(true);
  }

  if (isLoading) {
    return (
      <AdminShell>
        <div className="p-6 animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </AdminShell>
    );
  }

  if (!path) {
    return (
      <AdminShell>
        <div className="p-6 text-center text-muted-foreground">
          <p>Parcours introuvable.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/admin/academy/paths")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
        </div>
      </AdminShell>
    );
  }

  const moduleTypeLabel: Record<string, string> = {
    lesson: "Leçon",
    quiz: "Quiz",
    exercise: "Exercice",
    practice: "Pratique IA",
  };

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/academy/paths")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-display font-bold">{path.name}</h1>
            <p className="text-xs text-muted-foreground">{path.description}</p>
          </div>
          <Badge variant={path.status === "published" ? "default" : "secondary"}>{path.status}</Badge>
          {path.difficulty && <Badge variant="outline">{path.difficulty}</Badge>}
        </div>

        {/* Info summary */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {path.academy_personae?.name && <span>🎯 Persona : {path.academy_personae.name}</span>}
          {path.estimated_hours > 0 && <span>⏱ {path.estimated_hours}h estimées</span>}
          {path.certificate_enabled && <span>🏆 Certificat activé</span>}
        </div>

        {/* Modules section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Modules ({pathModules.length})
            </h2>
            <Button size="sm" onClick={openCreateModule}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter un module
            </Button>
          </div>

          {pathModules.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                Aucun module dans ce parcours. Ajoutez-en pour structurer la formation.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {pathModules.map((pm: any, idx: number) => {
                const mod = pm.academy_modules;
                if (!mod) return null;
                return (
                  <Card key={pm.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{mod.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px]">
                          {moduleTypeLabel[mod.module_type] || mod.module_type}
                        </Badge>
                        {mod.estimated_minutes && (
                          <span className="text-[10px] text-muted-foreground">{mod.estimated_minutes} min</span>
                        )}
                        <Badge variant={mod.status === "published" ? "default" : "secondary"} className="text-[10px]">
                          {mod.status}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModule(mod)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeModule.mutate(pm.id)}>
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
      </div>

      {/* Module create/edit dialog */}
      <Dialog open={moduleOpen} onOpenChange={setModuleOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editModuleId ? "Modifier le module" : "Nouveau module"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Titre</Label>
              <Input value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="Ex: Introduction à l'IA générative" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={moduleForm.description} onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })} rows={3} placeholder="Objectifs et contenu du module..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={moduleForm.module_type} onValueChange={v => setModuleForm({ ...moduleForm, module_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson">Leçon</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="exercise">Exercice</SelectItem>
                    <SelectItem value="practice">Pratique IA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Durée estimée (min)</Label>
                <Input type="number" min={0} value={moduleForm.estimated_minutes} onChange={e => setModuleForm({ ...moduleForm, estimated_minutes: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={moduleForm.status} onValueChange={v => setModuleForm({ ...moduleForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModuleOpen(false)}>Annuler</Button>
              <Button
                onClick={() => editModuleId ? updateModule.mutate() : createModule.mutate()}
                disabled={!moduleForm.title || createModule.isPending || updateModule.isPending}
              >
                <Save className="h-4 w-4 mr-2" /> {editModuleId ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
