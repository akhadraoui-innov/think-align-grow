import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Play, Pause, Copy, Check, ChevronRight, Timer, Crown, Wifi, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/PageTransition";
import { useWorkshopRoom } from "@/hooks/useWorkshop";
import { useCards, usePillars } from "@/hooks/useToolkitData";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    lobby: { label: "En attente", class: "bg-muted text-muted-foreground" },
    active: { label: "En cours", class: "bg-primary/15 text-primary" },
    paused: { label: "Pause", class: "bg-accent/15 text-accent" },
    completed: { label: "Terminé", class: "bg-pillar-finance/15 text-pillar-finance" },
  };
  const s = map[status] || map.lobby;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.class}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {s.label}
    </span>
  );
}

export default function WorkshopRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    workshop,
    participants,
    loading,
    isHost,
    startWorkshop,
    pauseWorkshop,
    resumeWorkshop,
    completeWorkshop,
    goToCard,
  } = useWorkshopRoom(id);

  const { data: allCards } = useCards();
  const { data: pillars } = usePillars();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id === ":id") {
      navigate("/workshop", { replace: true });
    }
  }, [id, navigate]);

  // Get current card info
  const currentCard = useMemo(() => {
    if (!workshop?.current_card_id || !allCards) return null;
    return allCards.find((c) => c.id === workshop.current_card_id) || null;
  }, [workshop?.current_card_id, allCards]);

  const currentPillar = useMemo(() => {
    if (!currentCard || !pillars) return null;
    return pillars.find((p) => p.id === currentCard.pillar_id) || null;
  }, [currentCard, pillars]);

  const copyCode = () => {
    if (!workshop) return;
    navigator.clipboard.writeText(workshop.code);
    setCopied(true);
    toast.success("Code copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
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
          <p className="text-muted-foreground">Workshop introuvable.</p>
          <Button onClick={() => navigate("/workshop")} variant="outline" className="rounded-xl font-bold uppercase tracking-wider">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux workshops
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen px-5 pt-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-black text-xl uppercase tracking-tight">{workshop.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={workshop.status} />
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {workshop.code}
              </button>
            </div>
          </div>
        </div>

        {/* Participants */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground">
              Participants ({participants.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 rounded-xl bg-card border border-border px-3 py-2"
              >
                <div className={`h-2 w-2 rounded-full ${p.is_connected ? "bg-pillar-finance" : "bg-muted"}`} />
                <span className="text-xs font-bold">{p.display_name}</span>
                {p.role === "host" && <Crown className="h-3 w-3 text-primary" />}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Lobby state */}
        {workshop.status === "lobby" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-dashed border-border p-8 text-center"
          >
            <Wifi className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display font-black text-lg uppercase tracking-tight mb-2">
              En attente des participants
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              Partagez le code <strong className="text-foreground">{workshop.code}</strong> pour inviter votre équipe.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              {participants.length} participant{participants.length > 1 ? "s" : ""} connecté{participants.length > 1 ? "s" : ""}
            </p>

            {isHost && (
              <Button
                onClick={startWorkshop}
                className="font-black uppercase tracking-wider rounded-xl"
                disabled={participants.length < 1}
              >
                <Play className="h-4 w-4 mr-2" />
                Démarrer le workshop
              </Button>
            )}
            {!isHost && (
              <p className="text-xs text-muted-foreground italic">
                L'animateur va bientôt démarrer la session...
              </p>
            )}
          </motion.div>
        )}

        {/* Active / Paused state - Current card display */}
        {(workshop.status === "active" || workshop.status === "paused") && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Host controls */}
            {isHost && (
              <div className="flex items-center gap-2">
                {workshop.status === "active" ? (
                  <Button variant="outline" size="sm" onClick={pauseWorkshop} className="rounded-xl font-bold uppercase tracking-wider text-xs">
                    <Pause className="h-3.5 w-3.5 mr-1.5" />
                    Pause
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={resumeWorkshop} className="rounded-xl font-bold uppercase tracking-wider text-xs">
                    <Play className="h-3.5 w-3.5 mr-1.5" />
                    Reprendre
                  </Button>
                )}
                <Button variant="destructive" size="sm" onClick={completeWorkshop} className="rounded-xl font-bold uppercase tracking-wider text-xs ml-auto">
                  Terminer
                </Button>
              </div>
            )}

            {/* Current card */}
            {currentCard ? (
              <div className="rounded-2xl bg-card border border-border p-6 card-shadow">
                {currentPillar && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">
                    {currentPillar.name} — Étape {workshop.current_step + 1}
                  </span>
                )}
                <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-3">
                  {currentCard.title}
                </h2>
                {currentCard.definition && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {currentCard.definition}
                  </p>
                )}
                {currentCard.action && (
                  <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 block">Action</span>
                    <p className="text-sm text-foreground">{currentCard.action}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {isHost ? "Sélectionnez une carte depuis les piliers pour commencer." : "En attente de l'animateur..."}
                </p>
              </div>
            )}

            {/* Card browser for host */}
            {isHost && allCards && pillars && (
              <CardBrowser
                cards={allCards}
                pillars={pillars}
                currentCardId={workshop.current_card_id}
                onSelect={(cardId, step) => goToCard(cardId, step)}
              />
            )}
          </motion.div>
        )}

        {/* Completed */}
        {workshop.status === "completed" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-foreground p-8 text-center relative overflow-hidden"
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl" style={{ background: "hsl(var(--primary))" }} />
            <div className="relative">
              <h2 className="font-display font-black text-2xl uppercase tracking-tight text-background mb-2">
                Workshop Terminé ! 🎉
              </h2>
              <p className="text-sm text-background/50 mb-4">
                {participants.length} participants — La génération des livrables arrive dans le Sprint 4.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}

// Simple card browser for the host
function CardBrowser({
  cards,
  pillars,
  currentCardId,
  onSelect,
}: {
  cards: any[];
  pillars: any[];
  currentCardId: string | null;
  onSelect: (cardId: string, step: number) => void;
}) {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  return (
    <div className="mt-4">
      <h3 className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">
        Sélectionner une carte
      </h3>
      <div className="space-y-2">
        {pillars.map((pillar) => {
          const pillarCards = cards.filter((c) => c.pillar_id === pillar.id);
          const isExpanded = expandedPillar === pillar.id;

          return (
            <div key={pillar.id}>
              <button
                onClick={() => setExpandedPillar(isExpanded ? null : pillar.id)}
                className="w-full flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3 text-left hover:bg-secondary transition-colors"
              >
                <span className="font-display font-bold text-sm uppercase tracking-tight">
                  {pillar.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground">{pillarCards.length}</span>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="py-2 pl-4 space-y-1">
                      {pillarCards.map((card, idx) => (
                        <button
                          key={card.id}
                          onClick={() => onSelect(card.id, idx)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            card.id === currentCardId
                              ? "bg-primary/10 text-primary font-bold"
                              : "hover:bg-secondary text-foreground"
                          }`}
                        >
                          <span className="text-muted-foreground text-xs mr-2">{idx + 1}.</span>
                          {card.title}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
