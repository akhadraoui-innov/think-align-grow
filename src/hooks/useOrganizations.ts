import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Organization = Tables<"organizations">;

export function useOrganizations() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ["admin-organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Organization[];
    },
  });

  const create = useMutation({
    mutationFn: async (org: { name: string; slug: string; primary_color?: string }) => {
      const { data, error } = await supabase
        .from("organizations")
        .insert(org)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-organizations"] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Organization> & { id: string }) => {
      const { data, error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-organizations"] }),
  });

  return { organizations: list.data || [], isLoading: list.isLoading, create, update, refetch: list.refetch };
}

export function useOrganizationDetail(id: string | undefined) {
  const org = useQuery({
    queryKey: ["admin-organization", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Organization;
    },
  });

  const members = useQuery({
    queryKey: ["admin-org-members", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", id!);
      if (error) throw error;
      // Fetch profiles for each member
      if (data && data.length > 0) {
        const userIds = data.map((m) => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);
        return data.map((m) => ({
          ...m,
          profile: profiles?.find((p) => p.user_id === m.user_id) || null,
        }));
      }
      return data?.map((m) => ({ ...m, profile: null })) || [];
    },
  });

  const toolkits = useQuery({
    queryKey: ["admin-org-toolkits", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_toolkits")
        .select("*, toolkits(*)")
        .eq("organization_id", id!);
      if (error) throw error;
      return data;
    },
  });

  const teams = useQuery({
    queryKey: ["admin-org-teams", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("organization_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Get member counts per team
      if (data && data.length > 0) {
        const teamIds = data.map((t) => t.id);
        const { data: tmData } = await supabase
          .from("team_members")
          .select("team_id")
          .in("team_id", teamIds);
        const countMap: Record<string, number> = {};
        tmData?.forEach((tm) => {
          countMap[tm.team_id] = (countMap[tm.team_id] || 0) + 1;
        });
        return data.map((t) => ({ ...t, member_count: countMap[t.id] || 0 }));
      }
      return data?.map((t) => ({ ...t, member_count: 0 })) || [];
    },
  });

  const subscription = useQuery({
    queryKey: ["admin-org-subscription", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("organization_id", id!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const workshops = useQuery({
    queryKey: ["admin-org-workshops", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workshops")
        .select("*")
        .eq("organization_id", id!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const activityLogs = useQuery({
    queryKey: ["admin-org-activity", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("organization_id", id!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  return {
    organization: org.data,
    members: members.data || [],
    toolkits: toolkits.data || [],
    teams: teams.data || [],
    subscription: subscription.data,
    workshops: workshops.data || [],
    activityLogs: activityLogs.data || [],
    isLoading: org.isLoading,
    refetch: () => {
      org.refetch();
      members.refetch();
      toolkits.refetch();
      teams.refetch();
      subscription.refetch();
      workshops.refetch();
      activityLogs.refetch();
    },
  };
}
