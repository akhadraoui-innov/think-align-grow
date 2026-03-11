import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlanInput {
  name: string;
  price_monthly: number | null;
  price_yearly: number | null;
  quotas: Record<string, any>;
  features: Record<string, any>;
  is_active: boolean;
  sort_order: number;
}

interface SubscriptionInput {
  organization_id: string;
  plan_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
}

export function useAdminBilling() {
  const qc = useQueryClient();

  // ── Plans ──
  const plansQuery = useQuery({
    queryKey: ["admin-billing-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const createPlan = useMutation({
    mutationFn: async (input: PlanInput) => {
      const { error } = await supabase.from("subscription_plans").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-billing-plans"] });
      toast.success("Plan créé");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, ...input }: PlanInput & { id: string }) => {
      const { error } = await supabase.from("subscription_plans").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-billing-plans"] });
      toast.success("Plan mis à jour");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subscription_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-billing-plans"] });
      toast.success("Plan supprimé");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Subscriptions ──
  const subscriptionsQuery = useQuery({
    queryKey: ["admin-billing-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_subscriptions")
        .select("*, organizations(id, name, slug), subscription_plans(id, name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createSubscription = useMutation({
    mutationFn: async (input: SubscriptionInput) => {
      const { error } = await supabase.from("organization_subscriptions").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-billing-subscriptions"] });
      toast.success("Abonnement créé");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateSubscription = useMutation({
    mutationFn: async ({ id, ...input }: Partial<SubscriptionInput> & { id: string }) => {
      const { error } = await supabase.from("organization_subscriptions").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-billing-subscriptions"] });
      toast.success("Abonnement mis à jour");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Credit stats ──
  const creditStatsQuery = useQuery({
    queryKey: ["admin-billing-credit-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("amount, type, user_id");
      if (error) throw error;

      let totalEarned = 0;
      let totalSpent = 0;
      for (const t of data) {
        if (t.amount > 0) totalEarned += t.amount;
        else totalSpent += Math.abs(t.amount);
      }

      return { totalEarned, totalSpent, balance: totalEarned - totalSpent, count: data.length };
    },
  });

  // ── Orgs list (for subscription dialog) ──
  const orgsQuery = useQuery({
    queryKey: ["admin-billing-orgs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  return {
    plans: plansQuery.data ?? [],
    plansLoading: plansQuery.isLoading,
    createPlan,
    updatePlan,
    deletePlan,

    subscriptions: subscriptionsQuery.data ?? [],
    subscriptionsLoading: subscriptionsQuery.isLoading,
    createSubscription,
    updateSubscription,

    creditStats: creditStatsQuery.data,
    creditStatsLoading: creditStatsQuery.isLoading,

    orgs: orgsQuery.data ?? [],
  };
}
