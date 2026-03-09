import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wifi, Copy, Check, Crown, MessageCircle } from "lucide-react";
import { PageTransition } from "@/components/ui/PageTransition";
import { useWorkshopRoom } from "@/hooks/useWorkshop";
import { useCards, usePillars } from "@/hooks/useToolkitData";
import { useCanvasItems } from "@/hooks/useCanvasItems";
import { useCanvasComments } from "@/hooks/useCanvasComments";
import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/use-mobile";
import { WorkshopCanvas } from "@/components/workshop/WorkshopCanvas";
import { WorkshopToolbar } from "@/components/workshop/WorkshopToolbar";
import { CardSidebar } from "@/components/workshop/CardSidebar";
import { DiscussionPanel } from "@/components/workshop/DiscussionPanel";
import { CanvasStats } from "@/components/workshop/CanvasStats";
import { supabase } from "@/integrations/supabase/client";

export default function WorkshopRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMobile();

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

  const { data: allCards } = useCards();
  const { data: pillars } = usePillars();
  const {
    items,
    loading: canvasLoading,
    addItem,
    updatePosition,
    updateContent,
    updateSize,
    updateColor,
    bringToFront,
    deleteItem,
    createArrow,
  } = useCanvasItems(id);

  // Canvas state
  const [viewport, setViewport] = useState({ x: 100, y: 80, scale: 1 });
  const [mode, setMode] = useState<"select" | "sticky" | "arrow" | "group">("select");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [arrowStart, setArrowStart] = useState<string | null>(null);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [copied, setCopied] = useState(false);

  // Comments for selected item
  const { comments, loading: commentsLoading, addComment, deleteComment } = useCanvasComments(id, selectedItemId);

  // Profiles cache
  const [profiles, setProfiles] = useState<Record<string, { display_name: string; avatar_url: string | null }>>({});

  // Load participant profiles
  useEffect(() => {
    if (!participants.length) return;
    const map: Record<string, { display_name: string; avatar_url: string | null }> = {};
    participants.forEach(p => {
      map[p.user_id] = { display_name: p.display_name, avatar_url: null };
    });
    setProfiles(map);
  }, [participants]);

  // Redirect invalid id
  useEffect(() => {
    if (id === ":id") {
      navigate("/workshop", { replace: true });
    }
  }, [id, navigate]);

  // Get title for selected item
  const selectedItemTitle = useMemo(() => {
    if (!selectedItemId) return undefined;
    const item = items.find(i => i.id === selectedItemId);
    if (!item) return undefined;
    if (item.type === "card" && item.card_id && allCards) {
      const card = allCards.find(c => c.id === item.card_id);
      return card?.title;
    }
    if (item.type === "sticky") return (item.content?.text as string) || "Post-it";
    if (item.type === "group") return (item.content?.title as string) || "Groupe";
    return "Flèche";
  }, [selectedItemId, items, allCards]);

  // Handlers
  const handleAddCard = useCallback(async (cardId: string) => {
    const centerX = (-viewport.x + 400) / viewport.scale;
    const centerY = (-viewport.y + 300) / viewport.scale;
    // Offset slightly random to avoid stacking
    const offsetX = Math.random() * 60 - 30;
    const offsetY = Math.random() * 60 - 30;
    await addItem("card", centerX + offsetX, centerY + offsetY, { card_id: cardId });
    toast.success("Carte ajoutée au canvas");
  }, [viewport, addItem]);

  const handleAddSticky = useCallback(async (x: number, y: number) => {
    await addItem("sticky", x, y, { color: "yellow", content: { text: "" } });
    setMode("select");
  }, [addItem]);

  const handleAddGroup = useCallback(async (x: number, y: number) => {
    await addItem("group", x, y, { width: 400, height: 300, content: { title: "Groupe" } });
    setMode("select");
  }, [addItem]);

  const handleArrowClick = useCallback(async (itemId: string) => {
    if (!arrowStart) {
      setArrowStart(itemId);
      return;
    }
    if (arrowStart === itemId) {
      setArrowStart(null);
      return;
    }
    await createArrow(arrowStart, itemId);
    setArrowStart(null);
    setMode("select");
    toast.success("Flèche créée");
  }, [arrowStart, createArrow]);

  const handleSelectItem = useCallback((itemId: string | null) => {
    setSelectedItemId(itemId);
    if (!itemId) {
      setShowDiscussion(false);
    }
  }, []);

  const copyCode = () => {
    if (!workshop) return;
    navigator.clipboard.writeText(workshop.code);
    setCopied(true);
    toast.success("Code copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading state
  if (workshopLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </PageTransition>
    );
  }

  // Not found
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

  // Lobby state
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

            {/* Participants */}
            <div className="mt-8 mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {participants.length} participant{participants.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {participants.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border"
                  >
                    <div className={`h-2 w-2 rounded-full ${p.is_connected ? "bg-pillar-finance" : "bg-muted"}`} />
                    <span className="text-xs font-bold">{p.display_name}</span>
                    {p.role === "host" && <Crown className="h-3 w-3 text-primary" />}
                  </div>
                ))}
              </div>
            </div>

            {isHost ? (
              <Button
                onClick={startWorkshop}
                className="font-black uppercase tracking-wider rounded-xl"
                disabled={participants.length < 1}
              >
                Démarrer le workshop
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                L'animateur va bientôt démarrer la session...
              </p>
            )}
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  // Completed state
  if (workshop.status === "completed") {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center px-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full rounded-2xl bg-foreground p-8 text-center relative overflow-hidden"
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl" style={{ background: "hsl(var(--primary))" }} />
            <div className="relative">
              <h2 className="font-display font-black text-2xl uppercase tracking-tight text-background mb-2">
                Workshop Terminé ! 🎉
              </h2>
              <p className="text-sm text-background/50 mb-4">
                {participants.length} participants — {items.filter(i => i.type === "card").length} cartes posées
              </p>
              <Button
                onClick={() => navigate("/workshop")}
                variant="outline"
                className="rounded-xl font-bold uppercase tracking-wider bg-background text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  // Active/Paused — Full Canvas Mode
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Toolbar */}
      <WorkshopToolbar
        mode={mode}
        onModeChange={setMode}
        viewport={viewport}
        onViewportChange={setViewport}
        workshopStatus={workshop.status}
        isHost={isHost}
        participants={participants}
        onStart={startWorkshop}
        onPause={pauseWorkshop}
        onResume={resumeWorkshop}
        onComplete={completeWorkshop}
        onBack={() => navigate("/workshop")}
        workshopName={workshop.name}
      />

      {/* Main area */}
      <div className="flex-1 flex relative mt-[60px]">
        {/* Card Sidebar */}
        {allCards && pillars && (
          <CardSidebar
            cards={allCards}
            pillars={pillars}
            onAddCard={handleAddCard}
            isMobile={isMobile}
          />
        )}

        {/* Canvas */}
        <div className="flex-1 relative">
          <WorkshopCanvas
            items={items}
            cards={allCards || []}
            pillars={pillars || []}
            selectedItemId={selectedItemId}
            mode={mode}
            arrowStart={arrowStart}
            onSelectItem={handleSelectItem}
            onUpdatePosition={updatePosition}
            onUpdateContent={updateContent}
            onUpdateSize={updateSize}
            onUpdateColor={updateColor}
            onBringToFront={bringToFront}
            onDeleteItem={deleteItem}
            onAddSticky={handleAddSticky}
            onAddGroup={handleAddGroup}
            onArrowClick={handleArrowClick}
            viewport={viewport}
            onViewportChange={setViewport}
            profiles={profiles}
          />

          {/* Stats */}
          <CanvasStats
            items={items}
            pillars={pillars || []}
            cards={(allCards || []).map(c => ({ id: c.id, pillar_id: c.pillar_id }))}
            participantCount={participants.length}
          />

          {/* Discussion toggle */}
          {selectedItemId && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute bottom-4 right-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
              onClick={() => setShowDiscussion(!showDiscussion)}
            >
              <MessageCircle className="h-5 w-5" />
            </motion.button>
          )}

          {/* Discussion panel */}
          <DiscussionPanel
            isOpen={showDiscussion && !!selectedItemId}
            onClose={() => setShowDiscussion(false)}
            comments={comments}
            loading={commentsLoading}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            currentUserId={user?.id}
            profiles={profiles}
            selectedItemTitle={selectedItemTitle}
          />
        </div>
      </div>

      {/* Arrow mode indicator */}
      {mode === "arrow" && arrowStart && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-foreground text-background text-sm font-bold shadow-elevated animate-pulse-soft">
          Cliquez sur un autre élément pour créer la flèche
        </div>
      )}
    </div>
  );
}
