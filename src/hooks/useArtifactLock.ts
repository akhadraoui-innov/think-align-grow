import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ArtifactLock {
  artifact_id: string;
  locked_by: string;
  locked_at: string;
  expires_at: string;
}

/**
 * Realtime view of all artifact locks for a session.
 * Used to show "Marie is editing…" badges to others.
 */
export function useArtifactLocks(sessionId: string | undefined) {
  const [locks, setLocks] = useState<Record<string, ArtifactLock>>({});

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    (async () => {
      const { data } = await (supabase as any)
        .from("challenge_artifact_locks")
        .select("*")
        .eq("session_id", sessionId)
        .gt("expires_at", new Date().toISOString());
      if (cancelled) return;
      const map: Record<string, ArtifactLock> = {};
      (data || []).forEach((l: ArtifactLock) => { map[l.artifact_id] = l; });
      setLocks(map);
    })();

    const ch = supabase
      .channel(`artlocks-${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "challenge_artifact_locks", filter: `session_id=eq.${sessionId}` }, (p) => {
        setLocks(prev => {
          const next = { ...prev };
          if (p.eventType === "DELETE") {
            const old = p.old as any;
            if (old?.artifact_id) delete next[old.artifact_id];
          } else {
            const row = p.new as ArtifactLock;
            if (new Date(row.expires_at) > new Date()) next[row.artifact_id] = row;
            else delete next[row.artifact_id];
          }
          return next;
        });
      })
      .subscribe();

    // periodic cleanup of expired locks in local state
    const interval = setInterval(() => {
      setLocks(prev => {
        const now = Date.now();
        let changed = false;
        const next: Record<string, ArtifactLock> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (new Date(v.expires_at).getTime() > now) next[k] = v;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 15_000);

    return () => { cancelled = true; supabase.removeChannel(ch); clearInterval(interval); };
  }, [sessionId]);

  return locks;
}

/**
 * Acquire (and heartbeat) a lock for a single artifact while the user is editing it.
 * Returns { acquired, owner, expiresAt, requestRelease }.
 */
export function useArtifactLock(artifactId: string | undefined, active: boolean) {
  const [state, setState] = useState<{ acquired: boolean; owner: string | null; expiresAt: string | null }>({
    acquired: false, owner: null, expiresAt: null,
  });
  const heartbeat = useRef<ReturnType<typeof setInterval> | null>(null);

  const acquire = useCallback(async () => {
    if (!artifactId) return;
    const { data, error } = await (supabase as any).rpc("try_acquire_artifact_lock", { _artifact_id: artifactId });
    if (error) { console.warn("[lock] acquire", error); return; }
    setState({
      acquired: !!data?.acquired,
      owner: data?.locked_by ?? null,
      expiresAt: data?.expires_at ?? null,
    });
  }, [artifactId]);

  useEffect(() => {
    if (!active || !artifactId) return;
    acquire();
    heartbeat.current = setInterval(acquire, 30_000);
    return () => {
      if (heartbeat.current) clearInterval(heartbeat.current);
      // best-effort release
      (supabase as any).rpc("release_artifact_lock", { _artifact_id: artifactId }).catch(() => {});
    };
  }, [active, artifactId, acquire]);

  return { ...state, retry: acquire };
}
