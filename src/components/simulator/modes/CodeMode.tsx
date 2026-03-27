// CodeMode — Split layout: Code Editor (left) + Chat (right)
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Loader2, Code, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { CodeEditor } from "../widgets/CodeEditor";
import { ScoreReveal } from "../widgets/ScoreReveal";
import { BriefingCard } from "../widgets/BriefingCard";
import { getModeDefinition } from "../config/modeRegistry";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface CodeModeProps {
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
    .replace(/```(scoring|gauges|kpis|funnel|stakeholders)\s*\n?[\s\S]*?```/g, "")
    .replace(/```evaluation\s*\n?[\s\S]*?```/g, "")
    .trim();
}

function extractCodeBlock(content: string, language: string): string | null {
  const langRegex = new RegExp("```(?:" + language + "|\\w+)\\s*\\n([\\s\\S]*?)```");
  const match = content.match(langRegex);
  if (match) return match[1].trim();
  const genericMatch = content.match(/```\s*\n([\s\S]*?)```/);
  if (genericMatch) return genericMatch[1].trim();
  return null;
}

export function CodeMode({
  practiceType, typeConfig, systemPrompt, scenario, maxExchanges, practiceId,
  previewMode = false, onComplete, onExchangeUpdate, onMessagesChange,
}: CodeModeProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [codeValue, setCodeValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [scoring, setScoring] = useState<Record<string, any> | null>(null);
  const [copied, setCopied] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolledInitially = useRef(false);

  const language = (typeConfig.language as string) || "typescript";
  const exchangeCount = messages.filter((m) => m.role === "user").length;
  const isLastExchange = exchangeCount >= maxExchanges - 1;
  const isEditableCode = ["pair_programming", "tdd_kata", "refactoring", "vibe_coding", "prompt_to_app", "prompt_lab"].includes(practiceType);

  useEffect(() => {
    if (!scrollRef.current) return;
    if (!hasScrolledInitially.current) {
      scrollRef.current.scrollTop = 0;
      hasScrolledInitially.current = true;
    } else {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => { onExchangeUpdate?.(exchangeCount); }, [exchangeCount, onExchangeUpdate]);

  useEffect(() => {
    if (messages.length === 0 && scenario) {
      setMessages([{ id: "scenario", role: "assistant", content: scenario, timestamp: new Date() }]);
      const code = extractCodeBlock(scenario, language);
      if (code) setCodeValue(code);
    }
  }, [scenario, language]);

  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && m.id !== "scenario");
    if (lastAssistant) {
      const code = extractCodeBlock(lastAssistant.content, language);
      if (code) setCodeValue(code);
    }
  }, [messages, language]);

  const sendMessage = useCallback(async () => {
    if (isStreaming || !user || evaluation) return;
    const textPart = input.trim();
    const codePart = codeValue.trim();
    let fullMessage = "";
    if (textPart && codePart) fullMessage = `${textPart}\n\n\`\`\`${language}\n${codePart}\n\`\`\``;
    else if (codePart) fullMessage = `\`\`\`${language}\n${codePart}\n\`\`\``;
    else if (textPart) fullMessage = textPart;
    else return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: fullMessage, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
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
      const scoringData = parseInlineBlock(fullContent, "scoring");
      if (scoringData) setScoring(scoringData);
      const evalData = parseEvaluation(fullContent);
      if (evalData) { setEvaluation(evalData); onComplete?.(evalData.score, updatedMessages, evalData); }
      onMessagesChange?.(updatedMessages);
    } catch (err: any) { toast.error(err.message || "Erreur de communication"); }
    finally { setIsStreaming(false); }
  }, [input, codeValue, isStreaming, messages, user, evaluation, practiceId, scenario, isLastExchange, language, onComplete]);

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const resetSession = () => { setMessages([]); setEvaluation(null); setScoring(null); setCodeValue(""); setInput(""); setBriefingOpen(true); };
  const copyCode = () => { navigator.clipboard.writeText(codeValue); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  // Separate scenario from chat messages
  const scenarioMsg = messages.find((m) => m.id === "scenario");
  const chatMessages = messages.filter((m) => m.id !== "scenario");

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Code Editor */}
      <div className="w-1/2 border-r flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-card shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Code className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold">{isEditableCode ? "Votre code" : "Code à reviewer"}</span>
            <Badge variant="outline" className="text-xs h-5">{language}</Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyCode}>
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          <CodeEditor value={codeValue} onChange={isEditableCode ? setCodeValue : undefined} language={language} readOnly={!isEditableCode} minHeight="100%" />
        </div>
        {scoring && (
          <div className="px-4 py-2.5 border-t bg-card flex flex-wrap gap-3 text-xs shrink-0">
            {Object.entries(scoring).filter(([k]) => !["attempt", "total"].includes(k)).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1">
                <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}:</span>
                <span className={cn("font-bold", typeof v === "number" && v >= 8 ? "text-emerald-600" : typeof v === "number" && v >= 5 ? "text-amber-600" : "text-destructive")}>{String(v)}</span>
              </div>
            ))}
            {scoring.total !== undefined && (
              <div className="border-l pl-3 font-medium">Total: <span className="font-bold text-primary">{scoring.total}</span></div>
            )}
          </div>
        )}
      </div>

      {/* Right: Chat */}
      <div className="w-1/2 flex flex-col overflow-hidden">
        {/* Chat messages + Briefing in scroll */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
          {/* Briefing Card inside scroll */}
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
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Sparkles className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
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

        {!evaluation && (
          <div className="shrink-0 p-4 border-t bg-background">
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isEditableCode ? "Expliquez vos choix de code..." : "Votre analyse ou review..."}
                className="min-h-[44px] max-h-[100px] resize-none text-sm"
                rows={1}
                disabled={isStreaming}
              />
              <Button size="icon" onClick={sendMessage} disabled={(!input.trim() && !codeValue.trim()) || isStreaming} className="shrink-0 h-[44px] w-[44px]">
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
