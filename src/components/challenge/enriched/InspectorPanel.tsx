import { X, Bot, Tag, Calendar, User, MessageCircle, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { CRITICALITY_META } from "./constants";
import { VoicePlayer } from "./voice/VoicePlayer";
import { ReactionBar } from "./ReactionBar";
import { VotePill } from "./VotePill";
import { ThreadPanel } from "./ThreadPanel";
import { ImageTile } from "./images/ImageTile";
import { LockBadge } from "./locks/LockBadge";
import { useArtifactLock } from "@/hooks/useArtifactLock";
import type { ChallengeArtifact, CreateArtifactInput } from "@/hooks/useChallengeArtifacts";
import type { ChallengeReaction, ChallengeVote } from "@/hooks/useChallengeReactions";
import { cn } from "@/lib/utils";

interface Props {
  artifact: ChallengeArtifact;
  artifacts: ChallengeArtifact[];
  sessionId: string;
  canEdit: boolean;
  reactions: ChallengeReaction[];
  votes: ChallengeVote[];
  me: string | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<ChallengeArtifact>) => Promise<void>;
  onCreate: (input: CreateArtifactInput) => Promise<any>;
  onToggleReaction: (artifactId: string, emoji: string) => void;
  onToggleVote: (artifactId: string) => void;
}

export function InspectorPanel({
  artifact, artifacts, sessionId, canEdit,
  reactions, votes, me,
  onClose, onUpdate, onCreate, onToggleReaction, onToggleVote,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(artifact.content || "");
  const [askingAi, setAskingAi] = useState(false);
  const [aiAction, setAiAction] = useState<string | null>(null);

  const meta = artifact.criticality ? CRITICALITY_META[artifact.criticality] : null;
  const aiMeta = artifact.ai_meta || {};
  const aiResponse = (aiMeta.response || aiMeta.summary || aiMeta.description) as string | undefined;
  const aiStatus = aiMeta.status as string | undefined;

  // Soft lock while editing
  const lock = useArtifactLock(artifact.id, editing && canEdit);
  const lockedByOther = !lock.acquired && !!lock.owner;

  const callAgent = async (mode: string, action?: string) => {
    setAskingAi(true);
    if (action) setAiAction(action);
    await supabase.functions.invoke("challenge-agent", {
      body: { artifact_id: artifact.id, session_id: sessionId, mode, action },
    });
    setAskingAi(false);
    setAiAction(null);
  };

  const askAi = () => callAgent("qa");

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const kindLabel = artifact.kind === "postit" ? "Post-it"
    : artifact.kind === "voice" ? "Mémo vocal"
    : artifact.kind === "question" ? "Question"
    : artifact.kind === "image" ? "Image"
    : artifact.kind;

  return (
    <>
      {/* Backdrop (sm/md only — sur lg+ on garde le centre visible) */}
      <div
        className="fixed inset-0 z-30 bg-background/40 backdrop-blur-[2px] lg:hidden"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: 420, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 420, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="fixed right-0 top-0 bottom-0 z-40 w-full sm:w-[400px] border-l border-border bg-background shadow-2xl flex flex-col"
      >
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className="text-base">{artifact.emoji || (artifact.kind === "image" ? "🖼️" : "📌")}</span>
        <h3 className="font-bold text-sm uppercase tracking-wider flex-1">{kindLabel}</h3>
        {lockedByOther && <LockBadge name="Verrouillé" />}
        <VotePill artifactId={artifact.id} votes={votes} me={me} onToggle={onToggleVote} />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {meta && (
          <div className={cn("rounded-md px-3 py-2 ring-1 flex items-center gap-2 text-xs font-bold", meta.bg, meta.ring, meta.text)}>
            <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
            Criticité {meta.label}
          </div>
        )}

        {artifact.kind === "image" && (
          <div>
            <ImageTile artifact={artifact} />
            {artifact.ai_meta?.alt && (
              <p className="text-[11px] text-muted-foreground italic mt-1">{artifact.ai_meta.alt}</p>
            )}
          </div>
        )}

        {artifact.kind !== "image" && (
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Contenu</p>
            {editing && canEdit && !lockedByOther ? (
              <div className="space-y-2">
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setContent(artifact.content || ""); }}>Annuler</Button>
                  <Button size="sm" onClick={async () => { await onUpdate(artifact.id, { content }); setEditing(false); }}>Enregistrer</Button>
                </div>
              </div>
            ) : (
              <p
                className={cn("text-sm whitespace-pre-wrap rounded-md p-3 bg-muted/30", canEdit && !lockedByOther && "cursor-pointer hover:bg-muted/50")}
                onClick={() => canEdit && !lockedByOther && setEditing(true)}
              >{artifact.content || <em className="text-muted-foreground">(vide)</em>}</p>
            )}
            {lockedByOther && <p className="text-[10px] text-amber-600 mt-1">🔒 Un autre participant édite ce contenu.</p>}
          </div>
        )}

        <ReactionBar artifactId={artifact.id} reactions={reactions} me={me} onToggle={onToggleReaction} />

        {/* AI ACTIONS — POSTIT */}
        {artifact.kind === "postit" && canEdit && (
          <div className="rounded-md border border-border p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Boost IA
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "reformuler", label: "Reformuler", mode: "postit_action" as const },
                { id: "challenger", label: "Challenger", mode: "postit_action" as const },
                { id: "approfondir", label: "Approfondir", mode: "postit_action" as const },
                { id: "devils_advocate", label: "🔥 Avocat du diable", mode: "devils_advocate" as const },
                { id: "coach", label: "🧭 Coach", mode: "coach" as const },
              ].map(c => (
                <Button key={c.id} size="sm" variant="outline" disabled={askingAi}
                  onClick={() => c.mode === "postit_action" ? callAgent("postit_action", c.id) : callAgent(c.mode)}
                  className="h-7 text-[11px]">
                  {askingAi && aiAction === c.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Wand2 className="h-3 w-3 mr-1" />}
                  {c.label}
                </Button>
              ))}
            </div>
            {aiResponse && (
              <div className="rounded bg-primary/5 border border-primary/20 p-2.5 text-sm whitespace-pre-wrap">{aiResponse}</div>
            )}
          </div>
        )}

        {/* AI — IMAGE DESCRIBE */}
        {artifact.kind === "image" && canEdit && (
          <div className="rounded-md border border-border p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Lecture IA
            </div>
            <Button size="sm" variant="outline" disabled={askingAi} onClick={() => callAgent("image_describe")} className="w-full">
              {askingAi ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1" />}
              Décrire & critiquer
            </Button>
            {aiResponse && (
              <div className="rounded bg-primary/5 border border-primary/20 p-2.5 text-sm whitespace-pre-wrap">{aiResponse}</div>
            )}
          </div>
        )}

        {artifact.kind === "voice" && artifact.audio_url && (
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Audio</p>
            <VoicePlayer storagePath={artifact.audio_url} durationMs={artifact.audio_duration_ms} />
            {artifact.transcription && (
              <div className="mt-2 rounded-md bg-muted/30 p-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Transcription</p>
                <p className="text-sm whitespace-pre-wrap">{artifact.transcription}</p>
              </div>
            )}
            {canEdit && artifact.transcription && (
              <Button size="sm" variant="outline" className="w-full mt-2" disabled={askingAi} onClick={() => callAgent("voice_summary")}>
                {askingAi ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                Synthèse IA
              </Button>
            )}
            {aiResponse && (
              <div className="mt-2 rounded bg-primary/5 border border-primary/20 p-2.5 text-sm whitespace-pre-wrap">{aiResponse}</div>
            )}
          </div>
        )}

        {artifact.kind === "question" && (
          <div className="rounded-md border border-border p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Bot className="h-3.5 w-3.5 text-primary" /> Réponse IA
              {aiStatus && <Badge variant="outline" className="text-[10px]">{aiStatus}</Badge>}
            </div>
            {aiResponse ? (
              <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Aucune réponse pour le moment.</p>
                <Button size="sm" variant="outline" onClick={askAi} disabled={askingAi} className="w-full">
                  {askingAi ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Bot className="h-3.5 w-3.5 mr-1" />}
                  {askingAi ? "Génération…" : "Demander à l'IA"}
                </Button>
              </div>
            )}
          </div>
        )}

        {artifact.tags?.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1 flex items-center gap-1"><Tag className="h-3 w-3" /> Tags</p>
            <div className="flex flex-wrap gap-1">
              {artifact.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-border">
          <ThreadPanel parent={artifact} artifacts={artifacts} canEdit={canEdit} onCreate={onCreate} />
        </div>

        <div className="text-[10px] text-muted-foreground space-y-1 pt-2 border-t border-border">
          <p className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(artifact.created_at).toLocaleString("fr-FR")}</p>
          <p className="flex items-center gap-1.5"><User className="h-3 w-3" /> {artifact.is_anonymous ? "Anonyme" : "Auteur"}</p>
          {artifact.category && <p className="flex items-center gap-1.5"><MessageCircle className="h-3 w-3" /> {artifact.category}</p>}
        </div>
      </div>
      </motion.aside>
    </>
  );
}
