import { motion } from "framer-motion";
import type { PillarId } from "@/data/mockCards";

const PILLAR_LABELS: { id: PillarId; short: string }[] = [
  { id: "thinking", short: "THK" },
  { id: "business", short: "BIZ" },
  { id: "innovation", short: "INN" },
  { id: "finance", short: "FIN" },
  { id: "marketing", short: "MKT" },
  { id: "operations", short: "OPS" },
  { id: "team", short: "TEA" },
  { id: "legal", short: "LEG" },
  { id: "growth", short: "GRO" },
  { id: "impact", short: "IMP" },
];

interface RadarChartProps {
  scores: Record<PillarId, number>;
  size?: number;
}

export function RadarChart({ scores, size = 200 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const n = PILLAR_LABELS.length;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = (value / 100) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const dataPoints = PILLAR_LABELS.map((p, i) => getPoint(i, scores[p.id] || 0));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {[25, 50, 75, 100].map((v) => (
        <polygon
          key={v}
          points={Array.from({ length: n }, (_, i) => {
            const pt = getPoint(i, v);
            return `${pt.x},${pt.y}`;
          }).join(" ")}
          fill="none"
          stroke="hsl(60 10% 95% / 0.08)"
          strokeWidth="0.5"
        />
      ))}

      {/* Axis lines */}
      {PILLAR_LABELS.map((_, i) => {
        const pt = getPoint(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="hsl(60 10% 95% / 0.05)" strokeWidth="0.5" />;
      })}

      {/* Data shape */}
      <motion.path
        d={dataPath}
        fill="hsl(14 90% 58% / 0.15)"
        stroke="hsl(14 90% 58%)"
        strokeWidth="2"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />

      {/* Data points */}
      {dataPoints.map((pt, i) => (
        <motion.circle
          key={i}
          cx={pt.x}
          cy={pt.y}
          r="3"
          fill="hsl(14 90% 58%)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + i * 0.05 }}
        />
      ))}

      {/* Labels */}
      {PILLAR_LABELS.map((p, i) => {
        const pt = getPoint(i, 120);
        return (
          <text
            key={p.id}
            x={pt.x}
            y={pt.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-muted-foreground"
            fontSize="8"
            fontWeight="700"
            letterSpacing="0.1em"
          >
            {p.short}
          </text>
        );
      })}
    </svg>
  );
}
