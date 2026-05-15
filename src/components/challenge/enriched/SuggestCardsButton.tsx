import { useMemo, useState } from "react";
import { Sparkles, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getPillarCssColor } from "@/hooks/useToolkitData";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";

interface Props {
  slotHint?: string | null;
  subjectTitle?: string | null;
  cards: DbCard[];
  pillars: DbPillar[];
  placedCardIds?: Set<string>;
  onAdd: (cardId: string) => void;
}

// Naive but instant scoring: token overlap on title/definition/objective vs slot+subject
function score(card: DbCard, query: string): number {
  if (!query) return 0;
  const haystack = `${card.title} ${card.subtitle ?? ""} ${card.definition ?? ""} ${card.objective ?? ""}`.toLowerCase();
  const tokens = query.toLowerCase().split(/\W+/).filter(t => t.length >= 4);
  if (tokens.length === 0) return 0;
  let s = 0;
  for (const t of tokens) {
    if (haystack.includes(t)) s += 1;
    if (card.title.toLowerCase().includes(t)) s += 2;
  }
  return s;
}

export function SuggestCardsButton({ slotHint, subjectTitle, cards, pillars, placedCardIds, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const suggestions = useMemo(() => {
    const q = `${subjectTitle ?? ""} ${slotHint ?? ""}`.trim();
    if (!q) return [];
    return cards
      .filter(c => !placedCardIds?.has(c.id))
      .map(c => ({ card: c, s: score(c, q) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
      .map(x => x.card);
  }, [cards, placedCardIds, slotHint, subjectTitle]);

  const handleClick = () => {
    if (open) { setOpen(false); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setOpen(true); }, 180);
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={handleClick}
        type="button"
        className={cn(
          "w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all",
          open
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50",
        )}
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
        {open ? "Masquer les suggestions" : `Suggestions IA (${suggestions.length})`}
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-1.5 space-y-1"
          >
            {suggestions.map(card => {
              const pillar = pillars.find(p => p.id === card.pillar_id);
              const color = pillar ? getPillarCssColor(pillar.slug, pillar.color) : "hsl(var(--primary))";
              return (
                <li
                  key={card.id}
                  className="flex items-center gap-2 rounded-md bg-background border border-border px-2 py-1.5 hover:border-primary/40 transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold leading-tight truncate">{card.title}</p>
                    {pillar && <p className="text-[9px] text-muted-foreground uppercase tracking-wider truncate">{pillar.name}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAdd(card.id)}
                    className="h-6 w-6 p-0 shrink-0"
                    style={{ color }}
                    title="Ajouter"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
