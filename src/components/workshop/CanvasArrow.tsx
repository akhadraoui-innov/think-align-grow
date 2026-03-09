import { cn } from "@/lib/utils";

interface CanvasArrowProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isSelected: boolean;
  onClick: () => void;
  style?: string; // "solid" | "dashed" | "dotted" | "thick"
  color?: string; // "default" | "primary" | "red" | "green"
}

const ARROW_COLORS: Record<string, string> = {
  default: "hsl(var(--muted-foreground))",
  primary: "hsl(var(--primary))",
  red: "hsl(var(--destructive))",
  green: "hsl(var(--pillar-finance))",
  blue: "hsl(var(--pillar-thinking))",
  orange: "hsl(var(--pillar-business))",
};

export function CanvasArrow({
  fromX, fromY, toX, toY,
  isSelected, onClick,
  style = "solid",
  color = "default",
}: CanvasArrowProps) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const curvature = Math.min(distance * 0.3, 100);

  const isHorizontal = Math.abs(dx) > Math.abs(dy);
  let cp1x, cp1y, cp2x, cp2y;
  
  if (isHorizontal) {
    cp1x = fromX + curvature; cp1y = fromY;
    cp2x = toX - curvature; cp2y = toY;
  } else {
    cp1x = fromX; cp1y = fromY + curvature;
    cp2x = toX; cp2y = toY - curvature;
  }

  const pathD = `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX} ${toY}`;

  const angle = Math.atan2(toY - cp2y, toX - cp2x);
  const arrowLength = 12;
  const arrowAngle = Math.PI / 6;
  const arrow1X = toX - arrowLength * Math.cos(angle - arrowAngle);
  const arrow1Y = toY - arrowLength * Math.sin(angle - arrowAngle);
  const arrow2X = toX - arrowLength * Math.cos(angle + arrowAngle);
  const arrow2Y = toY - arrowLength * Math.sin(angle + arrowAngle);
  const arrowHeadD = `M ${arrow1X} ${arrow1Y} L ${toX} ${toY} L ${arrow2X} ${arrow2Y}`;

  const strokeColor = isSelected ? "hsl(var(--primary))" : (ARROW_COLORS[color] || ARROW_COLORS.default);
  const strokeWidth = style === "thick" ? 4 : isSelected ? 3 : 2;
  const dashArray = style === "dashed" ? "8,6" : style === "dotted" ? "3,4" : undefined;

  return (
    <g 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="cursor-pointer"
    >
      <path d={pathD} fill="none" stroke="transparent" strokeWidth={20} className="pointer-events-auto" />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dashArray}
        className="pointer-events-none transition-colors"
      />
      <path
        d={arrowHeadD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none transition-colors"
      />
      <circle cx={fromX} cy={fromY} r={4} fill={strokeColor} className="pointer-events-none transition-colors" />
    </g>
  );
}
