import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlaygroundCard } from "./PlaygroundCard";
import { PHASE_LABELS } from "@/hooks/useToolkitData";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Card = Tables<"cards">;
type Pillar = Tables<"pillars">;

export type BoardLayout = "atelier" | "kanban" | "constellation" | "carousel";

const PHASES = ["foundations", "model", "growth", "execution"];

function dragHandle(card: Card) {
  return (e: React.DragEvent) => {
    e.dataTransfer.setData("text/card-id", card.id);
    e.dataTransfer.effectAllowed = "copy";
  };
}

export function PlaygroundBoard({
  layout,
  cards,
  pillars,
  accent,
}: {
  layout: BoardLayout;
  cards: Card[];
  pillars: Pillar[];
  accent: string;
}) {
  const pillarMap = new Map(pillars.map((p) => [p.id, p]));

  if (layout === "kanban") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-6 min-h-full">
        {PHASES.map((phase) => {
          const phaseCards = cards.filter((c) => c.phase === phase);
          return (
            <div key={phase} className="bg-muted/40 rounded-2xl p-3 min-h-[400px]">
              <div
                className="px-3 py-2 mb-3 rounded-lg font-bold text-sm uppercase tracking-wider text-white"
                style={{ background: accent }}
              >
                {PHASE_LABELS[phase] || phase}
                <span className="ml-2 opacity-80 font-normal">({phaseCards.length})</span>
              </div>
              <div className="flex flex-col gap-3 items-center">
                <AnimatePresence mode="popLayout">
                  {phaseCards.map((c, i) => (
                    <PlaygroundCard
                      key={c.id}
                      card={c as any}
                      pillar={pillarMap.get(c.pillar_id)}
                      index={i}
                      draggable
                      onDragStart={dragHandle(c)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (layout === "constellation") {
    return (
      <div className="p-6 space-y-10">
        {pillars.map((p) => {
          const pCards = cards.filter((c) => c.pillar_id === p.id);
          if (pCards.length === 0) return null;
          return (
            <div key={p.id} className="relative">
              <div
                className="inline-block px-4 py-1.5 rounded-full text-white font-bold text-sm uppercase tracking-wider mb-4"
                style={{ background: p.color || accent, boxShadow: `0 0 30px ${p.color || accent}66` }}
              >
                {p.name}
              </div>
              <div className="flex flex-wrap gap-5 justify-center">
                <AnimatePresence mode="popLayout">
                  {pCards.map((c, i) => (
                    <motion.div
                      key={c.id}
                      style={{
                        transform: `rotate(${(i % 5 - 2) * 2}deg)`,
                      }}
                    >
                      <PlaygroundCard
                        card={c as any}
                        pillar={p}
                        index={i}
                        draggable
                        onDragStart={dragHandle(c)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (layout === "carousel") {
    return <CarouselBoard cards={cards} pillarMap={pillarMap} accent={accent} />;
  }

  // atelier (default)
  return (
    <div className="p-6 flex flex-wrap gap-5 justify-center content-start">
      <AnimatePresence mode="popLayout">
        {cards.map((c, i) => (
          <PlaygroundCard
            key={c.id}
            card={c as any}
            pillar={pillarMap.get(c.pillar_id)}
            index={i}
            draggable
            onDragStart={dragHandle(c)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function CarouselBoard({
  cards,
  pillarMap,
  accent,
}: {
  cards: Card[];
  pillarMap: Map<string, Pillar>;
  accent: string;
}) {
  const [idx, setIdx] = useState(0);
  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-10">
        Aucune carte à afficher.
      </div>
    );
  }
  const safeIdx = ((idx % cards.length) + cards.length) % cards.length;
  const next = () => setIdx((i) => i + 1);
  const prev = () => setIdx((i) => i - 1);

  const visible = [-2, -1, 0, 1, 2].map((offset) => {
    const i = ((safeIdx + offset) % cards.length + cards.length) % cards.length;
    return { card: cards[i], offset };
  });

  return (
    <div className="relative h-[600px] flex items-center justify-center [perspective:1400px] overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={prev}
        className="absolute left-4 z-20 rounded-full bg-card border shadow-lg"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={next}
        className="absolute right-4 z-20 rounded-full bg-card border shadow-lg"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
      <div className="relative w-full h-full flex items-center justify-center">
        {visible.map(({ card, offset }) => {
          const isCenter = offset === 0;
          return (
            <motion.div
              key={`${card.id}-${offset}`}
              animate={{
                x: offset * 220,
                scale: isCenter ? 1.05 : 0.85 - Math.abs(offset) * 0.05,
                rotateY: offset * -15,
                opacity: 1 - Math.abs(offset) * 0.25,
                zIndex: 10 - Math.abs(offset),
              }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="absolute"
              style={{ filter: isCenter ? "none" : "blur(0.5px)" }}
            >
              <PlaygroundCard
                card={card as any}
                pillar={pillarMap.get(card.pillar_id)}
                draggable
                onDragStart={dragHandle(card)}
              />
            </motion.div>
          );
        })}
      </div>
      <div className="absolute bottom-4 text-sm text-muted-foreground font-mono">
        {safeIdx + 1} / {cards.length}
      </div>
    </div>
  );
}
