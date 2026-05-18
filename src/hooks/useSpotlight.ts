import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SpotlightState {
  artifactId: string | null;
  subjectId: string | null;
  slotId: string | null;
}

/**
 * Spotlight state lives on challenge_sessions row (already updated via useChallengeSession realtime).
 * This hook only exposes the setters.
 */
export function useSpotlight(sessionId: string | null | undefined) {
  const setSpotlight = useCallback(async (patch: Partial<{ artifactId: string | null; subjectId: string | null; slotId: string | null }>) => {
    if (!sessionId) return;
    const upd: any = {};
    if ("artifactId" in patch) upd.spotlight_artifact_id = patch.artifactId;
    if ("subjectId" in patch) upd.spotlight_subject_id = patch.subjectId;
    if ("slotId" in patch) upd.spotlight_slot_id = patch.slotId;
    const { error } = await (supabase as any).from("challenge_sessions").update(upd).eq("id", sessionId);
    if (error) toast.error("Spotlight error", { description: error.message });
  }, [sessionId]);

  const clear = useCallback(() => setSpotlight({ artifactId: null, subjectId: null, slotId: null }), [setSpotlight]);

  return { setSpotlight, clear };
}
