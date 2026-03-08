import { useState } from "react";
import { motion } from "framer-motion";
import type { StrategyCard, PillarId } from "@/data/mockCards";

const pillarColors: Record<PillarId, string> = {
  thinking: "from-pillar-thinking/20 to-pillar-thinking/5 border-pillar-thinking/30",
  business: "from-pillar-business/20 to-pillar-business/5 border-pillar-business/30",
  innovation: "from-pillar-innovation/20 to-pillar-innovation/5 border-pillar-innovation/30",
  finance: "from-pillar-finance/20 to-pillar-finance/5 border-pillar-finance/30",
  marketing: "from-pillar-marketing/20 to-pillar-marketing/5 border-pillar-marketing/30",
  operations: "from-pillar-operations/20 to-pillar-operations/5 border-pillar-operations/30",
  team: "from-pillar-team/20 to-pillar-team/5 border-pillar-team/30",
  legal: "from-pillar-legal/20 to-pillar-legal/5 border-pillar-legal/30",
  growth: "from-pillar-growth/20 to-pillar-growth/5 border-pillar-growth/30",
  impact: "from-pillar-impact/20 to-pillar-impact/5 border-pillar-impact/30",
};

const pillarTextColors: Record<PillarId, string> = {
  thinking: "text-pillar-thinking",
  business: "text-pillar-business",
  innovation: "text-pillar-innovation",
  finance: "text-pillar-finance",
  marketing: "text-pillar-marketing",
  operations: "text-pillar-operations",
  team: "text-pillar-team",
  legal: "text-pillar-legal",
  growth: "text-pillar-growth",
  impact: "text-pillar-impact",
};

interface FlipCardProps {
  card: StrategyCard;
}

export function FlipCard({ card }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="perspective-1000 cursor-pointer h-52"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 25 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${pillarColors[card.pillar]} border p-5 flex flex-col justify-between`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${pillarTextColors[card.pillar]}`}>
              {card.pillar} · {card.phase}
            </span>
            <h3 className="font-display font-bold text-lg text-foreground uppercase tracking-wide mt-2">
              {card.title}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-3">{card.definition}</p>
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">Tap to flip →</span>
        </div>

        {/* Back */}
        <div
          className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${pillarColors[card.pillar]} border p-5 flex flex-col justify-between`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${pillarTextColors[card.pillar]}`}>
              Action
            </span>
            <p className="text-sm text-foreground mt-2 leading-relaxed">{card.action}</p>
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${pillarTextColors[card.pillar]}`}>
              KPI
            </span>
            <p className="text-sm text-muted-foreground mt-1">{card.kpi}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
