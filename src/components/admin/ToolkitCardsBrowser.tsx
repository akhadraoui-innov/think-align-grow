import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { FlipCard } from "@/components/ui/FlipCard";
import { GameCard } from "@/components/challenge/GameCard";
import { LayoutGrid, Grid3X3, Layers, Eye } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const PHASE_LABELS: Record<string, string> = {
  foundations: "Fondations", model: "Modèle", growth: "Croissance", execution: "Exécution",
};

type CardFormat = "flip" | "game" | "section" | "full";
type GroupBy = "all" | "pillar" | "phase";

interface Props {
  cards: Tables<"cards">[];
  pillars: Tables<"pillars">[];
}

export function ToolkitCardsBrowser({ cards, pillars }: Props) {
  const [format, setFormat] = useState<CardFormat>("game");
  const [groupBy, setGroupBy] = useState<GroupBy>("pillar");
  const [columns, setColumns] = useState(4);
  const [filterPillar, setFilterPillar] = useState("all");
  const [filterPhase, setFilterPhase] = useState("all");

  const filtered = useMemo(() => {
    let result = cards;
    if (filterPillar !== "all") result = result.filter(c => c.pillar_id === filterPillar);
    if (filterPhase !== "all") result = result.filter(c => c.phase === filterPhase);
    return result;
  }, [cards, filterPillar, filterPhase]);

  const pillarMap = useMemo(() => {
    const m = new Map<string, Tables<"pillars">>();
    pillars.forEach(p => m.set(p.id, p));
    return m;
  }, [pillars]);

  const groups = useMemo(() => {
    if (groupBy === "all") return [{ key: "all", label: `Toutes les cartes (${filtered.length})`, items: filtered }];
    if (groupBy === "pillar") {
      return pillars
        .filter(p => filterPillar === "all" || p.id === filterPillar)
        .map(p => ({
          key: p.id,
          label: p.name,
          color: p.color,
          items: filtered.filter(c => c.pillar_id === p.id),
        }))
        .filter(g => g.items.length > 0);
    }
    // phase
    return ["foundations", "model", "growth", "execution"]
      .filter(ph => filterPhase === "all" || ph === filterPhase)
      .map(ph => ({
        key: ph,
        label: PHASE_LABELS[ph],
        items: filtered.filter(c => c.phase === ph),
      }))
      .filter(g => g.items.length > 0);
  }, [groupBy, filtered, pillars, filterPillar, filterPhase]);

  const gridClass = `grid gap-4 ${
    columns === 3 ? "grid-cols-3" :
    columns === 4 ? "grid-cols-2 md:grid-cols-4" :
    columns === 6 ? "grid-cols-3 md:grid-cols-6" :
    "grid-cols-4 md:grid-cols-8"
  }`;

  const renderCard = (card: Tables<"cards">) => {
    const pillar = pillarMap.get(card.pillar_id);
    const dbCard = card as any;

    if (format === "flip") {
      return (
        <FlipCard
          key={card.id}
          card={dbCard}
          pillarSlug={pillar?.slug || ""}
          pillarColor={pillar?.color}
        />
      );
    }

    if (format === "game") {
      return (
        <GameCard
          key={card.id}
          card={dbCard}
          pillar={pillar as any}
          readOnly
        />
      );
    }

    if (format === "section") {
      return (
        <div
          key={card.id}
          className="rounded-xl p-4 text-white min-h-[120px] flex flex-col justify-between"
          style={{ backgroundColor: pillar?.color || "#666" }}
        >
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">
              {PHASE_LABELS[card.phase]}
            </span>
            <h4 className="font-display font-bold text-sm mt-1 leading-tight">{card.title}</h4>
          </div>
          <p className="text-[10px] opacity-80 mt-2 line-clamp-2">{card.subtitle}</p>
        </div>
      );
    }

    // full
    return (
      <div key={card.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[9px]" style={{ borderColor: pillar?.color || undefined, color: pillar?.color || undefined }}>
            {pillar?.name}
          </Badge>
          <span className="text-[9px] text-muted-foreground">{PHASE_LABELS[card.phase]}</span>
        </div>
        <h4 className="font-semibold text-sm text-foreground">{card.title}</h4>
        {card.subtitle && <p className="text-xs text-muted-foreground">{card.subtitle}</p>}
        {card.definition && <p className="text-xs text-foreground/80 leading-relaxed">{card.definition}</p>}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {card.action && (
            <div>
              <span className="text-[9px] font-bold uppercase text-muted-foreground">Action</span>
              <p className="text-[11px] text-foreground mt-0.5">{card.action}</p>
            </div>
          )}
          {card.kpi && (
            <div>
              <span className="text-[9px] font-bold uppercase text-muted-foreground">KPI</span>
              <p className="text-[11px] text-foreground mt-0.5">{card.kpi}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
        <div className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={format} onValueChange={(v: CardFormat) => setFormat(v)}>
            <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="game">Game</SelectItem>
              <SelectItem value="flip">Flip</SelectItem>
              <SelectItem value="section">Section</SelectItem>
              <SelectItem value="full">Détaillé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={groupBy} onValueChange={(v: GroupBy) => setGroupBy(v)}>
            <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="pillar">Par pilier</SelectItem>
              <SelectItem value="phase">Par phase</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <Grid3X3 className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={filterPillar} onValueChange={setFilterPillar}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Tous piliers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous piliers</SelectItem>
              {pillars.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <Select value={filterPhase} onValueChange={setFilterPhase}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Toutes phases" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes phases</SelectItem>
              {Object.entries(PHASE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
          <Slider
            value={[columns]}
            onValueChange={([v]) => setColumns(v)}
            min={3}
            max={8}
            step={1}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground w-4">{columns}</span>
        </div>
      </div>

      {/* Counter */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">{filtered.length} carte{filtered.length > 1 ? "s" : ""}</Badge>
      </div>

      {/* Cards */}
      {groups.map(g => (
        <div key={g.key} className="space-y-3">
          {groupBy !== "all" && (
            <div className="flex items-center gap-2">
              {"color" in g && g.color && <div className="h-3 w-3 rounded-full" style={{ backgroundColor: g.color as string }} />}
              <h3 className="text-sm font-semibold text-foreground">{g.label}</h3>
              <Badge variant="outline" className="text-[10px]">{g.items.length}</Badge>
            </div>
          )}
          <div className={format === "game" ? "flex flex-wrap gap-4" : gridClass}>
            {g.items.map(renderCard)}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-12">Aucune carte trouvée.</div>
      )}
    </div>
  );
}
