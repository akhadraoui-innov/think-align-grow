import { useState } from "react";
import { Send, Sparkles, Loader2, RefreshCw, ShieldCheck, Cpu, MessageCircle, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { usePracticeVariants, type AdminPractice } from "@/hooks/useAdminPractices";

interface Props {
  practice: AdminPractice;
}

interface Msg { role: "user" | "assistant"; content: string; }

const POSTURE_LABEL: Record<string, string> = {
  proactive: "Proactif",
  guided: "Guidé",
  socratic: "Socratique",
  challenger: "Challenger",
  silent: "Silencieux",
  intensive: "Intensif",
};

export function LivePreviewPanel({ practice }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: variants = [] } = usePracticeVariants(practice.id);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/academy-practice`;

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          preview_practice: practice,
          messages: next,
        }),
      });

      if (!resp.ok || !resp.body) {
        setMessages([...next, { role: "assistant", content: "Erreur de prévisualisation." }]);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let assistant = "";
      setMessages([...next, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              assistant += delta;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistant };
                return copy;
              });
            }
          } catch {}
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => setMessages([]);

  const modelLabel = (practice.model_override ?? "google/gemini-2.5-flash").split("/").pop();
  const postureLabel = POSTURE_LABEL[practice.coaching_mode] ?? practice.coaching_mode ?? "guided";
  const activeVariants = variants.filter((v: any) => v.is_active).length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border/60 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-xs font-bold uppercase tracking-widest">Live preview</p>
          </div>
          <Button size="sm" variant="outline" onClick={reset} className="h-7 px-2 gap-1 text-[11px]">
            <RefreshCw className="h-3 w-3" /> Reset
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-[9px] gap-1 px-1.5 py-0 h-4">
            <Cpu className="h-2.5 w-2.5" /> {modelLabel}
          </Badge>
          <Badge variant="outline" className="text-[9px] gap-1 px-1.5 py-0 h-4">
            <MessageCircle className="h-2.5 w-2.5" /> {postureLabel}
          </Badge>
          {activeVariants > 0 && (
            <Badge variant="outline" className="text-[9px] gap-1 px-1.5 py-0 h-4">
              <GitBranch className="h-2.5 w-2.5" /> {activeVariants} variante{activeVariants > 1 ? "s" : ""}
            </Badge>
          )}
          <Badge variant="outline" className="text-[9px] gap-1 px-1.5 py-0 h-4 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-2.5 w-2.5" /> Reflet exact
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        {messages.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">
              Testez votre pratique. Modèle, posture, scénario, objectifs, garde-fous et phases sont injectés.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`rounded-lg p-3 text-xs ${m.role === "user" ? "bg-primary/10" : "bg-secondary/60"}`}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  {m.role === "user" ? "Vous" : "Assistant"}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">{m.content || (loading && i === messages.length - 1 ? "…" : "")}</p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t border-border/60 flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Tester un message…"
          className="text-xs h-8"
          disabled={loading}
        />
        <Button size="sm" onClick={send} disabled={loading || !input.trim()} className="h-8">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
