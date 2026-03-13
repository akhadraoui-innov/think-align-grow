import { useState, useMemo, lazy, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { GameCard } from "@/components/challenge/GameCard";
import { LayoutGrid, Grid3X3, Layers, Eye, BarChart3, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import { getPillarCssColor, getPillarCssColorAlpha, getPillarIconName, PHASE_LABELS } from "@/hooks/useToolkitData";
import dynamicIconImports from "lucide-react/dynamicIconImports";

const iconCache = new Map<string, React.LazyExoticComponent<any>>();

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const kebab = name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  const importFn = dynamicIconImports[kebab as keyof typeof dynamicIconImports];
  if (!importFn) return null;
  if (!iconCache.has(kebab)) {
    iconCache.set(kebab, lazy(importFn));
  }
  const LazyIcon = iconCache.get(kebab)!;
  return (
    <Suspense fallback={<div className={className} />}>
      <LazyIcon className={className} />
    </Suspense>
  );
}

type CardFormat = "game" | "section" | "preview" | "full" | "gamified";
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
    const slug = pillar?.slug || "";
    const dbCol = pillar?.color || null;
    const pillarColor = getPillarCssColor(slug, dbCol);
    const pillarColorAlpha = (a: number) => getPillarCssColorAlpha(slug, dbCol, a);
    const pillarIconName = pillar ? getPillarIconName(pillar.slug, pillar.icon_name) : "Circle";

    // ── Game card (flip card from challenge) ──
    if (format === "game") {
      return (
        <GameCard
          key={card.id}
          card={card as any}
          pillar={pillar as any}
          readOnly
        />
      );
    }

    // ── Gamified (collectible, full-color, from CanvasCard) ──
    if (format === "gamified") {
      return (
        <div
          key={card.id}
          className="rounded-3xl overflow-hidden flex flex-col min-h-[280px] w-60"
          style={{ background: `linear-gradient(145deg, ${pillarColor}, ${pillarColorAlpha(0.85)})` }}
        >
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }} />
          <div className="relative p-5 flex flex-col items-center text-center flex-1">
            <div className="inline-flex px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm mb-4">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/90">
                {PHASE_LABELS[card.phase] || card.phase}
              </span>
            </div>
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-inner">
              <DynamicIcon name={pillarIconName} className="h-8 w-8 text-white" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 mb-1">
              {pillar?.name || "Pilier"}
            </span>
            <h3 className="font-display font-black text-base uppercase tracking-tight leading-tight text-white mb-3 line-clamp-3">
              {card.title}
            </h3>
            {card.subtitle && (
              <p className="text-[11px] text-white/60 italic line-clamp-2">{card.subtitle}</p>
            )}
          </div>
        </div>
      );
    }

    // ── Section (compact colored, from CanvasCard) ──
    if (format === "section") {
      return (
        <div
          key={card.id}
          className="rounded-2xl overflow-hidden"
          style={{ background: `linear-gradient(145deg, ${pillarColor}, ${pillarColorAlpha(0.85)})` }}
        >
          <div className="p-3 text-white">
            <span className="text-[8px] font-black uppercase tracking-widest text-white/70">
              {pillar?.name || "Pilier"}
            </span>
            <h3 className="font-display font-black text-sm uppercase tracking-tight leading-tight text-white line-clamp-2 mt-1 mb-2">
              {card.title}
            </h3>
            <div className="flex gap-1.5 mt-1">
              {[1, 2, 3].map((level) => (
                <div key={level} className="h-2 w-2 rounded-full border bg-transparent border-white/40" />
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ── Preview / Full (standard card with pillar bar, from CanvasCard) ──
    const isFull = format === "full";
    return (
      <div key={card.id} className="rounded-2xl bg-card border-2 border-border overflow-hidden flex flex-col">
        {/* Pillar color bar */}
        <div className="h-2 w-full shrink-0" style={{ background: pillarColor }} />

        <div className={cn("p-4", isFull && "p-5")}>
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-black uppercase tracking-widest rounded-full text-[9px] px-2 py-0.5"
              style={{ background: pillarColorAlpha(0.08), color: pillarColor }}>
              {pillar?.name || "Pilier"}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {PHASE_LABELS[card.phase] || card.phase}
            </span>
          </div>

          {/* Title */}
          <h3 className={cn(
            "font-display font-black uppercase tracking-tight leading-tight text-lg mb-2",
            isFull && "text-xl mb-3"
          )}>
            {card.title}
          </h3>

          {card.subtitle && (
            <p className="text-xs text-muted-foreground italic mb-2">{card.subtitle}</p>
          )}

          {/* Objective (full only) */}
          {isFull && card.objective && (
            <div className="flex items-start gap-2 mb-3">
              <Target className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: pillarColor }} />
              <p className="text-xs text-foreground/80 leading-relaxed">{card.objective}</p>
            </div>
          )}

          {/* Definition */}
          {card.definition && (
            <p className={cn("text-xs text-foreground/80 leading-relaxed mb-3", !isFull && "line-clamp-3")}>
              {card.definition}
            </p>
          )}

          {/* Action */}
          {card.action && (
            <div className="rounded-xl p-3 mb-3" style={{ background: pillarColorAlpha(0.04), borderLeft: `3px solid ${pillarColor}` }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="h-3 w-3" style={{ color: pillarColor }} />
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: pillarColor }}>
                  {card.step_name || "Action"}
                </span>
              </div>
              <p className={cn("text-xs text-foreground leading-relaxed", !isFull && "line-clamp-2")}>
                {card.action}
              </p>
            </div>
          )}

          {/* KPI */}
          {card.kpi && (
            <div className="flex items-start gap-2 bg-muted/30 p-3 rounded-lg border border-border/50 mb-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <div className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Indicateurs de maturité</div>
                <div className={cn("text-foreground/90 space-y-0.5", !isFull && "line-clamp-3")}>
                  {card.kpi.split('\n').map((line, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full shrink-0 opacity-30" style={{ background: pillarColor }} />
                      <span className="text-[10px]">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
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
              <SelectItem value="section">Section</SelectItem>
              <SelectItem value="preview">Preview</SelectItem>
              <SelectItem value="full">Full</SelectItem>
              <SelectItem value="gamified">Gamifié</SelectItem>
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
          <div className={format === "game" || format === "gamified" ? "flex flex-wrap gap-4" : gridClass}>
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
