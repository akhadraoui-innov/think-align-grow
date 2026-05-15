import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChallengeArtifact, CreateArtifactInput } from "@/hooks/useChallengeArtifacts";

interface Props {
  parent: ChallengeArtifact;
  artifacts: ChallengeArtifact[];
  canEdit: boolean;
  onCreate: (input: CreateArtifactInput) => Promise<any>;
}

export function ThreadPanel({ parent, artifacts, canEdit, onCreate }: Props) {
  const replies = artifacts.filter(a => a.parent_artifact_id === parent.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const [content, setContent] = useState("");
  const [anon, setAnon] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!content.trim()) return;
    setBusy(true);
    const created = await onCreate({
      kind: "postit",
      content: content.trim(),
      parent_artifact_id: parent.id,
      subject_id: parent.subject_id,
      criticality: "low",
      emoji: "💬",
      is_anonymous: anon,
    });
    setBusy(false);
    if (created) setContent("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
        <MessageCircle className="h-3 w-3" /> Fil de discussion ({replies.length})
      </div>
      <div className="space-y-1.5">
        {replies.length === 0 && <p className="text-xs text-muted-foreground italic">Aucune réponse.</p>}
        {replies.map(r => (
          <div key={r.id} className="rounded-md bg-muted/40 p-2 text-xs">
            <p className="whitespace-pre-wrap">{r.emoji && <span className="mr-1">{r.emoji}</span>}{r.content}</p>
            <p className="text-[9px] text-muted-foreground mt-1">
              {r.is_anonymous ? "Anonyme" : "Auteur"} • {new Date(r.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        ))}
      </div>
      {canEdit && (
        <div className="space-y-1.5">
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={2} placeholder="Répondre…" className="text-xs resize-none" />
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setAnon(v => !v)}
              className={cn("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded", anon ? "bg-amber-500/15 text-amber-700" : "text-muted-foreground hover:bg-muted")}
            >
              <EyeOff className="h-3 w-3" /> {anon ? "Anonyme" : "Public"}
            </button>
            <Button size="sm" onClick={submit} disabled={busy || !content.trim()}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Envoyer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
