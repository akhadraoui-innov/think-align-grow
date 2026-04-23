import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Loader2, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  mode: "compose" | "refine" | "automation_design";
  onClose: () => void;
  onApply: (result: any) => void;
  context?: {
    organization_name?: string;
    plan?: string;
    persona?: string;
    available_events?: string[];
  };
  currentTemplate?: { subject?: string; markdown?: string };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MODE_LABEL: Record<Props["mode"], string> = {
  compose: "Rédaction d'email",
  refine: "Amélioration",
  automation_design: "Déclencheur",
};

export function EmailMarketingAIChat({ mode, onClose, onApply, context, currentTemplate }: Props) {
  const [brief, setBrief] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamBuffer]);

  const handleSend = async () => {
    if (!brief.trim() || streaming) return;
    const userMsg: ChatMessage = { role: "user", content: brief };
    setMessages(prev => [...prev, userMsg]);
    setBrief("");
    setStreaming(true);
    setStreamBuffer("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `https://yucwxukikfianvaokebs.supabase.co/functions/v1/email-marketing-ai`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          mode,
          brief: userMsg.content,
          current_template: currentTemplate,
          context,
          conversation: messages,
        }),
      });

      if (!resp.ok || !resp.body) {
        const txt = await resp.text();
        toast.error(`Erreur IA: ${resp.status}`, { description: txt.slice(0, 200) });
        setStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setStreamBuffer(acc);
            }
          } catch { /* ignore */ }
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: acc }]);
      setStreamBuffer("");
    } catch (e: any) {
      toast.error("Erreur réseau", { description: e?.message });
    } finally {
      setStreaming(false);
    }
  };

  const tryParseAndApply = (raw: string) => {
    const match = raw.match(/```json\s*([\s\S]+?)```/);
    if (!match) {
      toast.error("Aucun bloc JSON détecté");
      return;
    }
    try {
      const parsed = JSON.parse(match[1]);
      onApply(parsed);
      toast.success("Appliqué au formulaire");
    } catch (e: any) {
      toast.error("JSON invalide", { description: e?.message });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Assistant IA</span>
          <Badge variant="secondary" className="text-[10px]">{MODE_LABEL[mode]}</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </header>

      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef as any}>
        <div className="space-y-3">
          {messages.length === 0 && !streamBuffer && (
            <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
              {mode === "compose" && "Décris l'email à rédiger : objectif, audience, ton, CTA…"}
              {mode === "refine" && "Indique ce qu'il faut améliorer (clarté, CTA, ton mobile…)."}
              {mode === "automation_design" && "Décris le scénario : quand l'email doit-il partir ? Quelles conditions ?"}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`rounded-lg p-3 text-xs ${m.role === "user" ? "bg-primary/10 text-foreground" : "bg-muted"}`}>
              <div className="text-[10px] font-semibold mb-1 opacity-60">{m.role === "user" ? "Vous" : "IA"}</div>
              <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
              {m.role === "assistant" && m.content.includes("```json") && (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="default" onClick={() => tryParseAndApply(m.content)}>
                    <ClipboardCopy className="h-3 w-3 mr-1" />Appliquer
                  </Button>
                </div>
              )}
            </div>
          ))}
          {streamBuffer && (
            <div className="rounded-lg p-3 text-xs bg-muted">
              <div className="text-[10px] font-semibold mb-1 opacity-60 flex items-center gap-1">
                IA <Loader2 className="h-3 w-3 animate-spin" />
              </div>
              <pre className="whitespace-pre-wrap font-sans">{streamBuffer}</pre>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border space-y-2">
        <Textarea
          value={brief}
          onChange={e => setBrief(e.target.value)}
          placeholder="Votre brief…"
          rows={3}
          disabled={streaming}
          className="text-xs resize-none"
        />
        <Button onClick={handleSend} disabled={!brief.trim() || streaming} className="w-full">
          {streaming ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Envoyer
        </Button>
      </div>
    </div>
  );
}
