import { useEffect, useMemo, useState, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Clock, Play, Pause, SkipBack } from "lucide-react";
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
  /** Speed in ms between steps when playing */
  stepMs?: number;
}

/** Innovation #5 — Frise chronologique avec auto-play "Rejouer la session" */
export function SessionTimeline({ events, onScrub, className, stepMs = 600 }: Props) {
  const sorted = useMemo(() => [...events].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)), [events]);
  const [idx, setIdx] = useState(sorted.length);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Reset index if event count changes
  useEffect(() => { setIdx(sorted.length); onScrub?.(null); }, [sorted.length]); // eslint-disable-line

  // Auto-play
  useEffect(() => {
    if (!playing) return;
    if (idx >= sorted.length) { setPlaying(false); return; }
    timerRef.current = window.setTimeout(() => {
      const next = Math.min(idx + 1, sorted.length);
      setIdx(next);
      onScrub?.(next >= sorted.length ? null : sorted[next].created_at);
    }, stepMs);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [playing, idx, sorted, stepMs, onScrub]);

  if (sorted.length === 0) return null;

  const handleChange = (vals: number[]) => {
    const v = vals[0] ?? sorted.length;
    setIdx(v);
    const ev = v >= sorted.length ? null : sorted[v];
    onScrub?.(ev?.created_at ?? null);
  };

  const restart = () => { setIdx(0); onScrub?.(sorted[0]?.created_at ?? null); setPlaying(true); };

  const currentLabel = idx >= sorted.length
    ? "Maintenant"
    : new Date(sorted[idx].created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className={cn("flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-card", className)}>
      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
      <Button size="sm" variant="ghost" onClick={restart} className="h-7 w-7 p-0 shrink-0" title="Rejouer depuis le début">
        <SkipBack className="h-3 w-3" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setPlaying(p => !p)} className="h-7 w-7 p-0 shrink-0" title={playing ? "Pause" : "Lecture"}>
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
      <span className="text-[10px] font-bold tabular-nums text-muted-foreground shrink-0 min-w-[100px] text-right">
        {currentLabel} · {idx}/{sorted.length}
      </span>
    </div>
  );
}
