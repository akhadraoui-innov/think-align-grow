import { useState } from "react";
import { Save, Image as ImageIcon, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

export function EmailDomainBrandingTab() {
  const perms = usePermissions();
  const canManage = perms.isSaasTeam;

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: orgs = [] } = useQuery({
    queryKey: ["email-orgs-with-branding"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("organizations") as any)
        .select("id, name, brand_logo_url, email_sender_domain, email_tracking_enabled, inactivity_reminder_days, email_features_override, plan_id")
        .order("name");
      if (error) throw error;
      return data as any[];
    },
  });

  const selected = orgs.find(o => o.id === selectedOrgId) || null;

  const update = useMutation({
    mutationFn: async (patch: any) => {
      const { error } = await (supabase.from("organizations") as any).update(patch).eq("id", selectedOrgId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mise à jour enregistrée");
      qc.invalidateQueries({ queryKey: ["email-orgs-with-branding"] });
    },
    onError: (e: any) => toast.error("Erreur", { description: e?.message }),
  });

  return (
    <div className="grid grid-cols-12 gap-4">
      <aside className="col-span-3">
        <Card className="p-3">
          <h3 className="text-sm font-semibold mb-2">Organisations</h3>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {orgs.map(o => (
              <button
                key={o.id}
                onClick={() => setSelectedOrgId(o.id)}
                className={`w-full text-left p-2 rounded text-xs ${selectedOrgId === o.id ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
              >
                <div className="font-medium">{o.name}</div>
                <div className="flex items-center gap-1 mt-1">
                  {o.brand_logo_url && <Badge variant="outline" className="text-[9px]">Logo</Badge>}
                  {o.email_sender_domain && <Badge variant="outline" className="text-[9px]">Domaine</Badge>}
                </div>
              </button>
            ))}
          </div>
        </Card>
      </aside>

      <main className="col-span-9 space-y-4">
        {!selected ? (
          <Card className="p-12 text-center text-sm text-muted-foreground">Sélectionnez une organisation</Card>
        ) : (
          <>
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Co-branding & Logo</h3>
              </div>
              <div>
                <Label className="text-xs">URL du logo de l'organisation</Label>
                <Input
                  value={selected.brand_logo_url || ""}
                  placeholder="https://… (PNG/SVG, hauteur recommandée 36px)"
                  onChange={e => selected.brand_logo_url = e.target.value}
                  disabled={!canManage}
                  defaultValue={selected.brand_logo_url || ""}
                />
              </div>
              {selected.brand_logo_url && (
                <div className="rounded border border-border p-3 bg-muted/30">
                  <img src={selected.brand_logo_url} alt="Logo" className="h-10" />
                </div>
              )}
              {canManage && (
                <Button size="sm" onClick={() => update.mutate({ brand_logo_url: selected.brand_logo_url || null })}>
                  <Save className="h-3.5 w-3.5 mr-1" />Enregistrer le logo
                </Button>
              )}
            </Card>

            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Domaine d'expédition</h3>
              </div>
              <div>
                <Label className="text-xs">Domaine sender (ex. notify.acme.com) — Enterprise</Label>
                <Input
                  defaultValue={selected.email_sender_domain || ""}
                  placeholder="notify.client.com"
                  onBlur={e => canManage && update.mutate({ email_sender_domain: e.target.value || null })}
                  disabled={!canManage}
                />
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <h3 className="font-semibold">Préférences RGPD & Inactivité</h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Tracking emails (pixel + clics)</Label>
                  <p className="text-[10px] text-muted-foreground">Opt-in RGPD — désactivé par défaut</p>
                </div>
                <Switch
                  checked={selected.email_tracking_enabled}
                  onCheckedChange={v => canManage && update.mutate({ email_tracking_enabled: v })}
                  disabled={!canManage}
                />
              </div>
              <div>
                <Label className="text-xs">Période d'inactivité avant rappel (jours)</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  defaultValue={selected.inactivity_reminder_days ?? 30}
                  onBlur={e => canManage && update.mutate({ inactivity_reminder_days: parseInt(e.target.value) || 30 })}
                  disabled={!canManage}
                />
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <h3 className="font-semibold">Surcharges de plan (exception)</h3>
              <p className="text-xs text-muted-foreground">Active manuellement un flag premium pour cette organisation, indépendamment de son plan.</p>
              {(["custom_email_domain", "custom_email_provider", "email_co_branding"] as const).map(flag => {
                const overrides = (selected.email_features_override || {}) as any;
                return (
                  <div key={flag} className="flex items-center justify-between">
                    <Label className="text-xs font-mono">{flag}</Label>
                    <Switch
                      checked={!!overrides[flag]}
                      onCheckedChange={v => {
                        if (!canManage) return;
                        const next = { ...overrides, [flag]: v };
                        update.mutate({ email_features_override: next });
                      }}
                      disabled={!canManage}
                    />
                  </div>
                );
              })}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
