import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface EmailLogRow {
  id: string;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface AdminEmailWidgetData {
  totals: { sent: number; failed: number; bounced: number; opened: number };
  sparkline: number[]; // 24 buckets
  lanes: Array<{ name: string; queue_length: number; tone: "info" | "success" | "warn" | "danger" }>;
  providerHealth: Array<{ provider_code: string; status: string; success_rate: number }>;
  recentFailures: EmailLogRow[];
  securityFlags: number;
}

export interface PortalEmailWidgetData {
  recent: EmailLogRow[];
  unread: number;
}

const LAST_SEEN_KEY = "email-widget-last-seen";

/* ─────────────────────────────────────────────
   ADMIN MODE
   ───────────────────────────────────────────── */

export function useAdminEmailWidget() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["email-widget-admin"],
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async (): Promise<AdminEmailWidgetData> => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [logsRes, lanesRes, providersRes, flagsRes] = await Promise.all([
        supabase
          .from("email_send_log")
          .select("id, template_name, recipient_email, status, error_message, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.rpc("get_priority_lane_metrics"),
        supabase.rpc("get_email_provider_health", { _hours: 24 }),
        supabase
          .from("email_security_flags")
          .select("id", { count: "exact", head: true })
          .is("reviewed_at", null),
      ]);

      const logs = (logsRes.data ?? []) as EmailLogRow[];

      const totals = logs.reduce(
        (acc, l) => {
          if (l.status === "sent" || l.status === "delivered") acc.sent++;
          else if (l.status === "failed" || l.status === "dlq") acc.failed++;
          else if (l.status === "bounced") acc.bounced++;
          else if (l.status === "opened") acc.opened++;
          return acc;
        },
        { sent: 0, failed: 0, bounced: 0, opened: 0 }
      );

      // Sparkline: 24 buckets horaires
      const sparkline = Array(24).fill(0);
      const now = Date.now();
      for (const log of logs) {
        const ts = new Date(log.created_at).getTime();
        const hourAgo = Math.floor((now - ts) / (60 * 60 * 1000));
        if (hourAgo >= 0 && hourAgo < 24) sparkline[23 - hourAgo]++;
      }

      const laneRows = (lanesRes.data ?? []) as Array<{
        queue_name?: string;
        priority?: string;
        queue_length?: number;
        backlog?: number;
      }>;
      const lanes = laneRows.slice(0, 3).map((l) => {
        const len = l.queue_length ?? l.backlog ?? 0;
        const tone: "success" | "warn" | "danger" =
          len > 200 ? "danger" : len > 50 ? "warn" : "success";
        return {
          name: l.queue_name ?? l.priority ?? "queue",
          queue_length: len,
          tone,
        };
      });

      const providerHealth = ((providersRes.data ?? []) as any[]).slice(0, 4).map((p) => ({
        provider_code: p.provider_code ?? p.provider ?? "—",
        status: p.health_status ?? p.status ?? "unknown",
        success_rate: Number(p.success_rate ?? 100),
      }));

      const recentFailures = logs
        .filter((l) => l.status === "failed" || l.status === "dlq" || l.status === "bounced")
        .slice(0, 4);

      return {
        totals,
        sparkline,
        lanes,
        providerHealth,
        recentFailures,
        securityFlags: flagsRes.count ?? 0,
      };
    },
  });

  // Realtime — nouvel échec → toast + invalidate
  useEffect(() => {
    const channel = supabase
      .channel("email-widget-admin-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "email_send_log" },
        (payload) => {
          const row = payload.new as EmailLogRow;
          if (row.status === "failed" || row.status === "dlq" || row.status === "bounced") {
            qc.invalidateQueries({ queryKey: ["email-widget-admin"] });
            toast.error("Échec d'envoi email", {
              description: `${row.template_name} → ${row.recipient_email}`,
            });
          } else {
            qc.invalidateQueries({ queryKey: ["email-widget-admin"] });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return {
    data: query.data,
    isLoading: query.isLoading,
  };
}

/* ─────────────────────────────────────────────
   PORTAL MODE
   ───────────────────────────────────────────── */

export function usePortalEmailWidget() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [lastSeen, setLastSeen] = useState<number>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(LAST_SEEN_KEY) : null;
    return stored ? Number(stored) : 0;
  });

  const query = useQuery({
    queryKey: ["email-widget-portal", user?.email],
    enabled: !!user?.email,
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async (): Promise<PortalEmailWidgetData> => {
      const { data, error } = await supabase
        .from("email_send_log")
        .select("id, template_name, recipient_email, status, error_message, created_at")
        .eq("recipient_email", user!.email!)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      const recent = (data ?? []) as EmailLogRow[];
      const unread = recent.filter((r) => new Date(r.created_at).getTime() > lastSeen).length;
      return { recent, unread };
    },
  });

  useEffect(() => {
    if (!user?.email) return;
    const channel = supabase
      .channel(`email-widget-portal-${user.email}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "email_send_log",
          filter: `recipient_email=eq.${user.email}`,
        },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["email-widget-portal", user.email] });
          const row = payload.new as EmailLogRow;
          toast.message("Nouvel email", { description: row.template_name });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, qc]);

  const markSeen = () => {
    const now = Date.now();
    localStorage.setItem(LAST_SEEN_KEY, String(now));
    setLastSeen(now);
    qc.invalidateQueries({ queryKey: ["email-widget-portal", user?.email] });
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    markSeen,
  };
}
