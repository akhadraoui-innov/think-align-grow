import { useMemo, useState } from "react";
import { Loader2, Sparkles, ArrowLeft, LayoutGrid, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChallengeView } from "@/components/challenge/ChallengeView";
import { BriefingForm } from "./briefing/BriefingForm";
import { EnrichedSidebar } from "./EnrichedSidebar";
import { InspectorPanel } from "./InspectorPanel";
import { useChallengeSession } from "@/hooks/useChallengeSession";
import { useChallengeArtifacts, type ChallengeArtifact } from "@/hooks/useChallengeArtifacts";
import { useChallengeReactions } from "@/hooks/useChallengeReactions";
import { SynthesisPanel } from "./SynthesisPanel";
import { PlateauBoard } from "./PlateauBoard";
import { cn } from "@/lib/utils";
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
  const [selected, setSelected] = useState<ChallengeArtifact | null>(null);
  const [view, setView] = useState<"cards" | "plateau">("cards");

  const enabled = useMemo(() => {
    const cfg = (template as any).enriched_config || {};
    return {
      postits: cfg.postits !== false,
      voice: cfg.voice !== false,
      questions: cfg.questions !== false,
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

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {showBoard && (enabled.postits || enabled.voice || enabled.questions) && (
          <EnrichedSidebar
            sessionId={session.id}
            workshopId={workshopId}
            currentSubjectId={session.current_subject_id}
            artifacts={artifacts}
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
            />
          )}

          {showBoard && view === "plateau" && (
            <div className="h-full">
              <PlateauBoard
                artifacts={artifacts}
                canEdit={canEdit}
                selectedId={selectedSync?.id ?? null}
                onSelect={(a) => setSelected(a)}
                onUpdate={update}
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
    </div>
  );
}
