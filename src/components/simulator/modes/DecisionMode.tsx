// DecisionMode — Chat + KPI sidebar + event alerts
// Used for: decision_game, crisis, incident_response, restructuring, change_management, sprint_planning

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Loader2, RotateCcw, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { TimerBar } from "../widgets/TimerBar";
import { KPIDashboard } from "../widgets/KPIDashboard";
import { ScoreReveal } from "../widgets/ScoreReveal";
import { DecisionTimeline } from "../widgets/DecisionTimeline";
import { getModeDefinition } from "../config/modeRegistry";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface DecisionModeProps {
  practiceType: string;
  typeConfig: Record<string, unknown>;
  systemPrompt: string;
  scenario: string;
  maxExchanges: number;
  practiceId: string;
  previewMode?: boolean;
  onComplete?: (score: number) => void;
  onExchangeUpdate?: (count: number) => void;
}

function parseInlineBlock(content: string, tag: string): Record<string, any> | null {
  const regex = new RegExp("```" + tag + "\\s*\\n?([\\s\\S]*?)```");
  const match = content.match(regex);
  if (!match) return null;
  try { return JSON.parse(match[1].trim()); } catch { return null; }
}

function parseEvaluation(content: string) {
  const match = content.match(/```evaluation\s*\n?([\s\S]*?)```/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim());
    if (typeof parsed.score === "number") return parsed;
  } catch {}
  return null;
}

function cleanContent(content: string): string {
  return content
    .replace(/```(scoring|gauges|kpis|funnel|stakeholders|events)\s*\n?[\s\S]*?```/g, "")
    .replace(/```evaluation\s*\n?[\s\S]*?```/g, "")
    .trim();
}

export function DecisionMode({
  practiceType,
  typeConfig,
  systemPrompt,
  scenario,
  maxExchanges,
  practiceId,
  previewMode = false,
  onComplete,
}: DecisionModeProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [kpis, setKpis] = useState<Record<string, number>>(() => {
    // Initialize KPIs from type_config
    const initial: Record<string, number> = {};
    if (typeConfig.initial_budget) initial.budget = typeConfig.initial_budget as number;
    if (typeConfig.initial_morale) initial.morale = typeConfig.initial_morale as number;
    return initial;
  });
  const [stakeholders, setStakeholders] = useState<Record<string, number>>({});
  const [decisions, setDecisions] = useState<{ label: string; impact: string; timestamp: Date }[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const modeDef = getModeDefinition(practiceType);
  const exchangeCount = messages.filter((m) => m.role === "user").length;
  const isLastExchange = exchangeCount >= maxExchanges - 1;
  const hasTimer = ["crisis", "incident_response"].includes(practiceType);
  const timeLimitSeconds = (typeConfig.total_duration_minutes as number) * 60 || (typeConfig.time_limit_minutes as number) * 60 || 0;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 && scenario) {
      setMessages([{ id: "scenario", role: "assistant", content: scenario, timestamp: new Date() }]);
    }
  }, [scenario]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming || !user || evaluation) return;

    // Track decision
    setDecisions((prev) => [...prev, { label: input.trim().substring(0, 60), impact: "neutral", timestamp: new Date() }]);

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input.trim(), timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const apiMessages = updatedMessages
        .filter((m) => m.id !== "scenario")
        .map((m) => ({ role: m.role, content: m.content }));
      if (scenario) apiMessages.unshift({ role: "assistant", content: scenario });

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/academy-practice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ practice_id: practiceId, messages: apiMessages, evaluate: isLastExchange }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

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
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: fullContent } : m)));
            }
          } catch {}
        }
      }

      // Parse KPIs
      const kpiData = parseInlineBlock(fullContent, "kpis");
      if (kpiData) {
        setKpis(kpiData as Record<string, number>);
        // Update last decision impact based on KPI changes
        setDecisions((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          const budgetDelta = (kpiData.budget || 0) - (kpis.budget || 50);
          const moraleDelta = (kpiData.morale || 0) - (kpis.morale || 50);
          const impact = (budgetDelta + moraleDelta) > 0 ? "positive" : (budgetDelta + moraleDelta) < 0 ? "negative" : "neutral";
          return [...prev.slice(0, -1), { ...last, impact }];
        });
      }

      // Parse stakeholders
      const stakeholderData = parseInlineBlock(fullContent, "stakeholders");
      if (stakeholderData) setStakeholders(stakeholderData as Record<string, number>);

      // Parse evaluation
      const evalData = parseEvaluation(fullContent);
      if (evalData) {
        setEvaluation(evalData);
        onComplete?.(evalData.score);
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur de communication");
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, user, evaluation, practiceId, scenario, isLastExchange, kpis, onComplete]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const resetSession = () => {
    setMessages([]);
    setEvaluation(null);
    setKpis({});
    setStakeholders({});
    setDecisions([]);
    setAlerts([]);
    setInput("");
  };

  const hasKPIs = Object.keys(kpis).length > 0;
  const hasStakeholders = Object.keys(stakeholders).length > 0;

  return (
    <div className="flex h-full">
      {/* Left sidebar: KPIs + Decisions */}
      <div className="w-64 border-r flex flex-col bg-muted/10 shrink-0">
        <div className="px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">{modeDef?.label || "Decision"}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Échange {exchangeCount}/{maxExchanges}
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
          {/* KPIs */}
          {hasKPIs && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Indicateurs</p>
              {Object.entries(kpis).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="capitalize text-muted-foreground">{key.replace(/_/g, " ")}</span>
                    <span className={cn("font-bold tabular-nums",
                      value > 60 ? "text-green-600" : value > 30 ? "text-amber-600" : "text-red-500"
                    )}>{value}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full",
                        value > 60 ? "bg-green-500" : value > 30 ? "bg-amber-500" : "bg-red-500"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stakeholders */}
          {hasStakeholders && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Parties prenantes</p>
              {Object.entries(stakeholders).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="capitalize">{key.replace(/_/g, " ")}</span>
                  <Badge variant="outline" className={cn("text-[9px] h-4",
                    value > 60 ? "border-green-500/30 text-green-600" :
                    value > 30 ? "border-amber-500/30 text-amber-600" : "border-red-500/30 text-red-500"
                  )}>{value}%</Badge>
                </div>
              ))}
            </div>
          )}

          {/* Decision Timeline */}
          <DecisionTimeline decisions={decisions} />
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Timer */}
        {hasTimer && timeLimitSeconds > 0 && !evaluation && (
          <TimerBar totalSeconds={timeLimitSeconds} onExpire={() => toast.info("Temps écoulé !")} />
        )}

        {/* Alert banner for crisis events */}
        <AnimatePresence>
          {alerts.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b bg-destructive/5 px-4 py-2"
            >
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                <span className="font-medium">{alerts[alerts.length - 1]}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {msg.role === "assistant" ? (
                    <EnrichedMarkdown content={cleanContent(msg.content)} />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {evaluation && <ScoreReveal score={evaluation.score} feedback={evaluation.feedback} dimensions={evaluation.dimensions} />}

        {/* Input */}
        <div className="p-4 border-t bg-background">
          {evaluation ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={resetSession}>
                <RotateCcw className="h-4 w-4 mr-2" /> Recommencer
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Votre décision..."
                className="min-h-[44px] max-h-[120px] resize-none"
                rows={1}
                disabled={isStreaming}
              />
              <Button size="icon" onClick={sendMessage} disabled={!input.trim() || isStreaming} className="shrink-0 h-[44px] w-[44px]">
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
