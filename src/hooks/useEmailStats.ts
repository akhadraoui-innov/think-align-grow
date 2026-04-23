import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailRun {
  id: string;
  template_code: string;
  template_version: number | null;
  organization_id: string | null;
  trigger_event: string;
  recipient_email: string;
  provider_used: string | null;
  message_id: string | null;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  error: string | null;
  created_at: string;
}

export interface EmailStatsRow {
  day: string;
  organization_id: string | null;
  template_code: string;
  trigger_event: string;
  provider_used: string | null;
  sent_count: number;
  failed_count: number;
  opened_count: number;
  clicked_count: number;
}

export function useEmailRuns(filters?: {
  organization_id?: string | null;
  template_code?: string;
  status?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["email-runs", filters],
    queryFn: async () => {
      let q = supabase
        .from("email_automation_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filters?.limit ?? 200);
      if (filters?.organization_id !== undefined) {
        if (filters.organization_id === null) q = q.is("organization_id", null);
        else q = q.eq("organization_id", filters.organization_id);
      }
      if (filters?.template_code) q = q.eq("template_code", filters.template_code);
      if (filters?.status) q = q.eq("status", filters.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as EmailRun[];
    },
  });
}

export function useEmailStats(organizationId?: string | null) {
  return useQuery({
    queryKey: ["email-stats", organizationId ?? "all"],
    queryFn: async () => {
      let q: any = supabase.from("v_email_stats" as any).select("*").order("day", { ascending: false }).limit(500);
      if (organizationId === null) q = q.is("organization_id", null);
      else if (organizationId) q = q.eq("organization_id", organizationId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as EmailStatsRow[];
    },
  });
}
