import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChallengeSessionRow {
  id: string;
  workshop_id: string;
  template_id: string;
  organization_id: string | null;
  status: "draft" | "briefing" | "running" | "synthesis" | "closed" | "archived";
  current_subject_id: string | null;
  config: Record<string, any>;
  facilitator_notes: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChallengeSessionContextRow {
  id: string;
  session_id: string;
  scope: string | null;
  goals: string | null;
  hypotheses: string | null;
  constraints: string | null;
  stakeholders: any[];
  context_data: Record<string, any>;
  attachments: any[];
  updated_at: string;
}

/**
 * Loads (or creates if host) the enriched session attached to a workshop.
 */
export function useChallengeSession(workshopId: string | undefined, templateId: string | undefined, isHost: boolean) {
  const [session, setSession] = useState<ChallengeSessionRow | null>(null);
  const [context, setContext] = useState<ChallengeSessionContextRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workshopId || !templateId) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("challenge_sessions")
        .select("*")
        .eq("workshop_id", workshopId)
        .maybeSingle();
      if (error) throw error;

      let row: ChallengeSessionRow | null = data;
      if (!row && isHost) {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        if (!uid) throw new Error("not_authenticated");
        const { data: created, error: insErr } = await (supabase as any)
          .from("challenge_sessions")
          .insert({
            workshop_id: workshopId,
            template_id: templateId,
            status: "briefing",
            created_by: uid,
          })
          .select()
          .single();
        if (insErr) throw insErr;
        row = created;
      }
      setSession(row);

      if (row) {
        const { data: ctxData } = await (supabase as any)
          .from("challenge_session_context")
          .select("*")
          .eq("session_id", row.id)
          .maybeSingle();
        setContext(ctxData ?? null);
      }
    } catch (e: any) {
      console.error("[useChallengeSession]", e);
      setError(e?.message || "load_failed");
    } finally {
      setLoading(false);
    }
  }, [workshopId, templateId, isHost]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime subscription on session row
  useEffect(() => {
    if (!session?.id) return;
    const ch = supabase
      .channel(`csess-${session.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "challenge_sessions", filter: `id=eq.${session.id}` }, (payload) => {
        setSession(payload.new as any);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "challenge_session_context", filter: `session_id=eq.${session.id}` }, (payload) => {
        if (payload.eventType === "DELETE") setContext(null);
        else setContext(payload.new as any);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session?.id]);

  const setStatus = useCallback(async (status: ChallengeSessionRow["status"]) => {
    if (!session) return;
    const { error } = await (supabase as any)
      .from("challenge_sessions")
      .update({ status, ...(status === "running" && !session.started_at ? { started_at: new Date().toISOString() } : {}), ...(status === "closed" ? { ended_at: new Date().toISOString() } : {}) })
      .eq("id", session.id);
    if (error) toast.error("Impossible de changer le statut");
  }, [session]);

  const upsertContext = useCallback(async (patch: Partial<ChallengeSessionContextRow>) => {
    if (!session) return;
    // Whitelist explicite : ne JAMAIS renvoyer embedding/embedding_input/id/updated_at
    const safe: any = {
      session_id: session.id,
      scope: patch.scope ?? context?.scope ?? null,
      goals: patch.goals ?? context?.goals ?? null,
      hypotheses: patch.hypotheses ?? context?.hypotheses ?? null,
      constraints: patch.constraints ?? context?.constraints ?? null,
      stakeholders: patch.stakeholders ?? context?.stakeholders ?? [],
      context_data: patch.context_data ?? context?.context_data ?? {},
      attachments: patch.attachments ?? context?.attachments ?? [],
    };
    const { data, error } = await (supabase as any)
      .from("challenge_session_context")
      .upsert(safe, { onConflict: "session_id" })
      .select()
      .single();
    if (error) {
      toast.error("Sauvegarde du contexte impossible");
      console.error(error);
      return;
    }
    // Re-embed asynchrone
    if (data?.id) {
      supabase.functions.invoke("challenge-embed", { body: { target: "context", id: data.id } })
        .catch((e) => console.warn("embed ctx", e));
    }
  }, [session, context]);

  return { session, context, loading, error, setStatus, upsertContext, reload: load };
}
