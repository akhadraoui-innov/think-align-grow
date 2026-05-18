import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, ArrowLeft, LayoutGrid, Map, Clock, Search } from "lucide-react";
import { SemanticSearchPanel } from "./innovations/SemanticSearchPanel";
import { ReindexButton } from "./innovations/ReindexButton";
import { ScopedSynthesisPanel } from "./innovations/ScopedSynthesisPanel";
import { ExportPdfButton } from "./innovations/ExportPdfButton";
import { SubjectTimer } from "./innovations/SubjectTimer";
import { SpotlightBanner } from "./innovations/Spotlight";
import { AnonymousToggle } from "./innovations/AnonymousToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChallengeView } from "@/components/challenge/ChallengeView";
import { BriefingForm } from "./briefing/BriefingForm";
import { EnrichedSidebar } from "./EnrichedSidebar";
import { InspectorPanel } from "./InspectorPanel";
import { useChallengeSession } from "@/hooks/useChallengeSession";
import { useChallengeArtifacts, type ChallengeArtifact } from "@/hooks/useChallengeArtifacts";
import { useChallengeReactions } from "@/hooks/useChallengeReactions";
import { useChallengePresence } from "@/hooks/useChallengePresence";
import { SynthesisPanel } from "./SynthesisPanel";
import { PlateauBoard } from "./PlateauBoard";
import { PresenceBar } from "./presence/PresenceBar";
import { CopilotBubble } from "./copilot/CopilotBubble";
import { cn } from "@/lib/utils";
import { SessionTimeline } from "./innovations/SessionTimeline";
import type { ChallengeTemplate } from "@/hooks/useChallengeData";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";

interface Props {
  template: ChallengeTemplate;
  workshopId: string;
  cards: DbCard[];
  pillars: DbPillar[];
  isHost: boolean;
  readOnly?: boolean;
}

export function EnrichedChallengeRoom({ template, workshopId, cards, pillars, isHost, readOnly }: Props) {
  const { session, context, loading, setStatus, upsertContext } = useChallengeSession(workshopId, template.id, isHost);
  const { artifacts, create, update, remove } = useChallengeArtifacts(session?.id, workshopId);
  const { reactionsByArtifact, votesByArtifact, me, toggleReaction, toggleVote } = useChallengeReactions(session?.id);
  const { peers, update: updatePresence } = useChallengePresence(session?.id);
  const [selected, setSelected] = useState<ChallengeArtifact | null>(null);
  const [view, setView] = useState<"cards" | "plateau">("cards");
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timeCutoff, setTimeCutoff] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Time-filtered artifacts (Innovation #5)
  const visibleArtifacts = useMemo(() => {
    if (!timeCutoff) return artifacts;
    const t = +new Date(timeCutoff);
    return artifacts.filter(a => +new Date(a.created_at) <= t);
  }, [artifacts, timeCutoff]);

  const timelineEvents = useMemo(
    () => artifacts.map(a => ({ id: a.id, created_at: a.created_at, kind: a.kind })),
    [artifacts],
  );

  // Broadcast which subject/artifact the user is currently viewing
  useEffect(() => {
    updatePresence({
      viewing_subject_id: session?.current_subject_id ?? null,
      editing_artifact_id: selected?.id ?? null,
    });
  }, [session?.current_subject_id, selected?.id, updatePresence]);

  const enabled = useMemo(() => {
    const cfg = (template as any).enriched_config || {};
    return {
      postits: cfg.postits !== false,
      voice: cfg.voice !== false,
      questions: cfg.questions !== false,
      images: cfg.images !== false,
      ai: cfg.ai !== false,
    };
  }, [template]);

  const statusBadge = useMemo(() => {
    const map: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      briefing: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      running: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      synthesis: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
      closed: "bg-slate-500/15 text-slate-600",
      archived: "bg-slate-500/15 text-slate-500",
    };
    return map[session?.status ?? "draft"];
  }, [session?.status]);

  // keep selected in sync with realtime updates
  const selectedSync = selected ? artifacts.find(a => a.id === selected.id) ?? null : null;

  if (loading || !session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const canEdit = !readOnly;
  const showBoard = session.status === "running";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-3 shrink-0 bg-background/50 backdrop-blur-sm">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-display font-bold text-sm uppercase tracking-widest">Challenge enrichi</h2>
        <Badge className={statusBadge} variant="outline">{session.status}</Badge>
        {showBoard && <div className="hidden md:block"><PresenceBar peers={peers} /></div>}
        <div className="ml-auto flex items-center gap-2">
          {showBoard && (
            <div className="flex items-center rounded-md border border-border p-0.5">
              <button onClick={() => setView("cards")} className={cn("h-7 px-2 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1", view === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                <LayoutGrid className="h-3 w-3" /> Cartes
              </button>
              <button onClick={() => setView("plateau")} className={cn("h-7 px-2 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1", view === "plateau" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                <Map className="h-3 w-3" /> Plateau
              </button>
            </div>
          )}
          {showBoard && timelineEvents.length > 1 && (
            <button
              onClick={() => { setTimelineOpen(o => !o); if (timelineOpen) setTimeCutoff(null); }}
              className={cn(
                "h-7 px-2 rounded-md border text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors",
                timelineOpen || timeCutoff
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
              title="Frise chronologique"
            >
              <Clock className="h-3 w-3" /> Timeline
            </button>
          )}
          {showBoard && (
            <button
              onClick={() => setSearchOpen(true)}
              className="h-7 px-2 rounded-md border border-border text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-muted-foreground hover:bg-muted transition-colors"
              title="Recherche sémantique (RAG)"
            >
              <Search className="h-3 w-3" /> Recherche
            </button>
          )}
          {showBoard && isHost && <ReindexButton sessionId={session.id} />}
          {isHost && (session.status === "synthesis" || session.status === "closed" || session.status === "archived") && (
            <ExportPdfButton sessionId={session.id} />
          )}
          {showBoard && session.current_subject_id && (
            <ScopedSynthesisPanel
              sessionId={session.id}
              scope="subject"
              scopeId={session.current_subject_id}
              label="sujet courant"
              canRegenerate={isHost}
            />
          )}
          {isHost && session.status === "running" && (
            <Button size="sm" variant="outline" onClick={() => setStatus("briefing")}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Briefing
            </Button>
          )}
          {isHost && session.status === "briefing" && (
            <Button size="sm" variant="outline" onClick={() => setStatus("running")}>Démarrer →</Button>
          )}
          {isHost && session.status === "running" && (
            <Button size="sm" onClick={() => setStatus("synthesis")} className="font-bold">Clôturer →</Button>
          )}
        </div>
      </div>

      {showBoard && timelineOpen && timelineEvents.length > 1 && (
        <div className="px-4 py-2 border-b border-border bg-muted/30 shrink-0">
          <SessionTimeline events={timelineEvents} onScrub={setTimeCutoff} />
        </div>
      )}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {showBoard && (enabled.postits || enabled.voice || enabled.questions) && (
          <EnrichedSidebar
            sessionId={session.id}
            workshopId={workshopId}
            currentSubjectId={session.current_subject_id}
            artifacts={visibleArtifacts}
            enabled={enabled}
            canEdit={canEdit}
            selectedId={selectedSync?.id ?? null}
            reactionsByArtifact={reactionsByArtifact}
            votesByArtifact={votesByArtifact}
            me={me}
            onSelect={(a) => setSelected(a)}
            onCreate={create}
            onUpdate={update}
            onDelete={remove}
            onToggleReaction={toggleReaction}
            onToggleVote={toggleVote}
            cards={cards}
            pillars={pillars}
            customCards={visibleArtifacts.filter(a => a.kind === "card" && a.is_custom_card)}
          />
        )}

        <div className="flex-1 min-w-0 overflow-auto">
          {session.status === "briefing" && (
            <BriefingForm
              context={context}
              readOnly={!isHost || readOnly}
              onSave={upsertContext}
              onStart={isHost ? () => setStatus("running") : undefined}
              canStart={!!context?.scope || !!context?.goals}
            />
          )}

          {showBoard && view === "cards" && (
            <ChallengeView
              template={template}
              workshopId={workshopId}
              cards={cards}
              pillars={pillars}
              isHost={isHost}
              readOnly={readOnly}
              hideSidebar
              artifacts={visibleArtifacts}
              onAttachArtifact={(slotId, artifactId, subjectId) => update(artifactId, { slot_id: slotId, subject_id: subjectId } as any)}
              onDetachArtifact={(artifactId) => update(artifactId, { slot_id: null } as any)}
              onSelectArtifact={(a) => setSelected(a)}
            />
          )}

          {showBoard && view === "plateau" && (
            <div className="h-full">
              <PlateauBoard
                artifacts={visibleArtifacts}
                canEdit={canEdit}
                selectedId={selectedSync?.id ?? null}
                onSelect={(a) => setSelected(a)}
                onUpdate={update}
                sessionId={session.id}
                onCreate={create}
              />
            </div>
          )}

          {session.status === "synthesis" && (
            <SynthesisPanel
              sessionId={session.id}
              isHost={isHost}
              onClose={() => setStatus("closed")}
            />
          )}

          {(session.status === "closed" || session.status === "archived" || session.status === "draft") && (
            <div className="p-10 text-center text-sm text-muted-foreground">Session {session.status}.</div>
          )}
        </div>

        {selectedSync && showBoard && (
          <InspectorPanel
            artifact={selectedSync}
            artifacts={artifacts}
            sessionId={session.id}
            canEdit={canEdit}
            reactions={reactionsByArtifact[selectedSync.id] ?? []}
            votes={votesByArtifact[selectedSync.id] ?? []}
            me={me}
            onClose={() => setSelected(null)}
            onUpdate={update}
            onCreate={create}
            onToggleReaction={toggleReaction}
            onToggleVote={toggleVote}
          />
        )}
      </div>

      {showBoard && enabled.ai && (
        <CopilotBubble
          sessionId={session.id}
          workshopId={workshopId}
          currentSubjectId={session.current_subject_id}
          selectedArtifact={selectedSync}
        />
      )}
      {showBoard && (
        <SemanticSearchPanel
          open={searchOpen}
          onOpenChange={setSearchOpen}
          sessionId={session.id}
          onJump={(m) => {
            if (m.source_type === "artifact" || m.source_type === "thread") {
              const a = artifacts.find(x => x.id === m.source_id);
              if (a) { setSelected(a); setSearchOpen(false); }
            }
          }}
        />
      )}
    </div>
  );
}
