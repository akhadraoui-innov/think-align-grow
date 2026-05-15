import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StickyNote, Mic, HelpCircle, Filter } from "lucide-react";
import { PostitComposer } from "./postits/PostitComposer";
import { PostitCard } from "./postits/PostitCard";
import { VoiceRecorder } from "./voice/VoiceRecorder";
import { VoicePlayer } from "./voice/VoicePlayer";
import { QuestionComposer } from "./questions/QuestionComposer";
import { CRITICALITY_META } from "./constants";
import { cn } from "@/lib/utils";
import type { ChallengeArtifact, ArtifactKind, CreateArtifactInput, Criticality } from "@/hooks/useChallengeArtifacts";

interface Props {
  sessionId: string;
  workshopId: string;
  artifacts: ChallengeArtifact[];
  enabled: { postits: boolean; voice: boolean; questions: boolean };
  canEdit: boolean;
  selectedId: string | null;
  onSelect: (a: ChallengeArtifact | null) => void;
  onCreate: (input: CreateArtifactInput) => Promise<any>;
  onUpdate: (id: string, patch: Partial<ChallengeArtifact>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TABS: { id: ArtifactKind; label: string; icon: any }[] = [
  { id: "postit", label: "Post-its", icon: StickyNote },
  { id: "voice", label: "Vocaux", icon: Mic },
  { id: "question", label: "Questions", icon: HelpCircle },
];

export function EnrichedSidebar({ sessionId, workshopId, artifacts, enabled, canEdit, selectedId, onSelect, onCreate, onUpdate, onDelete }: Props) {
  const allowedTabs = TABS.filter(t => (t.id === "postit" && enabled.postits) || (t.id === "voice" && enabled.voice) || (t.id === "question" && enabled.questions));
  const [tab, setTab] = useState<ArtifactKind>(allowedTabs[0]?.id ?? "postit");
  const [filterCrit, setFilterCrit] = useState<Criticality | "all">("all");

  const filtered = useMemo(() => {
    let list = artifacts.filter(a => a.kind === tab);
    if (filterCrit !== "all" && tab === "postit") list = list.filter(a => a.criticality === filterCrit);
    return list.slice().reverse();
  }, [artifacts, tab, filterCrit]);

  const counts = useMemo(() => ({
    postit: artifacts.filter(a => a.kind === "postit").length,
    voice: artifacts.filter(a => a.kind === "voice").length,
    question: artifacts.filter(a => a.kind === "question").length,
  }), [artifacts]);

  return (
    <aside className="w-[340px] shrink-0 border-r border-border bg-background/60 flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 border-b border-border">
        <div className="flex gap-1">
          {allowedTabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors",
                tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
              <Badge variant="secondary" className="h-4 px-1 text-[9px]">{counts[t.id as keyof typeof counts] ?? 0}</Badge>
            </button>
          ))}
        </div>
      </div>

      {canEdit && (
        <div className="p-3 border-b border-border space-y-2">
          {tab === "postit" && <PostitComposer onCreate={onCreate} />}
          {tab === "voice" && <VoiceRecorder sessionId={sessionId} onCreate={onCreate} />}
          {tab === "question" && <QuestionComposer onCreate={onCreate} sessionId={sessionId} />}
        </div>
      )}

      {tab === "postit" && (
        <div className="px-3 py-2 border-b border-border flex items-center gap-1.5 text-[10px]">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <button onClick={() => setFilterCrit("all")} className={cn("px-2 py-0.5 rounded font-bold uppercase tracking-wider", filterCrit === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>Tous</button>
          {(Object.keys(CRITICALITY_META) as Criticality[]).map(c => (
            <button key={c} onClick={() => setFilterCrit(c)} className={cn("px-2 py-0.5 rounded font-bold flex items-center gap-1", filterCrit === c ? "ring-1 ring-primary" : "opacity-60 hover:opacity-100")}>
              <span className={cn("h-1.5 w-1.5 rounded-full", CRITICALITY_META[c].dot)} />
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">Aucun élément.</p>
        )}
        {tab === "postit" && filtered.map(a => (
          <PostitCard
            key={a.id}
            artifact={a}
            canEdit={canEdit}
            selected={selectedId === a.id}
            onClick={() => onSelect(a)}
            onDelete={() => onDelete(a.id)}
            onResolve={() => onUpdate(a.id, { status: "resolved" })}
          />
        ))}
        {tab === "voice" && filtered.map(a => (
          <button key={a.id} onClick={() => onSelect(a)} className={cn("w-full text-left rounded-lg border border-border p-2 space-y-1 hover:bg-muted/40 transition-colors", selectedId === a.id && "ring-2 ring-primary")}>
            {a.audio_url && <VoicePlayer storagePath={a.audio_url} durationMs={a.audio_duration_ms} />}
            {a.transcription ? (
              <p className="text-xs line-clamp-2 px-1">{a.transcription}</p>
            ) : (
              <p className="text-[10px] text-muted-foreground italic px-1">Transcription en cours…</p>
            )}
          </button>
        ))}
        {tab === "question" && filtered.map(a => {
          const aiStatus = (a.ai_meta as any)?.status;
          const recipient = (a.ai_meta as any)?.recipient;
          return (
            <button key={a.id} onClick={() => onSelect(a)} className={cn("w-full text-left rounded-lg border border-border p-3 space-y-1.5 hover:bg-muted/40 transition-colors", selectedId === a.id && "ring-2 ring-primary")}>
              <p className="text-sm font-medium flex gap-1.5"><span>❓</span> {a.content}</p>
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                <Badge variant="outline" className="text-[9px]">{recipient || "?"}</Badge>
                {aiStatus && <Badge variant="secondary" className="text-[9px]">{aiStatus}</Badge>}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
