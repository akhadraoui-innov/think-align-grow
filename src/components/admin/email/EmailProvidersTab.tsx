import { useState } from "react";
import { Plus, Save, Trash2, Send, Lock, Activity, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  useEmailProviders, useEmailProviderConfigs, useUpsertEmailProviderConfig, useDeleteEmailProviderConfig,
} from "@/hooks/useEmailProviders";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";

export function EmailProvidersTab({ organizationId }: { organizationId: string | null }) {
  const perms = usePermissions();
  const canManage = perms.has("email.providers.manage");

  const { data: providers = [] } = useEmailProviders();
  const { data: configs = [] } = useEmailProviderConfigs(organizationId);
  const upsert = useUpsertEmailProviderConfig();
  const del = useDeleteEmailProviderConfig();

  const [editing, setEditing] = useState<any | null>(null);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; detail: string; circuit: string }>>({});

  const handleTest = async (configId: string) => {
    setTesting(t => ({ ...t, [configId]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("test-email-provider", {
        body: { config_id: configId },
      });
      if (error) throw error;
      const res = data as any;
      setTestResults(r => ({ ...r, [configId]: { ok: !!res.ok, detail: res.detail || res.error || "", circuit: res.circuit_breaker || "closed" } }));
      if (res.ok) toast.success("Connexion OK", { description: res.detail });
      else toast.error("Connexion KO", { description: res.detail || res.error });
    } catch (e: any) {
      toast.error("Test impossible", { description: e?.message });
    } finally {
      setTesting(t => ({ ...t, [configId]: false }));
    }
  };

  const handleSave = async () => {
    if (!editing?.provider_code || !editing?.from_email) {
      toast.error("Provider et email expéditeur requis");
      return;
    }
    try {
      await upsert.mutateAsync({
        id: editing.id,
        organization_id: editing.organization_id ?? organizationId,
        provider_code: editing.provider_code,
        from_email: editing.from_email,
        from_name: editing.from_name,
        reply_to: editing.reply_to,
        is_default: editing.is_default,
        is_active: editing.is_active ?? true,
        credentials: editing.credentials_input,
      });
      toast.success("Configuration enregistrée");
      setEditing(null);
    } catch (e: any) {
      toast.error("Erreur", { description: e?.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Fournisseurs d'email</h2>
          <p className="text-xs text-muted-foreground">
            {organizationId ? "Configurations spécifiques à l'organisation" : "Configurations globales (plateforme)"}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setEditing({
            provider_code: "lovable",
            from_email: "noreply@growthinnov.com",
            from_name: "GROWTHINNOV",
            is_default: configs.length === 0,
            is_active: true,
            organization_id: organizationId,
          })}>
            <Plus className="h-4 w-4 mr-1" />Ajouter un fournisseur
          </Button>
        )}
      </div>

      <div className="grid gap-3">
        {configs.map(c => {
          const provider = providers.find(p => p.code === c.provider_code);
          return (
            <Card key={c.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Send className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{provider?.name || c.provider_code}</span>
                    {c.is_default && <Badge variant="default" className="text-[10px]">Défaut</Badge>}
                    {!c.is_active && <Badge variant="secondary" className="text-[10px]">Inactif</Badge>}
                    {!c.organization_id && <Badge variant="outline" className="text-[10px]">Global</Badge>}
                    {testResults[c.id] && (
                      <Badge variant={testResults[c.id].ok ? "default" : "destructive"} className="text-[10px] gap-1">
                        {testResults[c.id].ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {testResults[c.id].ok ? "OK" : "KO"}
                      </Badge>
                    )}
                    {testResults[c.id]?.circuit === "open" && (
                      <Badge variant="destructive" className="text-[10px] gap-1">
                        <Activity className="h-3 w-3" />Circuit ouvert
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {c.from_name ? `${c.from_name} <${c.from_email}>` : c.from_email}
                  </div>
                  {testResults[c.id]?.detail && (
                    <div className="text-[10px] text-muted-foreground mt-1">{testResults[c.id].detail}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => handleTest(c.id)} disabled={testing[c.id]}>
                  {testing[c.id] ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Activity className="h-3 w-3 mr-1" />}
                  Tester
                </Button>
                {canManage && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ ...c, credentials_input: undefined })}>Éditer</Button>
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
        {configs.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Aucun fournisseur configuré pour ce périmètre
          </Card>
        )}
      </div>

      <Sheet open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Configuration fournisseur</SheetTitle>
          </SheetHeader>
          {editing && (() => {
            const provider = providers.find(p => p.code === editing.provider_code);
            const schema = (provider?.config_schema || {}) as any;
            const fields: { key: string; label: string; type: string; required?: boolean }[] = schema.fields || [];

            return (
              <div className="space-y-4 mt-6">
                <div>
                  <Label className="text-xs">Fournisseur</Label>
                  <Select value={editing.provider_code} onValueChange={v => setEditing({ ...editing, provider_code: v, credentials_input: {} })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {providers.map(p => <SelectItem key={p.id} value={p.code}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {provider?.description && <p className="text-[10px] text-muted-foreground mt-1">{provider.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Email expéditeur</Label>
                    <Input value={editing.from_email || ""} onChange={e => setEditing({ ...editing, from_email: e.target.value })} placeholder="noreply@example.com" />
                  </div>
                  <div>
                    <Label className="text-xs">Nom affiché</Label>
                    <Input value={editing.from_name || ""} onChange={e => setEditing({ ...editing, from_name: e.target.value })} placeholder="GROWTHINNOV" />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Reply-To (optionnel)</Label>
                  <Input value={editing.reply_to || ""} onChange={e => setEditing({ ...editing, reply_to: e.target.value })} />
                </div>

                {fields.length > 0 && (
                  <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <Lock className="h-3 w-3" />
                      Identifiants (chiffrés au repos)
                    </div>
                    {fields.map(f => (
                      <div key={f.key}>
                        <Label className="text-xs">{f.label}{f.required && " *"}</Label>
                        <Input
                          type={f.type === "password" ? "password" : "text"}
                          placeholder={editing.id ? "Laisser vide pour conserver la valeur" : ""}
                          value={editing.credentials_input?.[f.key] || ""}
                          onChange={e => setEditing({
                            ...editing,
                            credentials_input: { ...(editing.credentials_input || {}), [f.key]: e.target.value },
                          })}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={editing.is_default ?? false} onCheckedChange={v => setEditing({ ...editing, is_default: v })} />
                    <Label className="text-xs">Défaut</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={editing.is_active ?? true} onCheckedChange={v => setEditing({ ...editing, is_active: v })} />
                    <Label className="text-xs">Actif</Label>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={upsert.isPending} className="w-full">
                  <Save className="h-4 w-4 mr-1" />Enregistrer
                </Button>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
