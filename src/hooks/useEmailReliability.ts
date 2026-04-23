import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProviderHealthRow {
  provider: string;
  total: number;
  sent: number;
  failed: number;
  bounced: number;
  dlq: number;
  failure_rate: number;
  circuit_open: boolean;
}

export interface QuotaAlertRow {
  organization_id: string;
  organization_name: string;
  sent_count: number;
  monthly_limit: number;
  usage_percent: number;
}

export interface CronHealthRow {
  jobname: string;
  schedule: string;
  active: boolean;
  last_status: string | null;
  last_start: string | null;
  last_end: string | null;
  last_message: string | null;
}

export function useProviderHealth(hours = 24) {
  return useQuery({
    queryKey: ["email-provider-health", hours],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_email_provider_health", { _hours: hours });
      if (error) throw error;
      return (data ?? []) as ProviderHealthRow[];
    },
  });
}

export function useQuotaAlerts() {
  return useQuery({
    queryKey: ["email-quota-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_email_quota_alerts");
      if (error) throw error;
      return (data ?? []) as QuotaAlertRow[];
    },
  });
}

export function useCronHealth() {
  return useQuery({
    queryKey: ["email-cron-health"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_email_cron_health");
      if (error) throw error;
      return (data ?? []) as CronHealthRow[];
    },
  });
}

export function useReplayDlq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { data, error } = await supabase.rpc("replay_dlq_message", { _message_id: messageId });
      if (error) throw error;
      const result = data as { ok: boolean; error?: string };
      if (!result?.ok) throw new Error(result?.error ?? "replay_failed");
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-logs"] });
      qc.invalidateQueries({ queryKey: ["email-provider-health"] });
      toast.success("Email remis en file d'attente");
    },
    onError: (e: Error) => toast.error(`Replay échoué : ${e.message}`),
  });
}
