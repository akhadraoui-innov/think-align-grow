import { useState, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SUPPORTED_LOCALES } from "@/hooks/useEmailTranslations";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  templateId?: string | null;
  inlineSubject?: string;
  inlineMarkdown?: string;
  organizationId: string | null;
}

export function EmailSendTestDialog({ open, onOpenChange, templateId, inlineSubject, inlineMarkdown, organizationId }: Props) {
  const { user } = useAuth();
  const [recipient, setRecipient] = useState("");
  const [locale, setLocale] = useState("fr");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && user?.email && !recipient) setRecipient(user.email);
  }, [open, user?.email]);

  const handleSend = async () => {
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      toast.error("Email destinataire invalide");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-test-email", {
        body: {
          template_id: templateId ?? undefined,
          subject: templateId ? undefined : inlineSubject,
          markdown: templateId ? undefined : inlineMarkdown,
          recipient,
          organization_id: organizationId,
          locale,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Email de test envoyé", { description: `Vérifiez la boîte de ${recipient}` });
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Envoi impossible", { description: e?.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4" />Envoyer un test
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Destinataire</Label>
            <Input
              type="email"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              placeholder="vous@exemple.com"
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Variables échantillon : firstName=Marie, organization.name=Acme SaaS
            </p>
          </div>
          {templateId && (
            <div>
              <Label className="text-xs">Langue</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LOCALES.map(l => (
                    <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
            {sending ? "Envoi…" : "Envoyer le test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
