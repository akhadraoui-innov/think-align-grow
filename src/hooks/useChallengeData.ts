import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ChallengeTemplate {
  id: string;
  name: string;
  description: string | null;
  pillar_id: string | null;
  toolkit_id: string;
  difficulty: string | null;
  created_at: string;
}

export interface ChallengeSubject {
  id: string;
  template_id: string;
  title: string;
  description: string | null;
  type: "question" | "challenge" | "context";
  sort_order: number;
}

export interface ChallengeSlot {
  id: string;
  subject_id: string;
  label: string;
  slot_type: "single" | "multi" | "ranked";
  hint: string | null;
  sort_order: number;
  required: boolean;
}

export interface ChallengeResponse {
  id: string;
  workshop_id: string;
  subject_id: string;
  slot_id: string;
  card_id: string;
  user_id: string;
  created_at: string;
}

export interface ChallengeAnalysis {
  id: string;
  workshop_id: string;
  template_id: string;
  analysis: {
    subjects?: Array<{
      title: string;
      maturity: number;
      interpretation: string;
      reflections: string[];
    }>;
    global_maturity?: number;
    summary?: string;
  };
  created_at: string;
}

export function useChallengeTemplates(toolkitId: string | undefined) {
  return useQuery({
    queryKey: ["challenge-templates", toolkitId],
    enabled: !!toolkitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_templates")
        .select("*")
        .eq("toolkit_id", toolkitId!)
        .order("created_at");
      if (error) throw error;
      return data as ChallengeTemplate[];
    },
  });
}

export function useChallengeStructure(templateId: string | undefined) {
  const subjectsQuery = useQuery({
    queryKey: ["challenge-subjects", templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_subjects")
        .select("*")
        .eq("template_id", templateId!)
        .order("sort_order");
      if (error) throw error;
      return data as ChallengeSubject[];
    },
  });

  const subjectIds = subjectsQuery.data?.map(s => s.id) || [];

  const slotsQuery = useQuery({
    queryKey: ["challenge-slots", subjectIds],
    enabled: subjectIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_slots")
        .select("*")
        .in("subject_id", subjectIds)
        .order("sort_order");
      if (error) throw error;
      return data as ChallengeSlot[];
    },
  });

  return {
    subjects: subjectsQuery.data || [],
    slots: slotsQuery.data || [],
    loading: subjectsQuery.isLoading || slotsQuery.isLoading,
  };
}

export function useChallengeResponses(workshopId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [responses, setResponses] = useState<ChallengeResponse[]>([]);

  // Fetch
  useEffect(() => {
    if (!workshopId) return;
    supabase
      .from("challenge_responses")
      .select("*")
      .eq("workshop_id", workshopId)
      .then(({ data }) => {
        if (data) setResponses(data as ChallengeResponse[]);
      });
  }, [workshopId]);

  // Realtime
  useEffect(() => {
    if (!workshopId) return;
    const channel = supabase
      .channel(`challenge-responses-${workshopId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "challenge_responses",
        filter: `workshop_id=eq.${workshopId}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setResponses(prev => [...prev.filter(r => r.id !== (payload.new as ChallengeResponse).id), payload.new as ChallengeResponse]);
        } else if (payload.eventType === "DELETE") {
          setResponses(prev => prev.filter(r => r.id !== (payload.old as any).id));
        } else if (payload.eventType === "UPDATE") {
          setResponses(prev => prev.map(r => r.id === (payload.new as ChallengeResponse).id ? payload.new as ChallengeResponse : r));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workshopId]);

  const placeCard = useCallback(async (slotId: string, subjectId: string, cardId: string) => {
    if (!workshopId || !user) return;
    // Remove existing response for this slot by this user
    await supabase
      .from("challenge_responses")
      .delete()
      .eq("workshop_id", workshopId)
      .eq("slot_id", slotId)
      .eq("user_id", user.id);

    const { error } = await supabase
      .from("challenge_responses")
      .insert({
        workshop_id: workshopId,
        subject_id: subjectId,
        slot_id: slotId,
        card_id: cardId,
        user_id: user.id,
      });
    if (error) toast.error("Erreur lors du placement de la carte");
  }, [workshopId, user]);

  const removeCard = useCallback(async (responseId: string) => {
    const { error } = await supabase
      .from("challenge_responses")
      .delete()
      .eq("id", responseId);
    if (error) toast.error("Erreur lors du retrait de la carte");
  }, []);

  return { responses, placeCard, removeCard };
}

export function useChallengeAnalysis(workshopId: string | undefined) {
  const analysisQuery = useQuery({
    queryKey: ["challenge-analysis", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_analyses")
        .select("*")
        .eq("workshop_id", workshopId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ChallengeAnalysis | null;
    },
  });

  return analysisQuery;
}
