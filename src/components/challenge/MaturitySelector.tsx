import { cn } from "@/lib/utils";

interface MaturitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
  compact?: boolean;
}

const LEVELS = [
  { value: 1, label: "Novice", short: "N" },
  { value: 2, label: "Débutant", short: "D" },
  { value: 3, label: "Inter.", short: "I" },
  { value: 4, label: "Avancé", short: "A" },
  { value: 5, label: "Expert", short: "E" },
];

const LEVEL_COLORS = [
  "bg-destructive text-destructive-foreground",
  "bg-orange-500 text-white",
  "bg-yellow-500 text-black",
  "bg-emerald-400 text-black",
  "bg-primary text-primary-foreground",
];

const LEVEL_RING_COLORS = [
  "ring-destructive",
  "ring-orange-500",
  "ring-yellow-500",
  "ring-emerald-400",
  "ring-primary",
];

export function MaturitySelector({ value, onChange, readOnly, compact }: MaturitySelectorProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-0.5">
        {LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            disabled={readOnly}
            onClick={() => onChange(value === level.value ? 0 : level.value)}
            className={cn(
              "h-2.5 w-2.5 rounded-full transition-all",
              level.value <= value ? LEVEL_COLORS[level.value - 1].split(" ")[0] : "bg-muted-foreground/20",
              !readOnly && "hover:scale-125 cursor-pointer",
              readOnly && "cursor-default"
            )}
            title={`${level.label} (${level.value}/5)`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-secondary/50 p-0.5">
      {LEVELS.map((level) => {
        const isActive = value === level.value;
        return (
          <button
            key={level.value}
            type="button"
            disabled={readOnly}
            onClick={() => onChange(value === level.value ? 0 : level.value)}
            className={cn(
              "px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide transition-all",
              isActive
                ? cn(LEVEL_COLORS[level.value - 1], "shadow-sm ring-1 ring-offset-1 ring-offset-background", LEVEL_RING_COLORS[level.value - 1])
                : "text-muted-foreground/50 hover:text-muted-foreground",
              !readOnly && "cursor-pointer",
              readOnly && "cursor-default opacity-70"
            )}
            title={`${level.label} (${level.value}/5)`}
          >
            {level.short}
          </button>
        );
      })}
    </div>
  );
}

export function MaturityBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const level = LEVELS.find(l => l.value === value);
  if (!level) return null;
  return (
    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md", LEVEL_COLORS[value - 1])}>
      {level.label}
    </span>
  );
}
