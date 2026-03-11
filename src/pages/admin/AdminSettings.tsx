import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Bot, Server, Info } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Provider {
  id: string;
  slug: string;
  name: string;
  base_url: string;
  auth_header_prefix: string;
  is_active: boolean;
}

interface AIConfig {
  id?: string;
  provider_id: string;
  api_key: string;
  model_chat: string;
  model_structured: string;
  prompts: Record<string, string>;
  max_tokens: number;
  temperature: number;
  is_active: boolean;
}

const PROMPT_KEYS = [
  { key: "coach", label: "Coach IA" },
  { key: "reflection", label: "Réflexion stratégique" },
  { key: "deliverables_swot", label: "Livrable — SWOT" },
  { key: "deliverables_bmc", label: "Livrable — BMC" },
  { key: "deliverables_pitch_deck", label: "Livrable — Pitch Deck" },
  { key: "deliverables_action_plan", label: "Livrable — Plan d'action" },
];

export default function AdminSettings() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [config, setConfig] = useState<AIConfig>({
    provider_id: "",
    api_key: "",
    model_chat: "google/gemini-3-flash-preview",
    model_structured: "google/gemini-3-flash-preview",
    prompts: {},
    max_tokens: 1000,
    temperature: 0.7,
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: provData }, { data: configData }] = await Promise.all([
      supabase.from("ai_providers").select("*").order("slug"),
      supabase.from("ai_configurations").select("*").is("organization_id", null).maybeSingle(),
    ]);
    setProviders((provData as any[]) || []);
    if (configData) {
      setConfig({
        id: (configData as any).id,
        provider_id: (configData as any).provider_id,
        api_key: (configData as any).api_key || "",
        model_chat: (configData as any).model_chat,
        model_structured: (configData as any).model_structured,
        prompts: (configData as any).prompts || {},
        max_tokens: (configData as any).max_tokens,
        temperature: Number((configData as any).temperature),
        is_active: (configData as any).is_active,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config.provider_id) {
      toast.error("Sélectionnez un fournisseur");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        provider_id: config.provider_id,
        api_key: config.api_key || null,
        model_chat: config.model_chat,
        model_structured: config.model_structured,
        prompts: config.prompts,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        is_active: config.is_active,
        organization_id: null,
      };

      if (config.id) {
        const { error } = await supabase.from("ai_configurations").update(payload).eq("id", config.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("ai_configurations").insert(payload).select().single();
        if (error) throw error;
        setConfig(prev => ({ ...prev, id: (data as any).id }));
      }
      toast.success("Configuration IA sauvegardée");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const updatePrompt = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, prompts: { ...prev.prompts, [key]: value } }));
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Paramètres</h1>
            <p className="text-sm text-muted-foreground mt-1">Configuration de la plateforme</p>
          </div>
        </div>

        <Tabs defaultValue="ai" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="ai" className="gap-1.5 text-xs">
              <Bot className="h-3.5 w-3.5" /> Configuration IA
            </TabsTrigger>
            <TabsTrigger value="providers" className="gap-1.5 text-xs">
              <Server className="h-3.5 w-3.5" /> Fournisseurs
            </TabsTrigger>
          </TabsList>

          {/* AI Config */}
          <TabsContent value="ai">
            <div className="space-y-6">
              {/* Info banner */}
              <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 flex items-start gap-3">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Sans configuration, <strong>Lovable AI</strong> est utilisé par défaut (aucune clé API requise). Configurez un fournisseur personnalisé pour utiliser votre propre compte.
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-card p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-display font-bold">Configuration globale</h2>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="config-active" className="text-xs text-muted-foreground">Active</Label>
                    <Switch id="config-active" checked={config.is_active} onCheckedChange={(v) => setConfig(prev => ({ ...prev, is_active: v }))} />
                  </div>
                </div>

                {/* Provider */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Fournisseur</Label>
                    <Select value={config.provider_id} onValueChange={(v) => setConfig(prev => ({ ...prev, provider_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.filter(p => p.is_active).map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Clé API</Label>
                    <Input type="password" value={config.api_key} onChange={(e) => setConfig(prev => ({ ...prev, api_key: e.target.value }))} placeholder="Laisser vide pour Lovable AI" />
                  </div>
                </div>

                {/* Models */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Modèle Chat</Label>
                    <Input value={config.model_chat} onChange={(e) => setConfig(prev => ({ ...prev, model_chat: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Modèle Structuré</Label>
                    <Input value={config.model_structured} onChange={(e) => setConfig(prev => ({ ...prev, model_structured: e.target.value }))} />
                  </div>
                </div>

                {/* Temperature & Max tokens */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Température ({config.temperature})</Label>
                    <Slider min={0} max={2} step={0.1} value={[config.temperature]} onValueChange={([v]) => setConfig(prev => ({ ...prev, temperature: v }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Max tokens</Label>
                    <Input type="number" value={config.max_tokens} onChange={(e) => setConfig(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 1000 }))} />
                  </div>
                </div>

                {/* Prompts */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold">Prompts système</h3>
                  {PROMPT_KEYS.map(({ key, label }) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-xs">{label}</Label>
                      <Textarea
                        value={config.prompts[key] || ""}
                        onChange={(e) => updatePrompt(key, e.target.value)}
                        placeholder="Laisser vide pour le prompt par défaut"
                        className="min-h-[80px] text-xs"
                      />
                    </div>
                  ))}
                </div>

                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Sauvegarder
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Providers */}
          <TabsContent value="providers">
            <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
              <h2 className="text-lg font-display font-bold">Fournisseurs IA</h2>
              <div className="space-y-3">
                {providers.map(p => (
                  <div key={p.id} className="rounded-xl border border-border/50 bg-secondary/20 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.slug} · {p.base_url}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Auth: {p.auth_header_prefix}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${p.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
                        {p.is_active ? "Actif" : "Inactif"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
