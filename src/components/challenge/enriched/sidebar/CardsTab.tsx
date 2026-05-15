import { useMemo, useState } from "react";
import { Search, X, ChevronRight, Plus, List, Layers, Workflow, Maximize2, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { getPillarCssColor, getPillarCssColorAlpha, PHASE_LABELS } from "@/hooks/useToolkitData";

type Mode = "compact" | "pillars" | "phases";

interface Props {
  cards: DbCard[];
  pillars: DbPillar[];
  placedCardIds?: Set<string>;
  onAdd?: (cardId: string) => void;
  onOpenExplorer?: () => void;
  customCardCount?: number;
}

export function CardsTab({ cards, pillars, placedCardIds, onAdd, onOpenExplorer, customCardCount = 0 }: Props) {
  const [mode, setMode] = useState<Mode>("pillars");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    if (!search) return cards;
    const q = search.toLowerCase();
    return cards.filter(c => c.title.toLowerCase().includes(q) || c.definition?.toLowerCase().includes(q));
  }, [cards, search]);

  const toggle = (id: string) => setExpanded(s => ({ ...s, [id]: !s[id] }));

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border space-y-2">
        {onOpenExplorer && (
          <Button onClick={onOpenExplorer} variant="outline" size="sm" className="w-full h-8 text-[11px] font-bold uppercase tracking-wider gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
            <Maximize2 className="h-3.5 w-3.5" /> Explorer plein écran
            {customCardCount > 0 && (
              <span className="ml-auto inline-flex items-center gap-0.5 text-amber-500"><Star className="h-3 w-3 fill-amber-400" />{customCardCount}</span>
            )}
          </Button>
        )}
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          {([
            { id: "compact", icon: List, label: "Compact" },
            { id: "pillars", icon: Layers, label: "Piliers" },
            { id: "phases", icon: Workflow, label: "Phases" },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                mode === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <t.icon className="h-3 w-3" /> {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une carte…"
            className="pl-8 h-8 text-xs bg-secondary/40 border-0"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {mode === "compact" && (
          <div className="space-y-0.5">
            {filtered.map(card => {
              const pillar = pillars.find(p => p.id === card.pillar_id);
              return <CardRow key={card.id} card={card} pillar={pillar} placed={placedCardIds?.has(card.id)} onAdd={onAdd} variant="compact" />;
            })}
            {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Aucune carte.</p>}
          </div>
        )}

        {mode === "pillars" && (
          <div className="space-y-1">
            {pillars.map(pillar => {
              const list = filtered.filter(c => c.pillar_id === pillar.id);
              if (search && list.length === 0) return null;
              const open = search ? true : (expanded[pillar.id] ?? false);
              const color = getPillarCssColor(pillar.slug, pillar.color);
              return (
                <div key={pillar.id}>
                  <button
                    onClick={() => toggle(pillar.id)}
                    className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
                  >
                    <div className="h-5 w-5 rounded-md grid place-items-center text-[10px] font-black text-white shrink-0" style={{ background: color }}>
                      {pillar.name.charAt(0)}
                    </div>
                    <span className="font-display font-bold text-xs flex-1 text-left truncate">{pillar.name}</span>
                    <span className="text-[10px] text-muted-foreground">{list.length}</span>
                    <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-90")} />
                  </button>
                  <AnimatePresence>
                    {open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pl-2 space-y-0.5 pb-1">
                          {list.map(c => <CardRow key={c.id} card={c} pillar={pillar} placed={placedCardIds?.has(c.id)} onAdd={onAdd} variant="normal" />)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {mode === "phases" && (
          <div className="space-y-1">
            {Object.entries(
              filtered.reduce<Record<string, DbCard[]>>((acc, c) => {
                (acc[c.phase] ||= []).push(c);
                return acc;
              }, {}),
            ).map(([phase, list]) => (
              <div key={phase}>
                <div className="px-2 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {PHASE_LABELS[phase] || phase} <span className="text-muted-foreground/60">({list.length})</span>
                </div>
                <div className="space-y-0.5">
                  {list.map(c => {
                    const pillar = pillars.find(p => p.id === c.pillar_id);
                    return <CardRow key={c.id} card={c} pillar={pillar} placed={placedCardIds?.has(c.id)} onAdd={onAdd} variant="normal" />;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CardRow({
  card, pillar, placed, onAdd, variant,
}: { card: DbCard; pillar?: DbPillar; placed?: boolean; onAdd?: (id: string) => void; variant: "compact" | "normal" }) {
  const color = pillar ? getPillarCssColor(pillar.slug, pillar.color) : "hsl(var(--primary))";
  const bg = pillar ? getPillarCssColorAlpha(pillar.slug, pillar.color, 0.08) : "hsl(var(--primary) / 0.08)";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("card-id", card.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "group relative flex items-center gap-2 rounded-md cursor-grab active:cursor-grabbing transition-colors hover:bg-muted/60",
        variant === "compact" ? "px-2 py-1" : "p-2",
        placed && "opacity-50",
      )}
      title={card.definition || card.title}
    >
      <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <span className={cn("font-display font-bold block truncate", variant === "compact" ? "text-[11px]" : "text-xs")}>
          {card.title}
        </span>
        {variant === "normal" && (
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
            {pillar?.name} · {PHASE_LABELS[card.phase] || card.phase}
          </span>
        )}
      </div>
      {onAdd && !placed && (
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(card.id); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
          style={{ color, background: bg }}
          title="Mettre en zone d'attente"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
      {placed && <span className="text-[9px] font-bold uppercase text-muted-foreground">✓ placée</span>}
    </div>
  );
}
