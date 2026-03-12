import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  toolkit: Tables<"toolkits">;
  pillars: Tables<"pillars">[];
  onUpdate: () => void;
}

type Message = { role: "user" | "assistant"; content: string };

export function ToolkitAIChatDialog({ toolkit, pillars, onUpdate }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [scope, setScope] = useState("all");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const instruction = input.trim();
    if (!instruction || loading) return;

    setInput("");
    const userMsg: Message = { role: "user", content: instruction };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("refine-toolkit", {
        body: {
          toolkit_id: toolkit.id,
          scope: scope === "all" ? "all" : scope,
          instruction,
        },
      });
      if (error) throw error;

      const assistantMsg: Message = {
        role: "assistant",
        content: data?.summary || "Modifications appliquées avec succès.",
      };
      setMessages(prev => [...prev, assistantMsg]);
      onUpdate();
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `❌ Erreur : ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" /> Améliorer avec l'IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Améliorer « {toolkit.name} »
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">Scope :</span>
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="h-8 w-48 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout le toolkit</SelectItem>
              {pillars.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-3 py-2 px-1">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8 space-y-2">
              <Bot className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p>Décrivez les améliorations souhaitées :</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {["Rends les KPIs plus mesurables", "Ajoute un angle RSE", "Simplifie les définitions"].map(s => (
                  <Badge key={s} variant="outline" className="cursor-pointer text-xs hover:bg-primary/10" onClick={() => setInput(s)}>
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
              <div className={`rounded-xl px-3 py-2 max-w-[80%] text-sm ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}>
                {m.content}
              </div>
              {m.role === "user" && <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <Bot className="h-5 w-5 text-primary shrink-0" />
              <div className="bg-muted rounded-xl px-3 py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ex: Rends les actions plus concrètes pour le pilier Finance..."
            className="min-h-[60px] resize-none text-sm"
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()} className="shrink-0 self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
