import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
}

const aiResponses = [
  "Intéressant ! Avez-vous validé votre **Problem-Solution Fit** ? Avant de structurer, il faut s'assurer que le problème est réel et douloureux.",
  "Je vous suggère de commencer par les cartes du pilier **Thinking** — notamment *First Principles* et *Inversion*. Elles vous aideront à clarifier vos hypothèses.",
  "Votre idée a du potentiel. Avez-vous déjà interviewé des clients potentiels ? La carte **Jobs To Be Done** pourrait structurer votre approche.",
  "Pour un lancement rapide, je recommande le plan de jeu **Lancer sa Startup** : 15 cartes qui couvrent les fondations essentielles.",
  "Bonne question ! Le **Business Model Canvas** est un excellent point de départ. Voulez-vous qu'on le remplisse ensemble ?",
  "Pensez à tester votre pricing tôt. La carte **Unit Economics** vous aidera à valider la viabilité financière.",
  "Avant de scaler, assurez-vous d'avoir un **Product-Market Fit** solide. Le Sean Ellis test (40%) est un bon indicateur.",
  "Je vois que vous êtes en phase de croissance. Les cartes **Viral Loop** et **Network Effects** pourraient être vos meilleurs alliés.",
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "ai", text: "Bienvenue ! Je suis votre coach stratégique IA. Décrivez-moi votre projet ou posez-moi une question sur la stratégie business. 🚀" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const responseIndex = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiText = aiResponses[responseIndex.current % aiResponses.length];
      responseIndex.current++;
      const aiMsg: Message = { id: `ai-${Date.now()}`, role: "ai", text: aiText };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="rounded-2xl rounded-bl-md bg-card border border-border px-4 py-3 flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary/50 animate-pulse" />
              <div className="h-2 w-2 rounded-full bg-primary/50 animate-pulse [animation-delay:150ms]" />
              <div className="h-2 w-2 rounded-full bg-primary/50 animate-pulse [animation-delay:300ms]" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Décrivez votre projet..."
            className="flex-1 rounded-xl bg-secondary border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
