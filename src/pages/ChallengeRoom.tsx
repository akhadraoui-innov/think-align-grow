import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Pause, Play, Check, Lock, Pencil, Save, Wifi, Copy, Crown } from "lucide-react";
import { PageTransition } from "@/components/ui/PageTransition";
import { useWorkshopRoom } from "@/hooks/useWorkshop";
import { useCards, usePillars } from "@/hooks/useToolkitData";
import { useChallengeTemplate } from "@/hooks/useChallengeData";
import { useAuth } from "@/hooks/useAuth";
import { ChallengeView } from "@/components/challenge/ChallengeView";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ChallengeRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    workshop,
    participants,
    loading: workshopLoading,
    isHost,
    startWorkshop,
    pauseWorkshop,
    resumeWorkshop,
    completeWorkshop,
  } = useWorkshopRoom(id);

  // Extract template_id from workshop config
  const config = workshop?.config as any;
  const templateId = config?.template_id as string | undefined;

  // Fetch the specific template
  const { data: template } = useChallengeTemplate(templateId);

  // Derive toolkit_id from the resolved template
  const toolkitId = template?.toolkit_id;

  const { data: allCards } = useCards(toolkitId);
  const { data: pillars } = usePillars(toolkitId);

  const [editMode, setEditMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (!workshop) return;
    navigator.clipboard.writeText(workshop.code);
    setCopied(true);
    toast.success("Code copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  if (workshopLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </PageTransition>
    );
  }

  if (!workshop) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center px-5 gap-4">
          <p className="text-muted-foreground">Challenge introuvable.</p>
          <Button onClick={() => navigate("/challenge")} variant="outline" className="rounded-xl font-bold uppercase tracking-wider">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux challenges
          </Button>
        </div>
      </PageTransition>
    );
  }

  // Lobby screen
  if (workshop.status === "lobby") {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center px-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full rounded-2xl border-2 border-dashed border-border p-8 text-center"
          >
            <Wifi className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-display font-black text-2xl uppercase tracking-tight mb-2">
              {workshop.name}
            </h1>
            <p className="text-sm text-muted-foreground mb-2">
              Partagez le code pour inviter votre équipe :
            </p>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-secondary text-2xl font-display font-black tracking-[0.3em] uppercase hover:bg-secondary/80 transition-colors"
            >
              {copied ? <Check className="h-5 w-5 text-pillar-finance" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
              {workshop.code}
            </button>
            <div className="mt-8 mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {participants.length} participant{participants.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border">
                    <div className={`h-2 w-2 rounded-full ${p.is_connected ? "bg-pillar-finance" : "bg-muted"}`} />
                    <span className="text-xs font-bold">{p.display_name}</span>
                    {p.role === "host" && <Crown className="h-3 w-3 text-primary" />}
                  </div>
                ))}
              </div>
            </div>
            {isHost ? (
              <Button onClick={startWorkshop} className="font-black uppercase tracking-wider rounded-xl" disabled={participants.length < 1}>
                Démarrer le challenge
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground italic">L'animateur va bientôt démarrer la session...</p>
            )}
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  const isCompleted = workshop.status === "completed";
  const isReadOnly = isCompleted && !editMode;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Minimal challenge header */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-background/80 backdrop-blur-sm border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/challenge")} className="rounded-xl shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-sm uppercase tracking-tight truncate">{workshop.name}</h1>
            <StatusBadge status={workshop.status} />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isCompleted && (
            isReadOnly ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Lecture seule</span>
                {isHost && (
                  <Button variant="outline" size="sm" className="rounded-xl font-bold uppercase tracking-wider text-xs h-7 ml-1" onClick={() => setEditMode(true)}>
                    <Pencil className="h-3 w-3 mr-1.5" />Modifier
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-primary">
                <Pencil className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Édition</span>
                <Button variant="default" size="sm" className="rounded-xl font-bold uppercase tracking-wider text-xs h-7 ml-1" onClick={() => { setEditMode(false); toast.success("Modifications enregistrées"); }}>
                  <Save className="h-3 w-3 mr-1.5" />Enregistrer
                </Button>
              </div>
            )
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/50">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold">{participants.length}</span>
          </div>

          {isHost && !isCompleted && (
            <div className="flex items-center gap-2">
              {workshop.status === "active" && (
                <>
                  <Button onClick={pauseWorkshop} variant="outline" size="sm" className="rounded-xl font-bold uppercase tracking-wider text-xs">
                    <Pause className="h-3.5 w-3.5 mr-1.5" />Pause
                  </Button>
                  <Button onClick={completeWorkshop} variant="destructive" size="sm" className="rounded-xl font-bold uppercase tracking-wider text-xs">
                    <Check className="h-3.5 w-3.5 mr-1.5" />Terminer
                  </Button>
                </>
              )}
              {workshop.status === "paused" && (
                <>
                  <Button onClick={resumeWorkshop} size="sm" className="rounded-xl font-bold uppercase tracking-wider text-xs">
                    <Play className="h-3.5 w-3.5 mr-1.5" />Reprendre
                  </Button>
                  <Button onClick={completeWorkshop} variant="destructive" size="sm" className="rounded-xl font-bold uppercase tracking-wider text-xs">
                    Terminer
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Challenge content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {template ? (
          <ChallengeView
            template={template}
            workshopId={id!}
            cards={allCards || []}
            pillars={pillars || []}
            isHost={isHost}
            readOnly={isReadOnly}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Aucun template de challenge disponible.
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    lobby: { label: "En attente", class: "bg-muted text-muted-foreground" },
    active: { label: "En cours", class: "bg-pillar-finance/15 text-pillar-finance" },
    paused: { label: "Pause", class: "bg-pillar-business/15 text-pillar-business" },
    completed: { label: "Terminé", class: "bg-primary/15 text-primary" },
  };
  const s = map[status] || map.lobby;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${s.class}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {s.label}
    </span>
  );
}
