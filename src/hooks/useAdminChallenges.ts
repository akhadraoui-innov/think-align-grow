import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export function useAdminChallenges() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["admin-challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_templates")
        .select("*, toolkits(id, name, icon_emoji), challenge_subjects(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const analyses = useQuery({
    queryKey: ["admin-challenge-analyses-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_analyses")
        .select("id, template_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const a of data || []) {
        counts[a.template_id] = (counts[a.template_id] || 0) + 1;
      }
      return counts;
    },
  });

  const create = useMutation({
    mutationFn: async (input: TablesInsert<"challenge_templates">) => {
      const { data, error } = await supabase.from("challenge_templates").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-challenges"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("challenge_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-challenges"] }),
  });

  return {
    templates: list.data || [],
    sessionCounts: analyses.data || {},
    isLoading: list.isLoading,
    create,
    remove,
  };
}

export function useAdminChallengeDetail(id: string | undefined) {
  const qc = useQueryClient();

  const template = useQuery({
    queryKey: ["admin-challenge-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_templates")
        .select("*, toolkits(id, name, icon_emoji), pillars(id, name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const subjects = useQuery({
    queryKey: ["admin-challenge-subjects", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_subjects")
        .select("*, challenge_slots(*)")
        .eq("template_id", id!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const analyses = useQuery({
    queryKey: ["admin-challenge-analyses", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_analyses")
        .select("*, workshops(id, name, status, created_at, code)")
        .eq("template_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const sessions = useQuery({
    queryKey: ["admin-challenge-sessions", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: analysisData, error: e1 } = await supabase
        .from("challenge_analyses")
        .select("workshop_id")
        .eq("template_id", id!);
      if (e1) throw e1;
      const workshopIds = [...new Set((analysisData || []).map((a) => a.workshop_id))];
      if (!workshopIds.length) return [];
      const { data, error } = await supabase
        .from("workshops")
        .select("*, organizations(id, name, logo_url)")
        .in("id", workshopIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const sessionExtras = useQuery({
    queryKey: ["admin-challenge-session-extras", id],
    enabled: !!id && !!sessions.data?.length,
    queryFn: async () => {
      const workshopIds = sessions.data!.map((w) => w.id);

      const [participantsRes, responsesRes] = await Promise.all([
        supabase.from("workshop_participants").select("workshop_id").in("workshop_id", workshopIds),
        supabase.from("challenge_responses").select("workshop_id").in("workshop_id", workshopIds),
      ]);

      const participantCounts: Record<string, number> = {};
      for (const p of participantsRes.data || []) {
        participantCounts[p.workshop_id] = (participantCounts[p.workshop_id] || 0) + 1;
      }

      const responseCounts: Record<string, number> = {};
      for (const r of responsesRes.data || []) {
        responseCounts[r.workshop_id] = (responseCounts[r.workshop_id] || 0) + 1;
      }

      return { participantCounts, responseCounts };
    },
  });

  const toolkits = useQuery({
    queryKey: ["admin-all-toolkits-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("toolkits").select("id, name, icon_emoji").order("name");
      if (error) throw error;
      return data;
    },
  });

  const pillarsByToolkit = useQuery({
    queryKey: ["admin-pillars-for-toolkit", template.data?.toolkit_id],
    enabled: !!template.data?.toolkit_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pillars")
        .select("id, name")
        .eq("toolkit_id", template.data!.toolkit_id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin-challenge-detail", id] });
    qc.invalidateQueries({ queryKey: ["admin-challenge-subjects", id] });
    qc.invalidateQueries({ queryKey: ["admin-challenge-analyses", id] });
    qc.invalidateQueries({ queryKey: ["admin-challenge-sessions", id] });
    qc.invalidateQueries({ queryKey: ["admin-challenges"] });
  };

  return {
    template: template.data,
    subjects: subjects.data || [],
    analyses: analyses.data || [],
    sessions: sessions.data || [],
    toolkits: toolkits.data || [],
    pillars: pillarsByToolkit.data || [],
    isLoading: template.isLoading,
    invalidateAll,
  };
}
