import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const THROTTLE_MS = 30_000;

/**
 * Met à jour profiles.last_seen_at à chaque changement de route,
 * avec un throttle de 30s pour limiter les écritures.
 */
export function useLastSeenTracker() {
  const location = useLocation();
  const { user } = useAuth();
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;
    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) return;
    lastUpdateRef.current = now;

    supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .then(() => {});
  }, [location.pathname, user]);
}
