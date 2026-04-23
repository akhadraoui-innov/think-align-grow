import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface NotificationRow {
  id: string;
  user_id: string;
  organization_id: string | null;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  severity: "info" | "success" | "warning" | "error";
  read_at: string | null;
  created_at: string;
}

export function useNotifications(limit = 20) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.id, limit],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["notifications", user.id] });
          if (payload.eventType === "INSERT") {
            const n = payload.new as NotificationRow;
            toast.message(n.title, { description: n.body ?? undefined });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  const unreadCount = (query.data ?? []).filter((n) => !n.read_at).length;

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase.rpc("mark_notifications_read", { _ids: ids });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("mark_all_notifications_read");
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  return {
    notifications: query.data ?? [],
    unreadCount,
    isLoading: query.isLoading,
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
  };
}
