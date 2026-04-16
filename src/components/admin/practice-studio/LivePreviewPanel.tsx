import { useState } from "react";
import { Send, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import type { AdminPractice } from "@/hooks/useAdminPractices";

interface Props {
  practice: AdminPractice;
}

interface Msg { role: "user" | "assistant"; content: string; }

export function LivePreviewPanel({ practice }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const systemOverride = [
        practice.system_prompt,
        practice.scenario ? `\n\nCONTEXTE:\n${practice.scenario}` : "",
        (practice.guardrails ?? []).length ? `\n\nGARDE-FOUS:\n${(practice.guardrails as string[]).map(g => `- ${g}`).join("\n")}` : "",
      ].join("");

      const { data: { session } } = await supabase.auth.getSession();
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/academy-practice`;

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          practice_id: "__standalone__",
          system_override: systemOverride,
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

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest">Live preview</p>
        </div>
        <Button size="sm" variant="ghost" onClick={reset} className="h-7 px-2">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        {messages.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">
              Testez votre pratique en direct. Le prompt courant est utilisé en temps réel.
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
