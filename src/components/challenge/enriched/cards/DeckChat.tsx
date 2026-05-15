import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Sparkles, Loader2, Bot, User, Plus, Wand2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { PHASE_LABELS } from "@/hooks/useToolkitData";

type Msg = { role: "user" | "assistant"; content: string; cited?: { id: string; title: string }[] };

interface Props {
  sessionId: string;
  cards: DbCard[];
  pillars: DbPillar[];
  onPickCard?: (cardId: string) => void;
  onCreateCustomFromDraft?: (draft: { title: string; definition?: string; phase?: string; pillar_id?: string | null }) => void;
}

const QUICK_PROMPTS = [
  "Quelle carte choisir pour clarifier la proposition de valeur ?",
  "Explique-moi la différence entre les cartes des piliers Modèle vs Croissance.",
  "Je n'ai pas trouvé ma carte — propose-moi un brouillon personnalisé.",
];

export function DeckChat({ sessionId, cards, pillars, onPickCard, onCreateCustomFromDraft }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const cardsContext = useMemo(() => {
    return cards.slice(0, 200).map(c => {
      const p = pillars.find(x => x.id === c.pillar_id);
      return {
        id: c.id,
        title: c.title,
        pillar: p?.name || "",
        phase: PHASE_LABELS[c.phase] || c.phase,
        definition: (c.definition || "").slice(0, 220),
        objective: (c.objective || "").slice(0, 160),
      };
    });
  }, [cards, pillars]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("challenge-agent", {
        body: {
          mode: "deck_assistant",
          session_id: sessionId,
          messages: next.map(m => ({ role: m.role, content: m.content })),
          cards_context: cardsContext,
        },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "AI failed");
      setMessages(m => [...m, { role: "assistant", content: data.answer, cited: data.cited_cards || [] }]);
    } catch (e: any) {
      toast.error("Échec du copilote", { description: String(e?.message || e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 grid grid-rows-[1fr_auto] overflow-hidden bg-muted/10">
      <ScrollArea className="min-h-0">
        <div ref={scrollRef as any} className="p-5 max-w-3xl mx-auto w-full space-y-4">
          <div className="text-center py-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-display font-black text-sm uppercase tracking-widest">Copilote des cartes</h3>
            <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-border bg-background hover:border-primary hover:text-primary transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-4 text-xs h-8 gap-2"
              onClick={() => setMessages([])}
            >
              <RotateCcw className="h-3 w-3" /> Relancer la sélection
            </Button>
          </div>

          {messages.map((m, i) => (
            <MessageBubble
              key={i}
              msg={m}
              cards={cards}
              onPickCard={onPickCard}
              onCreateDraft={onCreateCustomFromDraft}
            />
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Le copilote réfléchit…
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border bg-background p-3">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
              else if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Demande une carte, une explication, un brouillon…  (Entrée pour envoyer)"
            rows={1}
            className="resize-none min-h-[42px] max-h-32 text-sm"
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()} className="font-bold shrink-0">
            <Send className="h-4 w-4 mr-1" /> Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  msg, cards, onPickCard, onCreateDraft,
}: {
  msg: Msg;
  cards: DbCard[];
  onPickCard?: (id: string) => void;
  onCreateDraft?: (draft: { title: string; definition?: string; phase?: string; pillar_id?: string | null }) => void;
}) {
  const isUser = msg.role === "user";
  const draft = !isUser ? extractDraft(msg.content) : null;

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
        isUser ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm",
      )}>
        {msg.content}

        {!isUser && msg.cited && msg.cited.length > 0 && (
          <div className="mt-3 pt-2 border-t border-border/60 flex flex-wrap gap-1.5">
            <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground w-full">Cartes citées</span>
            {msg.cited.map(c => (
              <button
                key={c.id}
                onClick={() => onPickCard?.(c.id)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Plus className="h-2.5 w-2.5" /> {c.title}
              </button>
            ))}
          </div>
        )}

        {!isUser && draft && (
          <div className="mt-3 pt-2 border-t border-border/60">
            <Button size="sm" variant="outline" onClick={() => onCreateDraft?.(draft)} className="text-[10px] h-7 font-bold">
              <Wand2 className="h-3 w-3 mr-1" /> Créer cette carte personnalisée
            </Button>
          </div>
        )}
      </div>
      {isUser && (
        <div className="h-7 w-7 rounded-full bg-foreground/10 text-foreground grid place-items-center shrink-0">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function extractDraft(text: string): { title: string; definition?: string; phase?: string; pillar_id?: string | null } | null {
  const titleMatch = text.match(/(?:\*\*)?\s*Titre\s*(?:\*\*)?\s*[:：]\s*([^\n*]+)/i);
  if (!titleMatch) return null;
  const defMatch = text.match(/(?:\*\*)?\s*D[ée]finition\s*(?:\*\*)?\s*[:：]\s*([^\n*]+)/i);
  const phaseMatch = text.match(/(?:\*\*)?\s*Phase\s*(?:\*\*)?\s*[:：]\s*([^\n*]+)/i);
  return {
    title: titleMatch[1].trim().slice(0, 60),
    definition: defMatch ? defMatch[1].trim().slice(0, 400) : undefined,
    phase: phaseMatch ? phaseMatch[1].trim().toLowerCase() : undefined,
  };
}
