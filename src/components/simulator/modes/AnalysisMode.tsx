// AnalysisMode — Briefing panel + data room + investigation chat
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Loader2, FolderSearch, FileText, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { ScoreReveal } from "../widgets/ScoreReveal";
import { SuggestionChips } from "../widgets/SuggestionChips";
import { InputQualityIndicator } from "../widgets/InputQualityIndicator";
import { getModeDefinition } from "../config/modeRegistry";

interface Message { id: string; role: "user" | "assistant"; content: string; timestamp: Date; }
interface Finding { label: string; severity: "high" | "medium" | "low"; timestamp: Date; }

interface AnalysisModeProps {
  practiceType: string;
  typeConfig: Record<string, unknown>;
  systemPrompt: string;
  scenario: string;
  maxExchanges: number;
  practiceId: string;
  previewMode?: boolean;
  onComplete?: (score: number, messages?: Message[], evaluation?: any) => void;
  onExchangeUpdate?: (count: number) => void;
  onMessagesChange?: (messages: Message[]) => void;
}

function parseInlineBlock(content: string, tag: string): any | null {
  const regex = new RegExp("```" + tag + "\\s*\\n?([\\s\\S]*?)```");
  const match = content.match(regex);
  if (!match) return null;
  try { return JSON.parse(match[1].trim()); } catch { return null; }
}

function parseEvaluation(content: string) {
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
    .replace(/```(scoring|gauges|kpis|findings|dataroom|suggestions)\s*\n?[\s\S]*?```/g, "")
    .replace(/```evaluation\s*\n?[\s\S]*?```/g, "")
    .trim();
}

export function AnalysisMode({
  practiceType, typeConfig, systemPrompt, scenario, maxExchanges, practiceId,
  previewMode = false, onComplete, onExchangeUpdate, onMessagesChange,
}: AnalysisModeProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [dataRoomDocs, setDataRoomDocs] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [briefingOpen, setBriefingOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const modeDef = getModeDefinition(practiceType);
  const exchangeCount = messages.filter((m) => m.role === "user").length;
  const isLastExchange = exchangeCount >= maxExchanges - 1;

  useEffect(() => { onExchangeUpdate?.(exchangeCount); }, [exchangeCount, onExchangeUpdate]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  useEffect(() => {
    if (messages.length === 0 && scenario) {
      setMessages([{ id: "scenario", role: "assistant", content: scenario, timestamp: new Date() }]);
    }
  }, [scenario]);

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
      if (!resp.ok) throw new Error(`Error ${resp.status}`);

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

      const findingsData = parseInlineBlock(fullContent, "findings");
      if (findingsData && Array.isArray(findingsData)) {
        setFindings((prev) => [...prev, ...findingsData.map((f: any) => ({ label: f.label || f, severity: f.severity || "medium", timestamp: new Date() }))]);
      }
      const drData = parseInlineBlock(fullContent, "dataroom");
      if (drData && Array.isArray(drData)) setDataRoomDocs((prev) => [...new Set([...prev, ...drData])]);
      const newSuggestions = parseSuggestions(fullContent);
      if (newSuggestions.length > 0) setSuggestions(newSuggestions);
      const evalData = parseEvaluation(fullContent);
      if (evalData) { setEvaluation(evalData); onComplete?.(evalData.score, updatedMessages, evalData); }
      onMessagesChange?.(updatedMessages);
    } catch (err: any) { toast.error(err.message || "Erreur de communication"); }
    finally { setIsStreaming(false); }
  }, [input, isStreaming, messages, user, evaluation, practiceId, scenario, isLastExchange, onComplete]);

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const resetSession = () => { setMessages([]); setEvaluation(null); setFindings([]); setDataRoomDocs([]); setSuggestions([]); setInput(""); setBriefingOpen(true); };
  const severityColor = { high: "text-destructive", medium: "text-amber-600", low: "text-emerald-600" };

  const scenarioMsg = messages.find((m) => m.id === "scenario");
  const chatMessages = messages.filter((m) => m.id !== "scenario");

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Briefing + Data Room + Findings */}
      <div className="w-72 border-r flex flex-col bg-card shrink-0 overflow-hidden">
        <div className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
              <FolderSearch className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold">{modeDef?.label || "Analysis"}</span>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
          {/* Briefing */}
          <Collapsible open={briefingOpen} onOpenChange={setBriefingOpen}>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-full">
              {briefingOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Briefing
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="text-xs leading-relaxed border-l-4 border-primary bg-background rounded-r-lg p-3 shadow-sm">
                <EnrichedMarkdown content={(scenarioMsg?.content || scenario).substring(0, 500)} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {dataRoomDocs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data Room</p>
              {dataRoomDocs.map((doc, i) => (
                <div key={i} className="flex items-center gap-2 text-xs bg-background rounded-lg px-3 py-2.5 border shadow-sm">
                  <FileText className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                  <span className="truncate">{doc}</span>
                </div>
              ))}
            </div>
          )}

          {findings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Findings ({findings.length})
              </p>
              {findings.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2 text-xs bg-background rounded-lg px-3 py-2.5 border shadow-sm"
                >
                  <AlertTriangle className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", severityColor[f.severity])} />
                  <span>{f.label}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Investigation Chat */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
          <AnimatePresence initial={false}>
            {chatMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border/40 shadow-sm"
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
              <div className="bg-card border rounded-2xl px-4 py-3 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {evaluation && (
          <ScoreReveal score={evaluation.score} feedback={evaluation.feedback} dimensions={evaluation.dimensions} recommendations={evaluation.recommendations} messages={messages.map(m => ({ role: m.role, content: m.content }))} onRestart={resetSession} />
        )}

        {!evaluation && suggestions.length > 0 && !isStreaming && (
          <SuggestionChips suggestions={suggestions} onSelect={(s) => sendMessage(s)} disabled={isStreaming} />
        )}

        {!evaluation && (
          <div className="shrink-0 p-4 border-t bg-background">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-0">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Posez vos questions d'investigation..."
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
    </div>
  );
}
