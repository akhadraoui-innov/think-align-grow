import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Trash2, Save } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  pillars: Tables<"pillars">[];
  toolkitId: string;
  onUpdate: () => void;
}

export function ToolkitPillarsTab({ pillars, toolkitId, onUpdate }: Props) {
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [newPillar, setNewPillar] = useState({ name: "", slug: "", color: "#3b82f6", icon_name: "", sort_order: pillars.length });

  const handleAdd = async () => {
    if (!newPillar.name || !newPillar.slug) return;
    setAdding(true);
    try {
      const { error } = await supabase.from("pillars").insert({ ...newPillar, toolkit_id: toolkitId });
      if (error) throw error;
      toast({ title: "Pilier ajouté" });
      setNewPillar({ name: "", slug: "", color: "#3b82f6", icon_name: "", sort_order: pillars.length + 1 });
      onUpdate();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("pillars").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pilier supprimé" });
      onUpdate();
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ordre</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nom</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Couleur</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Icône</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {pillars.map((p) => (
              <tr key={p.id} className="border-b border-border/30">
                <td className="px-4 py-3 text-muted-foreground">{p.sort_order}</td>
                <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.slug}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: p.color || "#ccc" }} />
                    <span className="text-xs text-muted-foreground">{p.color}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{p.icon_name || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
            {pillars.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Aucun pilier</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-card p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Ajouter un pilier</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Input placeholder="Nom" value={newPillar.name} onChange={(e) => setNewPillar((f) => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }))} />
          <Input placeholder="Slug" value={newPillar.slug} onChange={(e) => setNewPillar((f) => ({ ...f, slug: e.target.value }))} />
          <input type="color" value={newPillar.color} onChange={(e) => setNewPillar((f) => ({ ...f, color: e.target.value }))} className="h-10 w-full rounded-md border border-input cursor-pointer" />
          <Input placeholder="Icône (ex: Brain)" value={newPillar.icon_name} onChange={(e) => setNewPillar((f) => ({ ...f, icon_name: e.target.value }))} />
          <Button onClick={handleAdd} disabled={adding} className="gap-2">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}
