import { useMemo, useState } from "react";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChallengeView } from "@/components/challenge/ChallengeView";
import { BriefingForm } from "./briefing/BriefingForm";
import { EnrichedSidebar } from "./EnrichedSidebar";
import { InspectorPanel } from "./InspectorPanel";
import { useChallengeSession } from "@/hooks/useChallengeSession";
import { useChallengeArtifacts, type ChallengeArtifact } from "@/hooks/useChallengeArtifacts";
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
  const [selected, setSelected] = useState<ChallengeArtifact | null>(null);

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
            onSelect={(a) => setSelected(a)}
            onCreate={create}
            onUpdate={update}
            onDelete={remove}
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

          {showBoard && (
            <ChallengeView
              template={template}
              workshopId={workshopId}
              cards={cards}
              pillars={pillars}
              isHost={isHost}
              readOnly={readOnly}
            />
          )}

          {session.status === "synthesis" && (
            <div className="max-w-2xl mx-auto p-10 text-center">
              <h3 className="font-display text-xl font-black uppercase tracking-tight">Synthèse multi-agents</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Cette étape sera assurée par <code>challenge-synthesize</code> (L9).
              </p>
              {isHost && (
                <Button className="mt-6" onClick={() => setStatus("closed")}>Clôturer définitivement</Button>
              )}
            </div>
          )}

          {(session.status === "closed" || session.status === "archived" || session.status === "draft") && (
            <div className="p-10 text-center text-sm text-muted-foreground">Session {session.status}.</div>
          )}
        </div>

        {selectedSync && showBoard && (
          <InspectorPanel
            artifact={selectedSync}
            sessionId={session.id}
            canEdit={canEdit}
            onClose={() => setSelected(null)}
            onUpdate={update}
          />
        )}
      </div>
    </div>
  );
}
