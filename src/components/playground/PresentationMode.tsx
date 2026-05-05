import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PlaygroundCard } from "./PlaygroundCard";
import type { Tables } from "@/integrations/supabase/types";

type Card = Tables<"cards">;
type Pillar = Tables<"pillars">;

export function PresentationMode({
  cards,
  pillars,
  onClose,
}: {
  cards: Card[];
  pillars: Pillar[];
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const pillarMap = new Map(pillars.map((p) => [p.id, p]));

  const next = () => setIdx((i) => (i + 1) % cards.length);
  const prev = () => setIdx((i) => (i - 1 + cards.length) % cards.length);

  // keyboard
  if (typeof window !== "undefined") {
    (window as any).__playKeydown && window.removeEventListener("keydown", (window as any).__playKeydown);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") onClose();
    };
    (window as any).__playKeydown = handler;
    window.addEventListener("keydown", handler);
  }

  if (cards.length === 0) return null;
  const card = cards[idx];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm">
      <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 text-white hover:bg-white/10">
        <X className="w-6 h-6" />
      </Button>
      <Button variant="ghost" size="icon" onClick={prev} className="absolute left-4 text-white hover:bg-white/10">
        <ChevronLeft className="w-8 h-8" />
      </Button>
      <Button variant="ghost" size="icon" onClick={next} className="absolute right-4 text-white hover:bg-white/10">
        <ChevronRight className="w-8 h-8" />
      </Button>
      <AnimatePresence mode="wait">
        <motion.div
          key={card.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.25 }}
        >
          <PlaygroundCard card={card as any} pillar={pillarMap.get(card.pillar_id)} variant="presentation" />
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-6 text-white/70 text-sm font-mono">
        {idx + 1} / {cards.length} · ← → espace pour naviguer · échap pour quitter
      </div>
    </div>
  );
}
