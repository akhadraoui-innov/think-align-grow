import { useState } from "react";
import { motion } from "framer-motion";
import type { DbCard } from "@/hooks/useToolkitData";
import { PHASE_LABELS } from "@/hooks/useToolkitData";

const slugColors: Record<string, string> = {
  thinking: "from-pillar-thinking/20 to-pillar-thinking/5 border-pillar-thinking/30",
  business: "from-pillar-business/20 to-pillar-business/5 border-pillar-business/30",
  innovation: "from-pillar-innovation/20 to-pillar-innovation/5 border-pillar-innovation/30",
  finance: "from-pillar-finance/20 to-pillar-finance/5 border-pillar-finance/30",
  indicators: "from-pillar-marketing/20 to-pillar-marketing/5 border-pillar-marketing/30",
  building: "from-pillar-operations/20 to-pillar-operations/5 border-pillar-operations/30",
  managing: "from-pillar-team/20 to-pillar-team/5 border-pillar-team/30",
  gouvernance: "from-pillar-legal/20 to-pillar-legal/5 border-pillar-legal/30",
  profitability: "from-pillar-growth/20 to-pillar-growth/5 border-pillar-growth/30",
  fundraising: "from-pillar-impact/20 to-pillar-impact/5 border-pillar-impact/30",
};

const slugTextColors: Record<string, string> = {
  thinking: "text-pillar-thinking",
  business: "text-pillar-business",
  innovation: "text-pillar-innovation",
  finance: "text-pillar-finance",
  indicators: "text-pillar-marketing",
  building: "text-pillar-operations",
  managing: "text-pillar-team",
  gouvernance: "text-pillar-legal",
  profitability: "text-pillar-growth",
  fundraising: "text-pillar-impact",
};

interface FlipCardProps {
  card: DbCard;
  pillarSlug?: string;
}

export function FlipCard({ card, pillarSlug = "business" }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const colorClass = slugColors[pillarSlug] || slugColors.business;
  const textClass = slugTextColors[pillarSlug] || slugTextColors.business;

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
          className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${colorClass} border p-5 flex flex-col justify-between`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${textClass}`}>
              {pillarSlug} · {PHASE_LABELS[card.phase] || card.phase}
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
          className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${colorClass} border p-5 flex flex-col justify-between`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${textClass}`}>
              Action
            </span>
            <p className="text-sm text-foreground mt-2 leading-relaxed">{card.action}</p>
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${textClass}`}>
              KPI
            </span>
            <p className="text-sm text-muted-foreground mt-1">{card.kpi}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
