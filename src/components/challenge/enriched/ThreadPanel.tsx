import { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, EyeOff, CornerDownRight, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { CRITICALITY_META } from "./constants";
import type { ChallengeArtifact, CreateArtifactInput, Criticality } from "@/hooks/useChallengeArtifacts";

interface Props {
  parent: ChallengeArtifact;
  artifacts: ChallengeArtifact[];
  canEdit: boolean;
  onCreate: (input: CreateArtifactInput) => Promise<any>;
}

const PALETTE: { criticality: Criticality; bg: string; ring: string; emoji: string }[] = [
  { criticality: "low", bg: "bg-amber-50 dark:bg-amber-950/40", ring: "ring-amber-200/70 dark:ring-amber-800/60", emoji: "💬" },
  { criticality: "medium", bg: "bg-blue-50 dark:bg-blue-950/40", ring: "ring-blue-200/70 dark:ring-blue-800/60", emoji: "💡" },
  { criticality: "high", bg: "bg-orange-50 dark:bg-orange-950/40", ring: "ring-orange-200/70 dark:ring-orange-800/60", emoji: "⚠️" },
  { criticality: "critical", bg: "bg-rose-50 dark:bg-rose-950/40", ring: "ring-rose-300/70 dark:ring-rose-800/60", emoji: "🔥" },
];

// Stable rotation per artifact id
function rotationFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (((h % 7) + 7) % 7) - 3; // -3..+3 deg
}

export function ThreadPanel({ parent, artifacts, canEdit, onCreate }: Props) {
  // Recursive descendants flattened in chronological order via thread_root_id when available,
  // fallback to parent_artifact_id traversal
  const replies = useMemo(() => {
    const root = parent.thread_root_id ?? parent.id;
    const linear = artifacts
      .filter(a => a.thread_root_id === root && a.id !== parent.id)
      .sort((a, b) => (a.thread_order ?? 0) - (b.thread_order ?? 0) || a.created_at.localeCompare(b.created_at));
    if (linear.length > 0) return linear;
    // Fallback BFS for legacy threads
    const out: ChallengeArtifact[] = [];
    const queue = [parent.id];
    while (queue.length) {
      const pid = queue.shift()!;
      const kids = artifacts.filter(a => a.parent_artifact_id === pid).sort((a, b) => a.created_at.localeCompare(b.created_at));
      out.push(...kids);
      kids.forEach(k => queue.push(k.id));
    }
    return out;
  }, [artifacts, parent.id, parent.thread_root_id]);

  const [content, setContent] = useState("");
  const [anon, setAnon] = useState(false);
  const [crit, setCrit] = useState<Criticality>("low");
  const [busy, setBusy] = useState(false);

  const submit = async (parentId: string = parent.id) => {
    if (!content.trim()) return;
    setBusy(true);
    const palette = PALETTE.find(p => p.criticality === crit) ?? PALETTE[0];
    const created = await onCreate({
      kind: "postit",
      content: content.trim(),
      parent_artifact_id: parentId,
      subject_id: parent.subject_id,
      criticality: crit,
      emoji: palette.emoji,
      is_anonymous: anon,
    });
    setBusy(false);
    if (created) setContent("");
  };

  // Group replies by direct parent for cascade rendering
  const childrenOf = (pid: string) =>
    replies.filter(r => r.parent_artifact_id === pid);

  const renderNode = (node: ChallengeArtifact, depth: number) => {
    const palette = PALETTE.find(p => p.criticality === node.criticality) ?? PALETTE[0];
    const rot = rotationFor(node.id);
    const kids = childrenOf(node.id);

    return (
      <div key={node.id} className="relative" style={{ paddingLeft: depth === 0 ? 0 : 16 }}>
        {depth > 0 && (
          <span className="absolute left-1 top-0 bottom-0 w-px bg-gradient-to-b from-border via-border to-transparent" />
        )}
        {depth > 0 && (
          <CornerDownRight className="absolute -left-0 top-3 h-3 w-3 text-muted-foreground/60" />
        )}
        <div className="flex items-start gap-2 pt-1">
          <div
            className={cn(
              "relative shrink-0 rounded-sm ring-1 px-2.5 py-2 text-xs leading-snug shadow-[0_2px_4px_rgba(0,0,0,0.06)] max-w-[260px]",
              palette.bg, palette.ring,
            )}
            style={{ transform: `rotate(${rot * 0.4}deg)` }}
          >
            <p className="whitespace-pre-wrap break-words">
              {node.emoji && <span className="mr-1">{node.emoji}</span>}{node.content}
            </p>
            <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-current/10">
              <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">
                {node.is_anonymous ? "Anonyme" : "Auteur"}
              </span>
              <span className="text-[9px] tabular-nums text-muted-foreground">
                {new Date(node.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>
        {kids.length > 0 && (
          <div className="mt-1 space-y-1">
            {kids.map(k => renderNode(k, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Top-level replies = those whose parent is the inspected artifact
  const topReplies = childrenOf(parent.id);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
        <MessageCircle className="h-3 w-3" />
        Fil de discussion ({replies.length})
      </div>

      {replies.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-3 text-center">
          <p className="text-[11px] text-muted-foreground italic">Aucune réponse. Commence le fil ↓</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {topReplies.map(r => renderNode(r, 0))}
        </div>
      )}

      {canEdit && (
        <div className="rounded-md border border-border bg-background p-2 space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            placeholder="Continuer le fil…"
            className="text-xs resize-none border-0 focus-visible:ring-0 px-1 py-0.5 min-h-[44px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); }
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {(Object.keys(CRITICALITY_META) as Criticality[]).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCrit(c)}
                  title={CRITICALITY_META[c].label}
                  className={cn("h-5 w-5 rounded-full grid place-items-center transition-all", crit === c ? "ring-2 ring-foreground/40 scale-110" : "opacity-60 hover:opacity-100")}
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full", CRITICALITY_META[c].dot)} />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAnon(v => !v)}
                className={cn("ml-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 h-5 rounded", anon ? "bg-amber-500/15 text-amber-700" : "text-muted-foreground hover:bg-muted")}
              >
                <EyeOff className="h-3 w-3" /> {anon ? "Anon" : "Public"}
              </button>
            </div>
            <Button size="sm" onClick={() => submit()} disabled={busy || !content.trim()} className="h-7 px-3 text-[11px] font-bold gap-1">
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Envoyer
            </Button>
          </div>
          <p className="text-[9px] text-muted-foreground/70 px-1">⌘/Ctrl+Entrée pour envoyer</p>
        </div>
      )}
    </div>
  );
}
