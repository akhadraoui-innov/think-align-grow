import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RagSourceType = "artifact" | "card" | "subject" | "slot" | "briefing" | "thread" | "synthesis";

export interface RagMatch {
  id: string;
  source_type: RagSourceType;
  source_id: string;
  content: string;
  metadata: Record<string, any> | null;
  similarity: number;
}

export function useChallengeRAG(sessionId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<RagMatch[]>([]);

  const search = useCallback(async (query: string, opts?: { kinds?: RagSourceType[]; k?: number }) => {
    if (!sessionId || !query.trim()) return [];
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke("challenge-rag", {
        body: { session_id: sessionId, query, kinds: opts?.kinds ?? null, k: opts?.k ?? 8 },
      });
      if (err) throw err;
      if (!data?.ok) throw new Error(data?.error || "rag failed");
      const m = (data.matches || []) as RagMatch[];
      setMatches(m);
      return m;
    } catch (e: any) {
      setError(String(e?.message || e));
      return [];
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  return { search, matches, loading, error };
}
