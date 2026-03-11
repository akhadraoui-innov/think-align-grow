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

  // ── Monthly credit consumption (last 6 months) ──
  const monthlyCreditsQuery = useQuery({
    queryKey: ["admin-billing-monthly-credits"],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await supabase
        .from("credit_transactions")
        .select("amount, created_at, type")
        .gte("created_at", sixMonthsAgo.toISOString());
      if (error) throw error;

      const monthMap: Record<string, { earned: number; spent: number }> = {};
      for (const t of data ?? []) {
        const key = t.created_at.slice(0, 7); // YYYY-MM
        if (!monthMap[key]) monthMap[key] = { earned: 0, spent: 0 };
        if (t.amount > 0) monthMap[key].earned += t.amount;
        else monthMap[key].spent += Math.abs(t.amount);
      }

      // Ensure all 6 months present
      const result = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toISOString().slice(0, 7);
        const label = d.toLocaleDateString("fr-FR", { month: "short" });
        result.push({
          month: label,
          earned: monthMap[key]?.earned ?? 0,
          spent: monthMap[key]?.spent ?? 0,
        });
      }
      return result;
    },
  });

  // ── Credits by organization ──
  const orgCreditsQuery = useQuery({
    queryKey: ["admin-billing-org-credits"],
    queryFn: async () => {
      // Get all credit transactions with user_id
      const { data: transactions, error: txErr } = await supabase
        .from("credit_transactions")
        .select("amount, user_id");
      if (txErr) throw txErr;

      // Get org memberships
      const { data: members, error: memErr } = await supabase
        .from("organization_members")
        .select("user_id, organization_id");
      if (memErr) throw memErr;

      // Get orgs
      const { data: orgsList, error: orgErr } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name");
      if (orgErr) throw orgErr;

      // Map user -> org(s)
      const userOrg: Record<string, string[]> = {};
      for (const m of members ?? []) {
        if (!userOrg[m.user_id]) userOrg[m.user_id] = [];
        userOrg[m.user_id].push(m.organization_id);
      }

      // Aggregate by org
      const orgStats: Record<string, { earned: number; spent: number }> = {};
      for (const t of transactions ?? []) {
        const orgIds = userOrg[t.user_id] ?? [];
        for (const oid of orgIds) {
          if (!orgStats[oid]) orgStats[oid] = { earned: 0, spent: 0 };
          if (t.amount > 0) orgStats[oid].earned += t.amount;
          else orgStats[oid].spent += Math.abs(t.amount);
        }
      }

      return (orgsList ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        earned: orgStats[o.id]?.earned ?? 0,
        spent: orgStats[o.id]?.spent ?? 0,
        balance: (orgStats[o.id]?.earned ?? 0) - (orgStats[o.id]?.spent ?? 0),
      })).filter((o) => o.earned > 0 || o.spent > 0);
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

    monthlyCredits: monthlyCreditsQuery.data ?? [],
    monthlyCreditsLoading: monthlyCreditsQuery.isLoading,

    orgCredits: orgCreditsQuery.data ?? [],
    orgCreditsLoading: orgCreditsQuery.isLoading,

    orgs: orgsQuery.data ?? [],
  };
}
