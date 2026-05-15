import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChallengeReaction {
  id: string;
  artifact_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface ChallengeVote {
  id: string;
  session_id: string;
  artifact_id: string;
  user_id: string;
  weight: number;
  vote_round: string;
}

export function useChallengeReactions(sessionId: string | undefined) {
  const [reactions, setReactions] = useState<ChallengeReaction[]>([]);
  const [votes, setVotes] = useState<ChallengeVote[]>([]);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  const load = useCallback(async () => {
    if (!sessionId) return;
    // fetch reactions for artifacts in this session via join through artifacts
    const { data: arts } = await (supabase as any)
      .from("challenge_artifacts").select("id").eq("session_id", sessionId);
    const ids = (arts ?? []).map((a: any) => a.id);
    if (ids.length === 0) { setReactions([]); setVotes([]); return; }
    const [{ data: rx }, { data: vx }] = await Promise.all([
      (supabase as any).from("challenge_reactions").select("*").in("artifact_id", ids),
      (supabase as any).from("challenge_votes").select("*").eq("session_id", sessionId),
    ]);
    setReactions((rx ?? []) as ChallengeReaction[]);
    setVotes((vx ?? []) as ChallengeVote[]);
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!sessionId) return;
    const ch = supabase
      .channel(`crx-${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "challenge_reactions" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "challenge_votes", filter: `session_id=eq.${sessionId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [sessionId, load]);

  const toggleReaction = useCallback(async (artifactId: string, emoji: string) => {
    if (!me) return;
    const existing = reactions.find(r => r.artifact_id === artifactId && r.user_id === me && r.emoji === emoji);
    if (existing) {
      const { error } = await (supabase as any).from("challenge_reactions").delete().eq("id", existing.id);
      if (error) toast.error("Réaction non retirée");
    } else {
      const { error } = await (supabase as any).from("challenge_reactions").insert({ artifact_id: artifactId, user_id: me, emoji });
      if (error) toast.error("Réaction impossible");
    }
  }, [reactions, me]);

  const toggleVote = useCallback(async (artifactId: string, weight = 1, round = "default") => {
    if (!me || !sessionId) return;
    const existing = votes.find(v => v.artifact_id === artifactId && v.user_id === me && v.vote_round === round);
    if (existing) {
      const { error } = await (supabase as any).from("challenge_votes").delete().eq("id", existing.id);
      if (error) toast.error("Vote non retiré");
    } else {
      const { error } = await (supabase as any).from("challenge_votes").insert({
        session_id: sessionId, artifact_id: artifactId, user_id: me, weight, vote_round: round,
      });
      if (error) toast.error("Vote impossible");
    }
  }, [votes, me, sessionId]);

  const reactionsByArtifact = useMemo(() => {
    const m: Record<string, ChallengeReaction[]> = {};
    for (const r of reactions) (m[r.artifact_id] ??= []).push(r);
    return m;
  }, [reactions]);

  const votesByArtifact = useMemo(() => {
    const m: Record<string, ChallengeVote[]> = {};
    for (const v of votes) (m[v.artifact_id] ??= []).push(v);
    return m;
  }, [votes]);

  return { reactions, votes, reactionsByArtifact, votesByArtifact, me, toggleReaction, toggleVote, reload: load };
}
