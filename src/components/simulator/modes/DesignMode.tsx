// DesignMode — Interactive board/canvas + side chat
// Used for: backlog_prio, capacity_planning, process_mapping, integration_planning, bm_design

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Loader2, Layout, GripVertical, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { ScoreReveal } from "../widgets/ScoreReveal";
import { SuggestionChips } from "../widgets/SuggestionChips";
import { getModeDefinition } from "../config/modeRegistry";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface BoardItem {
  id: string;
  label: string;
  priority: "high" | "medium" | "low";
  notes: string;
}

interface DesignModeProps {
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

function parseEvaluation(content: string) {
  const match = content.match(/```evaluation\s*\n?([\s\S]*?)```/);
  if (!match) return null;
  try { const p = JSON.parse(match[1].trim()); if (typeof p.score === "number") return p; } catch {} return null;
}

function parseSuggestions(content: string): string[] {
  const match = content.match(/```suggestions\s*\n?([\s\S]*?)```/);
  if (!match) return [];
  try { const p = JSON.parse(match[1].trim()); if (Array.isArray(p)) return p.slice(0, 3); } catch {} return [];
}

function cleanContent(content: string): string {
  return content
    .replace(/```(scoring|gauges|kpis|board|suggestions)\s*\n?[\s\S]*?```/g, "")
    .replace(/```evaluation\s*\n?[\s\S]*?```/g, "")
    .trim();
}

export function DesignMode({
  practiceType,
  typeConfig,
  systemPrompt,
  scenario,
  maxExchanges,
  practiceId,
  previewMode = false,
  onComplete,
  onExchangeUpdate,
  onMessagesChange,
}: DesignModeProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [boardItems, setBoardItems] = useState<BoardItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState("");
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

  const addBoardItem = () => {
    if (!newItemLabel.trim()) return;
    setBoardItems((prev) => [...prev, { id: crypto.randomUUID(), label: newItemLabel.trim(), priority: "medium", notes: "" }]);
    setNewItemLabel("");
  };

  const removeBoardItem = (id: string) => {
    setBoardItems((prev) => prev.filter((i) => i.id !== id));
  };

  const cyclePriority = (id: string) => {
    setBoardItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const next = item.priority === "high" ? "medium" : item.priority === "medium" ? "low" : "high";
      return { ...item, priority: next };
    }));
  };

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = overrideText || input.trim();
    if (isStreaming || !user || evaluation) return;

    // Include board state in message
    let fullMessage = "";
    const boardSummary = boardItems.length > 0
      ? `\n\n**Mon board actuel :**\n${boardItems.map((i, idx) => `${idx + 1}. [${i.priority.toUpperCase()}] ${i.label}`).join("\n")}`
      : "";

    fullMessage = (text || "Voici mon board") + boardSummary;
    if (!fullMessage.trim()) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: fullMessage, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setSuggestions([]);
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

      const newSuggestions = parseSuggestions(fullContent);
      if (newSuggestions.length > 0) setSuggestions(newSuggestions);

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
  }, [input, boardItems, isStreaming, messages, user, evaluation, practiceId, scenario, isLastExchange, onComplete]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const resetSession = () => {
    setMessages([]);
    setEvaluation(null);
    setBoardItems([]);
    setSuggestions([]);
    setInput("");
  };

  const priorityColors = {
    high: "border-destructive/40 bg-destructive/5",
    medium: "border-amber-500/40 bg-amber-500/5",
    low: "border-emerald-500/40 bg-emerald-500/5",
  };
  const priorityBadge = {
    high: "destructive" as const,
    medium: "secondary" as const,
    low: "outline" as const,
  };

  return (
    <div className="flex h-full">
      {/* Left: Interactive Board */}
      <div className="w-1/2 border-r flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <Layout className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">Board</span>
            <Badge variant="outline" className="text-[9px] h-4">{boardItems.length} items</Badge>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
          {boardItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex items-center gap-2 rounded-lg border px-3 py-2", priorityColors[item.priority])}
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 cursor-grab" />
              <span className="text-xs text-muted-foreground font-mono w-5">{idx + 1}.</span>
              <span className="text-sm flex-1 truncate">{item.label}</span>
              <Badge
                variant={priorityBadge[item.priority]}
                className="text-[9px] h-4 cursor-pointer select-none"
                onClick={() => cyclePriority(item.id)}
              >
                {item.priority}
              </Badge>
              <button onClick={() => removeBoardItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}

          {boardItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              Ajoutez des éléments à votre board pour structurer votre réflexion
            </div>
          )}
        </div>

        {/* Add item input */}
        {!evaluation && (
          <div className="p-3 border-t bg-muted/20">
            <div className="flex gap-2">
              <Input
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addBoardItem(); }}
                placeholder="Ajouter un élément..."
                className="text-xs h-8"
              />
              <Button size="sm" variant="outline" onClick={addBoardItem} disabled={!newItemLabel.trim()} className="h-8 px-2">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Chat */}
      <div className="w-1/2 flex flex-col">
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
                  "max-w-[90%] rounded-2xl px-4 py-3 text-sm",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {msg.role === "assistant" ? (
                    <EnrichedMarkdown content={cleanContent(msg.content)} />
                  ) : (
                    <p className="whitespace-pre-wrap text-xs">{msg.content.length > 200 ? msg.content.substring(0, 200) + "..." : msg.content}</p>
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

        {evaluation && (
          <ScoreReveal score={evaluation.score} feedback={evaluation.feedback} dimensions={evaluation.dimensions} recommendations={evaluation.recommendations} onRestart={resetSession} />
        )}

        {!evaluation && suggestions.length > 0 && !isStreaming && (
          <SuggestionChips suggestions={suggestions} onSelect={(s) => sendMessage(s)} disabled={isStreaming} />
        )}

        {!evaluation && (
          <div className="p-3 border-t bg-background">
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Expliquez vos choix ou demandez conseil..."
                className="min-h-[40px] max-h-[100px] resize-none text-xs"
                rows={1}
                disabled={isStreaming}
              />
              <Button size="icon" onClick={() => sendMessage()} disabled={(!input.trim() && boardItems.length === 0) || isStreaming} className="shrink-0 h-[40px] w-[40px]">
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
