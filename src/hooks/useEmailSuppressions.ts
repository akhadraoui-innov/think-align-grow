import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailSuppression {
  id: string;
  email: string;
  organization_id: string | null;
  reason: "bounce" | "complaint" | "unsubscribe" | "manual";
  source_provider: string | null;
  metadata: any;
  suppressed_at: string;
  reactivated_at: string | null;
  reactivated_by: string | null;
  is_active: boolean;
}

export function useEmailSuppressions(organizationId?: string | null, opts?: { activeOnly?: boolean; reason?: string }) {
  return useQuery({
    queryKey: ["email-suppressions", organizationId ?? "global", opts],
    queryFn: async () => {
      let q = supabase
        .from("email_suppressions")
        .select("*")
        .order("suppressed_at", { ascending: false })
        .limit(500);
      if (organizationId === null) q = q.is("organization_id", null);
      else if (organizationId) q = q.eq("organization_id", organizationId);
      if (opts?.activeOnly) q = q.eq("is_active", true);
      if (opts?.reason) q = q.eq("reason", opts.reason);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as EmailSuppression[];
    },
  });
}

export function useReactivateSuppression() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("email_suppressions")
        .update({ reactivated_at: new Date().toISOString(), reactivated_by: user?.id ?? null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-suppressions"] }),
  });
}

export function useAddSuppression() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      organization_id: string | null;
      reason: "bounce" | "complaint" | "unsubscribe" | "manual";
      metadata?: any;
    }) => {
      const { error } = await supabase.from("email_suppressions").upsert(
        {
          email: payload.email.toLowerCase(),
          organization_id: payload.organization_id,
          reason: payload.reason,
          metadata: payload.metadata ?? {},
        },
        { onConflict: "email,organization_id,reason" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-suppressions"] }),
  });
}
