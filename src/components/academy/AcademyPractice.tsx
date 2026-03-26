import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Award, Bot, Lightbulb, RotateCcw, MessageSquare, Zap, Target, ArrowUp, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnrichedMarkdown } from "./EnrichedMarkdown";

interface AcademyPracticeProps {
  moduleId: string;
  enrollmentId?: string;
  onComplete?: (score: number) => void;
  previewMode?: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Phase {
  name: string;
  description?: string;
  trigger_after?: number; // exchange count to trigger this phase
}

interface EvalDimension {
  name: string;
  description?: string;
  weight?: number;
}

function parseEvaluationFromContent(content: string): { score: number; feedback: string; dimensions?: { name: string; score: number }[] } | null {
  const match = content.match(/```evaluation\s*\n?([\s\S]*?)```/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim());
    if (typeof parsed.score === "number") return parsed;
  } catch {}
  return null;
}

export function AcademyPractice({ moduleId, enrollmentId, onComplete, previewMode = false }: AcademyPracticeProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
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

  // Parse phases and dimensions from practice config
  const phases: Phase[] = useMemo(() => {
    if (!practice?.phases) return [];
    const p = practice.phases as any;
    return Array.isArray(p) ? p : [];
  }, [practice]);

  const evalDimensions: EvalDimension[] = useMemo(() => {
    if (!practice?.evaluation_dimensions) return [];
    const d = practice.evaluation_dimensions as any;
    return Array.isArray(d) ? d : [];
  }, [practice]);

  // Load existing session or create new one
  useEffect(() => {
    if (previewMode) { setIsLoadingSession(false); return; }
    if (!practice || !user) { setIsLoadingSession(false); return; }

    const loadSession = async () => {
      const { data: existing } = await supabase
        .from("academy_practice_sessions")
        .select("*")
        .eq("practice_id", practice.id)
        .eq("user_id", user.id)
        .is("completed_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        setSessionId(existing.id);
        const savedMessages = (existing.messages as any[]) || [];
        if (savedMessages.length > 0) {
          setMessages(savedMessages.map((m: any) => ({
            id: m.id || `${m.role}-${Date.now()}-${Math.random()}`,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp || Date.now()),
          })));
        }
        if (existing.evaluation) {
          setEvaluation(existing.evaluation);
        }
      }
      setIsLoadingSession(false);
    };
    loadSession();
  }, [practice?.id, user?.id, previewMode]);

  // Persist messages to DB after each change
  const persistSession = useCallback(async (msgs: Message[], eval_data?: any, score?: number) => {
    if (!user || !practice) return;

    const msgPayload = msgs.map(m => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp.toISOString() }));

    if (sessionId) {
      await supabase.from("academy_practice_sessions").update({
        messages: msgPayload as any,
        ...(eval_data ? { evaluation: eval_data as any, score, completed_at: new Date().toISOString() } : {}),
      }).eq("id", sessionId);
    } else {
      const { data: newSession } = await supabase.from("academy_practice_sessions").insert({
        user_id: user.id,
        practice_id: practice.id,
        enrollment_id: enrollmentId || null,
        messages: msgPayload as any,
        ...(eval_data ? { evaluation: eval_data as any, score, completed_at: new Date().toISOString() } : {}),
      }).select("id").single();
      if (newSession) setSessionId(newSession.id);
    }
  }, [user, practice, sessionId, enrollmentId]);

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

  // Update current phase based on exchange count
  useEffect(() => {
    if (phases.length === 0) return;
    const exchangeCount = messages.filter(m => m.role === "user").length;
    let phaseIdx = 0;
    for (let i = phases.length - 1; i >= 0; i--) {
      if (phases[i].trigger_after != null && exchangeCount >= phases[i].trigger_after!) {
        phaseIdx = i;
        break;
      }
    }
    setCurrentPhaseIdx(phaseIdx);
  }, [messages, phases]);

  const contextualSuggestions = useMemo(() => {
    if (!practice) return [];
    const title = practice.title || "";
    const suggestions = [
      `Comment aborder concrètement "${title.toLowerCase()}" ?`,
      "Peux-tu me donner un exemple réel ?",
      "Quels sont les erreurs courantes à éviter ?",
      "Comment mesurer le succès de cette approche ?",
    ];
    return suggestions.slice(0, 4);
  }, [practice]);

  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement de la session...
      </div>
    );
  }

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
  const currentPhase = phases.length > 0 ? phases[currentPhaseIdx] : null;

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
      const session = (await supabase.auth.getSession()).data.session;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          practice_id: practice.id,
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          evaluate: isLastExchange,
          ...(currentPhase ? { current_phase: currentPhase } : {}),
          ...(evalDimensions.length > 0 ? { evaluation_dimensions: evalDimensions } : {}),
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
      let finalMessages = allMessages;

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
                  const updated = prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                  finalMessages = updated;
                  return updated;
                }
                const newMsg: Message = { id: `a-${Date.now()}`, role: "assistant", content: assistantContent, timestamp: new Date() };
                const updated = [...prev, newMsg];
                finalMessages = updated;
                return updated;
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
              const updated = prev.map((m, i) => i === prev.length - 1 ? { ...m, content: cleanedContent || assistantContent } : m);
              finalMessages = updated;
              return updated;
            }
            return prev;
          });
          await persistSession(finalMessages, evalResult, evalResult.score);
        } else {
          await persistSession(finalMessages);
        }
      } else {
        await persistSession(finalMessages);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erreur de communication");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleReset = async () => {
    // Complete current session if exists
    if (sessionId) {
      await supabase.from("academy_practice_sessions").update({
        completed_at: new Date().toISOString(),
      }).eq("id", sessionId);
    }
    setMessages([]);
    setEvaluation(null);
    setSessionId(null);
    setCurrentPhaseIdx(0);
  };

  const handleEndSession = async () => {
    // Request evaluation from AI
    setIsStreaming(true);
    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/academy-practice`;
      const session = (await supabase.auth.getSession()).data.session;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          practice_id: practice.id,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          evaluate: true,
          ...(evalDimensions.length > 0 ? { evaluation_dimensions: evalDimensions } : {}),
        }),
      });

      if (!resp.ok) throw new Error("Erreur lors de l'évaluation");
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
                if (last?.role === "assistant" && last.id.startsWith("a-eval-")) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { id: `a-eval-${Date.now()}`, role: "assistant", content: assistantContent, timestamp: new Date() }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

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
        await persistSession(messages, evalResult, evalResult.score);
      } else {
        // Fallback: score based on exchange count
        const score = Math.round((exchangeCount / maxExchanges) * 70);
        const fallbackEval = { score, feedback: "Session terminée. Votre score est basé sur votre niveau d'engagement dans la conversation." };
        setEvaluation(fallbackEval);
        onComplete?.(score);
        await persistSession(messages, fallbackEval, score);
      }
    } catch (e: any) {
      console.error(e);
      const score = Math.round((exchangeCount / maxExchanges) * 70);
      const fallbackEval = { score, feedback: "Session terminée. L'évaluation automatique n'a pas pu aboutir." };
      setEvaluation(fallbackEval);
      onComplete?.(score);
      await persistSession(messages, fallbackEval, score);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
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
          {/* Phase indicator */}
          {currentPhase && (
            <Badge variant="outline" className="text-[9px] h-5 gap-1 border-violet-500/30 text-violet-600">
              <Target className="h-2.5 w-2.5" />
              {currentPhase.name}
            </Badge>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{exchangeCount}/{maxExchanges}</span>
            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          {!isFinished && exchangeCount >= 3 && (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleEndSession} disabled={isStreaming}>
              <Award className="h-3 w-3" /> Terminer
            </Button>
          )}
          {!isFinished && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset} title="Recommencer">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Phase stepper (if phases exist) */}
      {phases.length > 1 && (
        <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border/20 bg-muted/20 overflow-x-auto">
          {phases.map((phase, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors",
                idx === currentPhaseIdx ? "bg-primary/10 text-primary" :
                idx < currentPhaseIdx ? "text-primary/60" : "text-muted-foreground/50"
              )}>
                <span className={cn(
                  "h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold",
                  idx === currentPhaseIdx ? "bg-primary text-primary-foreground" :
                  idx < currentPhaseIdx ? "bg-primary/30 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {idx + 1}
                </span>
                {phase.name}
              </div>
              {idx < phases.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/30" />}
            </div>
          ))}
        </div>
      )}

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
                {phases.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs bg-violet-500/10 text-violet-600 px-3 py-1.5 rounded-full">
                    <Sparkles className="h-3 w-3" /> {phases.length} phases
                  </div>
                )}
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

              {/* Radar dimensions if available */}
              {evaluation.dimensions && evaluation.dimensions.length > 0 && (
                <div className="space-y-2 text-left bg-muted/30 rounded-xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Compétences évaluées</p>
                  {evaluation.dimensions.map((dim: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{dim.name}</span>
                        <span className={cn(
                          "font-bold",
                          dim.score >= 80 ? "text-emerald-500" : dim.score >= 50 ? "text-amber-500" : "text-red-500"
                        )}>{dim.score}/100</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${dim.score}%` }}
                          transition={{ duration: 1, delay: i * 0.2 }}
                          className={cn(
                            "h-full rounded-full",
                            dim.score >= 80 ? "bg-emerald-500" : dim.score >= 50 ? "bg-amber-500" : "bg-red-500"
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

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