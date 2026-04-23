import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay } from "date-fns";

export type AnalyticsRange = "24h" | "7d" | "30d" | "90d";

export interface AnalyticsRow {
  created_at: string;
  status: string;
  template_code: string;
  trigger_event: string;
  provider_used: string | null;
  organization_id: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  recipient_email: string;
  message_id: string | null;
}

export interface DailyPoint {
  day: string;
  sent: number;
  failed: number;
  opened: number;
  clicked: number;
  bounced: number;
}

export interface TemplateStat {
  template_code: string;
  total: number;
  sent: number;
  failed: number;
  open_rate: number;
  click_rate: number;
}

export interface ProviderStat {
  provider: string;
  total: number;
  failed: number;
  failure_rate: number;
}

const RANGE_DAYS: Record<AnalyticsRange, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function useEmailAnalytics(organizationId: string | null, range: AnalyticsRange = "7d") {
  return useQuery({
    queryKey: ["email-analytics", organizationId ?? "all", range],
    queryFn: async () => {
      const days = RANGE_DAYS[range];
      const since = subDays(new Date(), days).toISOString();

      let q = supabase
        .from("email_automation_runs")
        .select("created_at,status,template_code,trigger_event,provider_used,organization_id,opened_at,clicked_at,recipient_email,message_id")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000);

      if (organizationId === null) q = q.is("organization_id", null);
      else if (organizationId) q = q.eq("organization_id", organizationId);

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as AnalyticsRow[];
    },
  });
}

/**
 * Dedup by message_id (keep latest row per email send) per email-dashboard guide.
 * Rows already ordered desc → first occurrence wins.
 */
export function dedupByMessageId(rows: AnalyticsRow[]): AnalyticsRow[] {
  const seen = new Set<string>();
  const out: AnalyticsRow[] = [];
  for (const r of rows) {
    const key = r.message_id ?? `${r.recipient_email}|${r.template_code}|${r.created_at}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

export function buildDailySeries(rows: AnalyticsRow[], days: number): DailyPoint[] {
  const buckets = new Map<string, DailyPoint>();
  for (let i = days - 1; i >= 0; i--) {
    const d = startOfDay(subDays(new Date(), i)).toISOString().slice(0, 10);
    buckets.set(d, { day: d, sent: 0, failed: 0, opened: 0, clicked: 0, bounced: 0 });
  }
  for (const r of rows) {
    const d = r.created_at.slice(0, 10);
    const b = buckets.get(d);
    if (!b) continue;
    if (r.status === "sent") b.sent++;
    else if (r.status === "failed" || r.status === "dlq") b.failed++;
    else if (r.status === "bounced") b.bounced++;
    if (r.opened_at) b.opened++;
    if (r.clicked_at) b.clicked++;
  }
  return Array.from(buckets.values());
}

export function buildTemplateStats(rows: AnalyticsRow[]): TemplateStat[] {
  const map = new Map<string, { total: number; sent: number; failed: number; opened: number; clicked: number }>();
  for (const r of rows) {
    const key = r.template_code || "—";
    const cur = map.get(key) ?? { total: 0, sent: 0, failed: 0, opened: 0, clicked: 0 };
    cur.total++;
    if (r.status === "sent") cur.sent++;
    if (r.status === "failed" || r.status === "dlq") cur.failed++;
    if (r.opened_at) cur.opened++;
    if (r.clicked_at) cur.clicked++;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .map(([template_code, v]) => ({
      template_code,
      total: v.total,
      sent: v.sent,
      failed: v.failed,
      open_rate: v.sent > 0 ? Math.round((v.opened / v.sent) * 1000) / 10 : 0,
      click_rate: v.sent > 0 ? Math.round((v.clicked / v.sent) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function buildProviderStats(rows: AnalyticsRow[]): ProviderStat[] {
  const map = new Map<string, { total: number; failed: number }>();
  for (const r of rows) {
    const key = r.provider_used || "—";
    const cur = map.get(key) ?? { total: 0, failed: 0 };
    cur.total++;
    if (r.status === "failed" || r.status === "dlq") cur.failed++;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .map(([provider, v]) => ({
      provider,
      total: v.total,
      failed: v.failed,
      failure_rate: v.total > 0 ? Math.round((v.failed / v.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}
