import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Send, Loader2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getModeDefinition } from "../config/modeRegistry";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface HelpDrawerProps {
  open: boolean;
  onClose: () => void;
  practiceId: string;
  practiceType: string;
}

interface HelpMsg {
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  { q: "Comment fonctionne ce mode ?", icon: "💡" },
  { q: "Quels sont les critères d'évaluation ?", icon: "🎯" },
  { q: "Donne-moi un conseil pour m'améliorer", icon: "📈" },
];

export function HelpDrawer({ open, onClose, practiceId, practiceType }: HelpDrawerProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<HelpMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const modeDef = getModeDefinition(practiceType);

  const sendHelp = useCallback(async (text: string) => {
    if (!text.trim() || loading || !user) return;

    const userMsg: HelpMsg = { role: "user", content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const systemPrompt = `Tu es un tuteur bienveillant qui aide l'apprenant à comprendre les mécaniques de la simulation "${modeDef?.label || practiceType}". 
Tu expliques les règles, les critères d'évaluation (${modeDef?.evaluationDimensions.join(", ")}), et donnes des conseils méthodologiques.
Tu ne donnes JAMAIS les réponses directes à la simulation. Tu guides sans résoudre.
Sois concis (3-5 phrases max). Utilise le markdown pour structurer tes réponses (listes, gras, etc).`;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/academy-practice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            practice_id: "__persona_chat__",
            system_override: systemPrompt,
            messages: updated.map((m) => ({ role: m.role, content: m.content })),
          }),
        }
      );

      if (!resp.ok) throw new Error("Error");

      const reader = resp.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: fullContent };
                return copy;
              });
            }
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Désolé, je n'ai pas pu répondre. Réessayez." }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
    }
  }, [messages, loading, user, practiceType, modeDef]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 340, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="border-l bg-background flex flex-col shrink-0 overflow-hidden h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2.5 text-sm font-semibold">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
            <Lightbulb className="h-4 w-4 text-white" />
          </div>
          Aide IA
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-2.5 pt-2">
            <p className="text-xs text-muted-foreground text-center mb-3">Questions rapides :</p>
            {QUICK_QUESTIONS.map(({ q, icon }) => (
              <button
                key={q}
                onClick={() => sendHelp(q)}
                className="w-full text-left text-xs px-3.5 py-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center gap-2.5 shadow-sm"
              >
                <span className="text-base">{icon}</span>
                <span className="font-medium">{q}</span>
              </button>
            ))}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "user" ? (
              <span className="inline-block px-3.5 py-2.5 rounded-2xl rounded-br-md max-w-[85%] text-xs leading-relaxed bg-primary text-primary-foreground font-medium">
                {msg.content}
              </span>
            ) : (
              <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-card border border-border/40 shadow-sm px-4 py-3">
                {msg.content ? (
                  <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none text-xs leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5 [&_strong]:text-foreground [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_h2]:font-semibold [&_h3]:font-semibold [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px]">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  loading && i === messages.length - 1 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2 shrink-0 bg-background">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendHelp(input)}
          placeholder="Posez votre question..."
          className="text-xs h-10 rounded-xl"
          disabled={loading}
        />
        <Button
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm"
          onClick={() => sendHelp(input)}
          disabled={!input.trim() || loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </motion.div>
  );
}
