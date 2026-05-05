import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, X, Trash2, Play, Zap } from "lucide-react";
import { PlaygroundCard } from "./PlaygroundCard";
import type { Tables } from "@/integrations/supabase/types";

type Card = Tables<"cards">;
type Pillar = Tables<"pillars">;

export function PlaygroundDeck({
  toolkitId,
  allCards,
  pillars,
  open,
  onToggle,
  onPresent,
  accent,
}: {
  toolkitId: string;
  allCards: Card[];
  pillars: Pillar[];
  open: boolean;
  onToggle: () => void;
  onPresent: (cards: Card[]) => void;
  accent: string;
}) {
  const storageKey = `toolkit-deck:${toolkitId}`;
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setIds(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(ids));
    } catch {}
  }, [ids, storageKey]);

  const pillarMap = new Map(pillars.map((p) => [p.id, p]));
  const cardMap = new Map(allCards.map((c) => [c.id, c]));
  const deckCards = ids.map((id) => cardMap.get(id)).filter(Boolean) as Card[];
  const total = deckCards.reduce((s, c) => s + (c.valorization || 0), 0);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/card-id");
    if (id && !ids.includes(id)) setIds((prev) => [...prev, id]);
  };

  const remove = (id: string) => setIds((prev) => prev.filter((x) => x !== id));
  const clear = () => setIds([]);

  if (!open) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-card border-l border-y rounded-l-xl px-2 py-4 shadow-lg hover:bg-muted transition-colors"
      >
        <div className="flex flex-col items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: accent }} />
          <span className="text-xs font-bold writing-mode-vertical [writing-mode:vertical-rl] uppercase tracking-wider">
            Mon deck ({ids.length})
          </span>
        </div>
      </button>
    );
  }

  return (
    <motion.aside
      initial={{ x: 360 }}
      animate={{ x: 0 }}
      exit={{ x: 360 }}
      className="fixed right-0 top-0 bottom-0 w-[340px] z-30 bg-card border-l shadow-2xl flex flex-col"
    >
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: `${accent}30` }}>
        <div>
          <h3 className="font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: accent }} /> Mon deck
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {deckCards.length} cartes · {total} pts
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="flex-1 overflow-hidden"
      >
        {deckCards.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-3 border-2 border-dashed"
              style={{ borderColor: `${accent}55` }}
            >
              <Sparkles className="w-8 h-8" style={{ color: accent }} />
            </div>
            <p className="text-sm font-medium">Glissez vos cartes ici</p>
            <p className="text-xs mt-1">Composez votre deck personnel</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-3 flex flex-col gap-3 items-center">
              {deckCards.map((c) => (
                <div key={c.id} className="relative group">
                  <PlaygroundCard card={c as any} pillar={pillarMap.get(c.pillar_id)} variant="compact" />
                  <button
                    onClick={() => remove(c.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {deckCards.length > 0 && (
        <div className="p-3 border-t flex gap-2">
          <Button onClick={() => onPresent(deckCards)} className="flex-1" style={{ background: accent }}>
            <Play className="w-4 h-4 mr-1" /> Présenter
          </Button>
          <Button variant="outline" size="icon" onClick={clear}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </motion.aside>
  );
}
