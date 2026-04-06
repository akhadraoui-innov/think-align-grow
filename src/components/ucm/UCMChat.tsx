import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { useUCMChatMessages, useSendUCMChat } from "@/hooks/useUCMChat";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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

  const handleSend = () => {
    const msg = input.trim();
    if (!msg) return;
    setInput("");
    sendChat.mutate({ project_id: projectId, message: msg });
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-6">
        <div className="max-w-3xl mx-auto space-y-4 py-6">
          {isLoading && (
            <p className="text-center text-muted-foreground text-sm">Chargement…</p>
          )}
          {!isLoading && (!messages || messages.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold text-foreground">Consultant IA</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Posez une question sur le projet — l'IA consultant a accès à tout le contexte (UC, analyses, synthèse).
              </p>
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
            onClick={handleSend}
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
