import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ArtifactKind = "card" | "postit" | "voice" | "question" | "image" | "sticker" | "link_note" | "vote_summary";
export type Criticality = "low" | "medium" | "high" | "critical";

export interface ChallengeArtifact {
  id: string;
  session_id: string;
  workshop_id: string;
  subject_id: string | null;
  slot_id: string | null;
  card_id: string | null;
  parent_artifact_id: string | null;
  kind: ArtifactKind;
  author_id: string;
  is_anonymous: boolean;
  content: string | null;
  content_rich: any;
  transcription: string | null;
  audio_url: string | null;
  audio_duration_ms: number | null;
  emoji: string | null;
  criticality: Criticality | null;
  category: string | null;
  tags: string[];
  ai_meta: Record<string, any>;
  format: string;
  position: { x?: number; y?: number } | null;
  z_index: number;
  color: string | null;
  status: "draft" | "active" | "resolved" | "archived";
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateArtifactInput {
  kind: ArtifactKind;
  content?: string | null;
  emoji?: string | null;
  criticality?: Criticality | null;
  category?: string | null;
  tags?: string[];
  subject_id?: string | null;
  slot_id?: string | null;
  card_id?: string | null;
  parent_artifact_id?: string | null;
  audio_url?: string | null;
  audio_duration_ms?: number | null;
  transcription?: string | null;
  position?: { x: number; y: number } | null;
  color?: string | null;
  is_anonymous?: boolean;
  ai_meta?: Record<string, any>;
}

export function useChallengeArtifacts(sessionId: string | undefined, workshopId: string | undefined) {
  const [artifacts, setArtifacts] = useState<ChallengeArtifact[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("challenge_artifacts")
      .select("*")
      .eq("session_id", sessionId)
      .neq("status", "archived")
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[artifacts]", error);
    } else {
      setArtifacts((data ?? []) as ChallengeArtifact[]);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!sessionId) return;
    const ch = supabase
      .channel(`cart-${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "challenge_artifacts", filter: `session_id=eq.${sessionId}` }, (payload) => {
        setArtifacts((prev) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as ChallengeArtifact;
            if (prev.some(a => a.id === row.id)) return prev;
            return [...prev, row];
          }
          if (payload.eventType === "UPDATE") {
            return prev.map(a => a.id === (payload.new as any).id ? (payload.new as ChallengeArtifact) : a);
          }
          if (payload.eventType === "DELETE") {
            return prev.filter(a => a.id !== (payload.old as any).id);
          }
          return prev;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [sessionId]);

  const create = useCallback(async (input: CreateArtifactInput): Promise<ChallengeArtifact | null> => {
    if (!sessionId || !workshopId) return null;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { toast.error("Non authentifié"); return null; }
    const { data, error } = await (supabase as any)
      .from("challenge_artifacts")
      .insert({
        session_id: sessionId,
        workshop_id: workshopId,
        author_id: u.user.id,
        tags: input.tags ?? [],
        format: "normal",
        ...input,
      })
      .select()
      .single();
    if (error) {
      toast.error("Création impossible");
      console.error(error);
      return null;
    }
    // Fire-and-forget embedding (skipped for voice; transcribe will trigger embed itself)
    if (data?.id && (data.content || "").trim() && data.kind !== "voice") {
      supabase.functions.invoke("challenge-embed", { body: { target: "artifact", id: data.id } })
        .catch((e) => console.warn("embed dispatch", e));
    }
    return data as ChallengeArtifact;
  }, [sessionId, workshopId]);

  const update = useCallback(async (id: string, patch: Partial<ChallengeArtifact>) => {
    const { error } = await (supabase as any)
      .from("challenge_artifacts")
      .update(patch)
      .eq("id", id);
    if (error) { toast.error("Mise à jour impossible"); console.error(error); return; }
    if (typeof patch.content === "string" && patch.content.trim()) {
      supabase.functions.invoke("challenge-embed", { body: { target: "artifact", id } })
        .catch((e) => console.warn("embed dispatch", e));
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await (supabase as any)
      .from("challenge_artifacts")
      .update({ status: "archived" })
      .eq("id", id);
    if (error) { toast.error("Suppression impossible"); }
  }, []);

  const grouped = useMemo(() => {
    const g: Record<ArtifactKind, ChallengeArtifact[]> = {
      card: [], postit: [], voice: [], question: [], image: [], sticker: [], link_note: [], vote_summary: [],
    };
    for (const a of artifacts) g[a.kind]?.push(a);
    return g;
  }, [artifacts]);

  return { artifacts, grouped, loading, create, update, remove, reload: load };
}
