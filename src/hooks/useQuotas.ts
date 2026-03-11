import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveOrg } from "@/contexts/OrgContext";

interface Quotas {
  max_workshops: number | null;
  max_challenges: number | null;
  max_ai_calls: number | null;
  max_members: number | null;
}

interface Usage {
  workshops: number;
  challenges: number;
}

interface QuotaResult {
  quotas: Quotas;
  usage: Usage;
  loading: boolean;
  canCreateWorkshop: boolean;
  canCreateChallenge: boolean;
  hasQuotas: boolean;
}

export function useQuotas(): QuotaResult {
  const { activeOrgId } = useActiveOrg();

  // Fetch org subscription + plan quotas
  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ["org-quotas", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_subscriptions")
        .select("plan_id, status, subscription_plans(quotas)")
        .eq("organization_id", activeOrgId!)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch current usage counts
  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ["org-usage", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { count: workshopCount } = await supabase
        .from("workshops")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", activeOrgId!)
        .neq("status", "completed");

      const { count: challengeCount } = await supabase
        .from("workshops")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", activeOrgId!)
        .neq("status", "completed")
        .eq("config->>type", "challenge");

      return {
        workshops: workshopCount ?? 0,
        challenges: challengeCount ?? 0,
      };
    },
  });

  const rawQuotas = (subData as any)?.subscription_plans?.quotas as Record<string, any> | undefined;

  const quotas: Quotas = {
    max_workshops: rawQuotas?.max_workshops ?? null,
    max_challenges: rawQuotas?.max_challenges ?? null,
    max_ai_calls: rawQuotas?.max_ai_calls ?? null,
    max_members: rawQuotas?.max_members ?? null,
  };

  const usage: Usage = usageData ?? { workshops: 0, challenges: 0 };
  const hasQuotas = !!subData;

  return {
    quotas,
    usage,
    loading: subLoading || usageLoading,
    canCreateWorkshop: !hasQuotas || quotas.max_workshops === null || usage.workshops < quotas.max_workshops,
    canCreateChallenge: !hasQuotas || quotas.max_challenges === null || usage.challenges < quotas.max_challenges,
    hasQuotas,
  };
}
