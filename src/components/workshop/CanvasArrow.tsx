import { cn } from "@/lib/utils";

interface CanvasArrowProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isSelected: boolean;
  onClick: () => void;
}

export function CanvasArrow({
  fromX,
  fromY,
  toX,
  toY,
  isSelected,
  onClick,
}: CanvasArrowProps) {
  // Calculate control points for a smooth bezier curve
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const curvature = Math.min(distance * 0.3, 100);

  // Determine if the arrow goes more horizontal or vertical
  const isHorizontal = Math.abs(dx) > Math.abs(dy);
  
  let cp1x, cp1y, cp2x, cp2y;
  
  if (isHorizontal) {
    cp1x = fromX + curvature;
    cp1y = fromY;
    cp2x = toX - curvature;
    cp2y = toY;
  } else {
    cp1x = fromX;
    cp1y = fromY + curvature;
    cp2x = toX;
    cp2y = toY - curvature;
  }

  const pathD = `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX} ${toY}`;

  // Arrow head
  const angle = Math.atan2(toY - cp2y, toX - cp2x);
  const arrowLength = 12;
  const arrowAngle = Math.PI / 6;

  const arrow1X = toX - arrowLength * Math.cos(angle - arrowAngle);
  const arrow1Y = toY - arrowLength * Math.sin(angle - arrowAngle);
  const arrow2X = toX - arrowLength * Math.cos(angle + arrowAngle);
  const arrow2Y = toY - arrowLength * Math.sin(angle + arrowAngle);

  const arrowHeadD = `M ${arrow1X} ${arrow1Y} L ${toX} ${toY} L ${arrow2X} ${arrow2Y}`;

  return (
    <g 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="cursor-pointer"
    >
      {/* Invisible wider path for easier clicking */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="pointer-events-auto"
      />
      
      {/* Visible path */}
      <path
        d={pathD}
        fill="none"
        stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
        strokeWidth={isSelected ? 3 : 2}
        strokeLinecap="round"
        className="pointer-events-none transition-colors"
      />

      {/* Arrow head */}
      <path
        d={arrowHeadD}
        fill="none"
        stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
        strokeWidth={isSelected ? 3 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none transition-colors"
      />

      {/* Start dot */}
      <circle
        cx={fromX}
        cy={fromY}
        r={4}
        fill={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
        className="pointer-events-none transition-colors"
      />
    </g>
  );
}
