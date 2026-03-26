import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Award, Bot, Lightbulb, RotateCcw, MessageSquare, Zap, Target, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnrichedMarkdown } from "./EnrichedMarkdown";

interface AcademyPracticeProps {
  moduleId: string;
  enrollmentId?: string;
  onComplete?: (score: number) => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function parseEvaluationFromContent(content: string): { score: number; feedback: string } | null {
  const match = content.match(/```evaluation\s*\n?([\s\S]*?)```/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim());
    if (typeof parsed.score === "number") return parsed;
  } catch {}
  return null;
}

export function AcademyPractice({ moduleId, enrollmentId, onComplete }: AcademyPracticeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: practice } = useQuery({
    queryKey: ["academy-practice", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_practices")
        .select("*")
        .eq("module_id", moduleId)
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  if (!practice) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Aucune session de pratique disponible pour ce module.
      </div>
    );
  }

  const exchangeCount = messages.filter(m => m.role === "user").length;
  const maxExchanges = practice.max_exchanges || 10;
  const isFinished = exchangeCount >= maxExchanges || !!evaluation;
  const progressPct = Math.round((exchangeCount / maxExchanges) * 100);
  const hasMessages = messages.length > 0;

  const contextualSuggestions = useMemo(() => {
    const tags = practice.tags || [];
    const title = practice.title || "";
    const suggestions = [
      `Comment aborder concrètement "${title.toLowerCase()}" ?`,
      "Peux-tu me donner un exemple réel ?",
      "Quels sont les erreurs courantes à éviter ?",
      "Comment mesurer le succès de cette approche ?",
    ];
    if (tags.includes("leadership")) suggestions.push("Comment adapter ça à mon style de management ?");
    if (tags.includes("ia") || tags.includes("ai")) suggestions.push("Quels outils IA recommandes-tu ?");
    return suggestions.slice(0, 4);
  }, [practice]);

  const handleSend = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || isStreaming || isFinished) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: msgText, timestamp: new Date() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsStreaming(true);

    try {
      const isLastExchange = exchangeCount + 1 >= maxExchanges;
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/academy-practice`;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          practice_id: practice.id,
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          evaluate: isLastExchange,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur de communication");
      }
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last.id.startsWith("a-")) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { id: `a-${Date.now()}`, role: "assistant", content: assistantContent, timestamp: new Date() }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (isLastExchange && assistantContent) {
        const evalResult = parseEvaluationFromContent(assistantContent);
        if (evalResult) {
          setEvaluation(evalResult);
          onComplete?.(evalResult.score);
          const cleanedContent = assistantContent.replace(/```evaluation\s*\n?[\s\S]*?```/, "").trim();
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: cleanedContent || assistantContent } : m);
            }
            return prev;
          });
        }
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erreur de communication");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setEvaluation(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Minimalist top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <span className="text-sm font-medium">{practice.title}</span>
            {practice.difficulty && (
              <Badge variant="secondary" className="text-[9px] h-4 ml-2">{practice.difficulty}</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{exchangeCount}/{maxExchanges}</span>
            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          {!isFinished && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset} title="Recommencer">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          /* Welcome screen */
          <div className="flex flex-col items-center justify-center h-full px-6 py-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center max-w-lg space-y-6"
            >
              {/* Animated icon */}
              <div className="relative mx-auto w-20 h-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 blur-xl"
                />
                <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Bot className="h-10 w-10 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold">{practice.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                  {practice.scenario}
                </p>
              </div>

              {/* Info chips */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {practice.difficulty && (
                  <div className="flex items-center gap-1.5 text-xs bg-muted/50 px-3 py-1.5 rounded-full">
                    <Target className="h-3 w-3" /> {practice.difficulty}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs bg-muted/50 px-3 py-1.5 rounded-full">
                  <MessageSquare className="h-3 w-3" /> {maxExchanges} échanges
                </div>
                <div className="flex items-center gap-1.5 text-xs bg-muted/50 px-3 py-1.5 rounded-full">
                  <Zap className="h-3 w-3" /> IA conversationnelle
                </div>
              </div>

              {/* Contextual suggestions */}
              <div className="grid grid-cols-2 gap-2 pt-2 max-w-md mx-auto">
                {contextualSuggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    onClick={() => handleSend(s)}
                    className="text-left text-xs p-3 rounded-xl border border-border/50 bg-background hover:bg-muted/50 hover:border-border transition-all group"
                  >
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">{s}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          /* Messages */
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            <AnimatePresence>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "assistant" ? (
                    <div className="flex items-start gap-3 max-w-[85%]">
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                        <Bot className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="prose prose-sm max-w-none dark:prose-invert [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 text-sm leading-relaxed">
                        <EnrichedMarkdown content={msg.content} />
                        {/* Streaming cursor */}
                        {isStreaming && messages[messages.length - 1]?.id === msg.id && (
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="inline-block w-0.5 h-4 bg-foreground ml-0.5 align-text-bottom"
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[75%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3 text-sm">
                      <p>{msg.content}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 py-3">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="h-2 w-2 rounded-full bg-muted-foreground/30"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Evaluation overlay */}
      <AnimatePresence>
        {evaluation && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-20 p-6"
          >
            <div className="max-w-md w-full space-y-6 text-center">
              {/* Score circle */}
              <div className="relative mx-auto w-32 h-32">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" strokeWidth="8" className="stroke-muted" />
                  <motion.circle
                    cx="60" cy="60" r="52" fill="none" strokeWidth="8"
                    strokeLinecap="round"
                    className={cn(
                      evaluation.score >= 80 ? "stroke-emerald-500" :
                      evaluation.score >= 50 ? "stroke-amber-500" : "stroke-red-500"
                    )}
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - evaluation.score / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="text-3xl font-bold"
                  >
                    {evaluation.score}
                  </motion.span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold">
                  {evaluation.score >= 80 ? "Excellent ! 🎉" :
                   evaluation.score >= 50 ? "Bonne progression ! 💪" :
                   "Continuez à pratiquer 📚"}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{evaluation.feedback}</p>
              </div>

              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleReset} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Recommencer
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      {!isFinished && (
        <div className="border-t border-border/30 bg-background shrink-0">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="relative flex items-end gap-2 bg-muted/30 rounded-2xl border border-border/50 focus-within:border-primary/30 transition-colors px-4 py-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Écrivez votre message..."
                className="flex-1 min-h-[24px] max-h-[200px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
                disabled={isStreaming}
                rows={1}
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                className="h-8 w-8 rounded-xl shrink-0 bg-primary hover:bg-primary/90"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">
              Entrée pour envoyer · Shift+Entrée pour un retour à la ligne
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
