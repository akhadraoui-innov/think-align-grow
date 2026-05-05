import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Filter, LayoutGrid, Columns3, Sparkles, Orbit, Film, Play, Map as MapIcon, Save } from "lucide-react";
import { PlaygroundBoard, type BoardLayout } from "@/components/playground/PlaygroundBoard";
import { PlaygroundFilters, type FiltersState } from "@/components/playground/PlaygroundFilters";
import { PlaygroundDeck } from "@/components/playground/PlaygroundDeck";
import { PresentationMode } from "@/components/playground/PresentationMode";
import { PlateauBoard } from "@/components/playground/PlateauBoard";
import { PlateauHand } from "@/components/playground/PlateauHand";
import { PlateauCategoryBar } from "@/components/playground/PlateauCategoryBar";
import { PlateauSessionDrawer } from "@/components/playground/PlateauSessionDrawer";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePlaygroundSessions, useAutoSave, type Placement, type SessionCategory } from "@/hooks/usePlaygroundSessions";
import { getToolkitTheme } from "@/lib/toolkitTheme";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Card = Tables<"cards">;
type Layout = BoardLayout | "plateau";

const LAYOUTS: { id: Layout; label: string; icon: any }[] = [
  { id: "atelier", label: "Atelier", icon: LayoutGrid },
  { id: "kanban", label: "Phases", icon: Columns3 },
  { id: "constellation", label: "Constellation", icon: Orbit },
  { id: "carousel", label: "Scène", icon: Film },
  { id: "plateau", label: "Plateau", icon: MapIcon },
];

export default function PortalToolkitPlayground() {
  const { toolkitId } = useParams<{ toolkitId: string }>();
  const navigate = useNavigate();
  const [layout, setLayout] = useState<Layout>("atelier");
  // Plateau state
  const [plateauPlacements, setPlateauPlacements] = useState<Placement[]>([]);
  const [cardScaleGlobal, setCardScaleGlobal] = useState(1);
  const [plateauCategory, setPlateauCategory] = useState<SessionCategory>({ type: "all", value: null });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [deckOpen, setDeckOpen] = useState(false);
  const [presenting, setPresenting] = useState<Card[] | null>(null);
  const [filters, setFilters] = useState<FiltersState>({
    search: "",
    pillarIds: [],
    phases: [],
    difficulties: [],
    withImageOnly: false,
  });

  const { data: toolkit, isLoading: tLoading } = useQuery({
    queryKey: ["pt-toolkit", toolkitId],
    enabled: !!toolkitId,
    queryFn: async () => {
      const { data } = await supabase.from("toolkits").select("*").eq("id", toolkitId!).maybeSingle();
      return data;
    },
  });

  const { data: pillars = [] } = useQuery({
    queryKey: ["pt-pillars", toolkitId],
    enabled: !!toolkitId,
    queryFn: async () => {
      const { data } = await supabase.from("pillars").select("*").eq("toolkit_id", toolkitId!).order("sort_order");
      return data || [];
    },
  });

  const { data: cards = [], isLoading: cLoading } = useQuery({
    queryKey: ["pt-cards", toolkitId, pillars.map((p) => p.id).join(",")],
    enabled: pillars.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("cards")
        .select("*")
        .in("pillar_id", pillars.map((p) => p.id))
        .order("sort_order");
      return (data || []) as Card[];
    },
  });

  const dominantColor = pillars[0]?.color || null;
  const theme = useMemo(() => getToolkitTheme(toolkit, dominantColor), [toolkit, dominantColor]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return cards.filter((c) => {
      if (filters.pillarIds.length && !filters.pillarIds.includes(c.pillar_id)) return false;
      if (filters.phases.length && !filters.phases.includes(c.phase as string)) return false;
      if (filters.difficulties.length && (!c.difficulty || !filters.difficulties.includes(c.difficulty))) return false;
      if (filters.withImageOnly && !(c as any).image_url) return false;
      if (q) {
        const blob = `${c.title} ${c.subtitle || ""} ${c.definition || ""} ${(Array.isArray(c.tags) ? c.tags.join(" ") : "")}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [cards, filters]);

  const counts = useMemo(() => {
    const byPillar: Record<string, number> = {};
    const byPhase: Record<string, number> = {};
    cards.forEach((c) => {
      byPillar[c.pillar_id] = (byPillar[c.pillar_id] || 0) + 1;
      byPhase[c.phase as string] = (byPhase[c.phase as string] || 0) + 1;
    });
    return { byPillar, byPhase };
  }, [cards]);

  // ----- Plateau : filtrage par catégorie cliquable -----
  const plateauCards = useMemo(() => {
    if (plateauCategory.type === "all") return cards;
    if (plateauCategory.type === "phase")
      return cards.filter((c) => c.phase === plateauCategory.value);
    if (plateauCategory.type === "pillar")
      return cards.filter((c) => c.pillar_id === plateauCategory.value);
    return cards;
  }, [cards, plateauCategory]);

  const placedIds = useMemo(
    () => new Set(plateauPlacements.map((p) => p.card_id)),
    [plateauPlacements]
  );

  // ----- Sessions plateau (historique) -----
  const { sessions, create, update, remove } = usePlaygroundSessions(toolkitId);
  useAutoSave(
    activeSessionId,
    {
      placements: plateauPlacements,
      card_scale_global: cardScaleGlobal,
      category: plateauCategory,
    },
    update
  );

  const handleSave = async () => {
    if (activeSessionId) {
      const ok = await update(activeSessionId, {
        placements: plateauPlacements as any,
        card_scale_global: cardScaleGlobal,
        category: plateauCategory as any,
      });
      if (ok) toast.success("Partie mise à jour");
      return;
    }
    setSaveName(`Partie du ${new Date().toLocaleDateString("fr-FR")}`);
    setSaveDialogOpen(true);
  };

  const confirmSave = async () => {
    const s = await create({
      name: saveName.trim() || "Partie sans nom",
      placements: plateauPlacements,
      card_scale_global: cardScaleGlobal,
      category: plateauCategory,
    });
    if (s) {
      setActiveSessionId(s.id);
      toast.success("Partie sauvegardée");
      setSaveDialogOpen(false);
    }
  };

  const handleNewSession = () => {
    setActiveSessionId(null);
    setPlateauPlacements([]);
    setPlateauCategory({ type: "all", value: null });
    setCardScaleGlobal(1);
  };

  const handleLoadSession = (s: any) => {
    setActiveSessionId(s.id);
    setPlateauPlacements((s.placements as Placement[]) || []);
    setCardScaleGlobal(Number(s.card_scale_global) || 1);
    setPlateauCategory((s.category as SessionCategory) || { type: "all", value: null });
    setLayout("plateau");
  };

  if (tLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!toolkit) {
    return (
      <div className="p-8 text-center">
        <p>Toolkit introuvable.</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Retour</Button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header
        className="relative flex-shrink-0 border-b"
        style={{
          background: `linear-gradient(135deg, ${theme.accent}11, transparent 60%), ${theme.accentSoft}`,
        }}
      >
        {toolkit.cover_image_url && (
          <div
            className="absolute inset-0 opacity-15 bg-cover bg-center"
            style={{ backgroundImage: `url(${toolkit.cover_image_url})` }}
          />
        )}
        <div
          className="absolute inset-0 opacity-50"
          style={{ backgroundImage: theme.patternSvg, backgroundRepeat: "repeat" }}
        />
        <div className="relative flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/portal/workshops/toolkits")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Terrain de jeu
              </div>
              <h1 className="text-2xl font-display font-bold truncate flex items-center gap-2">
                <span className="text-3xl">{(toolkit as any).icon_emoji || "🎴"}</span>
                {toolkit.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:flex bg-card border rounded-lg p-1 gap-1">
              {LAYOUTS.map((L) => {
                const Icon = L.icon;
                const active = layout === L.id;
                return (
                  <button
                    key={L.id}
                    onClick={() => setLayout(L.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all",
                      active ? "text-white shadow" : "text-muted-foreground hover:text-foreground"
                    )}
                    style={active ? { background: theme.accent } : undefined}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {L.label}
                  </button>
                );
              })}
            </div>
            {layout === "plateau" && (
              <>
                <PlateauSessionDrawer
                  sessions={sessions as any}
                  onLoad={handleLoadSession}
                  onDelete={(id) => {
                    remove(id);
                    if (id === activeSessionId) handleNewSession();
                  }}
                  onNew={handleNewSession}
                  activeId={activeSessionId}
                  accent={theme.accent}
                />
                <Button variant="outline" size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1.5" />
                  {activeSessionId ? "Mettre à jour" : "Sauver"}
                </Button>
              </>
            )}
            {layout !== "plateau" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltersOpen((v) => !v)}
                className="lg:hidden"
              >
                <Filter className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                if (layout === "plateau" && plateauPlacements.length > 0) {
                  const ordered = [...plateauPlacements]
                    .sort((a, b) => a.z - b.z)
                    .map((p) => cards.find((c) => c.id === p.card_id))
                    .filter(Boolean) as Card[];
                  setPresenting(ordered);
                } else {
                  setPresenting(filtered);
                }
              }}
              style={{ background: theme.accent }}
              disabled={layout === "plateau" ? plateauPlacements.length === 0 : filtered.length === 0}
            >
              <Play className="w-4 h-4 mr-1" /> Présenter
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      {layout === "plateau" ? (
        <div className="flex flex-col flex-1 min-h-0">
          <PlateauCategoryBar
            cards={cards}
            pillars={pillars}
            value={plateauCategory}
            onChange={setPlateauCategory}
            accent={theme.accent}
          />
          <div className="flex items-center gap-3 px-6 py-2 border-b bg-card/40">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Taille des cartes
            </span>
            <div className="w-48">
              <Slider
                value={[cardScaleGlobal * 100]}
                min={60}
                max={140}
                step={5}
                onValueChange={(v) => setCardScaleGlobal(v[0] / 100)}
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {Math.round(cardScaleGlobal * 100)}%
            </span>
            <div className="ml-auto text-xs text-muted-foreground">
              {plateauPlacements.length} carte{plateauPlacements.length > 1 ? "s" : ""} sur le plateau
              {activeSessionId && (
                <span className="ml-2 text-[10px] uppercase tracking-wider opacity-70">
                  · auto-save activé
                </span>
              )}
            </div>
          </div>
          <main className="flex-1 min-h-0 p-4 overflow-hidden" style={{ height: "65vh" }}>
            <PlateauBoard
              toolkit={toolkit}
              theme={theme}
              cards={cards}
              pillars={pillars}
              placements={plateauPlacements}
              setPlacements={setPlateauPlacements}
              cardScaleGlobal={cardScaleGlobal}
            />
          </main>
          <PlateauHand
            cards={plateauCards}
            pillars={pillars}
            placedIds={placedIds}
            cardScaleGlobal={cardScaleGlobal}
          />
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          {filtersOpen && (
            <PlaygroundFilters
              pillars={pillars}
              filters={filters}
              setFilters={setFilters}
              onClose={() => setFiltersOpen(false)}
              accent={theme.accent}
              counts={counts}
            />
          )}
          <main className="flex-1 overflow-y-auto relative" style={{ backgroundImage: theme.patternSvg, backgroundRepeat: "repeat" }}>
            {cLoading ? (
              <div className="p-8 grid grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[392px] w-[280px]" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Sparkles className="w-10 h-10 opacity-40" />
                <p>Aucune carte ne correspond aux filtres.</p>
              </div>
            ) : (
              <PlaygroundBoard layout={layout as BoardLayout} cards={filtered} pillars={pillars} accent={theme.accent} />
            )}
          </main>
        </div>
      )}

      <PlaygroundDeck
        toolkitId={toolkit.id}
        allCards={cards}
        pillars={pillars}
        open={deckOpen}
        onToggle={() => setDeckOpen((v) => !v)}
        onPresent={(cs) => setPresenting(cs)}
        accent={theme.accent}
      />

      {presenting && (
        <PresentationMode
          cards={presenting}
          pillars={pillars}
          onClose={() => setPresenting(null)}
        />
      )}
    </div>
  );
}
