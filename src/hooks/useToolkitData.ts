import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DbPillar = Tables<"pillars">;
export type DbCard = Tables<"cards">;
export type DbGamePlan = Tables<"game_plans">;
export type DbGamePlanStep = Tables<"game_plan_steps">;
export type DbQuizQuestion = Tables<"quiz_questions">;

const TOOLKIT_SLUG = "bootstrap-in-business";

export function useToolkit() {
  return useQuery({
    queryKey: ["toolkit", TOOLKIT_SLUG],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("toolkits")
        .select("*")
        .eq("slug", TOOLKIT_SLUG)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function usePillars() {
  const { data: toolkit } = useToolkit();
  return useQuery({
    queryKey: ["pillars", toolkit?.id],
    enabled: !!toolkit?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pillars")
        .select("*")
        .eq("toolkit_id", toolkit!.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useCards() {
  const { data: pillars } = usePillars();
  return useQuery({
    queryKey: ["cards", pillars?.map(p => p.id)],
    enabled: !!pillars?.length,
    queryFn: async () => {
      const pillarIds = pillars!.map(p => p.id);
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .in("pillar_id", pillarIds)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useQuizQuestions() {
  const { data: pillars } = usePillars();
  return useQuery({
    queryKey: ["quiz_questions", pillars?.map(p => p.id)],
    enabled: !!pillars?.length,
    queryFn: async () => {
      const pillarIds = pillars!.map(p => p.id);
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .in("pillar_id", pillarIds)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useGamePlans() {
  const { data: toolkit } = useToolkit();
  return useQuery({
    queryKey: ["game_plans", toolkit?.id],
    enabled: !!toolkit?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_plans")
        .select("*")
        .eq("toolkit_id", toolkit!.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useGamePlanSteps(planId: string | null) {
  return useQuery({
    queryKey: ["game_plan_steps", planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_plan_steps")
        .select("*, cards(*)")
        .eq("game_plan_id", planId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

// Pillar metadata helpers
const PILLAR_ICON_MAP: Record<string, string> = {
  thinking: "Brain",
  business: "Briefcase",
  innovation: "Lightbulb",
  finance: "Wallet",
  indicators: "BarChart3",
  building: "Hammer",
  managing: "Users",
  gouvernance: "Shield",
  profitability: "TrendingUp",
  fundraising: "Heart",
};

const PILLAR_GRADIENT_MAP: Record<string, string> = {
  thinking: "thinking",
  business: "business",
  innovation: "innovation",
  finance: "finance",
  marketing: "marketing",
  operations: "primary",
  team: "team",
  legal: "accent",
  growth: "finance",
  impact: "impact",
};

export function getPillarGradient(slug: string): string {
  return PILLAR_GRADIENT_MAP[slug] || "primary";
}

export function getPillarIconName(slug: string): string {
  return PILLAR_ICON_MAP[slug] || "Circle";
}

// Phase label mapping
export const PHASE_LABELS: Record<string, string> = {
  foundations: "Fondations",
  model: "Modèle",
  growth: "Croissance",
  execution: "Exécution",
};
