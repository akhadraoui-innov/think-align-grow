import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export interface AdminUserDetail {
  // Profile
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
  xp: number;
  created_at: string;
  last_seen_at: string | null;
  updated_at: string;
  // New fields
  email: string | null;
  phone: string | null;
  job_title: string | null;
  department: string | null;
  service: string | null;
  pole: string | null;
  hierarchy_level: string | null;
  manager_user_id: string | null;
  manager_name: string | null;
  bio: string | null;
  interests: string[];
  objectives: string[];
  linkedin_url: string | null;
  location: string | null;
}

export function useAdminUserDetail(userId: string | undefined) {
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: ["admin-user-detail", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId!)
        .single();
      if (error) throw error;
      return data as any as AdminUserDetail;
    },
  });

  const roles = useQuery({
    queryKey: ["admin-user-roles", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);
      if (error) throw error;
      return data.map((r) => r.role);
    },
  });

  const organizations = useQuery({
    queryKey: ["admin-user-orgs", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members")
        .select("*, organizations(id, name, slug, primary_color, logo_url)")
        .eq("user_id", userId!);
      if (error) throw error;
      return data || [];
    },
  });

  const credits = useQuery({
    queryKey: ["admin-user-credits", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: balance } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      const { data: transactions } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(20);
      return { balance: balance || { balance: 0, lifetime_earned: 0 }, transactions: transactions || [] };
    },
  });

  const workshops = useQuery({
    queryKey: ["admin-user-workshops", userId],
    enabled: !!userId,
    queryFn: async () => {
      // Workshops hosted
      const { data: hosted } = await supabase
        .from("workshops")
        .select("id, name, code, status, created_at, organization_id")
        .eq("host_id", userId!)
        .order("created_at", { ascending: false })
        .limit(30);
      // Workshops participated
      const { data: participations } = await supabase
        .from("workshop_participants")
        .select("workshop_id, role, joined_at, workshops(id, name, code, status, created_at)")
        .eq("user_id", userId!)
        .order("joined_at", { ascending: false })
        .limit(30);
      return { hosted: hosted || [], participations: participations || [] };
    },
  });

  const challenges = useQuery({
    queryKey: ["admin-user-challenges", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_responses")
        .select("id, workshop_id, subject_id, slot_id, card_id, maturity, rank, format, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const quizResults = useQuery({
    queryKey: ["admin-user-quiz", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_results")
        .select("*, toolkits(name)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const cardProgress = useQuery({
    queryKey: ["admin-user-cards", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_card_progress")
        .select("*, cards(title, pillar_id)")
        .eq("user_id", userId!)
        .order("viewed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const activityLogs = useQuery({
    queryKey: ["admin-user-activity", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  // Mutations
  const updateProfile = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates as any)
        .eq("user_id", userId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-user-detail", userId] }),
  });

  const addRole = useMutation({
    mutationFn: async (role: string) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId!, role } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-user-roles", userId] }),
  });

  const removeRole = useMutation({
    mutationFn: async (role: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId!).eq("role", role as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-user-roles", userId] }),
  });

  const adjustCredits = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description: string }) => {
      const { data: current } = await supabase.from("user_credits").select("balance").eq("user_id", userId!).single();
      await supabase.from("user_credits").update({ balance: (current?.balance ?? 0) + amount }).eq("user_id", userId!);
      await supabase.from("credit_transactions").insert({ user_id: userId!, amount, type: amount > 0 ? "earned" : "spent", description });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-user-credits", userId] }),
  });

  const addToOrganization = useMutation({
    mutationFn: async ({ organizationId, role }: { organizationId: string; role: string }) => {
      const { error } = await supabase.from("organization_members").insert({
        user_id: userId!,
        organization_id: organizationId,
        role: role as any,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-user-orgs", userId] }),
  });

  const removeFromOrganization = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase.from("organization_members").delete().eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-user-orgs", userId] }),
  });

  return {
    profile: profile.data,
    roles: roles.data || [],
    organizations: organizations.data || [],
    credits: credits.data,
    workshops: workshops.data || { hosted: [], participations: [] },
    challenges: challenges.data || [],
    quizResults: quizResults.data || [],
    cardProgress: cardProgress.data || [],
    activityLogs: activityLogs.data || [],
    isLoading: profile.isLoading,
    updateProfile,
    addRole,
    removeRole,
    adjustCredits,
    addToOrganization,
    removeFromOrganization,
    refetch: () => {
      profile.refetch();
      roles.refetch();
      organizations.refetch();
      credits.refetch();
      workshops.refetch();
      challenges.refetch();
      quizResults.refetch();
      cardProgress.refetch();
      activityLogs.refetch();
    },
  };
}
