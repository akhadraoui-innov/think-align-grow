// DocumentMode — Split-view: Markdown editor (left) + AI feedback chat (right)
// Used for: spec_writing, user_story, adr, data_storytelling, nocode_architect, presentation

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Loader2, FileText, Eye, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { ScoreReveal } from "../widgets/ScoreReveal";
import { SuggestionChips } from "../widgets/SuggestionChips";
import { InputQualityIndicator } from "../widgets/InputQualityIndicator";
import { getModeDefinition } from "../config/modeRegistry";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface DocumentModeProps {
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
  try {
    const parsed = JSON.parse(match[1].trim());
    if (typeof parsed.score === "number") return parsed;
  } catch {}
  return null;
}

function parseSuggestions(content: string): string[] {
  const match = content.match(/```suggestions\s*\n?([\s\S]*?)```/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1].trim());
    if (Array.isArray(parsed)) return parsed.slice(0, 3);
  } catch {}
  return [];
}

function cleanContent(content: string): string {
  return content
    .replace(/```(scoring|gauges|kpis|suggestions)\s*\n?[\s\S]*?```/g, "")
    .replace(/```evaluation\s*\n?[\s\S]*?```/g, "")
    .trim();
}

export function DocumentMode({
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
}: DocumentModeProps) {
  const { user } = useAuth();
  const [document, setDocument] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [editorTab, setEditorTab] = useState<string>("edit");
  const scrollRef = useRef<HTMLDivElement>(null);

  const modeDef = getModeDefinition(practiceType);
  const exchangeCount = messages.filter((m) => m.role === "user").length;
  const isLastExchange = exchangeCount >= maxExchanges - 1;

  useEffect(() => {
    onExchangeUpdate?.(exchangeCount);
  }, [exchangeCount, onExchangeUpdate]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 && scenario) {
      setMessages([{ id: "scenario", role: "assistant", content: scenario, timestamp: new Date() }]);
    }
  }, [scenario]);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const chatText = overrideText || chatInput.trim();
    if (isStreaming || !user || evaluation) return;

    // Combine document + chat message
    let fullMessage = "";
    if (document.trim() && chatText) {
      fullMessage = `**Mon document :**\n\n${document.trim()}\n\n---\n\n**Mon commentaire :** ${chatText}`;
    } else if (document.trim()) {
      fullMessage = `**Mon document :**\n\n${document.trim()}`;
    } else if (chatText) {
      fullMessage = chatText;
    } else {
      return;
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: fullMessage, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setChatInput("");
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

      const newSuggestions = parseSuggestions(fullContent);
      if (newSuggestions.length > 0) setSuggestions(newSuggestions);

      const evalData = parseEvaluation(fullContent);
      if (evalData) {
        setEvaluation(evalData);
        onComplete?.(evalData.score, updatedMessages, evalData);
      }
      onMessagesChange?.(updatedMessages);
    } catch (err: any) {
      toast.error(err.message || "Erreur de communication");
    } finally {
      setIsStreaming(false);
    }
  }, [chatInput, document, isStreaming, messages, user, evaluation, practiceId, scenario, isLastExchange, onComplete]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const resetSession = () => {
    setMessages([]);
    setEvaluation(null);
    setDocument("");
    setChatInput("");
    setSuggestions([]);
  };

  const wordCount = document.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex h-full">
      {/* Left: Document Editor */}
      <div className="w-1/2 border-r flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">Document</span>
            <Badge variant="outline" className="text-[9px] h-4">{wordCount} mots</Badge>
          </div>
          <Tabs value={editorTab} onValueChange={setEditorTab}>
            <TabsList className="h-7">
              <TabsTrigger value="edit" className="text-[10px] h-5 px-2 gap-1">
                <Edit3 className="h-3 w-3" /> Éditer
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-[10px] h-5 px-2 gap-1">
                <Eye className="h-3 w-3" /> Aperçu
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          {editorTab === "edit" ? (
            <textarea
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              placeholder="Rédigez votre document ici en markdown..."
              className="w-full h-full resize-none border-0 bg-transparent p-4 text-sm font-mono focus:outline-none placeholder:text-muted-foreground/40"
              disabled={!!evaluation}
            />
          ) : (
            <div className="p-4 prose prose-sm max-w-none">
              <EnrichedMarkdown content={document || "*Aucun contenu...*"} />
            </div>
          )}
        </div>
      </div>

      {/* Right: AI Feedback Chat */}
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
          <ScoreReveal
            score={evaluation.score}
            feedback={evaluation.feedback}
            dimensions={evaluation.dimensions}
            recommendations={evaluation.recommendations}
            messages={messages.map(m => ({ role: m.role, content: m.content }))}
            onRestart={resetSession}
          />
        )}

        {!evaluation && suggestions.length > 0 && !isStreaming && (
          <SuggestionChips suggestions={suggestions} onSelect={(s) => sendMessage(s)} disabled={isStreaming} />
        )}

        {!evaluation && (
          <div className="p-3 border-t bg-background">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-0">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Commentaire ou question (le document est envoyé automatiquement)..."
                  className="min-h-[40px] max-h-[100px] resize-none text-xs"
                  rows={1}
                  disabled={isStreaming}
                />
                <InputQualityIndicator text={chatInput} practiceType={practiceType} />
              </div>
              <Button size="icon" onClick={() => sendMessage()} disabled={(!chatInput.trim() && !document.trim()) || isStreaming} className="shrink-0 h-[40px] w-[40px]">
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
