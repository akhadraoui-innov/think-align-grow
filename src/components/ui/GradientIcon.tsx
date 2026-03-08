import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface GradientIconProps {
  icon: LucideIcon;
  gradient?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  iconClassName?: string;
}

const gradients: Record<string, string> = {
  primary: "from-primary to-pillar-thinking",
  accent: "from-accent to-pillar-marketing",
  finance: "from-pillar-finance to-pillar-growth",
  business: "from-pillar-business to-pillar-impact",
  innovation: "from-pillar-innovation to-accent",
  thinking: "from-pillar-thinking to-primary",
  marketing: "from-pillar-marketing to-accent",
  team: "from-pillar-team to-primary",
  impact: "from-pillar-impact to-pillar-business",
};

const sizes = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

const iconSizes = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-10 w-10",
};

export function GradientIcon({
  icon: Icon,
  gradient = "primary",
  size = "md",
  className,
  iconClassName,
}: GradientIconProps) {
  const grad = gradients[gradient] || gradients.primary;

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
        grad,
        sizes[size],
        className
      )}
    >
      <Icon className={cn("text-foreground drop-shadow-sm", iconSizes[size], iconClassName)} />
    </div>
  );
}
