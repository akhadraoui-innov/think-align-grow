import { AlignLeft, Minus, AlignJustify } from "lucide-react";
import { cn } from "@/lib/utils";

export type CardFormat = "compact" | "normal" | "expanded";

interface FormatSelectorProps {
  value: CardFormat;
  onChange: (value: CardFormat) => void;
  readOnly?: boolean;
}

const FORMATS: { value: CardFormat; icon: typeof Minus; label: string }[] = [
  { value: "compact", icon: Minus, label: "Compact" },
  { value: "normal", icon: AlignLeft, label: "Normal" },
  { value: "expanded", icon: AlignJustify, label: "Étendu" },
];

export function FormatSelector({ value, onChange, readOnly }: FormatSelectorProps) {
  return (
    <div className="flex items-center gap-0.5 bg-secondary/50 rounded-lg p-0.5">
      {FORMATS.map(({ value: fmt, icon: Icon, label }) => (
        <button
          key={fmt}
          type="button"
          disabled={readOnly}
          onClick={() => onChange(fmt)}
          className={cn(
            "p-1 rounded-md transition-colors",
            value === fmt ? "bg-background shadow-sm text-foreground" : "text-muted-foreground",
            !readOnly && "hover:text-foreground cursor-pointer",
            readOnly && "cursor-default"
          )}
          title={label}
        >
          <Icon className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}
