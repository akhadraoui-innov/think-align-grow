import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wifi, Copy, Check, Crown, MessageCircle, LayoutGrid, Pencil, Play, Pause, Users, Lock, Save } from "lucide-react";
import { PageTransition } from "@/components/ui/PageTransition";
import { useWorkshopRoom } from "@/hooks/useWorkshop";
import { useCards, usePillars, useToolkit } from "@/hooks/useToolkitData";
import { useCanvasItems } from "@/hooks/useCanvasItems";
import { useCanvasComments } from "@/hooks/useCanvasComments";
import { useChallengeTemplates } from "@/hooks/useChallengeData";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { WorkshopCanvas } from "@/components/workshop/WorkshopCanvas";
import { WorkshopToolbar } from "@/components/workshop/WorkshopToolbar";
import { CardSidebar } from "@/components/workshop/CardSidebar";
import { DiscussionPanel } from "@/components/workshop/DiscussionPanel";
import { CanvasStats } from "@/components/workshop/CanvasStats";
import { ChallengeView } from "@/components/challenge/ChallengeView";
import { supabase } from "@/integrations/supabase/client";

export default function WorkshopRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

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
  const { data: toolkit } = useToolkit();
  const { data: challengeTemplates } = useChallengeTemplates(toolkit?.id);
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
  const [mode, setMode] = useState<string>("select");
  const [editMode, setEditMode] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [arrowStart, setArrowStart] = useState<string | null>(null);
  const [arrowStartAnchor, setArrowStartAnchor] = useState<string | null>(null);
  const [selectedIconName, setSelectedIconName] = useState("Star");
  const [stickyShape, setStickyShape] = useState("square");
  const [groupShape, setGroupShape] = useState("rectangle");
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [copied, setCopied] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [workshopMode, setWorkshopMode] = useState<"canvas" | "challenge">("canvas");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Auto-select first template & force challenge mode when templates exist
  useEffect(() => {
    if (challengeTemplates && challengeTemplates.length > 0) {
      if (!selectedTemplateId) setSelectedTemplateId(challengeTemplates[0].id);
      setWorkshopMode("challenge");
    }
  }, [challengeTemplates, selectedTemplateId]);

  // Comments for selected item
  const { comments, loading: commentsLoading, addComment, deleteComment } = useCanvasComments(id, selectedItemId);

  // Profiles cache
  const [profiles, setProfiles] = useState<Record<string, { display_name: string; avatar_url: string | null }>>({});

  useEffect(() => {
    if (!participants.length) return;
    const map: Record<string, { display_name: string; avatar_url: string | null }> = {};
    participants.forEach(p => {
      map[p.user_id] = { display_name: p.display_name, avatar_url: null };
    });
    setProfiles(map);
  }, [participants]);

  useEffect(() => {
    if (id === ":id") {
      navigate("/workshop", { replace: true });
    }
  }, [id, navigate]);

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
    const offsetX = Math.random() * 60 - 30;
    const offsetY = Math.random() * 60 - 30;
    await addItem("card", centerX + offsetX, centerY + offsetY, { card_id: cardId });
    toast.success("Carte ajoutée au canvas");
  }, [viewport, addItem]);

  const handleAddSticky = useCallback(async (x: number, y: number) => {
    await addItem("sticky", x, y, { color: "yellow", content: { text: "", sticky_shape: stickyShape } });
    setMode("select");
  }, [addItem, stickyShape]);

  const handleAddGroup = useCallback(async (x: number, y: number) => {
    await addItem("group", x, y, { width: 400, height: 300, content: { title: "Groupe", group_shape: groupShape } });
    setMode("select");
  }, [addItem, groupShape]);

  const handleAddIcon = useCallback(async (x: number, y: number) => {
    await addItem("icon", x, y, { content: { icon_name: selectedIconName, label: "", icon_color: "default", icon_size: "md" } });
    setMode("select");
  }, [addItem, selectedIconName]);

  const handleAddText = useCallback(async (x: number, y: number) => {
    await addItem("text", x, y, { content: { text: "Texte", text_style: "heading" } });
    setMode("select");
  }, [addItem]);

  const handleArrowClick = useCallback(async (itemId: string, anchor?: string) => {
    if (!arrowStart) {
      setArrowStart(itemId);
      setArrowStartAnchor(anchor || "bottom");
      return;
    }
    if (arrowStart === itemId) {
      setArrowStart(null);
      setArrowStartAnchor(null);
      return;
    }
    const arrow = await createArrow(arrowStart, itemId);
    if (arrow) {
      await updateContent(arrow.id, {
        from_anchor: arrowStartAnchor || "bottom",
        to_anchor: anchor || "top",
      });
    }
    setArrowStart(null);
    setArrowStartAnchor(null);
    setMode("select");
    toast.success("Flèche créée");
  }, [arrowStart, arrowStartAnchor, createArrow, updateContent]);

  const handleSelectItem = useCallback((itemId: string | null) => {
    setSelectedItemId(itemId);
    if (!itemId) {
      setShowDiscussion(false);
    }
  }, []);

  // Fit-to-content: calculate bounding box of all items and adjust viewport
  const handleFitToContent = useCallback(() => {
    const nonArrows = items.filter(i => i.type !== "arrow");
    if (nonArrows.length === 0) {
      setViewport({ x: 100, y: 80, scale: 1 });
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nonArrows.forEach(item => {
      const w = item.width || 240;
      const h = item.height || 160;
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + w);
      maxY = Math.max(maxY, item.y + h);
    });
    const container = document.querySelector("[data-canvas='true']")?.parentElement;
    const cw = container?.clientWidth || 800;
    const ch = container?.clientHeight || 600;
    const padding = 60;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const scale = Math.max(0.25, Math.min(1.5, Math.min(cw / contentW, ch / contentH)));
    const cx = (cw - contentW * scale) / 2 - minX * scale + padding * scale;
    const cy = (ch - contentH * scale) / 2 - minY * scale + padding * scale;
    setViewport({ x: cx, y: cy, scale });
  }, [items]);

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
          <p className="text-muted-foreground">Workshop introuvable.</p>
          <Button onClick={() => navigate("/workshop")} variant="outline" className="rounded-xl font-bold uppercase tracking-wider">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux workshops
          </Button>
        </div>
      </PageTransition>
    );
  }

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
                Démarrer le workshop
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
      {/* Minimal header */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-background/80 backdrop-blur-sm border-b border-border shrink-0">
        {/* Left: back + name + status */}
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/workshop")} className="rounded-xl shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-sm uppercase tracking-tight truncate">{workshop.name}</h1>
            <StatusBadge status={workshop.status} />
          </div>
        </div>

        {/* Right: participants + host controls + edit mode */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Edit mode controls for completed workshops */}
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

          {/* Participants */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/50">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold">{participants.length}</span>
            <div className="flex -space-x-2">
              {participants.slice(0, 4).map(p => (
                <div
                  key={p.id}
                  className={`h-6 w-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold uppercase ${
                    p.role === "host" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}
                  title={p.display_name}
                >
                  {p.display_name.charAt(0)}
                </div>
              ))}
              {participants.length > 4 && (
                <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">
                  +{participants.length - 4}
                </div>
              )}
            </div>
          </div>

          {/* Host controls */}
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

      {/* Main area — flex-1, no margin-top */}
      <div className="flex-1 flex relative min-h-0">
        {/* Card Sidebar — always visible when not read-only */}
        {!isReadOnly && allCards && pillars && (
          <CardSidebar cards={allCards} pillars={pillars} onAddCard={handleAddCard} isMobile={isMobile} />
        )}

        {/* Content area */}
        <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
          {workshopMode === "challenge" && selectedTemplateId && challengeTemplates ? (
            <ChallengeView
              template={challengeTemplates.find(t => t.id === selectedTemplateId)!}
              workshopId={id!}
              cards={allCards || []}
              pillars={pillars || []}
              isHost={isHost}
              readOnly={isReadOnly}
            />
          ) : (
            <>
              <WorkshopCanvas
                items={items}
                cards={allCards || []}
                pillars={pillars || []}
                selectedItemId={isReadOnly ? null : selectedItemId}
                mode={isReadOnly ? "select" : mode}
                arrowStart={isReadOnly ? null : arrowStart}
                onSelectItem={isReadOnly ? () => {} : handleSelectItem}
                onUpdatePosition={isReadOnly ? () => {} : updatePosition}
                onUpdateContent={isReadOnly ? () => {} : updateContent}
                onUpdateSize={isReadOnly ? () => {} : updateSize}
                onUpdateColor={isReadOnly ? () => {} : updateColor}
                onBringToFront={isReadOnly ? () => {} : bringToFront}
                onDeleteItem={isReadOnly ? () => {} : deleteItem}
                onAddSticky={isReadOnly ? () => {} : handleAddSticky}
                onAddGroup={isReadOnly ? () => {} : handleAddGroup}
                onAddIcon={isReadOnly ? () => {} : handleAddIcon}
                onAddText={isReadOnly ? () => {} : handleAddText}
                onArrowClick={isReadOnly ? () => {} : handleArrowClick}
                viewport={viewport}
                onViewportChange={setViewport}
                profiles={profiles}
                snapToGrid={snapToGrid}
              />

              <CanvasStats
                items={items}
                pillars={pillars || []}
                cards={(allCards || []).map(c => ({ id: c.id, pillar_id: c.pillar_id }))}
                participantCount={participants.length}
              />

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
            </>
          )}
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
