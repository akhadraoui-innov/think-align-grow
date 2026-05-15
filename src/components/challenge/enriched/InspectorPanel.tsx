import { X, Bot, Tag, Calendar, User, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CRITICALITY_META } from "./constants";
import { VoicePlayer } from "./voice/VoicePlayer";
import type { ChallengeArtifact } from "@/hooks/useChallengeArtifacts";
import { cn } from "@/lib/utils";

interface Props {
  artifact: ChallengeArtifact;
  sessionId: string;
  canEdit: boolean;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<ChallengeArtifact>) => Promise<void>;
}

export function InspectorPanel({ artifact, sessionId, canEdit, onClose, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(artifact.content || "");
  const [askingAi, setAskingAi] = useState(false);

  const meta = artifact.criticality ? CRITICALITY_META[artifact.criticality] : null;
  const aiMeta = artifact.ai_meta || {};
  const aiResponse = aiMeta.response as string | undefined;
  const aiStatus = aiMeta.status as string | undefined;

  const askAi = async () => {
    setAskingAi(true);
    await supabase.functions.invoke("challenge-agent", {
      body: { artifact_id: artifact.id, session_id: sessionId, mode: "qa" },
    });
    setAskingAi(false);
  };

  return (
    <aside className="w-[380px] shrink-0 border-l border-border bg-background/95 backdrop-blur-sm flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className="text-base">{artifact.emoji || "📌"}</span>
        <h3 className="font-bold text-sm uppercase tracking-wider flex-1">
          {artifact.kind === "postit" ? "Post-it" : artifact.kind === "voice" ? "Mémo vocal" : artifact.kind === "question" ? "Question" : artifact.kind}
        </h3>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {meta && (
          <div className={cn("rounded-md px-3 py-2 ring-1 flex items-center gap-2 text-xs font-bold", meta.bg, meta.ring, meta.text)}>
            <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
            Criticité {meta.label}
          </div>
        )}

        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Contenu</p>
          {editing && canEdit ? (
            <div className="space-y-2">
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setContent(artifact.content || ""); }}>Annuler</Button>
                <Button size="sm" onClick={async () => { await onUpdate(artifact.id, { content }); setEditing(false); }}>Enregistrer</Button>
              </div>
            </div>
          ) : (
            <p
              className={cn("text-sm whitespace-pre-wrap rounded-md p-3 bg-muted/30", canEdit && "cursor-pointer hover:bg-muted/50")}
              onClick={() => canEdit && setEditing(true)}
            >{artifact.content || <em className="text-muted-foreground">(vide)</em>}</p>
          )}
        </div>

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
                  <Bot className="h-3.5 w-3.5 mr-1" /> {askingAi ? "Génération…" : "Demander à l'IA"}
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

        <div className="text-[10px] text-muted-foreground space-y-1 pt-2 border-t border-border">
          <p className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(artifact.created_at).toLocaleString("fr-FR")}</p>
          <p className="flex items-center gap-1.5"><User className="h-3 w-3" /> {artifact.is_anonymous ? "Anonyme" : "Auteur"}</p>
          {artifact.category && <p className="flex items-center gap-1.5"><MessageCircle className="h-3 w-3" /> {artifact.category}</p>}
        </div>
      </div>
    </aside>
  );
}
