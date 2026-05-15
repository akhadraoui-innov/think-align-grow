import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function LockBadge({ name, color, className }: { name?: string | null; color?: string; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-background/95 backdrop-blur ring-1 ring-border shadow-sm",
        className,
      )}
      style={color ? { boxShadow: `0 0 0 1.5px ${color}` } : undefined}
    >
      <Lock className="h-2.5 w-2.5" />
      <span>{name || "Édité"}</span>
    </div>
  );
}
