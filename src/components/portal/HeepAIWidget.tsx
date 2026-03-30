import { useState } from "react";
import { Bot, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeepAIWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-gradient-hero shadow-primary-glow flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform"
        >
          <Bot className="h-5 w-5" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 h-[28rem] rounded-2xl border border-border/50 bg-card shadow-elevated flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/30 bg-muted/30">
            <div className="h-8 w-8 rounded-full bg-gradient-hero flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Ask GROWTHINNOV IA</p>
              <p className="text-[10px] text-muted-foreground">Mentor spécialisé</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
            <div className="bg-muted/40 rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%]">
              <p className="text-xs text-foreground leading-relaxed">
                Bonjour ! Je suis votre mentor HEEP IA. Comment puis-je vous aider dans votre parcours ?
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-border/30">
            <div className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Posez votre question..."
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
              />
              <button className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0 hover:bg-primary/90 transition-colors">
                <Send className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
