import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { useSpendCredits } from "@/hooks/useSpendCredits";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
}

interface ChatInterfaceProps {
  creditCost?: number;
  organizationId?: string | null;
}

export function ChatInterface({ creditCost = 1, organizationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "ai", text: "Bienvenue ! Je suis votre coach stratégique IA. Décrivez-moi votre projet ou posez-moi une question sur la stratégie business. 🚀" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { balance, hasCredits } = useCredits();
  const spendCredits = useSpendCredits();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    if (!hasCredits(creditCost)) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    const userText = input;
    setInput("");
    setIsTyping(true);

    try {
      // Spend credits first
      await spendCredits.mutateAsync({
        amount: creditCost,
        description: `Coach IA – message`,
      });

      // Call AI via edge function or gateway
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("ai-coach", {
        body: {
          messages: [...messages, userMsg].filter(m => m.id !== "welcome").map(m => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.text,
          })),
          userMessage: userText,
          organization_id: organizationId || undefined,
        },
      });

      const aiText = response.data?.reply || "Désolé, je n'ai pas pu générer une réponse. Réessayez.";
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: "ai", text: aiText }]);
    } catch (err: any) {
      // If credit spend failed, show error but don't add AI message
      if (err.message?.includes("Crédits insuffisants")) {
        setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "ai", text: "⚠️ Crédits insuffisants pour cette action." }]);
      } else {
        setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "ai", text: "Désolé, une erreur est survenue. Réessayez." }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const insufficientCredits = !hasCredits(creditCost);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary/15 text-foreground rounded-br-md"
                    : "bg-card border border-border text-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "ai" && (
                  <Sparkles className="inline h-3.5 w-3.5 text-primary mr-1.5 -mt-0.5" />
                )}
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-card border border-border px-4 py-3 flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary/50 animate-pulse" />
              <div className="h-2 w-2 rounded-full bg-primary/50 animate-pulse [animation-delay:150ms]" />
              <div className="h-2 w-2 rounded-full bg-primary/50 animate-pulse [animation-delay:300ms]" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Credit warning */}
      {insufficientCredits && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Crédits insuffisants ({balance} restants, {creditCost} requis)</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={insufficientCredits ? "Crédits insuffisants..." : "Décrivez votre projet..."}
            disabled={insufficientCredits}
            className="flex-1 rounded-xl bg-secondary border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping || insufficientCredits}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
