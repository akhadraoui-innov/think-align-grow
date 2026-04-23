import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailABTest {
  id: string;
  template_id: string;
  organization_id: string | null;
  name: string;
  variant_a_subject: string;
  variant_b_subject: string;
  variant_a_sent: number;
  variant_b_sent: number;
  variant_a_opened: number;
  variant_b_opened: number;
  variant_a_clicked: number;
  variant_b_clicked: number;
  status: "running" | "paused" | "completed";
  winner: "A" | "B" | null;
  significance_pct: number | null;
  started_at: string;
  completed_at: string | null;
}

export function useEmailABTests(organizationId?: string | null) {
  return useQuery({
    queryKey: ["email-ab-tests", organizationId ?? "global"],
    queryFn: async () => {
      let q = supabase.from("email_ab_tests").select("*").order("started_at", { ascending: false });
      if (organizationId === null) q = q.is("organization_id", null);
      else if (organizationId) q = q.eq("organization_id", organizationId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as EmailABTest[];
    },
  });
}

export function useUpsertABTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<EmailABTest> & { template_id: string; name: string; variant_a_subject: string; variant_b_subject: string }) => {
      const row = {
        template_id: payload.template_id,
        organization_id: payload.organization_id ?? null,
        name: payload.name,
        variant_a_subject: payload.variant_a_subject,
        variant_b_subject: payload.variant_b_subject,
        status: payload.status ?? "running",
      };
      const { data, error } = payload.id
        ? await supabase.from("email_ab_tests").update(row).eq("id", payload.id).select().single()
        : await supabase.from("email_ab_tests").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-ab-tests"] }),
  });
}

export function useStopABTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, winner }: { id: string; winner: "A" | "B" }) => {
      const { error } = await supabase
        .from("email_ab_tests")
        .update({ status: "completed", winner, completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-ab-tests"] }),
  });
}
