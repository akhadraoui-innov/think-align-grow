import { PlaygroundCard } from "./PlaygroundCard";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Card = Tables<"cards">;
type Pillar = Tables<"pillars">;

export function PlateauHand({
  cards,
  pillars,
  placedIds,
  cardScaleGlobal,
}: {
  cards: Card[];
  pillars: Pillar[];
  placedIds: Set<string>;
  cardScaleGlobal: number;
}) {
  const pillarMap = new Map(pillars.map((p) => [p.id, p]));

  const onDragStart = (card: Card) => (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    const r = target.getBoundingClientRect();
    e.dataTransfer.setData("text/card-id", card.id);
    e.dataTransfer.effectAllowed = "move";
    // Centre le drag image sur le pointeur (pour que le drop soit "exact")
    try {
      e.dataTransfer.setDragImage(target, e.clientX - r.left, e.clientY - r.top);
    } catch {}
  };

  // 2 lignes scroll-x : on génère un grid 2 lignes auto-flow column
  return (
    <div className="w-full overflow-x-auto overflow-y-hidden border-t bg-card/60 backdrop-blur">
      <div
        className="grid grid-flow-col auto-cols-max gap-3 p-3"
        style={{ gridTemplateRows: "repeat(2, auto)" }}
      >
        {cards.map((c, i) => {
          const placed = placedIds.has(c.id);
          // Compact pour la main, mais respecte le scale global
          const w = 180 * cardScaleGlobal;
          const h = 252 * cardScaleGlobal;
          return (
            <div
              key={c.id}
              draggable
              onDragStart={onDragStart(c)}
              className={cn("cursor-grab active:cursor-grabbing transition-opacity", placed && "opacity-30")}
              style={{ width: w, height: h }}
              title={placed ? "Déjà sur le plateau" : "Glisser sur le plateau"}
            >
              <div style={{ transform: `scale(${cardScaleGlobal * (180 / 280)})`, transformOrigin: "top left", width: 280, height: 392 }}>
                <PlaygroundCard
                  card={c as any}
                  pillar={pillarMap.get(c.pillar_id)}
                  index={i}
                />
              </div>
            </div>
          );
        })}
        {cards.length === 0 && (
          <div className="text-sm text-muted-foreground italic px-4 py-6">
            Aucune carte dans cette catégorie.
          </div>
        )}
      </div>
    </div>
  );
}
