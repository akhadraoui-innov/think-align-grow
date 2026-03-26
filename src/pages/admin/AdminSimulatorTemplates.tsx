import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ArrowLeft, Plus, Zap, Pencil, Trash2, Loader2, Copy } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MODE_REGISTRY, UNIVERSE_LABELS, getModeDefinition, getAllUniverses } from "@/components/simulator/config/modeRegistry";
import { getConfigFields } from "@/components/simulator/config/typeConfigSchemas";
import { toast } from "sonner";

export default function AdminSimulatorTemplates() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    scenario: "",
    system_prompt: "",
    practice_type: "conversation",
    type_config: {} as Record<string, unknown>,
    max_exchanges: 10,
    difficulty: "intermediate",
    ai_assistance_level: "guided",
    evaluation_rubric: [] as any[],
    organization_id: null as string | null,
  });

  // Fetch organizations for assignment
  const { data: orgs = [] } = useQuery({
    queryKey: ["admin-orgs-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: practices = [], isLoading } = useQuery({
    queryKey: ["admin-standalone-practices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_practices")
        .select("*")
        .is("module_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title,
        scenario: form.scenario,
        system_prompt: form.system_prompt,
        practice_type: form.practice_type,
        type_config: form.type_config,
        max_exchanges: form.max_exchanges,
        difficulty: form.difficulty,
        ai_assistance_level: form.ai_assistance_level,
        evaluation_rubric: form.evaluation_rubric,
        organization_id: form.organization_id,
      };
      if (editId) {
        const { error } = await supabase.from("academy_practices").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("academy_practices").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-standalone-practices"] });
      toast.success(editId ? "Template mis à jour" : "Template créé");
      setDialogOpen(false);
      setEditId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academy_practices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-standalone-practices"] });
      toast.success("Supprimé");
    },
  });

  const duplicate = useMutation({
    mutationFn: async (pr: any) => {
      const { id, created_at, ...rest } = pr;
      const { error } = await supabase.from("academy_practices").insert({
        ...rest,
        title: `${rest.title} (copie)`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-standalone-practices"] });
      toast.success("Dupliqué");
    },
  });

  const filtered = practices.filter((p: any) =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.practice_type?.includes(search.toLowerCase())
  );

  function openEdit(pr: any) {
    setEditId(pr.id);
    setForm({
      title: pr.title,
      scenario: pr.scenario || "",
      system_prompt: pr.system_prompt || "",
      practice_type: pr.practice_type || "conversation",
      type_config: pr.type_config || {},
      max_exchanges: pr.max_exchanges || 10,
      difficulty: pr.difficulty || "intermediate",
      ai_assistance_level: pr.ai_assistance_level || "guided",
      evaluation_rubric: pr.evaluation_rubric || [],
      organization_id: pr.organization_id || null,
    });
    setDialogOpen(true);
  }

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/simulator")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <div>
            <h1 className="text-xl font-display font-bold">Bibliothèque de Templates</h1>
            <p className="text-xs text-muted-foreground">Simulations standalone assignables aux organisations</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9" />
          </div>
          <Button size="sm" onClick={() => { setEditId(null); setForm({ title: "", scenario: "", system_prompt: "", practice_type: "conversation", type_config: {}, max_exchanges: 10, difficulty: "intermediate", ai_assistance_level: "guided", evaluation_rubric: [], organization_id: null }); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Nouveau template
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Aucun template standalone.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((pr: any) => {
              const def = getModeDefinition(pr.practice_type);
              return (
                <Card key={pr.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2 px-5 pt-5">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Zap className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate">{pr.title}</span>
                        {def && <Badge className="text-[9px] bg-primary/10 text-primary border-0 shrink-0">{def.label}</Badge>}
                        <Badge variant="outline" className="text-[9px] shrink-0">{pr.ai_assistance_level || "guided"}</Badge>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicate.mutate(pr)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(pr)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(pr.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <p className="text-xs text-muted-foreground line-clamp-2">{pr.scenario}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-[9px]">{pr.max_exchanges} échanges</Badge>
                      <Badge variant="secondary" className="text-[9px]">{pr.difficulty}</Badge>
                      {pr.organization_id && <Badge variant="outline" className="text-[9px]">Org spécifique</Badge>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Modifier le template" : "Nouveau template de simulation"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type de simulation</Label>
                  <Select value={form.practice_type} onValueChange={v => {
                    const modeDef = getModeDefinition(v);
                    setForm(f => ({ ...f, practice_type: v, type_config: modeDef?.defaultConfig || {} }));
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {getAllUniverses().map(u => (
                        <div key={u.value}>
                          <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{u.label}</div>
                          {u.modes.map(([key, def]) => (
                            <SelectItem key={key} value={key} className="text-xs">{def.label}</SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Niveau d'aide IA</Label>
                  <Select value={form.ai_assistance_level} onValueChange={v => setForm(f => ({ ...f, ai_assistance_level: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="autonomous">Autonome — Pas de suggestions</SelectItem>
                      <SelectItem value="guided">Guidé — Suggestions après réponses</SelectItem>
                      <SelectItem value="intensive">Intensif — Coaching proactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Titre</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Scénario</Label>
                <Textarea value={form.scenario} onChange={e => setForm(f => ({ ...f, scenario: e.target.value }))} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Prompt système IA</Label>
                <Textarea value={form.system_prompt} onChange={e => setForm(f => ({ ...f, system_prompt: e.target.value }))} rows={5} className="font-mono text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Échanges max</Label>
                  <Input type="number" min={3} max={30} value={form.max_exchanges} onChange={e => setForm(f => ({ ...f, max_exchanges: parseInt(e.target.value) || 10 }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Difficulté</Label>
                  <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Débutant</SelectItem>
                      <SelectItem value="intermediate">Intermédiaire</SelectItem>
                      <SelectItem value="advanced">Avancé</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Assigner à une organisation (optionnel)</Label>
                <Select value={form.organization_id || "__none__"} onValueChange={v => setForm(f => ({ ...f, organization_id: v === "__none__" ? null : v }))}>
                  <SelectTrigger><SelectValue placeholder="Aucune (public)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Aucune (public)</SelectItem>
                    {orgs.map((o: any) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => upsert.mutate()} disabled={!form.title || upsert.isPending} className="w-full">
                {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editId ? "Mettre à jour" : "Créer le template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}
