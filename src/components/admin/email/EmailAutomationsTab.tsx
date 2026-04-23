import { useState } from "react";
import { Plus, Sparkles, Trash2, Save, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useEmailAutomations, useUpsertEmailAutomation, useDeleteEmailAutomation, TRIGGER_EVENTS, EmailAutomation } from "@/hooks/useEmailAutomations";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { usePermissions } from "@/hooks/usePermissions";
import { EmailMarketingAIChat } from "./EmailMarketingAIChat";

export function EmailAutomationsTab({ organizationId }: { organizationId: string | null }) {
  const perms = usePermissions();
  const canManage = perms.has("email.automations.manage");
  const canCompose = perms.has("email.compose");

  const { data: automations = [] } = useEmailAutomations(organizationId);
  const { data: templates = [] } = useEmailTemplates(organizationId);
  const upsert = useUpsertEmailAutomation();
  const del = useDeleteEmailAutomation();

  const [editing, setEditing] = useState<Partial<EmailAutomation> | null>(null);
  const [showAI, setShowAI] = useState(false);

  const handleSave = async () => {
    if (!editing?.code || !editing?.name || !editing?.trigger_event || !editing?.template_code) {
      toast.error("Tous les champs sont requis");
      return;
    }
    try {
      await upsert.mutateAsync({
        id: editing.id,
        code: editing.code,
        name: editing.name,
        organization_id: editing.organization_id ?? organizationId,
        trigger_event: editing.trigger_event,
        template_code: editing.template_code,
        delay_minutes: editing.delay_minutes ?? 0,
        conditions: editing.conditions ?? {},
        is_active: editing.is_active ?? true,
      });
      toast.success("Automation sauvegardée");
      setEditing(null);
    } catch (e: any) {
      toast.error("Erreur", { description: e?.message });
    }
  };

  const handleToggle = async (a: EmailAutomation) => {
    try {
      await upsert.mutateAsync({ ...a, is_active: !a.is_active });
    } catch (e: any) {
      toast.error("Erreur", { description: e?.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Automations</h2>
          <p className="text-xs text-muted-foreground">Quand X se produit → Envoyer Z après N minutes</p>
        </div>
        {canManage && (
          <Button onClick={() => setEditing({
            code: `auto_${Date.now()}`,
            name: "Nouvelle automation",
            trigger_event: "user.created",
            template_code: templates[0]?.code || "welcome",
            delay_minutes: 0,
            organization_id: organizationId,
            is_active: false,
          })}>
            <Plus className="h-4 w-4 mr-1" />Nouvelle automation
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Déclencheur</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Délai</TableHead>
              <TableHead>Portée</TableHead>
              <TableHead>État</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {automations.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium text-sm">{a.name}</TableCell>
                <TableCell><Badge variant="outline" className="font-mono text-[10px]">{a.trigger_event}</Badge></TableCell>
                <TableCell><code className="text-xs">{a.template_code}</code></TableCell>
                <TableCell className="text-xs">{a.delay_minutes > 0 ? `${a.delay_minutes} min` : "Immédiat"}</TableCell>
                <TableCell>
                  {a.organization_id ? <Badge variant="secondary" className="text-[10px]">Org</Badge> : <Badge variant="outline" className="text-[10px]">Global</Badge>}
                </TableCell>
                <TableCell>
                  <Switch checked={a.is_active} onCheckedChange={() => canManage && handleToggle(a)} disabled={!canManage} />
                </TableCell>
                <TableCell className="text-right">
                  {canManage && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(a)}>Éditer</Button>
                      {a.organization_id && (
                        <Button size="sm" variant="ghost" onClick={() => del.mutate(a.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {automations.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Aucune automation</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Configurer l'automation</SheetTitle>
          </SheetHeader>
          {editing && (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Code interne</Label>
                  <Input value={editing.code || ""} onChange={e => setEditing({ ...editing, code: e.target.value })} className="font-mono text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Nom affiché</Label>
                  <Input value={editing.name || ""} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                </div>
              </div>

              <div>
                <Label className="text-xs">Événement déclencheur</Label>
                <Select value={editing.trigger_event} onValueChange={v => setEditing({ ...editing, trigger_event: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_EVENTS.map(e => <SelectItem key={e.value} value={e.value}>{e.label} <span className="opacity-50 ml-2 font-mono text-[10px]">{e.value}</span></SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Template à envoyer</Label>
                <Select value={editing.template_code} onValueChange={v => setEditing({ ...editing, template_code: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {templates.map(t => <SelectItem key={t.id} value={t.code}>{t.name} <span className="opacity-50 ml-2 font-mono text-[10px]">{t.code}</span></SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Délai d'envoi (minutes, 0 = immédiat)</Label>
                <Input type="number" min={0} value={editing.delay_minutes ?? 0} onChange={e => setEditing({ ...editing, delay_minutes: parseInt(e.target.value) || 0 })} />
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={editing.is_active ?? false} onCheckedChange={v => setEditing({ ...editing, is_active: v })} />
                <Label className="text-xs">Activer cette automation</Label>
              </div>

              <div className="flex justify-between pt-4 border-t">
                {canCompose && (
                  <Button variant="outline" onClick={() => setShowAI(true)}>
                    <Sparkles className="h-4 w-4 mr-1" />Suggérer un déclencheur
                  </Button>
                )}
                <Button onClick={handleSave} disabled={upsert.isPending} className="ml-auto">
                  <Save className="h-4 w-4 mr-1" />Sauvegarder
                </Button>
              </div>
            </div>
          )}

          {showAI && (
            <div className="fixed inset-0 z-50 bg-background/95 flex">
              <div className="flex-1" onClick={() => setShowAI(false)} />
              <div className="w-[420px]">
                <EmailMarketingAIChat
                  mode="automation_design"
                  context={{ available_events: TRIGGER_EVENTS.map(e => e.value) }}
                  onClose={() => setShowAI(false)}
                  onApply={(r: any) => {
                    setEditing(prev => prev ? {
                      ...prev,
                      trigger_event: r.trigger_event ?? prev.trigger_event,
                      template_code: r.template_code ?? prev.template_code,
                      delay_minutes: r.delay_minutes ?? prev.delay_minutes,
                      conditions: r.conditions ?? prev.conditions,
                    } : prev);
                    setShowAI(false);
                  }}
                />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
