import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TimerState {
  duration: number | null;
  startedAt: string | null;
  pausedAt: string | null;
  remaining: number | null; // seconds, computed
  running: boolean;
}

export function useSubjectTimer(subjectId: string | null | undefined) {
  const [state, setState] = useState<TimerState>({ duration: null, startedAt: null, pausedAt: null, remaining: null, running: false });

  const compute = useCallback((duration: number | null, startedAt: string | null, pausedAt: string | null): TimerState => {
    if (!duration || !startedAt) return { duration, startedAt, pausedAt, remaining: duration, running: false };
    const startMs = +new Date(startedAt);
    const refMs = pausedAt ? +new Date(pausedAt) : Date.now();
    const elapsed = Math.max(0, Math.floor((refMs - startMs) / 1000));
    return { duration, startedAt, pausedAt, remaining: Math.max(0, duration - elapsed), running: !pausedAt };
  }, []);

  const load = useCallback(async () => {
    if (!subjectId) return;
    const { data } = await (supabase as any)
      .from("challenge_subjects")
      .select("timer_duration_seconds,timer_started_at,timer_paused_at")
      .eq("id", subjectId)
      .maybeSingle();
    if (data) setState(compute(data.timer_duration_seconds, data.timer_started_at, data.timer_paused_at));
  }, [subjectId, compute]);

  useEffect(() => { load(); }, [load]);

  // Realtime subscription
  useEffect(() => {
    if (!subjectId) return;
    const ch = supabase
      .channel(`subj-timer-${subjectId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "challenge_subjects", filter: `id=eq.${subjectId}` }, (p) => {
        const row = p.new as any;
        setState(compute(row.timer_duration_seconds, row.timer_started_at, row.timer_paused_at));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [subjectId, compute]);

  // Local tick
  useEffect(() => {
    if (!state.running || state.remaining == null || state.remaining <= 0) return;
    const i = setInterval(() => {
      setState((s) => s.running && s.remaining != null ? { ...s, remaining: Math.max(0, s.remaining - 1) } : s);
    }, 1000);
    return () => clearInterval(i);
  }, [state.running, state.remaining]);

  const update = useCallback(async (patch: Record<string, any>) => {
    if (!subjectId) return;
    const { error } = await (supabase as any).from("challenge_subjects").update(patch).eq("id", subjectId);
    if (error) toast.error("Timer error", { description: error.message });
  }, [subjectId]);

  const start = useCallback((seconds: number) => update({
    timer_duration_seconds: seconds,
    timer_started_at: new Date().toISOString(),
    timer_paused_at: null,
  }), [update]);

  const pause = useCallback(() => update({ timer_paused_at: new Date().toISOString() }), [update]);

  const resume = useCallback(async () => {
    if (!state.startedAt || !state.pausedAt) return;
    // shift startedAt forward by paused duration to preserve remaining time
    const pausedFor = Date.now() - +new Date(state.pausedAt);
    const newStart = new Date(+new Date(state.startedAt) + pausedFor).toISOString();
    await update({ timer_started_at: newStart, timer_paused_at: null });
  }, [state.startedAt, state.pausedAt, update]);

  const addSeconds = useCallback(async (delta: number) => {
    if (!state.startedAt) return;
    const newStart = new Date(+new Date(state.startedAt) + delta * 1000).toISOString();
    await update({ timer_started_at: newStart });
  }, [state.startedAt, update]);

  const reset = useCallback(() => update({
    timer_duration_seconds: null,
    timer_started_at: null,
    timer_paused_at: null,
  }), [update]);

  return { state, start, pause, resume, addSeconds, reset, reload: load };
}
