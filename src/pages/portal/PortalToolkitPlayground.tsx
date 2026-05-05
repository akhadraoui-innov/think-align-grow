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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersOpen((v) => !v)}
              className="lg:hidden"
            >
              <Filter className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => setPresenting(filtered)}
              style={{ background: theme.accent }}
              disabled={filtered.length === 0}
            >
              <Play className="w-4 h-4 mr-1" /> Présenter
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
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
            <PlaygroundBoard layout={layout} cards={filtered} pillars={pillars} accent={theme.accent} />
          )}
        </main>
      </div>

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
