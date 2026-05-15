import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, HelpCircle, Bot, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { CreateArtifactInput } from "@/hooks/useChallengeArtifacts";

interface Props {
  onCreate: (input: CreateArtifactInput) => Promise<any>;
  defaultSubjectId?: string | null;
  sessionId: string;
}

const RECIPIENTS = [
  { id: "ai", label: "IA Coach", icon: Bot },
  { id: "group", label: "Groupe", icon: HelpCircle },
  { id: "host", label: "Animateur", icon: HelpCircle },
] as const;

export function QuestionComposer({ onCreate, defaultSubjectId, sessionId }: Props) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [recipient, setRecipient] = useState<typeof RECIPIENTS[number]["id"]>("ai");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const [busy, setBusy] = useState(false);
  const [anon, setAnon] = useState(false);

  const submit = async () => {
    if (!content.trim()) return;
    setBusy(true);
    const created = await onCreate({
      kind: "question",
      content: content.trim(),
      emoji: "❓",
      criticality: urgency === "high" ? "high" : urgency === "low" ? "low" : "medium",
      subject_id: defaultSubjectId ?? null,
      is_anonymous: anon,
      ai_meta: { recipient, status: recipient === "ai" ? "pending_ai" : "open" },
    });
    if (created && recipient === "ai") {
      supabase.functions.invoke("challenge-agent", {
        body: { artifact_id: created.id, session_id: sessionId, mode: "qa" },
      }).then(({ error }) => { if (error) console.error("agent", error); });
    }
    setBusy(false);
    if (created) { setContent(""); setOpen(false); }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="w-full justify-start font-bold">
        <Plus className="h-4 w-4 mr-2" /> Poser une question
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-3">
      <Textarea
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Quelle est ta question ?"
        className="resize-none"
      />
      <div>
        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">Destinataire</p>
        <div className="grid grid-cols-3 gap-1">
          {RECIPIENTS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRecipient(r.id)}
              className={cn(
                "rounded-md py-1.5 text-[10px] font-bold uppercase tracking-wider ring-1 transition-all flex items-center justify-center gap-1",
                recipient === r.id ? "ring-2 ring-primary bg-primary/5" : "ring-border hover:bg-muted",
              )}
            >
              <r.icon className="h-3 w-3" /> {r.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">Urgence</p>
        <div className="grid grid-cols-3 gap-1">
          {(["low", "medium", "high"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUrgency(u)}
              className={cn(
                "rounded-md py-1.5 text-[10px] font-bold uppercase tracking-wider ring-1 transition-all",
                urgency === u ? "ring-2 ring-primary bg-primary/5" : "ring-border hover:bg-muted",
              )}
            >{u === "low" ? "Calme" : u === "medium" ? "Normal" : "Urgent"}</button>
          ))}
        </div>
      </div>
      <div className="flex justify-between gap-2 items-center">
        <button
          type="button"
          onClick={() => setAnon(v => !v)}
          className={cn("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded", anon ? "bg-amber-500/15 text-amber-700" : "text-muted-foreground hover:bg-muted")}
        >
          <EyeOff className="h-3 w-3" /> {anon ? "Anonyme" : "Public"}
        </button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setContent(""); }}>Annuler</Button>
          <Button size="sm" onClick={submit} disabled={busy || !content.trim()} className="font-bold">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}
