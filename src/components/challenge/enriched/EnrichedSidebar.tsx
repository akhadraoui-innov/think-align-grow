import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StickyNote, Mic, HelpCircle, Filter, Image as ImageIcon, Plus, Layers } from "lucide-react";
import { PostitComposer } from "./postits/PostitComposer";
import { PostitCard } from "./postits/PostitCard";
import { VoiceRecorder } from "./voice/VoiceRecorder";
import { VoicePlayer } from "./voice/VoicePlayer";
import { QuestionComposer } from "./questions/QuestionComposer";
import { ImageLibrary } from "./images/ImageLibrary";
import { ImageTile } from "./images/ImageTile";
import { CardsTab } from "./sidebar/CardsTab";
import { CardExplorer } from "./cards/CardExplorer";
import { CRITICALITY_META } from "./constants";
import { cn } from "@/lib/utils";
import type { ChallengeArtifact, ArtifactKind, CreateArtifactInput, Criticality } from "@/hooks/useChallengeArtifacts";
import type { ChallengeReaction, ChallengeVote } from "@/hooks/useChallengeReactions";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { ReactionBar } from "./ReactionBar";
import { VotePill } from "./VotePill";

type SidebarTab = ArtifactKind | "card";

interface Props {
  sessionId: string;
  workshopId: string;
  currentSubjectId?: string | null;
  artifacts: ChallengeArtifact[];
  enabled: { postits: boolean; voice: boolean; questions: boolean; images?: boolean; cards?: boolean };
  canEdit: boolean;
  selectedId: string | null;
  reactionsByArtifact: Record<string, ChallengeReaction[]>;
  votesByArtifact: Record<string, ChallengeVote[]>;
  me: string | null;
  onSelect: (a: ChallengeArtifact | null) => void;
  onCreate: (input: CreateArtifactInput) => Promise<any>;
  onUpdate: (id: string, patch: Partial<ChallengeArtifact>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleReaction: (artifactId: string, emoji: string) => void;
  onToggleVote: (artifactId: string) => void;
  // Cards (toolkit)
  cards?: DbCard[];
  pillars?: DbPillar[];
  placedCardIds?: Set<string>;
  onAddCardToStaging?: (cardId: string) => void;
  customCards?: ChallengeArtifact[];
}

const TABS: { id: SidebarTab; label: string; icon: any }[] = [
  { id: "card", label: "Cartes", icon: Layers },
  { id: "postit", label: "Post-its", icon: StickyNote },
  { id: "voice", label: "Vocaux", icon: Mic },
  { id: "question", label: "Questions", icon: HelpCircle },
  { id: "image", label: "Images", icon: ImageIcon },
];

export function EnrichedSidebar({
  sessionId, workshopId, currentSubjectId, artifacts, enabled, canEdit, selectedId,
  reactionsByArtifact, votesByArtifact, me,
  onSelect, onCreate, onUpdate, onDelete, onToggleReaction, onToggleVote,
  cards = [], pillars = [], placedCardIds, onAddCardToStaging, customCards = [],
}: Props) {
  const allowedTabs = TABS.filter(t =>
    (t.id === "card" && (enabled.cards ?? true) && cards.length > 0) ||
    (t.id === "postit" && enabled.postits) ||
    (t.id === "voice" && enabled.voice) ||
    (t.id === "question" && enabled.questions) ||
    (t.id === "image" && (enabled.images ?? true))
  );
  const [tab, setTab] = useState<SidebarTab>(allowedTabs[0]?.id ?? "postit");
  const [imageOpen, setImageOpen] = useState(false);
  const [filterCrit, setFilterCrit] = useState<Criticality | "all">("all");
  const [scope, setScope] = useState<"current" | "all">(currentSubjectId ? "current" : "all");
  const [includeResolved, setIncludeResolved] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(false);

  const subjectCustomCards = useMemo(
    () => customCards.filter(c => !currentSubjectId || c.visibility_subject_id === currentSubjectId || c.subject_id === currentSubjectId),
    [customCards, currentSubjectId],
  );

  // Only show top-level artifacts in the list (children appear in inspector thread)
  const baseList = useMemo(
    () => artifacts.filter(a => !a.parent_artifact_id && (includeResolved || a.status !== "resolved")),
    [artifacts, includeResolved],
  );

  const filtered = useMemo(() => {
    let list = baseList.filter(a => a.kind === tab);
    if (scope === "current" && currentSubjectId) list = list.filter(a => a.subject_id === currentSubjectId);
    if (filterCrit !== "all" && tab === "postit") list = list.filter(a => a.criticality === filterCrit);
    return list.slice().reverse();
  }, [baseList, tab, filterCrit, scope, currentSubjectId]);

  const counts = useMemo(() => ({
    card: cards.length,
    postit: baseList.filter(a => a.kind === "postit").length,
    voice: baseList.filter(a => a.kind === "voice").length,
    question: baseList.filter(a => a.kind === "question").length,
    image: baseList.filter(a => a.kind === "image").length,
  }), [baseList, cards.length]);

  // Drag-start props for any artifact tile (uses native ghost from the tile itself)
  const dragProps = (a: ChallengeArtifact) => ({
    draggable: canEdit,
    onDragStart: (e: React.DragEvent<HTMLElement>) => {
      e.dataTransfer.setData("artifact-id", a.id);
      e.dataTransfer.setData("artifact-kind", a.kind);
      e.dataTransfer.effectAllowed = "move";
      // Use the tile node itself as drag image, offset to the cursor
      const node = e.currentTarget as HTMLElement;
      const rect = node.getBoundingClientRect();
      try { e.dataTransfer.setDragImage(node, Math.min(40, rect.width / 2), Math.min(20, rect.height / 2)); } catch {}
    },
  });

  return (
    <aside className="w-[280px] min-w-[260px] max-w-[300px] shrink-0 border-r border-border bg-background/60 flex flex-col h-full">
      <div className="px-1.5 pt-2 border-b border-border">
        <div className="flex">
          {allowedTabs.map(t => {
            const active = tab === t.id;
            const count = counts[t.id as keyof typeof counts] ?? 0;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex-1 flex flex-col items-center justify-end gap-0.5 pt-1.5 pb-2 text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                title={`${t.label} (${count})`}
              >
                <t.icon className={cn("h-4 w-4 transition-colors", active && "text-primary")} />
                <span className="flex items-center gap-1 leading-none">
                  <span>{t.label}</span>
                  {count > 0 && (
                    <span className={cn(
                      "inline-flex items-center justify-center h-3.5 min-w-[14px] px-1 rounded-full text-[9px] tabular-nums",
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>{count}</span>
                  )}
                </span>
                <span className={cn(
                  "absolute left-1/2 -translate-x-1/2 bottom-0 h-[2px] rounded-full transition-all",
                  active ? "w-8 bg-primary" : "w-0 bg-transparent"
                )} />
              </button>
            );
          })}
        </div>
      </div>

      {tab === "card" ? (
        <CardsTab
          cards={cards}
          pillars={pillars}
          placedCardIds={placedCardIds}
          onAdd={onAddCardToStaging}
          onOpenExplorer={() => setExplorerOpen(true)}
          customCardCount={subjectCustomCards.length}
        />
      ) : (
        <>
          {currentSubjectId && (
            <div className="px-3 py-1.5 border-b border-border flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
              <button onClick={() => setScope("current")} className={cn("flex-1 py-1 rounded", scope === "current" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>Sujet courant</button>
              <button onClick={() => setScope("all")} className={cn("flex-1 py-1 rounded", scope === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>Tous sujets</button>
              <button onClick={() => setIncludeResolved(v => !v)} className={cn("py-1 px-2 rounded", includeResolved ? "bg-emerald-500/10 text-emerald-600" : "text-muted-foreground hover:bg-muted")} title="Inclure résolus">✓</button>
            </div>
          )}

          {canEdit && (
            <div className="p-3 border-b border-border space-y-2">
              {tab === "postit" && <PostitComposer onCreate={onCreate} defaultSubjectId={scope === "current" ? currentSubjectId : null} />}
              {tab === "voice" && <VoiceRecorder sessionId={sessionId} onCreate={onCreate} defaultSubjectId={scope === "current" ? currentSubjectId : null} />}
              {tab === "question" && <QuestionComposer onCreate={onCreate} sessionId={sessionId} defaultSubjectId={scope === "current" ? currentSubjectId : null} />}
              {tab === "image" && (
                <Button onClick={() => setImageOpen(true)} variant="outline" className="w-full justify-start font-bold">
                  <Plus className="h-4 w-4 mr-2" /> Ajouter une image
                </Button>
              )}
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
              <p className="text-xs text-muted-foreground text-center py-8">
                Aucun élément. {canEdit && "Crée-en un ci-dessus."}
              </p>
            )}
            {tab === "postit" && filtered.map(a => (
              <div key={a.id} className={cn("space-y-1", a.slot_id && "opacity-60")} {...dragProps(a)}>
                <PostitCard
                  artifact={a}
                  canEdit={canEdit}
                  selected={selectedId === a.id}
                  onClick={() => onSelect(a)}
                  onDelete={() => onDelete(a.id)}
                  onResolve={() => onUpdate(a.id, { status: "resolved" })}
                />
                <div className="flex items-center justify-between gap-1 px-1">
                  <ReactionBar artifactId={a.id} reactions={reactionsByArtifact[a.id] ?? []} me={me} onToggle={onToggleReaction} compact />
                  <VotePill artifactId={a.id} votes={votesByArtifact[a.id] ?? []} me={me} onToggle={onToggleVote} />
                </div>
              </div>
            ))}
            {tab === "voice" && filtered.map(a => (
              <div key={a.id} {...dragProps(a)} className={cn(a.slot_id && "opacity-60")}>
                <button onClick={() => onSelect(a)} className={cn("w-full text-left rounded-lg border border-border p-2 space-y-1 hover:bg-muted/40 transition-colors cursor-grab active:cursor-grabbing", selectedId === a.id && "ring-2 ring-primary")}>
                  {a.audio_url && <VoicePlayer storagePath={a.audio_url} durationMs={a.audio_duration_ms} />}
                  {a.transcription ? (
                    <p className="text-xs line-clamp-2 px-1">{a.transcription}</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground italic px-1">Transcription en cours…</p>
                  )}
                </button>
              </div>
            ))}
            {tab === "question" && filtered.map(a => {
              const aiStatus = (a.ai_meta as any)?.status;
              const recipient = (a.ai_meta as any)?.recipient;
              return (
                <div key={a.id} {...dragProps(a)} className={cn(a.slot_id && "opacity-60")}>
                  <button onClick={() => onSelect(a)} className={cn("w-full text-left rounded-lg border border-border p-3 space-y-1.5 hover:bg-muted/40 transition-colors cursor-grab active:cursor-grabbing", selectedId === a.id && "ring-2 ring-primary")}>
                    <p className="text-sm font-medium flex gap-1.5"><span>❓</span> {a.content}</p>
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      <Badge variant="outline" className="text-[9px]">{recipient || "?"}</Badge>
                      {aiStatus && <Badge variant="secondary" className="text-[9px]">{aiStatus}</Badge>}
                    </div>
                  </button>
                </div>
              );
            })}
            {tab === "image" && filtered.map(a => (
              <div key={a.id} {...dragProps(a)} className={cn(a.slot_id && "opacity-60")}>
                <button onClick={() => onSelect(a)} className={cn("w-full text-left rounded-lg border border-border p-2 space-y-1.5 hover:bg-muted/40 transition-colors overflow-hidden cursor-grab active:cursor-grabbing", selectedId === a.id && "ring-2 ring-primary")}>
                  <ImageTile artifact={a} compact />
                  {(a.ai_meta?.alt || a.content) && (
                    <p className="text-[10px] text-muted-foreground line-clamp-1 px-1">{a.ai_meta?.alt || a.content}</p>
                  )}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <ImageLibrary
        open={imageOpen}
        onOpenChange={setImageOpen}
        sessionId={sessionId}
        defaultSubjectId={scope === "current" ? currentSubjectId : null}
        onCreate={onCreate}
      />

      <CardExplorer
        open={explorerOpen}
        onOpenChange={setExplorerOpen}
        cards={cards}
        pillars={pillars}
        customCards={subjectCustomCards}
        placedCardIds={placedCardIds}
        currentSubjectId={currentSubjectId ?? null}
        onAddToStaging={onAddCardToStaging}
        onCreateCustomCard={onCreate}
      />
    </aside>
  );
}
