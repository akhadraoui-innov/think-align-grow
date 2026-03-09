import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Plus, Search, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { getPillarGradient, PHASE_LABELS } from "@/hooks/useToolkitData";

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
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3">
          Toolkit CPAM
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="pl-9 rounded-xl bg-secondary/50 border-0"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {search ? (
            // Search results
            <div className="space-y-2">
              {filteredCards.map(card => {
                const pillar = pillars.find(p => p.id === card.pillar_id);
                return (
                  <CardItem 
                    key={card.id} 
                    card={card} 
                    pillar={pillar} 
                    onAdd={() => onAddCard(card.id)} 
                  />
                );
              })}
              {filteredCards.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucune carte trouvée
                </p>
              )}
            </div>
          ) : (
            // Pillars accordion
            <div className="space-y-1">
              {pillars.map(pillar => {
                const pillarCards = cards.filter(c => c.pillar_id === pillar.id);
                const isExpanded = expandedPillar === pillar.id;
                const gradient = getPillarGradient(pillar.slug);

                return (
                  <div key={pillar.id}>
                    <button
                      onClick={() => setExpandedPillar(isExpanded ? null : pillar.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
                    >
                      <div 
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                        style={{ background: `hsl(var(--pillar-${gradient}))` }}
                      >
                        {pillar.name.charAt(0)}
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-display font-bold text-sm block">
                          {pillar.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {pillarCards.length} cartes
                        </span>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isExpanded && "rotate-90"
                      )} />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 pr-2 pb-2 space-y-1">
                            {pillarCards.map(card => (
                              <CardItem 
                                key={card.id} 
                                card={card} 
                                pillar={pillar}
                                onAdd={() => onAddCard(card.id)} 
                              />
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
          <Button 
            variant="outline" 
            size="sm" 
            className="absolute bottom-20 left-4 z-40 rounded-xl shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Cartes
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-72 border-r border-border bg-card h-full">
      {content}
    </div>
  );
}

function CardItem({ 
  card, 
  pillar, 
  onAdd 
}: { 
  card: DbCard; 
  pillar: DbPillar | undefined; 
  onAdd: () => void;
}) {
  const gradient = pillar ? getPillarGradient(pillar.slug) : "primary";

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="group relative flex items-start gap-2 p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors cursor-pointer"
      onClick={onAdd}
    >
      <div 
        className="h-2 w-2 rounded-full mt-1.5 shrink-0"
        style={{ background: `hsl(var(--pillar-${gradient}))` }}
      />
      <div className="flex-1 min-w-0">
        <span className="font-display font-bold text-xs block truncate">
          {card.title}
        </span>
        {card.definition && (
          <span className="text-[10px] text-muted-foreground line-clamp-1">
            {card.definition}
          </span>
        )}
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
          {PHASE_LABELS[card.phase] || card.phase}
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-primary text-primary-foreground transition-opacity"
      >
        <Plus className="h-3 w-3" />
      </button>
    </motion.div>
  );
}
