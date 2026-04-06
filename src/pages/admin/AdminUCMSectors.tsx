import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";

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

  return (
    <AdminShell>
      <PageTransition>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Secteurs UCM</h1>
            <Button onClick={() => { setEditSector({}); setForm({ label: "", icon: "", group_name: "", knowledge: "", functions: "{}", code: "" }); }}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <Card key={group}>
                <CardHeader><CardTitle className="text-base">{group}</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(items as any[]).map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{s.icon}</span>
                          <span className="font-medium">{s.label}</span>
                          <Badge variant={s.is_active ? "default" : "secondary"} className="text-xs">
                            {s.is_active ? "Actif" : "Inactif"}
                          </Badge>
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
                  <DialogTitle>{editSector.id ? "Modifier" : "Ajouter"} un secteur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Label</label>
                      <Input value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Icône (emoji)</label>
                      <Input value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Groupe</label>
                    <Input value={form.group_name} onChange={(e) => setForm((p) => ({ ...p, group_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Knowledge sectoriel</label>
                    <Textarea value={form.knowledge} onChange={(e) => setForm((p) => ({ ...p, knowledge: e.target.value }))} rows={4} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fonctions (JSON)</label>
                    <Textarea value={form.functions} onChange={(e) => setForm((p) => ({ ...p, functions: e.target.value }))} rows={8} className="font-mono text-xs" />
                  </div>
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
