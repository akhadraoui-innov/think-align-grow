import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveOrg } from "@/contexts/OrgContext";

export function useUCMQuotas() {
  const { activeOrgId } = useActiveOrg();
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["ucm-quota-usage", activeOrgId, period],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("ucm_quota_usage")
        .select("*")
        .eq("organization_id", activeOrgId!)
        .eq("period", period)
        .maybeSingle();
      return data;
    },
  });

  const { data: org } = useQuery({
    queryKey: ["org-ucm-quotas", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("ucm_quotas")
        .eq("id", activeOrgId!)
        .single();
      return data?.ucm_quotas as Record<string, number> | null;
    },
  });

  const limits = org || {};
  const u = usage || { uc_generations: 0, analysis_generations: 0, exports: 0, total_tokens: 0 };

  return {
    usage: u,
    limits,
    loading: usageLoading,
    canGenerate: !limits.max_uc_generations || (u as any).uc_generations < limits.max_uc_generations,
    canAnalyze: !limits.max_analyses_per_month || (u as any).analysis_generations < limits.max_analyses_per_month,
    canExport: !limits.max_exports_per_month || (u as any).exports < limits.max_exports_per_month,
  };
}
