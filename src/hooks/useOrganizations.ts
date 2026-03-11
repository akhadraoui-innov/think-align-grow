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
      return data;
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

  return {
    organization: org.data,
    members: members.data || [],
    toolkits: toolkits.data || [],
    isLoading: org.isLoading,
  };
}
