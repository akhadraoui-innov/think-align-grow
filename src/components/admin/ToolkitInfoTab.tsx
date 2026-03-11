import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  toolkit: Tables<"toolkits">;
  onUpdate: () => void;
}

export function ToolkitInfoTab({ toolkit, onUpdate }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const [form, setForm] = useState(() => buildForm(toolkit));

  function buildForm(tk: Tables<"toolkits">) {
    return {
      name: tk.name,
      slug: tk.slug,
      description: tk.description || "",
      icon_emoji: tk.icon_emoji || "🚀",
      status: tk.status,
      version: (tk as any).version || "1.0",
      difficulty_level: (tk as any).difficulty_level || "",
      estimated_duration: (tk as any).estimated_duration || "",
      tags: Array.isArray((tk as any).tags) ? (tk as any).tags as string[] : [],
      target_audience: (tk as any).target_audience || "",
      benefits: (tk as any).benefits || "",
      usage_mode: (tk as any).usage_mode || "",
      content_description: (tk as any).content_description || "",
      credit_cost_workshop: (tk as any).credit_cost_workshop ?? 0,
      credit_cost_challenge: (tk as any).credit_cost_challenge ?? 0,
      terms: (tk as any).terms || "",
      nomenclature: (tk as any).nomenclature || "",
    };
  }

  useEffect(() => {
    setForm(buildForm(toolkit));
  }, [toolkit]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("toolkits").update(form as any).eq("id", toolkit.id);
      if (error) throw error;
      toast({ title: "Toolkit mis à jour" });
      onUpdate();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6">
      {/* Section 1: Identité */}
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Identité</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Emoji</Label>
            <Input value={form.icon_emoji} onChange={(e) => set("icon_emoji", e.target.value)} className="w-20 text-center text-lg" />
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={form.status} onValueChange={(v: any) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Version</Label>
            <Input value={form.version} onChange={(e) => set("version", e.target.value)} placeholder="1.0" />
          </div>
          <div className="space-y-2">
            <Label>Niveau de difficulté</Label>
            <Select value={form.difficulty_level} onValueChange={(v) => set("difficulty_level", v)}>
              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="debutant">Débutant</SelectItem>
                <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                <SelectItem value="avance">Avancé</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Durée estimée</Label>
            <Input value={form.estimated_duration} onChange={(e) => set("estimated_duration", e.target.value)} placeholder="Ex: 2h, 1 journée..." />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Ajouter un tag..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} className="max-w-xs" />
            <Button variant="outline" size="sm" onClick={addTag} type="button">+</Button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Description & Contenu */}
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Description & Contenu</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Description générale</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>À qui ça s'adresse</Label>
            <Textarea value={form.target_audience} onChange={(e) => set("target_audience", e.target.value)} rows={2} placeholder="Profils cibles, prérequis..." />
          </div>
          <div className="space-y-2">
            <Label>Ça apporte quoi / Bénéfices</Label>
            <Textarea value={form.benefits} onChange={(e) => set("benefits", e.target.value)} rows={2} placeholder="Valeur ajoutée, compétences acquises..." />
          </div>
          <div className="space-y-2">
            <Label>Mode d'utilisation</Label>
            <Textarea value={form.usage_mode} onChange={(e) => set("usage_mode", e.target.value)} rows={2} placeholder="Comment utiliser ce toolkit..." />
          </div>
          <div className="space-y-2">
            <Label>Description du contenu</Label>
            <Textarea value={form.content_description} onChange={(e) => set("content_description", e.target.value)} rows={3} placeholder="Détail du contenu inclus..." />
          </div>
        </div>
      </div>

      {/* Section 3: Crédits, Tarifs & Conditions */}
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Crédits, Tarifs & Conditions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Coût crédits / Workshop</Label>
            <Input type="number" value={form.credit_cost_workshop} onChange={(e) => set("credit_cost_workshop", parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Coût crédits / Challenge</Label>
            <Input type="number" value={form.credit_cost_challenge} onChange={(e) => set("credit_cost_challenge", parseInt(e.target.value) || 0)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Conditions d'utilisation</Label>
          <Textarea value={form.terms} onChange={(e) => set("terms", e.target.value)} rows={3} placeholder="Règles d'utilisation, licences..." />
        </div>
        <div className="space-y-2">
          <Label>Nomenclature / Classification</Label>
          <Textarea value={form.nomenclature} onChange={(e) => set("nomenclature", e.target.value)} rows={2} placeholder="Référence interne, catégorie..." />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </Button>
      </div>

      {/* Section 4: Métadonnées */}
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-2">
        <h3 className="font-semibold text-foreground">Métadonnées</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">ID</span><p className="font-mono text-xs text-foreground mt-0.5">{toolkit.id}</p></div>
          <div><span className="text-muted-foreground">Créé le</span><p className="text-foreground mt-0.5">{format(new Date(toolkit.created_at), "dd MMM yyyy HH:mm", { locale: fr })}</p></div>
          <div><span className="text-muted-foreground">Mis à jour</span><p className="text-foreground mt-0.5">{format(new Date(toolkit.updated_at), "dd MMM yyyy HH:mm", { locale: fr })}</p></div>
        </div>
      </div>
    </div>
  );
}
