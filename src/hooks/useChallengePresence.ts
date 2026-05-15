import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PresenceUser {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  color: string;
  cursor: { x: number; y: number } | null;
  viewing_subject_id: string | null;
  editing_artifact_id: string | null;
  last_active: number;
}

const COLORS = ["#f97316","#10b981","#6366f1","#ec4899","#06b6d4","#eab308","#a855f7","#ef4444"];
function hashColor(uid: string) {
  let h = 0; for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

export function useChallengePresence(sessionId: string | undefined) {
  const { user } = useAuth();
  const [peers, setPeers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const stateRef = useRef<Partial<PresenceUser>>({});
  const lastTrack = useRef(0);

  useEffect(() => {
    if (!sessionId || !user) return;

    const me: PresenceUser = {
      user_id: user.id,
      display_name: (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "Anonyme",
      avatar_url: (user.user_metadata?.avatar_url as string) || null,
      color: hashColor(user.id),
      cursor: null,
      viewing_subject_id: null,
      editing_artifact_id: null,
      last_active: Date.now(),
    };
    stateRef.current = me;

    const ch = supabase.channel(`presence-${sessionId}`, {
      config: { presence: { key: user.id } },
    });
    channelRef.current = ch;

    ch.on("presence", { event: "sync" }, () => {
      const stateMap = ch.presenceState<PresenceUser>();
      const list: PresenceUser[] = [];
      for (const arr of Object.values(stateMap)) {
        const last = (arr as any)[arr.length - 1];
        if (last && last.user_id !== user.id) list.push(last as PresenceUser);
      }
      setPeers(list);
    });

    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") await ch.track(stateRef.current);
    });

    return () => { supabase.removeChannel(ch); channelRef.current = null; };
  }, [sessionId, user]);

  const update = useCallback((patch: Partial<PresenceUser>) => {
    stateRef.current = { ...stateRef.current, ...patch, last_active: Date.now() };
    const now = Date.now();
    if (now - lastTrack.current < 80) return; // throttle
    lastTrack.current = now;
    channelRef.current?.track(stateRef.current).catch(() => {});
  }, []);

  return { peers, update, me: user?.id ?? null };
}
