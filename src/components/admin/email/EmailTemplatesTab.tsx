import { useState, useEffect } from "react";
import { Plus, Sparkles, Trash2, Save, Eye, Send, History, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useEmailTemplates, useUpsertEmailTemplate, useDeleteEmailTemplate, EmailTemplate } from "@/hooks/useEmailTemplates";
import { usePermissions } from "@/hooks/usePermissions";
import { EmailMarketingAIChat } from "./EmailMarketingAIChat";
import { EmailVersionsDrawer } from "./EmailVersionsDrawer";
import { EmailSendTestDialog } from "./EmailSendTestDialog";
import { EmailTranslationsPanel } from "./EmailTranslationsPanel";
import { renderEmail, SAMPLE_VARS } from "@/lib/email-render";

export function EmailTemplatesTab({ organizationId }: { organizationId: string | null }) {
  const perms = usePermissions();
  const canManage = perms.hasAny("email.templates.manage", "email.compose");
  const canCompose = perms.has("email.compose");

  const { data: templates = [], isLoading } = useEmailTemplates(organizationId);
  const upsert = useUpsertEmailTemplate();
  const del = useDeleteEmailTemplate();

  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [showAI, setShowAI] = useState<null | "compose" | "refine">(null);
  const [showVersions, setShowVersions] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);

  useEffect(() => {
    if (!selected && templates.length > 0) setSelected(templates[0]);
  }, [templates, selected]);

  const handleSave = async () => {
    if (!selected) return;
    try {
      await upsert.mutateAsync({
        id: selected.id,
        code: selected.code,
        organization_id: selected.organization_id,
        name: selected.name,
        subject: selected.subject,
        markdown_body: selected.markdown_body,
        is_active: selected.is_active,
        variables: selected.variables,
      });
      toast.success("Template sauvegardé");
    } catch (e: any) {
      toast.error("Erreur", { description: e?.message });
    }
  };

  const handleNew = async () => {
    const code = `custom_${Date.now()}`;
    try {
      const created = await upsert.mutateAsync({
        code,
        name: "Nouveau template",
        subject: "Sujet à définir",
        markdown_body: "# Bonjour {{firstName}}\n\nVotre message…\n\n{{button:CTA|https://example.com}}",
        organization_id: organizationId,
        is_active: false,
      } as any);
      setSelected(created as any);
    } catch (e: any) {
      toast.error("Création impossible", { description: e?.message });
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-260px)]">
      {/* List */}
      <aside className="col-span-3 border border-border rounded-xl bg-card overflow-hidden flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">Templates</h3>
          {canManage && (
            <Button size="sm" variant="outline" onClick={handleNew}>
              <Plus className="h-3.5 w-3.5 mr-1" />Nouveau
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading && <p className="text-xs text-muted-foreground p-2">Chargement…</p>}
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                selected?.id === t.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              <div className="font-medium">{t.name}</div>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant={t.is_active ? "default" : "secondary"} className="text-[9px]">
                  {t.is_active ? "Actif" : "Brouillon"}
                </Badge>
                {!t.organization_id && <Badge variant="outline" className="text-[9px]">Global</Badge>}
                <span className="text-[9px] text-muted-foreground">v{t.version}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Editor */}
      <main className="col-span-9 flex gap-4">
        <div className={`flex-1 flex flex-col gap-3 ${showAI ? "" : ""}`}>
          {selected ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px]">{selected.code}</Badge>
                  <span className="text-xs text-muted-foreground">v{selected.version}</span>
                </div>
                <div className="flex items-center gap-2">
                  {canCompose && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setShowAI("compose")}>
                        <Sparkles className="h-3.5 w-3.5 mr-1" />Générer
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAI("refine")}>
                        <Sparkles className="h-3.5 w-3.5 mr-1" />Améliorer
                      </Button>
                    </>
                  )}
                  {selected.id && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setShowVersions(true)}>
                        <History className="h-3.5 w-3.5 mr-1" />Versions
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowTranslations(true)}>
                        <Languages className="h-3.5 w-3.5 mr-1" />Locales
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setShowTest(true)}>
                    <Send className="h-3.5 w-3.5 mr-1" />Test
                  </Button>
                  {canManage && (
                    <>
                      <div className="flex items-center gap-2">
                        <Switch checked={selected.is_active} onCheckedChange={v => setSelected({ ...selected, is_active: v })} />
                        <Label className="text-xs">Actif</Label>
                      </div>
                      <Button size="sm" onClick={handleSave} disabled={upsert.isPending}>
                        <Save className="h-3.5 w-3.5 mr-1" />Sauvegarder
                      </Button>
                      {selected.organization_id && (
                        <Button size="sm" variant="ghost" onClick={() => del.mutate(selected.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs">Nom interne</Label>
                <Input value={selected.name} onChange={e => setSelected({ ...selected, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Sujet de l'email</Label>
                <Input value={selected.subject} onChange={e => setSelected({ ...selected, subject: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
                <div className="flex flex-col">
                  <Label className="text-xs mb-1">Markdown</Label>
                  <Textarea
                    value={selected.markdown_body}
                    onChange={e => setSelected({ ...selected, markdown_body: e.target.value })}
                    className="flex-1 font-mono text-xs resize-none"
                  />
                </div>
                <div className="flex flex-col min-h-0">
                  <Label className="text-xs mb-1 flex items-center gap-1"><Eye className="h-3 w-3" />Aperçu</Label>
                  <div className="flex-1 overflow-auto rounded-lg border border-border bg-white p-4">
                    <div className="max-w-[600px] mx-auto">
                      <div className="text-xs text-muted-foreground mb-2 pb-2 border-b">
                        Sujet : <strong>{selected.subject.replace(/\{\{firstName\}\}/g, SAMPLE_VARS.firstName)}</strong>
                      </div>
                      <div dangerouslySetInnerHTML={{ __html: renderEmail({ subject: selected.subject, markdown: selected.markdown_body, variables: SAMPLE_VARS, branding: { coBrand: false } }).html }} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Sélectionnez ou créez un template
            </div>
          )}
        </div>

        {showAI && selected && (
          <div className="w-[380px] shrink-0">
            <EmailMarketingAIChat
              mode={showAI}
              currentTemplate={{ subject: selected.subject, markdown: selected.markdown_body }}
              onClose={() => setShowAI(null)}
              onApply={(result: any) => {
                setSelected({
                  ...selected,
                  subject: result.subject ?? selected.subject,
                  markdown_body: result.markdown ?? selected.markdown_body,
                });
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
