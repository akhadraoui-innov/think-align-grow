import { useEffect, useRef } from "react";
import { Play, Pause, Plus, RotateCcw, Timer as TimerIcon } from "lucide-react";
import { useSubjectTimer } from "@/hooks/useSubjectTimer";
import { cn } from "@/lib/utils";

const PRESETS = [60, 180, 300, 600];

function fmt(s: number | null): string {
  if (s == null) return "--:--";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

interface Props {
  subjectId: string | null | undefined;
  isHost: boolean;
}

export function SubjectTimer({ subjectId, isHost }: Props) {
  const { state, start, pause, resume, addSeconds, reset } = useSubjectTimer(subjectId);
  const beepedRef = useRef(false);

  useEffect(() => {
    if (state.remaining === 0 && state.running && !beepedRef.current) {
      beepedRef.current = true;
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.value = 660;
        osc.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.7);
      } catch { /* ignore */ }
    }
    if (state.remaining != null && state.remaining > 0) beepedRef.current = false;
  }, [state.remaining, state.running]);

  if (!subjectId) return null;
  if (!state.duration && !isHost) return null;

  const lowTime = state.remaining != null && state.remaining > 0 && state.remaining < 30;
  const elapsed = state.duration && state.remaining != null ? 1 - state.remaining / state.duration : 0;

  return (
    <div className={cn(
      "flex items-center gap-2 px-2.5 py-1 rounded-md border bg-background/80 backdrop-blur-sm",
      lowTime ? "border-red-500 animate-pulse" : "border-border",
    )}>
      <TimerIcon className={cn("h-3.5 w-3.5", lowTime ? "text-red-500" : "text-muted-foreground")} />
      <span className={cn("font-mono text-sm font-bold tabular-nums", lowTime && "text-red-500")}>{fmt(state.remaining)}</span>
      {state.duration && (
        <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
          <div className={cn("h-full transition-all", lowTime ? "bg-red-500" : "bg-primary")} style={{ width: `${Math.min(100, elapsed * 100)}%` }} />
        </div>
      )}
      {isHost && (
        <div className="flex items-center gap-0.5 ml-1">
          {!state.duration && PRESETS.map((p) => (
            <button key={p} onClick={() => start(p)} className="text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-muted text-muted-foreground" title={`Démarrer ${p}s`}>
              {p < 60 ? `${p}s` : `${p / 60}'`}
            </button>
          ))}
          {state.duration != null && (
            <>
              {state.running ? (
                <button onClick={pause} className="p-1 rounded hover:bg-muted" title="Pause"><Pause className="h-3 w-3" /></button>
              ) : state.pausedAt ? (
                <button onClick={resume} className="p-1 rounded hover:bg-muted" title="Reprendre"><Play className="h-3 w-3" /></button>
              ) : null}
              <button onClick={() => addSeconds(30)} className="p-1 rounded hover:bg-muted" title="+30s"><Plus className="h-3 w-3" /></button>
              <button onClick={reset} className="p-1 rounded hover:bg-muted" title="Reset"><RotateCcw className="h-3 w-3" /></button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
