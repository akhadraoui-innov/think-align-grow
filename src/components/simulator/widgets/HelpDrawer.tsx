import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getModeDefinition } from "../config/modeRegistry";
import { cn } from "@/lib/utils";

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
  "Comment fonctionne ce mode ?",
  "Quels sont les critères d'évaluation ?",
  "Donne-moi un conseil pour m'améliorer",
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
Sois concis (3-5 phrases max).`;

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
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute inset-y-0 right-0 w-80 bg-background border-l shadow-lg z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Aide IA
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
          {messages.length === 0 && (
            <div className="space-y-2 pt-4">
              <p className="text-xs text-muted-foreground text-center">Questions rapides :</p>
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendHelp(q)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={cn("text-xs leading-relaxed", msg.role === "user" ? "text-right" : "")}>
              <span className={cn(
                "inline-block px-3 py-2 rounded-xl max-w-[90%]",
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {msg.content || (loading && i === messages.length - 1 ? "..." : "")}
              </span>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 border-t flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendHelp(input)}
            placeholder="Posez votre question..."
            className="text-xs h-8"
            disabled={loading}
          />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => sendHelp(input)} disabled={!input.trim() || loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
