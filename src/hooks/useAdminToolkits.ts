import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Toolkit = Tables<"toolkits">;

export function useAdminToolkits() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["admin-toolkits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("toolkits")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Get pillar + card counts per toolkit
  const counts = useQuery({
    queryKey: ["admin-toolkit-counts"],
    queryFn: async () => {
      const { data: pillars, error: e1 } = await supabase.from("pillars").select("id, toolkit_id");
      if (e1) throw e1;
      const { data: cards, error: e2 } = await supabase.from("cards").select("id, pillar_id");
      if (e2) throw e2;

      const pillarsByToolkit: Record<string, number> = {};
      const pillarToToolkit: Record<string, string> = {};
      for (const p of pillars || []) {
        pillarsByToolkit[p.toolkit_id] = (pillarsByToolkit[p.toolkit_id] || 0) + 1;
        pillarToToolkit[p.id] = p.toolkit_id;
      }

      const cardsByToolkit: Record<string, number> = {};
      for (const c of cards || []) {
        const tid = pillarToToolkit[c.pillar_id];
        if (tid) cardsByToolkit[tid] = (cardsByToolkit[tid] || 0) + 1;
      }

      return { pillarsByToolkit, cardsByToolkit };
    },
  });

  const create = useMutation({
    mutationFn: async (input: TablesInsert<"toolkits">) => {
      const { data, error } = await supabase.from("toolkits").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-toolkits"] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...fields }: TablesUpdate<"toolkits"> & { id: string }) => {
      const { error } = await supabase.from("toolkits").update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-toolkits"] });
      qc.invalidateQueries({ queryKey: ["admin-toolkit-detail"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("toolkits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-toolkits"] }),
  });

  const generateWithAI = useMutation({
    mutationFn: async (input: {
      name: string;
      slug: string;
      icon_emoji: string;
      description: string;
      target_audience: string;
      objectives: string;
      pillar_count: number;
      cards_per_pillar: number;
      language: string;
      difficulty_level: string;
      generate_quiz: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke("generate-toolkit", { body: input });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { toolkit_id: string; pillars_count: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-toolkits"] });
      qc.invalidateQueries({ queryKey: ["admin-toolkit-counts"] });
    },
  });

  return {
    toolkits: list.data || [],
    isLoading: list.isLoading,
    counts: counts.data || { pillarsByToolkit: {}, cardsByToolkit: {} },
    create,
    update,
    remove,
    generateWithAI,
  };
}

export function useAdminToolkitDetail(id: string | undefined) {
  const qc = useQueryClient();

  const toolkit = useQuery({
    queryKey: ["admin-toolkit-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("toolkits").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const pillars = useQuery({
    queryKey: ["admin-toolkit-pillars", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("pillars").select("*").eq("toolkit_id", id!).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const cards = useQuery({
    queryKey: ["admin-toolkit-cards", id],
    enabled: !!id,
    queryFn: async () => {
      const pillarIds = pillars.data?.map((p) => p.id) || [];
      if (!pillarIds.length) return [];
      const { data, error } = await supabase.from("cards").select("*").in("pillar_id", pillarIds).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const challengeTemplates = useQuery({
    queryKey: ["admin-toolkit-challenges", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("challenge_templates").select("*, challenge_subjects(*, challenge_slots(*))").eq("toolkit_id", id!).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const gamePlans = useQuery({
    queryKey: ["admin-toolkit-gameplans", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("game_plans").select("*, game_plan_steps(*)").eq("toolkit_id", id!).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const quizQuestions = useQuery({
    queryKey: ["admin-toolkit-quiz", id],
    enabled: !!pillars.data?.length,
    queryFn: async () => {
      const pillarIds = pillars.data!.map((p) => p.id);
      const { data, error } = await supabase.from("quiz_questions").select("*").in("pillar_id", pillarIds).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const orgToolkits = useQuery({
    queryKey: ["admin-toolkit-orgs", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("organization_toolkits").select("*, organizations(id, name, slug, primary_color)").eq("toolkit_id", id!);
      if (error) throw error;
      return data;
    },
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin-toolkit-detail", id] });
    qc.invalidateQueries({ queryKey: ["admin-toolkit-pillars", id] });
    qc.invalidateQueries({ queryKey: ["admin-toolkit-cards", id] });
    qc.invalidateQueries({ queryKey: ["admin-toolkit-challenges", id] });
    qc.invalidateQueries({ queryKey: ["admin-toolkit-gameplans", id] });
    qc.invalidateQueries({ queryKey: ["admin-toolkit-quiz", id] });
    qc.invalidateQueries({ queryKey: ["admin-toolkit-orgs", id] });
  };

  return {
    toolkit: toolkit.data,
    pillars: pillars.data || [],
    cards: cards.data || [],
    challengeTemplates: challengeTemplates.data || [],
    gamePlans: gamePlans.data || [],
    quizQuestions: quizQuestions.data || [],
    orgToolkits: orgToolkits.data || [],
    isLoading: toolkit.isLoading,
    invalidateAll,
  };
}
