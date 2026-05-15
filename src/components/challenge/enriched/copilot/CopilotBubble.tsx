import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2, Trash2, Bot, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useChallengeCopilot } from "@/hooks/useChallengeCopilot";
import { cn } from "@/lib/utils";
import type { ChallengeArtifact } from "@/hooks/useChallengeArtifacts";

interface Props {
  sessionId: string;
  workshopId: string;
  currentSubjectId: string | null;
  selectedArtifact: ChallengeArtifact | null;
}

const SUGGESTIONS = [
  "Synthétise les 3 idées les plus prometteuses.",
  "Quels angles morts j'ai oubliés ?",
  "Reformule notre problématique en une phrase.",
];

export function CopilotBubble({ sessionId, workshopId, currentSubjectId, selectedArtifact }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const ctx = {
    subject_id: currentSubjectId,
    artifact_id: selectedArtifact?.id ?? null,
    slot_id: selectedArtifact?.slot_id ?? null,
  };

  const { messages, streaming, ask, reset } = useChallengeCopilot(sessionId, workshopId, ctx);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming]);

  const send = async () => {
    const t = text.trim();
    if (!t || streaming) return;
    setText("");
    await ask(t);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 group flex items-center gap-2 rounded-full bg-primary text-primary-foreground pl-3 pr-4 py-2.5 shadow-lg hover:shadow-2xl hover:scale-105 transition-all"
        title="Co-pilote IA"
      >
        <div className="relative">
          <Sparkles className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider">Co-pilote</span>
        <Badge variant="secondary" className="h-4 text-[9px] bg-background/20 text-primary-foreground border-0">Beta</Badge>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[400px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-2rem)] rounded-xl border border-border bg-background/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2 bg-gradient-to-r from-primary/10 to-transparent">
        <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider">Co-pilote IA</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {selectedArtifact ? `focus: ${selectedArtifact.kind}` : "contexte session entière"}
          </p>
        </div>
        <Badge variant="outline" className="h-4 text-[9px]">Beta</Badge>
        {messages.length > 0 && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={reset} title="Nouveau thread">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setOpen(false)}>
          <Minimize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && !streaming && (
          <div className="space-y-3 pt-4">
            <div className="text-center space-y-1">
              <Bot className="h-8 w-8 mx-auto text-primary/60" />
              <p className="text-sm font-bold">Comment je peux aider ?</p>
              <p className="text-[11px] text-muted-foreground">Je connais le briefing, les sujets, les contributions.</p>
            </div>
            <div className="space-y-1.5 pt-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2", m.role === "user" && "flex-row-reverse")}>
            <div className={cn(
              "h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold",
              m.role === "user" ? "bg-muted" : "bg-primary text-primary-foreground",
            )}>
              {m.role === "user" ? "Toi" : <Sparkles className="h-3 w-3" />}
            </div>
            <div className={cn(
              "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap max-w-[85%]",
              m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm",
            )}>{m.content}</div>
          </div>
        ))}
        {streaming && (
          <div className="flex gap-2">
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Sparkles className="h-3 w-3" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-3 py-2 bg-muted text-sm flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Réflexion…
            </div>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-border bg-background">
        <div className="relative">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Demande au co-pilote…"
            rows={2}
            className="resize-none pr-10 text-sm"
          />
          <Button
            size="icon"
            onClick={send}
            disabled={!text.trim() || streaming}
            className="absolute bottom-1.5 right-1.5 h-7 w-7"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
