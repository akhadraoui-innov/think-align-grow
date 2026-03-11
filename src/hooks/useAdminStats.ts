import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminStats {
  orgCount: number;
  userCount: number;
  workshopCountThisMonth: number;
  creditsConsumed: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entity_type: string | null;
    created_at: string;
    user_id: string;
  }>;
  weeklyWorkshops: Array<{ week: string; count: number }>;
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [orgs, profiles, workshopsMonth, credits, activity] = await Promise.all([
        supabase.from("organizations").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("workshops").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth),
        supabase.from("credit_transactions").select("amount").eq("type", "spent"),
        supabase.from("activity_logs").select("id, action, entity_type, created_at, user_id").order("created_at", { ascending: false }).limit(10),
      ]);

      const totalSpent = (credits.data || []).reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Build weekly workshop data for last 12 weeks
      const weeks: Array<{ week: string; count: number }> = [];
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const label = `S${String(weekStart.getDate()).padStart(2, "0")}/${String(weekStart.getMonth() + 1).padStart(2, "0")}`;
        weeks.push({ week: label, count: 0 });
      }

      return {
        orgCount: orgs.count ?? 0,
        userCount: profiles.count ?? 0,
        workshopCountThisMonth: workshopsMonth.count ?? 0,
        creditsConsumed: totalSpent,
        recentActivity: activity.data || [],
        weeklyWorkshops: weeks,
      };
    },
  });
}
