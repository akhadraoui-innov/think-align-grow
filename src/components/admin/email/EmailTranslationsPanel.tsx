import { useState } from "react";
import { Plus, Languages, Save, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  useEmailTranslations, useUpsertEmailTranslation, useDeleteEmailTranslation,
  SUPPORTED_LOCALES, EmailTemplateTranslation,
} from "@/hooks/useEmailTranslations";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  templateId: string;
  defaultSubject: string;
  defaultMarkdown: string;
  canManage: boolean;
}

export function EmailTranslationsPanel({ templateId, defaultSubject, defaultMarkdown, canManage }: Props) {
  const { data: translations = [] } = useEmailTranslations(templateId);
  const upsert = useUpsertEmailTranslation();
  const del = useDeleteEmailTranslation();

  const [editing, setEditing] = useState<Partial<EmailTemplateTranslation> | null>(null);
  const [translating, setTranslating] = useState(false);

  const usedLocales = new Set(translations.map(t => t.locale));
  const availableLocales = SUPPORTED_LOCALES.filter(l => !usedLocales.has(l.code));

  const handleSave = async () => {
    if (!editing?.locale || !editing.subject || !editing.markdown_body) {
      toast.error("Tous les champs sont requis");
      return;
    }
    try {
      await upsert.mutateAsync({
        id: editing.id,
        template_id: templateId,
        locale: editing.locale,
        subject: editing.subject,
        markdown_body: editing.markdown_body,
        is_active: editing.is_active ?? true,
      });
      toast.success("Traduction enregistrée");
      setEditing(null);
    } catch (e: any) {
      toast.error("Erreur", { description: e?.message });
    }
  };

  const handleAITranslate = async () => {
    if (!editing?.locale) return;
    setTranslating(true);
    try {
      const localeMeta = SUPPORTED_LOCALES.find(l => l.code === editing.locale);
      const targetLang = localeMeta?.label ?? editing.locale;
      const { data, error } = await supabase.functions.invoke("email-marketing-ai", {
        body: {
          mode: "refine",
          brief: `Traduis ce sujet et ce corps en ${targetLang}. Garde les variables {{...}} et la structure markdown intactes.`,
          current_template: { subject: defaultSubject, markdown: defaultMarkdown },
        },
      });
      if (error) throw error;
      // The function streams; here we just expect a JSON-ish payload as fallback
      const text = typeof data === "string" ? data : JSON.stringify(data ?? {});
      const m = text.match(/```json\s*([\s\S]+?)```/);
      const parsed = m ? JSON.parse(m[1]) : null;
      if (parsed?.subject || parsed?.markdown) {
        setEditing(prev => prev ? {
          ...prev,
          subject: parsed.subject ?? prev.subject ?? defaultSubject,
          markdown_body: parsed.markdown ?? prev.markdown_body ?? defaultMarkdown,
        } : prev);
        toast.success(`Traduit en ${targetLang}`);
      } else {
        toast.warning("Traduction renvoyée — vérifiez le rendu manuellement");
      }
    } catch (e: any) {
      toast.error("Échec de la traduction IA", { description: e?.message });
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Languages className="h-3.5 w-3.5" />
          Traductions ({translations.length}/{SUPPORTED_LOCALES.length})
        </div>
        {canManage && availableLocales.length > 0 && !editing && (
          <Button size="sm" variant="outline" onClick={() => setEditing({
            locale: availableLocales[0].code,
            subject: defaultSubject,
            markdown_body: defaultMarkdown,
            is_active: true,
          })}>
            <Plus className="h-3 w-3 mr-1" />Ajouter une langue
          </Button>
        )}
      </div>

      {translations.map(t => {
        const meta = SUPPORTED_LOCALES.find(l => l.code === t.locale);
        return (
          <Card key={t.id} className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{meta?.flag}</span>
              <div>
                <div className="text-xs font-semibold">{meta?.label || t.locale}</div>
                <p className="text-[10px] text-muted-foreground truncate max-w-[280px]">{t.subject}</p>
              </div>
              {t.is_active ? (
                <Badge variant="default" className="text-[9px]">Actif</Badge>
              ) : (
                <Badge variant="secondary" className="text-[9px]">Inactif</Badge>
              )}
            </div>
            {canManage && (
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing(t)}>Éditer</Button>
                <Button size="sm" variant="ghost" onClick={() => del.mutate({ id: t.id, template_id: templateId })}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            )}
          </Card>
        );
      })}

      {editing && (
        <Card className="p-4 space-y-3 border-primary/40">
          <div className="grid grid-cols-3 gap-3 items-end">
            <div className="col-span-1">
              <Label className="text-xs">Langue</Label>
              <Select value={editing.locale} onValueChange={v => setEditing({ ...editing, locale: v })} disabled={!!editing.id}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(editing.id ? SUPPORTED_LOCALES : availableLocales).map(l => (
                    <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex items-end justify-end gap-2">
              <Button size="sm" variant="outline" onClick={handleAITranslate} disabled={translating}>
                <Sparkles className="h-3 w-3 mr-1" />{translating ? "Traduction…" : "Traduire avec l'IA"}
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-xs">Sujet</Label>
            <Input value={editing.subject || ""} onChange={e => setEditing({ ...editing, subject: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Markdown</Label>
            <Textarea
              value={editing.markdown_body || ""}
              onChange={e => setEditing({ ...editing, markdown_body: e.target.value })}
              rows={10}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
            <Button size="sm" onClick={handleSave} disabled={upsert.isPending}>
              <Save className="h-3 w-3 mr-1" />Enregistrer
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
