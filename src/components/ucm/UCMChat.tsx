import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { useUCMChatMessages, useSendUCMChat } from "@/hooks/useUCMChat";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UCMPageHeader } from "./UCMPageHeader";
import { cn } from "@/lib/utils";

const SUGGESTION_CHIPS = [
  "Résume les forces du portfolio UC",
  "Compare les risques entre UC",
  "Propose un plan d'action à 90 jours",
  "Quelles synergies entre les use cases ?",
];

interface Props {
  projectId: string;
}

export function UCMChat({ projectId }: Props) {
  const { data: messages, isLoading } = useUCMChatMessages(projectId);
  const sendChat = useSendUCMChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (msg?: string) => {
    const text = (msg || input).trim();
    if (!text) return;
    setInput("");
    sendChat.mutate({ project_id: projectId, message: text });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0">
        <UCMPageHeader
          icon={<MessageCircle className="h-5 w-5 text-primary" />}
          title="Consultant IA"
          subtitle="Posez des questions sur le projet — l'IA a accès à tout le contexte"
        />
      </div>

      <ScrollArea className="flex-1 px-6">
        <div className="max-w-3xl mx-auto space-y-4 py-6">
          {isLoading && (
            <p className="text-center text-muted-foreground text-sm">Chargement…</p>
          )}
          {!isLoading && (!messages || messages.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold text-foreground">Posez votre première question</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Le consultant IA a accès au contexte complet : UC, analyses et synthèse.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-lg">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSend(chip)}
                    className="px-3 py-1.5 rounded-full border bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}
          {(messages || []).map((m: any) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 border"
                )}
              >
                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                ) : (
                  <EnrichedMarkdown content={m.content || ""} />
                )}
              </div>
            </div>
          ))}
          {sendChat.isPending && (
            <div className="flex justify-start">
              <div className="bg-muted/60 border rounded-2xl px-4 py-3 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="border-t px-6 py-3 shrink-0">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question au consultant IA…"
            className="min-h-[48px] max-h-[120px] resize-none bg-background"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
          />
          <Button
            onClick={() => handleSend()}
            disabled={sendChat.isPending || !input.trim()}
            size="icon"
            className="shrink-0 h-12 w-12"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
