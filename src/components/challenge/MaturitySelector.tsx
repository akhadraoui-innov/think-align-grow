import { cn } from "@/lib/utils";

interface MaturitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
}

const LEVELS = [1, 2, 3, 4, 5];
const LEVEL_COLORS = [
  "bg-destructive",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-emerald-400",
  "bg-primary",
];

export function MaturitySelector({ value, onChange, readOnly }: MaturitySelectorProps) {
  return (
    <div className="flex items-center gap-0.5">
      {LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          disabled={readOnly}
          onClick={() => onChange(value === level ? 0 : level)}
          className={cn(
            "h-2.5 w-2.5 rounded-full transition-all",
            level <= value ? LEVEL_COLORS[level - 1] : "bg-muted-foreground/20",
            !readOnly && "hover:scale-125 cursor-pointer",
            readOnly && "cursor-default"
          )}
          title={`Maturité ${level}/5`}
        />
      ))}
    </div>
  );
}
