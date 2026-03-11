import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { getPillarGradient, getPillarCssColor, getPillarCssColorAlpha, PHASE_LABELS } from "@/hooks/useToolkitData";

interface CardSidebarProps {
  cards: DbCard[];
  pillars: DbPillar[];
  onAddCard: (cardId: string) => void;
  isMobile?: boolean;
}

export function CardSidebar({ cards, pillars, onAddCard, isMobile }: CardSidebarProps) {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredCards = search
    ? cards.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.definition?.toLowerCase().includes(search.toLowerCase())
      )
    : cards;

  const content = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3">
          Toolkit CPAM
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9 rounded-xl bg-secondary/50 border-0" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {search ? (
            <div className="space-y-1">
              {filteredCards.map(card => {
                const pillar = pillars.find(p => p.id === card.pillar_id);
                return <CardItem key={card.id} card={card} pillar={pillar} onAdd={() => onAddCard(card.id)} />;
              })}
              {filteredCards.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune carte trouvée</p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {pillars.map(pillar => {
                const pillarCards = cards.filter(c => c.pillar_id === pillar.id);
                const isExpanded = expandedPillar === pillar.id;
                const gradient = getPillarGradient(pillar.slug, pillar.color);
                const sidebarPillarColor = getPillarCssColor(pillar.slug, pillar.color);

                return (
                  <div key={pillar.id}>
                    <button
                      onClick={() => setExpandedPillar(isExpanded ? null : pillar.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                        style={{ background: sidebarPillarColor }}>
                        {pillar.name.charAt(0)}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="font-display font-bold text-sm block truncate">{pillar.name}</span>
                        <span className="text-[10px] text-muted-foreground">{pillarCards.length} cartes</span>
                      </div>
                      <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-90")} />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="pl-4 pr-2 pb-2 space-y-1">
                            {pillarCards.map(card => (
                              <CardItem key={card.id} card={card} pillar={pillar} onAdd={() => onAddCard(card.id)} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="absolute bottom-20 left-4 z-40 rounded-xl shadow-lg">
            <Plus className="h-4 w-4 mr-2" />Cartes
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">{content}</SheetContent>
      </Sheet>
    );
  }

  return <div className="w-72 border-r border-border bg-card h-full">{content}</div>;
}

function CardItem({ card, pillar, onAdd }: { card: DbCard; pillar: DbPillar | undefined; onAdd: () => void }) {
  const pillarColor = pillar ? getPillarCssColor(pillar.slug, pillar.color) : `hsl(var(--pillar-primary))`;
  const pillarColorAlpha = (a: number) => getPillarCssColorAlpha(pillar?.slug || "", pillar?.color || null, a);

  return (
    <HoverCard openDelay={1200} closeDelay={200}>
      <HoverCardTrigger asChild>
        <div
          draggable
          onDragStart={(e) => { e.dataTransfer.setData("card-id", card.id); e.dataTransfer.effectAllowed = "move"; }}
          className="group relative flex items-center gap-2 p-2.5 rounded-xl hover:bg-secondary/60 transition-colors cursor-pointer"
          onClick={onAdd}
        >
          <div className="h-2 w-2 rounded-full shrink-0" style={{ background: pillarColor }} />
          <div className="flex-1 min-w-0">
            <span className="font-display font-bold text-xs block truncate">{card.title}</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
              {PHASE_LABELS[card.phase] || card.phase}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors shrink-0"
            style={{ color: pillarColor }}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-80 p-0" sideOffset={8}>
        <div className="p-4">
          {/* Pillar badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: pillarColorAlpha(0.08), color: pillarColor }}>
              {pillar?.name || "Pilier"}
            </span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
              {PHASE_LABELS[card.phase] || card.phase}
            </span>
          </div>

          {/* Title */}
          <h4 className="font-display font-black text-sm uppercase tracking-tight leading-tight mb-2">
            {card.title}
          </h4>

          {/* Subtitle */}
          {card.subtitle && (
            <p className="text-xs text-muted-foreground italic mb-2">{card.subtitle}</p>
          )}

          {/* Definition */}
          {card.definition && (
            <p className="text-xs text-foreground/80 leading-relaxed mb-3">{card.definition}</p>
          )}

          {/* Action */}
          {card.action && (
            <div className="rounded-lg p-2.5 mb-3" style={{ background: `${pillarColor}08`, borderLeft: `3px solid ${pillarColor}` }}>
              <span className="text-[9px] font-black uppercase tracking-widest block mb-1" style={{ color: pillarColor }}>
                {card.step_name || "Action"}
              </span>
              <p className="text-xs text-foreground leading-relaxed">{card.action}</p>
            </div>
          )}

          {/* KPI */}
          {card.kpi && (
            <div className="bg-muted/30 rounded-lg p-2.5 border border-border/50">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Indicateurs</span>
              <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">{card.kpi}</p>
            </div>
          )}

          {/* Add button */}
          <button onClick={onAdd}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold text-white transition-colors"
            style={{ background: pillarColor }}>
            <Plus className="h-3.5 w-3.5" />
            Ajouter au canvas
          </button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
