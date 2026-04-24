import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type OrgRole = Database["public"]["Enums"]["org_role"];

export interface AdminUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
  xp: number;
  created_at: string;
  last_seen_at: string | null;
  email?: string;
  roles: string[];
  organizations: { id: string; name: string; role: string }[];
  credit_balance: number;
}

export function useAdminUsers() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // 1. All profiles
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;

      const userIds = (profiles || []).map((p) => p.user_id);
      if (userIds.length === 0) return [];

      // 2. Roles, org memberships, credits in parallel
      const [rolesRes, membersRes, creditsRes] = await Promise.all([
        supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
        supabase.from("organization_members").select("user_id, role, organization_id, organizations(id, name)").in("user_id", userIds),
        supabase.from("user_credits").select("user_id, balance").in("user_id", userIds),
      ]);

      const rolesMap: Record<string, string[]> = {};
      (rolesRes.data || []).forEach((r) => {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
        rolesMap[r.user_id].push(r.role);
      });

      const orgsMap: Record<string, { id: string; name: string; role: string }[]> = {};
      (membersRes.data || []).forEach((m: any) => {
        if (!orgsMap[m.user_id]) orgsMap[m.user_id] = [];
        orgsMap[m.user_id].push({
          id: m.organizations?.id || m.organization_id,
          name: m.organizations?.name || "—",
          role: m.role,
        });
      });

      const creditsMap: Record<string, number> = {};
      (creditsRes.data || []).forEach((c) => {
        creditsMap[c.user_id] = c.balance;
      });

      return (profiles || []).map((p): AdminUser => ({
        user_id: p.user_id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        status: p.status,
        xp: p.xp,
        created_at: p.created_at,
        last_seen_at: p.last_seen_at,
        email: (p as any).email ?? undefined,
        roles: rolesMap[p.user_id] || [],
        organizations: orgsMap[p.user_id] || [],
        credit_balance: creditsMap[p.user_id] ?? 0,
      }));
    },
  });

  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const adjustCredits = useMutation({
    mutationFn: async ({ userId, amount, description }: { userId: string; amount: number; description: string }) => {
      // Update balance
      const { data: current } = await supabase.from("user_credits").select("balance").eq("user_id", userId).single();
      const newBalance = (current?.balance ?? 0) + amount;
      await supabase.from("user_credits").update({ balance: newBalance }).eq("user_id", userId);
      // Log transaction
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        amount,
        type: amount > 0 ? "earned" : "spent",
        description,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: "active" | "suspended" }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus } as any)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return {
    users: list.data || [],
    isLoading: list.isLoading,
    addRole,
    removeRole,
    adjustCredits,
    toggleStatus,
    refetch: list.refetch,
  };
}
