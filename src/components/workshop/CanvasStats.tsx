import { motion } from "framer-motion";
import { BarChart3, StickyNote, Square, ArrowRight, Users } from "lucide-react";
import { CanvasItem } from "@/hooks/useCanvasItems";
import type { DbPillar } from "@/hooks/useToolkitData";
import { getPillarGradient } from "@/hooks/useToolkitData";
import { cn } from "@/lib/utils";

interface CanvasStatsProps {
  items: CanvasItem[];
  pillars: DbPillar[];
  cards: { id: string; pillar_id: string }[];
  participantCount: number;
}

export function CanvasStats({ items, pillars, cards, participantCount }: CanvasStatsProps) {
  // Count items by type
  const cardCount = items.filter(i => i.type === "card").length;
  const stickyCount = items.filter(i => i.type === "sticky").length;
  const groupCount = items.filter(i => i.type === "group").length;
  const arrowCount = items.filter(i => i.type === "arrow").length;

  // Count cards by pillar
  const pillarCounts = pillars.map(pillar => {
    const count = items.filter(i => {
      if (i.type !== "card" || !i.card_id) return false;
      const card = cards.find(c => c.id === i.card_id);
      return card?.pillar_id === pillar.id;
    }).length;
    return { pillar, count };
  }).filter(p => p.count > 0);

  // Get unique contributors
  const contributors = new Set(items.map(i => i.created_by)).size;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-4 left-4 z-40 flex items-center gap-2"
    >
      {/* Total counts */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-background/90 backdrop-blur-sm border border-border shadow-lg">
        <StatItem icon={BarChart3} label="Cartes" count={cardCount} />
        <div className="w-px h-6 bg-border" />
        <StatItem icon={StickyNote} label="Post-its" count={stickyCount} />
        <div className="w-px h-6 bg-border" />
        <StatItem icon={Square} label="Groupes" count={groupCount} />
        <div className="w-px h-6 bg-border" />
        <StatItem icon={ArrowRight} label="Liens" count={arrowCount} />
        <div className="w-px h-6 bg-border" />
        <StatItem icon={Users} label="Contrib." count={contributors} />
      </div>

      {/* Pillar distribution */}
      {pillarCounts.length > 0 && (
        <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-background/90 backdrop-blur-sm border border-border shadow-lg">
          {pillarCounts.slice(0, 5).map(({ pillar, count }) => {
            const gradient = getPillarGradient(pillar.slug, pillar.color);
            return (
              <div 
                key={pillar.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                style={{ background: `hsl(var(--pillar-${gradient}) / 0.1)` }}
                title={pillar.name}
              >
                <div 
                  className="h-2 w-2 rounded-full"
                  style={{ background: `hsl(var(--pillar-${gradient}))` }}
                />
                <span 
                  className="text-[10px] font-bold"
                  style={{ color: `hsl(var(--pillar-${gradient}))` }}
                >
                  {count}
                </span>
              </div>
            );
          })}
          {pillarCounts.length > 5 && (
            <span className="text-[10px] text-muted-foreground px-1">
              +{pillarCounts.length - 5}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

function StatItem({ 
  icon: Icon, 
  label, 
  count 
}: { 
  icon: React.ElementType; 
  label: string; 
  count: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs font-bold">{count}</span>
      <span className="text-[10px] text-muted-foreground hidden sm:inline">{label}</span>
    </div>
  );
}
