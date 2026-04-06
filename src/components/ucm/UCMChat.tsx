import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { useUCMChatMessages, useSendUCMChat } from "@/hooks/useUCMChat";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="flex flex-col h-[600px]">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4 p-1">
          {isLoading && <p className="text-center text-muted-foreground text-sm">Chargement…</p>}
          {!isLoading && (!messages || messages.length === 0) && (
            <p className="text-center text-muted-foreground text-sm py-12">
              Posez une question sur le projet — l'IA consultant a accès à tout le contexte (UC, analyses, synthèse).
            </p>
          )}
          {(messages || []).map((m: any) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}>
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
              <div className="bg-muted rounded-xl px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="border-t pt-3 mt-3 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez votre question au consultant IA…"
          className="min-h-[48px] max-h-[120px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
        />
        <Button onClick={handleSend} disabled={sendChat.isPending || !input.trim()} size="icon" className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
