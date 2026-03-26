// AssessmentMode — Compliance/conformity grid + justification + AI scoring
// Used for: security_audit, ai_impact, legal_analysis, compliance, gdpr_pia, digital_maturity

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Loader2, ClipboardCheck, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
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
import { getModeDefinition } from "../config/modeRegistry";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type CriterionStatus = "conform" | "non_conform" | "partial" | "pending";

interface Criterion {
  id: string;
  label: string;
  status: CriterionStatus;
  justification: string;
}

interface AssessmentModeProps {
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
    .replace(/```(scoring|gauges|criteria|suggestions)\s*\n?[\s\S]*?```/g, "")
    .replace(/```evaluation\s*\n?[\s\S]*?```/g, "")
    .trim();
}

const defaultCriteria: Record<string, string[]> = {
  security_audit: ["Authentification", "Autorisation", "Chiffrement", "Logging", "Injection", "CORS", "Secrets management", "Dépendances"],
  gdpr_pia: ["Base légale", "Minimisation", "Durée de conservation", "Droits des personnes", "Transferts hors UE", "Sous-traitants", "Sécurité", "PIA nécessaire"],
  compliance: ["Politique interne", "Formation", "Déclarations", "Contrôles", "Documentation", "Reporting", "Sanctions", "Amélioration continue"],
  ai_impact: ["Emplois impactés", "Biais algorithmiques", "Transparence", "Vie privée", "Sécurité des données", "Responsabilité", "Réglementation", "Impact environnemental"],
  legal_analysis: ["Conformité réglementaire", "Risque contractuel", "Responsabilité civile", "Propriété intellectuelle", "Protection des données", "Droit social"],
  digital_maturity: ["Stratégie digitale", "Culture data", "Outils & infra", "Compétences", "Processus", "Innovation", "Gouvernance", "Expérience client"],
};

export function AssessmentMode({
  practiceType,
  typeConfig,
  systemPrompt,
  scenario,
  maxExchanges,
  practiceId,
  previewMode = false,
  onComplete,
  onExchangeUpdate,
}: AssessmentModeProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>(() => {
    const labels = defaultCriteria[practiceType] || defaultCriteria.compliance;
    return labels.map((label) => ({ id: crypto.randomUUID(), label, status: "pending" as CriterionStatus, justification: "" }));
  });
  const [selectedCriterion, setSelectedCriterion] = useState<string | null>(null);
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

  const cycleStatus = (id: string) => {
    setCriteria((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const order: CriterionStatus[] = ["pending", "conform", "partial", "non_conform"];
      const next = order[(order.indexOf(c.status) + 1) % order.length];
      return { ...c, status: next };
    }));
  };

  const updateJustification = (id: string, text: string) => {
    setCriteria((prev) => prev.map((c) => c.id === id ? { ...c, justification: text } : c));
  };

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = overrideText || input.trim();
    if (isStreaming || !user || evaluation) return;

    // Include assessment grid
    const gridSummary = criteria
      .filter((c) => c.status !== "pending")
      .map((c) => `- ${c.label}: ${c.status}${c.justification ? ` — ${c.justification}` : ""}`)
      .join("\n");

    let fullMessage = text || "Voici mon évaluation";
    if (gridSummary) fullMessage += `\n\n**Ma grille d'évaluation :**\n${gridSummary}`;
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
  }, [input, criteria, isStreaming, messages, user, evaluation, practiceId, scenario, isLastExchange, onComplete]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const resetSession = () => {
    setMessages([]);
    setEvaluation(null);
    setSuggestions([]);
    setInput("");
    setCriteria((prev) => prev.map((c) => ({ ...c, status: "pending", justification: "" })));
    setSelectedCriterion(null);
  };

  const statusIcon = {
    pending: <MinusCircle className="h-4 w-4 text-muted-foreground" />,
    conform: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    partial: <MinusCircle className="h-4 w-4 text-amber-600" />,
    non_conform: <XCircle className="h-4 w-4 text-destructive" />,
  };

  const assessed = criteria.filter((c) => c.status !== "pending").length;

  return (
    <div className="flex h-full">
      {/* Left: Assessment Grid */}
      <div className="w-80 border-r flex flex-col bg-muted/10 shrink-0">
        <div className="px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">{modeDef?.label || "Assessment"}</span>
            <Badge variant="outline" className="text-[9px] h-4 ml-auto">{assessed}/{criteria.length}</Badge>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
          {criteria.map((c) => (
            <motion.div
              key={c.id}
              className={cn(
                "rounded-lg border px-3 py-2 cursor-pointer transition-colors",
                selectedCriterion === c.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              )}
              onClick={() => setSelectedCriterion(selectedCriterion === c.id ? null : c.id)}
            >
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); cycleStatus(c.id); }} className="shrink-0">
                  {statusIcon[c.status]}
                </button>
                <span className="text-xs font-medium flex-1">{c.label}</span>
              </div>
              {selectedCriterion === c.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-2"
                >
                  <Textarea
                    value={c.justification}
                    onChange={(e) => updateJustification(c.id, e.target.value)}
                    placeholder="Justification..."
                    className="text-[11px] min-h-[60px] resize-none"
                    rows={2}
                    disabled={!!evaluation}
                  />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="px-3 py-2 border-t bg-muted/20">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Progression</span>
            <span>{Math.round((assessed / criteria.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${(assessed / criteria.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right: Chat */}
      <div className="flex-1 flex flex-col min-w-0">
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
                    <p className="whitespace-pre-wrap text-xs">{msg.content.length > 300 ? msg.content.substring(0, 300) + "..." : msg.content}</p>
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
          <div className="p-4 border-t bg-background">
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Commentaire ou question sur votre évaluation..."
                className="min-h-[44px] max-h-[120px] resize-none"
                rows={1}
                disabled={isStreaming}
              />
              <Button size="icon" onClick={() => sendMessage()} disabled={(!input.trim() && assessed === 0) || isStreaming} className="shrink-0 h-[44px] w-[44px]">
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
