import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminStats {
  orgCount: number;
  userCount: number;
  publishedToolkits: number;
  totalCards: number;
  workshopCountThisMonth: number;
  completedChallenges: number;
  creditsConsumed: number;
  quizCount: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entity_type: string | null;
    created_at: string;
    user_id: string;
  }>;
  weeklyWorkshops: Array<{ week: string; count: number }>;
  roleDistribution: Array<{ role: string; count: number }>;
  topOrgs: Array<{ name: string; workshopCount: number }>;
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [orgs, profiles, workshopsMonth, credits, activity, toolkits, cards, quizResults, allRoles, allWorkshops] = await Promise.all([
        supabase.from("organizations").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("workshops").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth),
        supabase.from("credit_transactions").select("amount").eq("type", "spent"),
        supabase.from("activity_logs").select("id, action, entity_type, created_at, user_id").order("created_at", { ascending: false }).limit(10),
        supabase.from("toolkits").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("cards").select("id", { count: "exact", head: true }),
        supabase.from("quiz_results").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("role"),
        supabase.from("workshops").select("created_at, organization_id, organizations(name)"),
      ]);

      const totalSpent = (credits.data || []).reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Weekly workshops (real data, last 12 weeks)
      const weeks: Array<{ week: string; count: number }> = [];
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - i * 7);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const label = `S${String(weekStart.getDate()).padStart(2, "0")}/${String(weekStart.getMonth() + 1).padStart(2, "0")}`;
        const count = (allWorkshops.data || []).filter(w => {
          const d = new Date(w.created_at);
          return d >= weekStart && d < weekEnd;
        }).length;
        weeks.push({ week: label, count });
      }

      // Role distribution
      const roleCounts: Record<string, number> = {};
      (allRoles.data || []).forEach((r: any) => {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
      });
      const roleDistribution = Object.entries(roleCounts)
        .map(([role, count]) => ({ role, count }))
        .sort((a, b) => b.count - a.count);

      // Top orgs by workshop count
      const orgWorkshops: Record<string, { name: string; count: number }> = {};
      (allWorkshops.data || []).forEach((w: any) => {
        if (w.organization_id && w.organizations?.name) {
          if (!orgWorkshops[w.organization_id]) {
            orgWorkshops[w.organization_id] = { name: w.organizations.name, count: 0 };
          }
          orgWorkshops[w.organization_id].count++;
        }
      });
      const topOrgs = Object.values(orgWorkshops)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(o => ({ name: o.name, workshopCount: o.count }));

      // Completed challenges = challenge_analyses count (proxy)
      const { count: challengeCount } = await supabase.from("challenge_analyses").select("id", { count: "exact", head: true });

      return {
        orgCount: orgs.count ?? 0,
        userCount: profiles.count ?? 0,
        publishedToolkits: toolkits.count ?? 0,
        totalCards: cards.count ?? 0,
        workshopCountThisMonth: workshopsMonth.count ?? 0,
        completedChallenges: challengeCount ?? 0,
        creditsConsumed: totalSpent,
        quizCount: quizResults.count ?? 0,
        recentActivity: activity.data || [],
        weeklyWorkshops: weeks,
        roleDistribution,
        topOrgs,
      };
    },
  });
}
