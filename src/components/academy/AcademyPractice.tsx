import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, MessageSquare, Award, Loader2, Bot, Lightbulb, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const SUGGESTION_PROMPTS = [
  "Pouvez-vous me donner un exemple concret ?",
  "Comment appliquer cela dans un contexte professionnel ?",
  "Quels sont les pièges à éviter ?",
  "Pouvez-vous me challenger sur ce point ?",
];

export function AcademyPractice({ moduleId, enrollmentId, onComplete }: AcademyPracticeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (practice?.scenario && messages.length === 0) {
      setMessages([{
        id: "intro",
        role: "assistant",
        content: practice.scenario,
        timestamp: new Date(),
      }]);
    }
  }, [practice]);

  if (!practice) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          Aucune session de pratique disponible pour ce module.
        </CardContent>
      </Card>
    );
  }

  const exchangeCount = messages.filter(m => m.role === "user").length;
  const maxExchanges = practice.max_exchanges || 10;
  const isFinished = exchangeCount >= maxExchanges || !!evaluation;
  const progressPct = Math.round((exchangeCount / maxExchanges) * 100);

  const handleSend = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || isStreaming || isFinished) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: msgText, timestamp: new Date() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsStreaming(true);
    setShowSuggestions(false);

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
          messages: allMessages.filter(m => m.id !== "intro").map(m => ({ role: m.role, content: m.content })),
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

      // Show suggestions after AI responds
      if (!isLastExchange) {
        setTimeout(() => setShowSuggestions(true), 500);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erreur de communication");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleReset = () => {
    setMessages([{
      id: "intro",
      role: "assistant",
      content: practice.scenario,
      timestamp: new Date(),
    }]);
    setEvaluation(null);
    setShowSuggestions(true);
  };

  return (
    <div className="flex flex-col h-[650px] border rounded-2xl overflow-hidden bg-background shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-violet-500/5 to-purple-500/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-sm">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold">{practice.title}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {practice.difficulty && (
                  <Badge variant="secondary" className="text-[9px] h-4">{practice.difficulty}</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {exchangeCount}/{maxExchanges}
            </Badge>
            {!isFinished && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <Progress value={progressPct} className="h-1.5" />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <div className="flex items-start gap-2 max-w-[85%]">
                {msg.role === "assistant" && (
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className={cn(
                  "rounded-2xl px-4 py-3 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted/60 rounded-bl-md"
                )}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
                      <EnrichedMarkdown content={msg.content} />
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex items-start gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="bg-muted/60 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="h-2 w-2 rounded-full bg-muted-foreground/40"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Suggestions */}
        {showSuggestions && !isStreaming && !isFinished && exchangeCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-1.5 pt-2"
          >
            {SUGGESTION_PROMPTS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="text-[11px] px-3 py-1.5 rounded-full border bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Lightbulb className="h-3 w-3" /> {s}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Evaluation result */}
      {evaluation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4"
        >
          <div className={cn(
            "p-5 rounded-2xl border shadow-sm",
            evaluation.score >= 80 ? "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200" :
            evaluation.score >= 50 ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200" :
            "bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-200"
          )}>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center shadow-md",
                evaluation.score >= 80 ? "bg-gradient-to-br from-emerald-500 to-teal-500" :
                evaluation.score >= 50 ? "bg-gradient-to-br from-amber-500 to-orange-500" :
                "bg-gradient-to-br from-red-500 to-pink-500"
              )}>
                <Award className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold">
                  {evaluation.score >= 80 ? "Session excellente ! 🎉" :
                   evaluation.score >= 50 ? "Bonne progression ! 💪" :
                   "Continuez à pratiquer 📚"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Progress value={evaluation.score} className="h-2 flex-1 max-w-[120px]" />
                  <Badge className="text-xs">{evaluation.score}/100</Badge>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{evaluation.feedback}</p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={handleReset} className="flex-1">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Recommencer
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Input */}
      {!isFinished && (
        <div className="p-4 border-t bg-muted/10">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Votre message..."
              className="min-h-[44px] max-h-[120px] resize-none rounded-xl"
              disabled={isStreaming}
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              className="shrink-0 h-11 w-11 rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
