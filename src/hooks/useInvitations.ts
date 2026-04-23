import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrgInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export function useInvitations(organizationId: string | undefined) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["org-invitations", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_invitations" as any)
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrgInvitation[];
    },
  });

  const send = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      if (!organizationId) throw new Error("Organisation manquante");
      const { data, error } = await supabase.functions.invoke("send-invitation", {
        body: { email, role, organization_id: organizationId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-invitations", organizationId] }),
  });

  const revoke = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("organization_invitations" as any)
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", invitationId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-invitations", organizationId] }),
  });

  const resend = useMutation({
    mutationFn: async (invitation: OrgInvitation) => {
      const { data, error } = await supabase.functions.invoke("send-invitation", {
        body: {
          email: invitation.email,
          role: invitation.role,
          organization_id: invitation.organization_id,
          resend_token: invitation.token,
        },
      });
      if (error) throw error;
      return data;
    },
  });

  return {
    invitations: list.data ?? [],
    isLoading: list.isLoading,
    send,
    revoke,
    resend,
    refetch: list.refetch,
  };
}
