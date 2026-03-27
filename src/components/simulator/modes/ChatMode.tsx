import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { TimerBar } from "../widgets/TimerBar";
import { TensionGauge } from "../widgets/TensionGauge";
import { KPIDashboard } from "../widgets/KPIDashboard";
import { ScoreReveal } from "../widgets/ScoreReveal";
import { SuggestionChips } from "../widgets/SuggestionChips";
import { InputQualityIndicator } from "../widgets/InputQualityIndicator";
import { BriefingCard } from "../widgets/BriefingCard";
import { getModeDefinition } from "../config/modeRegistry";
import { getInitialSuggestions } from "../config/scenarioTemplates";



interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatModeProps {
  practiceType: string;
  typeConfig: Record<string, unknown>;
  systemPrompt: string;
  scenario: string;
  maxExchanges: number;
  practiceId: string;
  previewMode?: boolean;
  sessionId?: string | null;
  onComplete?: (score: number, messages?: Message[], evaluation?: any) => void;
  onExchangeUpdate?: (count: number) => void;
  onMessagesChange?: (messages: Message[]) => void;
}

function parseInlineBlock(content: string, tag: string): Record<string, number> | null {
  const regex = new RegExp("```" + tag + "\\s*\\n?([\\s\\S]*?)```");
  const match = content.match(regex);
  if (!match) return null;
  try { return JSON.parse(match[1].trim()); } catch { return null; }
}

function parseEvaluation(content: string): { score: number; feedback: string; dimensions?: { name: string; score: number }[]; recommendations?: string[] } | null {
  const match = content.match(/```evaluation\s*\n?([\s\S]*?)```/);
  if (!match) return null;
  try { const parsed = JSON.parse(match[1].trim()); if (typeof parsed.score === "number") return parsed; } catch {}
  return null;
}

function parseSuggestions(content: string): string[] {
  const match = content.match(/```suggestions\s*\n?([\s\S]*?)```/);
  if (!match) return [];
  try { const parsed = JSON.parse(match[1].trim()); if (Array.isArray(parsed)) return parsed.slice(0, 3); } catch {}
  return [];
}

function cleanContent(content: string): string {
  return content
    .replace(/```(scoring|gauges|kpis|funnel|stakeholders|suggestions)\s*\n?[\s\S]*?```/g, "")
    .replace(/```evaluation\s*\n?[\s\S]*?```/g, "")
    .trim();
}

export function ChatMode({
  practiceType, typeConfig, systemPrompt, scenario, maxExchanges, practiceId,
  previewMode = false, sessionId, onComplete, onExchangeUpdate, onMessagesChange,
}: ChatModeProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [gauges, setGauges] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    if (typeConfig.tension_start) init.tension = typeConfig.tension_start as number;
    if (typeConfig.rapport_start) init.rapport = typeConfig.rapport_start as number;
    return init;
  });
  const [scoring, setScoring] = useState<Record<string, number> | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [briefingOpen, setBriefingOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasScrolledInitially = useRef(false);

  const exchangeCount = messages.filter((m) => m.role === "user").length;
  const isLastExchange = exchangeCount >= maxExchanges - 1;
  const hasTimer = practiceType === "pitch" || practiceType === "incident_response" || practiceType === "crisis";
  const timeLimitSeconds = (typeConfig.time_limit_seconds as number) || ((typeConfig.time_limit_minutes as number) || 0) * 60;

  useEffect(() => { onExchangeUpdate?.(exchangeCount); }, [exchangeCount, onExchangeUpdate]);
  
  // Scroll to top on mount, then auto-scroll to bottom on new messages
  useEffect(() => {
    if (!scrollRef.current) return;
    if (!hasScrolledInitially.current) {
      scrollRef.current.scrollTop = 0;
      hasScrolledInitially.current = true;
    } else {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 && scenario) {
      setMessages([{ id: "scenario", role: "assistant", content: scenario, timestamp: new Date() }]);
      const initialChips = getInitialSuggestions(practiceType);
      if (initialChips.length > 0) setSuggestions(initialChips);
    }
  }, [scenario, practiceType]);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = overrideText || input.trim();
    if (!text || isStreaming || !user || evaluation) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setSuggestions([]);
    setBriefingOpen(false);
    setIsStreaming(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const apiMessages = updatedMessages.filter((m) => m.id !== "scenario").map((m) => ({ role: m.role, content: m.content }));
      if (scenario) apiMessages.unshift({ role: "assistant", content: scenario });

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/academy-practice`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ practice_id: practiceId, messages: apiMessages, evaluate: isLastExchange, ...(practiceId === "__standalone__" && systemPrompt ? { system_override: systemPrompt } : {}) }),
      });
      if (!resp.ok) { const errData = await resp.json().catch(() => ({})); throw new Error(errData.error || `Error ${resp.status}`); }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");
      const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "", timestamp: new Date() };
      setMessages((prev) => [...prev, assistantMsg]);
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

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
          try { const parsed = JSON.parse(data); const delta = parsed.choices?.[0]?.delta?.content; if (delta) { fullContent += delta; setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: fullContent } : m))); } } catch {}
        }
      }

      for (const tag of ["gauges", "kpis", "funnel", "stakeholders"]) {
        const parsed = parseInlineBlock(fullContent, tag);
        if (parsed) setGauges(parsed);
      }
      const scoringData = parseInlineBlock(fullContent, "scoring");
      if (scoringData) setScoring(scoringData);
      const newSuggestions = parseSuggestions(fullContent);
      if (newSuggestions.length > 0) setSuggestions(newSuggestions);
      const evalData = parseEvaluation(fullContent);
      const allMessages = [...updatedMessages, { id: assistantMsg.id, role: "assistant" as const, content: fullContent, timestamp: assistantMsg.timestamp }];
      if (evalData) { setEvaluation(evalData); onComplete?.(evalData.score, allMessages, evalData); }
      onMessagesChange?.(allMessages);
    } catch (err: any) { toast.error(err.message || "Erreur de communication"); }
    finally { setIsStreaming(false); }
  }, [input, isStreaming, messages, user, evaluation, practiceId, scenario, isLastExchange, onComplete]);

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const resetSession = () => { setMessages([]); setEvaluation(null); setGauges({}); setScoring(null); setSuggestions([]); setInput(""); setBriefingOpen(true); };

  const showTension = "tension" in gauges || "rapport" in gauges;
  const showKPIs = "budget" in gauges || "morale" in gauges || "risk" in gauges;
  const showFunnel = "interest" in gauges || "closing_probability" in gauges;
  const showStakeholders = "supporters" in gauges || "adoption" in gauges;

  const scenarioMsg = messages.find((m) => m.id === "scenario");
  const chatMessages = messages.filter((m) => m.id !== "scenario");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {hasTimer && timeLimitSeconds > 0 && !evaluation && (
        <TimerBar totalSeconds={timeLimitSeconds} onExpire={() => toast.info("Temps écoulé !")} />
      )}

      {(showTension || showKPIs || showFunnel || showStakeholders) && (
        <div className="px-4 py-2.5 border-b bg-card flex flex-wrap gap-3 shrink-0">
          {showTension && <TensionGauge tension={gauges.tension || 5} rapport={gauges.rapport || 5} progress={gauges.progress} />}
          {showKPIs && <KPIDashboard kpis={gauges} />}
          {showFunnel && (
            <div className="flex gap-3 text-xs">
              {gauges.interest !== undefined && <span>Intérêt: <strong>{gauges.interest}/10</strong></span>}
              {gauges.trust !== undefined && <span>Confiance: <strong>{gauges.trust}/10</strong></span>}
              {gauges.closing_probability !== undefined && <span>Closing: <strong>{gauges.closing_probability}%</strong></span>}
            </div>
          )}
          {showStakeholders && (
            <div className="flex gap-3 text-xs">
              {gauges.supporters !== undefined && <span className="text-emerald-600">Supporters: {gauges.supporters}%</span>}
              {gauges.neutrals !== undefined && <span className="text-muted-foreground">Neutres: {gauges.neutrals}%</span>}
              {gauges.resistants !== undefined && <span className="text-destructive">Résistants: {gauges.resistants}%</span>}
              {gauges.adoption !== undefined && <span className="text-primary font-medium">Adoption: {gauges.adoption}%</span>}
            </div>
          )}
        </div>
      )}

      {scoring && (
        <div className="px-4 py-2.5 border-b bg-card shrink-0">
          <div className="flex flex-wrap gap-4 text-xs">
            {Object.entries(scoring).filter(([k]) => k !== "attempt" && k !== "total").map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className="capitalize text-muted-foreground">{k.replace(/_/g, " ")}:</span>
                <span className={cn("font-bold", (v as number) >= 8 ? "text-emerald-600" : (v as number) >= 5 ? "text-amber-600" : "text-destructive")}>{v}/10</span>
              </div>
            ))}
            {scoring.total !== undefined && (
              <div className="flex items-center gap-1.5 border-l pl-4">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-primary">{scoring.total}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages + Briefing in scrollable area */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        {/* Briefing Card Atlassian — inside scroll */}
        {scenarioMsg && (
          <BriefingCard
            content={cleanContent(scenarioMsg.content)}
            practiceType={practiceType}
            collapsed={!briefingOpen}
            onToggle={() => setBriefingOpen(!briefingOpen)}
          />
        )}
        <AnimatePresence initial={false}>
          {chatMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "assistant" && (
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <Sparkles className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <div className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border/40 shadow-sm"
              )}>
                {msg.role === "assistant" ? (
                  <EnrichedMarkdown content={cleanContent(msg.content)} />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
                <p className="text-[10px] mt-1.5 opacity-50">
                  {msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-card border rounded-2xl px-4 py-3 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {evaluation && (
        <ScoreReveal score={evaluation.score} feedback={evaluation.feedback} dimensions={evaluation.dimensions} recommendations={evaluation.recommendations} practiceType={practiceType} messages={messages.map(m => ({ role: m.role, content: m.content }))} onRestart={resetSession} />
      )}

      {!evaluation && suggestions.length > 0 && !isStreaming && (
        <SuggestionChips suggestions={suggestions} onSelect={(s) => sendMessage(s)} disabled={isStreaming} />
      )}

      {!evaluation && (
        <div className="shrink-0 p-4 border-t bg-background">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11px] text-muted-foreground font-medium">
              Réponse {exchangeCount + 1}/{maxExchanges}
            </span>
            {input.length > 0 && (
              <span className="text-[11px] text-muted-foreground tabular-nums">{input.length} car.</span>
            )}
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-0">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder(practiceType)}
                className="min-h-[44px] max-h-[120px] resize-none"
                rows={1}
                disabled={isStreaming}
              />
              <InputQualityIndicator text={input} practiceType={practiceType} />
            </div>
            <Button size="icon" onClick={() => sendMessage()} disabled={!input.trim() || isStreaming} className="shrink-0 h-[44px] w-[44px]">
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function getPlaceholder(type: string): string {
  const map: Record<string, string> = {
    coaching: "Proposez votre approche de coaching...",
    negotiation: "Décrivez votre stratégie de négociation...",
    pitch: "Présentez votre argumentaire...",
    change_management: "Détaillez votre plan de conduite du changement...",
    sales_call: "Formulez votre approche commerciale...",
    crisis: "Exposez votre plan de gestion de crise...",
  };
  return map[type] || "Rédigez votre réponse...";
}
