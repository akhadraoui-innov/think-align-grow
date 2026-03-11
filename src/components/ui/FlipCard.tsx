import { useState } from "react";
import { motion } from "framer-motion";
import type { DbCard } from "@/hooks/useToolkitData";
import { getPillarGradient, getPillarCssColor, PHASE_LABELS } from "@/hooks/useToolkitData";

interface FlipCardProps {
  card: DbCard;
  pillarSlug?: string;
  pillarColor?: string | null;
}

export function FlipCard({ card, pillarSlug = "business", pillarColor }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const gradient = getPillarGradient(pillarSlug, pillarColor);
  const cssColor = getPillarCssColor(pillarSlug, pillarColor);

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
          className="absolute inset-0 rounded-3xl border border-border overflow-hidden p-5 flex flex-col justify-between"
          style={{
            backfaceVisibility: "hidden",
            background: `linear-gradient(135deg, ${cssColor}33, ${cssColor}0d)`,
            borderColor: `${cssColor}4d`,
          }}
        >
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.15em]"
              style={{ color: `hsl(var(--pillar-${gradient}))` }}
            >
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
          className="absolute inset-0 rounded-3xl border border-border overflow-hidden p-5 flex flex-col justify-between"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: `linear-gradient(135deg, hsl(var(--pillar-${gradient}) / 0.2), hsl(var(--pillar-${gradient}) / 0.05))`,
            borderColor: `hsl(var(--pillar-${gradient}) / 0.3)`,
          }}
        >
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.15em]"
              style={{ color: `hsl(var(--pillar-${gradient}))` }}
            >
              Action
            </span>
            <p className="text-sm text-foreground mt-2 leading-relaxed">{card.action}</p>
          </div>
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.15em]"
              style={{ color: `hsl(var(--pillar-${gradient}))` }}
            >
              KPI
            </span>
            <p className="text-sm text-muted-foreground mt-1">{card.kpi}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
