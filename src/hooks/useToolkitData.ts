import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DbPillar = Tables<"pillars">;
export type DbCard = Tables<"cards">;
export type DbGamePlan = Tables<"game_plans">;
export type DbGamePlanStep = Tables<"game_plan_steps">;
export type DbQuizQuestion = Tables<"quiz_questions">;

/**
 * Fetch a toolkit by slug, or the first published toolkit if no slug provided.
 */
export function useToolkit(slug?: string) {
  return useQuery({
    queryKey: ["toolkit", slug ?? "__first_published"],
    queryFn: async () => {
      if (slug) {
        const { data, error } = await supabase
          .from("toolkits")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();
        if (error) throw error;
        return data;
      }
      // No slug → first published toolkit
      const { data, error } = await supabase
        .from("toolkits")
        .select("*")
        .eq("status", "published")
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function usePillars(toolkitIdOverride?: string) {
  const { data: toolkit } = useToolkit();
  const toolkitId = toolkitIdOverride || toolkit?.id;
  return useQuery({
    queryKey: ["pillars", toolkitId],
    enabled: !!toolkitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pillars")
        .select("*")
        .eq("toolkit_id", toolkitId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useCards(toolkitIdOverride?: string) {
  const { data: pillars } = usePillars(toolkitIdOverride);
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

// ----- Visual helpers -----
// Fallback maps for legacy slugs; DB values (pillar.color, pillar.icon_name) take priority.

const PILLAR_ICON_FALLBACK: Record<string, string> = {
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

const PILLAR_GRADIENT_FALLBACK: Record<string, string> = {
  thinking: "thinking",
  business: "business",
  innovation: "innovation",
  finance: "finance",
  indicators: "marketing",
  building: "building",
  managing: "team",
  gouvernance: "gouvernance",
  profitability: "finance",
  fundraising: "impact",
};

/**
 * Returns a gradient TOKEN for a pillar (e.g. "thinking", "business").
 * Always returns a valid CSS token — never a raw hex value.
 */
export function getPillarGradient(slug: string, dbColor?: string | null): string {
  // Only use dbColor if it's a known token (not a hex)
  if (dbColor && !dbColor.startsWith('#')) return dbColor;
  return PILLAR_GRADIENT_FALLBACK[slug] || "primary";
}

/**
 * Returns a ready-to-use CSS color string for a pillar.
 * If the DB stores a hex (#8B5CF6), returns it directly.
 * Otherwise, returns hsl(var(--pillar-<token>)).
 */
export function getPillarCssColor(slug: string, dbColor?: string | null): string {
  if (dbColor?.startsWith('#')) return dbColor;
  const token = PILLAR_GRADIENT_FALLBACK[slug] || "primary";
  return `hsl(var(--pillar-${token}))`;
}

/**
 * Returns a CSS color with alpha/opacity.
 * For hex colors: appends hex alpha (e.g. #8B5CF626).
 * For token colors: uses hsl(var(--pillar-token) / alpha).
 * @param alpha - opacity from 0 to 1
 */
export function getPillarCssColorAlpha(slug: string, dbColor: string | null | undefined, alpha: number): string {
  if (dbColor?.startsWith('#')) {
    const hexAlpha = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return `${dbColor}${hexAlpha}`;
  }
  const token = PILLAR_GRADIENT_FALLBACK[slug] || "primary";
  return `hsl(var(--pillar-${token}) / ${alpha})`;
}

/**
 * Returns an icon name for a pillar.
 * Prefers pillar.icon_name from DB, falls back to slug-based map, then "Circle".
 */
export function getPillarIconName(slug: string, dbIconName?: string | null): string {
  if (dbIconName) return dbIconName;
  return PILLAR_ICON_FALLBACK[slug] || "Circle";
}

// Phase label mapping (kept as reference; phases are enum-based in DB)
export const PHASE_LABELS: Record<string, string> = {
  foundations: "Fondations",
  model: "Modèle",
  growth: "Croissance",
  execution: "Exécution",
};
