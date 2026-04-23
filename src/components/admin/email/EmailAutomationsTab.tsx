import { useState } from "react";
import { Plus, Sparkles, Trash2, Save, LayoutList, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  useEmailAutomations,
  useUpsertEmailAutomation,
  useDeleteEmailAutomation,
  TRIGGER_EVENTS,
  EmailAutomation,
} from "@/hooks/useEmailAutomations";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { usePermissions } from "@/hooks/usePermissions";
import { EmailMarketingAIChat } from "./EmailMarketingAIChat";
import { ConditionsBuilder } from "./ConditionsBuilder";
import { WorkflowTimeline } from "./WorkflowTimeline";

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
  const [view, setView] = useState<"workflow" | "table">("workflow");

  const eventMeta = TRIGGER_EVENTS.find((e) => e.value === editing?.trigger_event);

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
        description: editing.description ?? null,
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

  const handleDuplicate = (a: EmailAutomation) => {
    setEditing({
      code: `${a.code}_copy_${Date.now().toString().slice(-4)}`,
      name: `${a.name} (copie)`,
      description: a.description,
      trigger_event: a.trigger_event,
      template_code: a.template_code,
      delay_minutes: a.delay_minutes,
      conditions: a.conditions,
      organization_id: organizationId,
      is_active: false,
    });
  };

  const newAutomation = (preset?: Partial<EmailAutomation>) => setEditing({
    code: `auto_${Date.now()}`,
    name: "Nouvelle automation",
    description: "",
    trigger_event: "user.created",
    template_code: templates[0]?.code || "welcome",
    delay_minutes: 0,
    conditions: {},
    organization_id: organizationId,
    is_active: false,
    ...preset,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Automations & Workflows</h2>
          <p className="text-xs text-muted-foreground">
            Quand X se produit (+ conditions optionnelles) → Envoyer Z après N minutes. Empilez plusieurs étapes par événement pour créer une séquence.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => newAutomation()}>
            <Plus className="h-4 w-4 mr-1" />Nouvelle automation
          </Button>
        )}
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList>
          <TabsTrigger value="workflow"><GitBranch className="h-3.5 w-3.5 mr-1" />Workflow</TabsTrigger>
          <TabsTrigger value="table"><LayoutList className="h-3.5 w-3.5 mr-1" />Tableau</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="mt-4">
          <WorkflowTimeline automations={automations} onEdit={setEditing} />
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Déclencheur</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Délai</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Portée</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {automations.map((a) => {
                  const condCount = (a.conditions?.all?.length || 0) + (a.conditions?.any?.length || 0);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium text-sm">
                        {a.name}
                        {a.description && <p className="text-[10px] text-muted-foreground truncate max-w-[280px]">{a.description}</p>}
                      </TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-[10px]">{a.trigger_event}</Badge></TableCell>
                      <TableCell><code className="text-xs">{a.template_code}</code></TableCell>
                      <TableCell className="text-xs">{a.delay_minutes > 0 ? `${a.delay_minutes} min` : "Immédiat"}</TableCell>
                      <TableCell>
                        {condCount > 0
                          ? <Badge variant="secondary" className="text-[10px]">{condCount} règle{condCount > 1 ? "s" : ""}</Badge>
                          : <span className="text-[10px] text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {a.organization_id
                          ? <Badge variant="secondary" className="text-[10px]">Org</Badge>
                          : <Badge variant="outline" className="text-[10px]">Global</Badge>}
                      </TableCell>
                      <TableCell>
                        <Switch checked={a.is_active} onCheckedChange={() => canManage && handleToggle(a)} disabled={!canManage} />
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => setEditing(a)}>Éditer</Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDuplicate(a)}>Dupliquer</Button>
                            {a.organization_id && (
                              <Button size="sm" variant="ghost" onClick={() => del.mutate(a.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {automations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">Aucune automation</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-[640px] sm:max-w-[640px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Configurer l'automation</SheetTitle>
          </SheetHeader>
          {editing && (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Code interne</Label>
                  <Input value={editing.code || ""} onChange={(e) => setEditing({ ...editing, code: e.target.value })} className="font-mono text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Nom affiché</Label>
                  <Input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
              </div>

              <div>
                <Label className="text-xs">Description (optionnel)</Label>
                <Textarea
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="À quoi sert cette automation ?"
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-xs">Événement déclencheur</Label>
                <Select value={editing.trigger_event} onValueChange={(v) => setEditing({ ...editing, trigger_event: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_EVENTS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label} <span className="opacity-50 ml-2 font-mono text-[10px]">{e.value}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Template à envoyer</Label>
                <Select value={editing.template_code} onValueChange={(v) => setEditing({ ...editing, template_code: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.code}>
                        {t.name} <span className="opacity-50 ml-2 font-mono text-[10px]">{t.code}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Délai d'envoi (minutes, 0 = immédiat)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editing.delay_minutes ?? 0}
                  onChange={(e) => setEditing({ ...editing, delay_minutes: parseInt(e.target.value) || 0 })}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Astuce : 1440 = +1 jour, 10080 = +1 semaine. Pour des séquences, créez plusieurs automations avec le même événement et différents délais.
                </p>
              </div>

              <Accordion type="single" collapsible defaultValue={Object.keys(editing.conditions || {}).length > 0 ? "conditions" : undefined}>
                <AccordionItem value="conditions">
                  <AccordionTrigger className="text-sm font-semibold">
                    Conditions de déclenchement
                  </AccordionTrigger>
                  <AccordionContent>
                    <ConditionsBuilder
                      value={editing.conditions || {}}
                      onChange={(next) => setEditing({ ...editing, conditions: next })}
                      payloadHints={eventMeta?.payloadHints || []}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex items-center gap-2">
                <Switch checked={editing.is_active ?? false} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
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
                  context={{ available_events: TRIGGER_EVENTS.map((e) => e.value) }}
                  onClose={() => setShowAI(false)}
                  onApply={(r: any) => {
                    setEditing((prev) => prev ? {
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
