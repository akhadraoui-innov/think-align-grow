import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SystemHealth {
  generated_at: string;
  providers: Array<{
    provider: string;
    total: number;
    sent: number;
    failed: number;
    bounced: number;
    dlq: number;
    failure_rate: number;
    circuit_open: boolean;
  }>;
  cron_jobs: Array<{
    jobname: string;
    schedule: string;
    active: boolean;
    last_status: string | null;
    last_start: string | null;
    last_end: string | null;
    last_message: string | null;
  }>;
  pgmq_backlogs: Array<{
    lane: string;
    queue_name: string;
    backlog: number;
    oldest_seconds: number | null;
  }>;
  audit_chain: { valid: boolean; broken_at: number | null; total: number };
  quota_alerts: Array<{
    organization_id: string;
    organization_name: string;
    sent_count: number;
    monthly_limit: number;
    usage_percent: number;
  }>;
  secrets_status: { email_hmac_secret: boolean; count_total: number };
  brand_assets_status: { logo_uploaded: boolean };
  critical_count: number;
}

export interface EdgeFunctionMetric {
  function_name: string;
  invocations: number;
  errors: number;
  p50_ms: number | null;
  p95_ms: number | null;
  error_rate: number | null;
}

export function useSystemHealth(refetchMs = 30_000) {
  return useQuery({
    queryKey: ["system-health"],
    refetchInterval: refetchMs,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_system_health");
      if (error) throw error;
      return data as unknown as SystemHealth;
    },
  });
}

export function useEdgeFunctionMetrics(hours = 24) {
  return useQuery({
    queryKey: ["edge-function-metrics", hours],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_edge_function_metrics", { _hours: hours });
      if (error) throw error;
      return (data ?? []) as EdgeFunctionMetric[];
    },
  });
}
