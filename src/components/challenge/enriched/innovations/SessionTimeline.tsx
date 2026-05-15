import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Clock, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  created_at: string;
  label?: string;
  kind?: string;
}

interface Props {
  events: TimelineEvent[];
  onScrub?: (timestamp: string | null) => void;
  className?: string;
}

/** Innovation #5 — Frise chronologique : slider pour rejouer la session */
export function SessionTimeline({ events, onScrub, className }: Props) {
  const sorted = useMemo(() => [...events].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)), [events]);
  const [idx, setIdx] = useState(sorted.length);
  const [playing, setPlaying] = useState(false);

  if (sorted.length === 0) return null;

  const handleChange = (vals: number[]) => {
    const v = vals[0] ?? sorted.length;
    setIdx(v);
    const ev = v >= sorted.length ? null : sorted[v];
    onScrub?.(ev?.created_at ?? null);
  };

  return (
    <div className={cn("flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-card", className)}>
      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
      <Button size="sm" variant="ghost" onClick={() => setPlaying(p => !p)} className="h-7 w-7 p-0 shrink-0">
        {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </Button>
      <Slider
        min={0}
        max={sorted.length}
        step={1}
        value={[idx]}
        onValueChange={handleChange}
        className="flex-1"
      />
      <span className="text-[10px] font-bold tabular-nums text-muted-foreground shrink-0 min-w-[60px] text-right">
        {idx}/{sorted.length}
      </span>
    </div>
  );
}
