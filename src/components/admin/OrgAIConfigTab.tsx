import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Info, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DEFAULT_PROMPTS } from "@/constants/defaultPrompts";

interface OrgAIConfigTabProps {
  organizationId: string;
}

interface Provider {
  id: string;
  slug: string;
  name: string;
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

export function OrgAIConfigTab({ organizationId }: OrgAIConfigTabProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [hasConfig, setHasConfig] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [providerId, setProviderId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelChat, setModelChat] = useState("google/gemini-3-flash-preview");
  const [modelStructured, setModelStructured] = useState("google/gemini-3-flash-preview");
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [maxTokens, setMaxTokens] = useState(1000);
  const [temperature, setTemperature] = useState(0.7);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: provData }, { data: configData }] = await Promise.all([
      supabase.from("ai_providers").select("id, slug, name, is_active").order("slug"),
      supabase.from("ai_configurations").select("*").eq("organization_id", organizationId).maybeSingle(),
    ]);
    setProviders((provData as any[]) || []);
    if (configData) {
      const c = configData as any;
      setConfigId(c.id);
      setHasConfig(true);
      setEnabled(c.is_active);
      setProviderId(c.provider_id);
      setApiKey(c.api_key || "");
      setModelChat(c.model_chat);
      setModelStructured(c.model_structured);
      setPrompts(c.prompts || {});
      setMaxTokens(c.max_tokens);
      setTemperature(Number(c.temperature));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!providerId) {
      toast.error("Sélectionnez un fournisseur");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        organization_id: organizationId,
        provider_id: providerId,
        api_key: apiKey || null,
        model_chat: modelChat,
        model_structured: modelStructured,
        prompts,
        max_tokens: maxTokens,
        temperature,
        is_active: enabled,
      };

      if (configId) {
        const { error } = await supabase.from("ai_configurations").update(payload).eq("id", configId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("ai_configurations").insert(payload).select().single();
        if (error) throw error;
        setConfigId((data as any).id);
        setHasConfig(true);
      }
      toast.success("Configuration IA de l'organisation sauvegardée");
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!configId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("ai_configurations").delete().eq("id", configId);
      if (error) throw error;
      setConfigId(null);
      setHasConfig(false);
      setEnabled(false);
      setProviderId("");
      setApiKey("");
      setPrompts({});
      toast.success("Configuration IA supprimée — l'organisation utilise désormais la config globale");
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          {hasConfig
            ? "Cette organisation utilise une configuration IA spécifique."
            : "Cette organisation utilise la configuration globale. Activez une surcharge pour personnaliser."}
        </p>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4">
        <div>
          <p className="text-sm font-bold">Configuration spécifique</p>
          <p className="text-xs text-muted-foreground">Surcharger la configuration globale pour cette organisation</p>
        </div>
        <Switch checked={enabled} onCheckedChange={(v) => { setEnabled(v); if (!hasConfig && v && providers.length > 0) setProviderId(providers[0].id); }} />
      </div>

      {enabled && (
        <div className="rounded-xl border border-border/50 bg-card p-6 space-y-6">
          {/* Provider & Key */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Fournisseur</Label>
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {providers.filter(p => p.is_active).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Clé API</Label>
              <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Laisser vide pour Lovable AI" />
            </div>
          </div>

          {/* Models */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Modèle Chat</Label>
              <Input value={modelChat} onChange={(e) => setModelChat(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Modèle Structuré</Label>
              <Input value={modelStructured} onChange={(e) => setModelStructured(e.target.value)} />
            </div>
          </div>

          {/* Temp & Tokens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Température ({temperature})</Label>
              <Slider min={0} max={2} step={0.1} value={[temperature]} onValueChange={([v]) => setTemperature(v)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Max tokens</Label>
              <Input type="number" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1000)} />
            </div>
          </div>

          {/* Prompts */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold">Prompts système (surcharges)</h3>
            {PROMPT_KEYS.map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Textarea
                  value={prompts[key] || ""}
                  onChange={(e) => setPrompts(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder="Laisser vide pour le prompt par défaut"
                  className="min-h-[80px] text-xs"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Sauvegarder
            </Button>
            {hasConfig && (
              <Button variant="outline" onClick={handleDelete} disabled={saving} className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" /> Supprimer la surcharge
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
