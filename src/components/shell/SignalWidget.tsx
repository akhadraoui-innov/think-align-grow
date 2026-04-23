import { ReactNode, useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SignalTone = "neutral" | "info" | "success" | "warn" | "danger";

interface SignalWidgetProps {
  icon: LucideIcon;
  label: string;
  count?: number;
  tone?: SignalTone;
  pulse?: boolean;
  variant?: "portal" | "admin";
  align?: "end" | "center" | "start";
  width?: number;
  children: (close: () => void) => ReactNode;
  /** Visible content when count > 0 (e.g. "9+") — defaults to count */
  badgeText?: string;
}

const toneToBadge: Record<SignalTone, string> = {
  neutral: "bg-foreground text-background",
  info: "bg-[hsl(var(--pillar-innovation))] text-white",
  success: "bg-[hsl(var(--pillar-growth))] text-white",
  warn: "bg-[hsl(var(--pillar-business))] text-white",
  danger: "bg-destructive text-destructive-foreground",
};

const toneToRing: Record<SignalTone, string> = {
  neutral: "",
  info: "",
  success: "",
  warn: "",
  danger: "studio-pulse",
};

/**
 * Primitive unifiée pour toutes les "cloches" du header.
 * - Badge tabulaire avec animation studio-tick à chaque increment
 * - Dropdown glassmorphique éditorial 384px
 * - Tone sémantique (pillar-driven)
 */
export function SignalWidget({
  icon: Icon,
  label,
  count = 0,
  tone = "neutral",
  pulse = false,
  variant = "portal",
  align = "end",
  width = 384,
  children,
  badgeText,
}: SignalWidgetProps) {
  const [open, setOpen] = useState(false);
  const [tickKey, setTickKey] = useState(0);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current) {
      setTickKey((k) => k + 1);
    }
    prevCount.current = count;
  }, [count]);

  const triggerSize =
    variant === "portal"
      ? "h-9 w-9 rounded-lg"
      : "h-8 w-8 rounded-md";

  const display = badgeText ?? (count > 99 ? "99+" : count > 9 ? "9+" : String(count));

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={label}
          className={cn(
            "relative flex items-center justify-center transition-colors duration-180 ease-studio",
            "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            triggerSize,
            open && "text-foreground bg-muted/60",
            pulse && tone === "danger" && "studio-pulse"
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          {count > 0 && (
            <span
              key={tickKey}
              className={cn(
                "absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full",
                "text-[9px] font-bold leading-none flex items-center justify-center",
                "studio-tnum studio-tick shadow-sm",
                "ring-2 ring-background",
                toneToBadge[tone],
                toneToRing[tone]
              )}
            >
              {display}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        sideOffset={10}
        className={cn(
          "p-0 overflow-hidden rounded-2xl border-0",
          "studio-surface-3 studio-shadow-pop",
          "studio-pop-in"
        )}
        style={{ width }}
      >
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/40 pointer-events-none" />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-foreground/[0.04] pointer-events-none" />
        <div className="relative">{children(() => setOpen(false))}</div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SignalHeaderProps {
  label: string;
  meta?: string;
  action?: ReactNode;
}

export function SignalHeader({ label, meta, action }: SignalHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
      <div className="flex items-baseline gap-2">
        <span className="studio-microcaps text-foreground/85">{label}</span>
        {meta && (
          <span className="studio-microcaps text-muted-foreground/70 text-[9px]">
            • {meta}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

interface SignalFooterProps {
  children: ReactNode;
}

export function SignalFooter({ children }: SignalFooterProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-foreground/[0.06] bg-foreground/[0.015]">
      {children}
    </div>
  );
}

export function SignalShortcut({ keys, label, onClick }: { keys: string[]; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs hover:bg-foreground/[0.05] transition-colors duration-180 ease-studio group"
    >
      <span className="text-foreground/80 group-hover:text-foreground font-medium">{label}</span>
      <span className="flex gap-0.5">
        {keys.map((k, i) => (
          <kbd key={i} className="studio-kbd">{k}</kbd>
        ))}
      </span>
    </button>
  );
}
