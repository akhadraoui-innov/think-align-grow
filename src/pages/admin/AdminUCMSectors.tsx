import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Globe, CheckCircle, FolderTree } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";

function StatsCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-xl font-bold text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminUCMSectors() {
  const qc = useQueryClient();
  const { data: sectors, isLoading } = useQuery({
    queryKey: ["admin-ucm-sectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ucm_sectors")
        .select("*")
        .is("organization_id", null)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const [editSector, setEditSector] = useState<any>(null);
  const [form, setForm] = useState({ label: "", icon: "", group_name: "", knowledge: "", functions: "{}", code: "" });

  const openEdit = (s: any) => {
    setEditSector(s);
    setForm({
      label: s.label,
      icon: s.icon || "",
      group_name: s.group_name || "",
      knowledge: s.knowledge || "",
      functions: JSON.stringify(s.functions || {}, null, 2),
      code: s.code || "",
    });
  };

  const saveSector = useMutation({
    mutationFn: async () => {
      let parsedFunctions = {};
      try { parsedFunctions = JSON.parse(form.functions); } catch { throw new Error("JSON functions invalide"); }
      const payload = { ...form, functions: parsedFunctions };
      if (editSector?.id) {
        const { error } = await supabase.from("ucm_sectors").update(payload).eq("id", editSector.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ucm_sectors").insert([{ ...payload, code: form.code || form.label.toLowerCase().replace(/\s+/g, "_"), is_active: true, sort_order: (sectors?.length || 0) + 1 }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Secteur sauvegardé");
      qc.invalidateQueries({ queryKey: ["admin-ucm-sectors"] });
      setEditSector(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const groups = (sectors || []).reduce((acc: Record<string, any[]>, s: any) => {
    const g = s.group_name || "Autre";
    if (!acc[g]) acc[g] = [];
    acc[g].push(s);
    return acc;
  }, {});

  const activeSectors = (sectors || []).filter((s: any) => s.is_active).length;
  const groupCount = Object.keys(groups).length;

  const getFunctionsCount = (s: any) => {
    try {
      const f = s.functions || {};
      return Object.keys(f).length;
    } catch { return 0; }
  };

  return (
    <AdminShell>
      <PageTransition>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-display">Secteurs UCM</h1>
              <p className="text-sm text-muted-foreground">Catalogue des secteurs d'activité et knowledge sectoriel</p>
            </div>
            <Button onClick={() => { setEditSector({}); setForm({ label: "", icon: "", group_name: "", knowledge: "", functions: "{}", code: "" }); }}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter
            </Button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <StatsCard icon={Globe} label="Total secteurs" value={sectors?.length || 0} color="bg-primary/10 text-primary" />
            <StatsCard icon={CheckCircle} label="Secteurs actifs" value={activeSectors} color="bg-emerald-500/10 text-emerald-500" />
            <StatsCard icon={FolderTree} label="Groupes" value={groupCount} color="bg-violet-500/10 text-violet-500" />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <Card key={group} className="rounded-xl border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{(items as any[])[0]?.icon || "📁"}</span>
                      <CardTitle className="text-base">{group}</CardTitle>
                      <Badge variant="outline" className="text-xs font-mono">{(items as any[]).length}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(items as any[]).map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{s.icon}</span>
                          <div>
                            <span className="font-medium text-sm">{s.label}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant={s.is_active ? "default" : "secondary"} className="text-[10px] h-4">
                                {s.is_active ? "Actif" : "Inactif"}
                              </Badge>
                              {getFunctionsCount(s) > 0 && (
                                <span className="text-[10px] text-muted-foreground">{getFunctionsCount(s)} fonctions</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {editSector && (
            <Dialog open={!!editSector} onOpenChange={(open) => { if (!open) setEditSector(null); }}>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    {form.icon && <span className="text-4xl">{form.icon}</span>}
                    <DialogTitle>{editSector.id ? "Modifier" : "Ajouter"} un secteur</DialogTitle>
                  </div>
                </DialogHeader>
                <Separator />
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Label</Label>
                      <Input value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Icône (emoji)</Label>
                      <Input value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Groupe</Label>
                    <Input value={form.group_name} onChange={(e) => setForm((p) => ({ ...p, group_name: e.target.value }))} />
                  </div>
                  <Separator />
                  <div className="space-y-1.5">
                    <Label>Knowledge sectoriel</Label>
                    <Textarea value={form.knowledge} onChange={(e) => setForm((p) => ({ ...p, knowledge: e.target.value }))} rows={4} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fonctions (JSON)</Label>
                    <Textarea value={form.functions} onChange={(e) => setForm((p) => ({ ...p, functions: e.target.value }))} rows={8} className="font-mono text-xs" />
                  </div>
                  <Separator />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditSector(null)}>Annuler</Button>
                    <Button onClick={() => saveSector.mutate()} disabled={saveSector.isPending}>
                      {saveSector.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Sauvegarder
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </PageTransition>
    </AdminShell>
  );
}
