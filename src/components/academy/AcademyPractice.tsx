import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, MessageSquare, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface AcademyPracticeProps {
  moduleId: string;
  enrollmentId?: string;
  onComplete?: (score: number) => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AcademyPractice({ moduleId, enrollmentId, onComplete }: AcademyPracticeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
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

  // Initialize with scenario context
  useEffect(() => {
    if (practice?.scenario && messages.length === 0) {
      setMessages([{
        id: "intro",
        role: "assistant",
        content: practice.scenario,
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

  const handleSend = async () => {
    if (!input.trim() || isStreaming || isFinished) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: input.trim() };
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
          messages: allMessages.filter(m => m.id !== "intro").map(m => ({
            role: m.role,
            content: m.content,
          })),
          evaluate: isLastExchange,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur de communication");
      }

      if (!resp.body) throw new Error("No response body");

      // Stream SSE
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
            // Check for evaluation data
            if (parsed.evaluation) {
              setEvaluation(parsed.evaluation);
              onComplete?.(parsed.evaluation.score);
              continue;
            }
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last.id.startsWith("a-")) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { id: `a-${Date.now()}`, role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erreur lors de la communication");
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-xl overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{practice.title}</span>
          {practice.difficulty && (
            <Badge variant="secondary" className="text-[10px]">{practice.difficulty}</Badge>
          )}
        </div>
        <Badge variant="outline" className="text-xs">
          {exchangeCount}/{maxExchanges} échanges
        </Badge>
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
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted rounded-bl-md"
              )}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Evaluation result */}
      {evaluation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 p-4 rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10"
        >
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-5 w-5 text-primary" />
            <span className="font-semibold">Évaluation de la session</span>
            <Badge className="ml-auto">{evaluation.score}/100</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{evaluation.feedback}</p>
        </motion.div>
      )}

      {/* Input */}
      {!isFinished && (
        <div className="p-4 border-t bg-muted/20">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Votre message..."
              className="min-h-[44px] max-h-[120px] resize-none"
              disabled={isStreaming}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="shrink-0 h-11 w-11"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
