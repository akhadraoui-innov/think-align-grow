import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface EmailCategory {
  code: string;
  name: string;
  description: string | null;
  is_required: boolean;
  sort_order: number;
}

export interface SubscriberPreference {
  id: string;
  email: string;
  category_code: string;
  subscribed: boolean;
  organization_id: string | null;
  double_opt_in_confirmed_at: string | null;
  source: string | null;
  updated_at: string;
}

export function useEmailCategories() {
  return useQuery({
    queryKey: ["email-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as EmailCategory[];
    },
  });
}

export function useEmailPreferences() {
  const { user } = useAuth();
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.organization_id ?? null;

  return useQuery({
    queryKey: ["email-preferences", user?.email, orgId],
    enabled: !!user?.email,
    queryFn: async () => {
      const query = supabase
        .from("email_subscriber_preferences")
        .select("*")
        .eq("email", user!.email!);
      const { data, error } = orgId
        ? await query.eq("organization_id", orgId)
        : await query.is("organization_id", null);
      if (error) throw error;
      return (data ?? []) as SubscriberPreference[];
    },
  });
}

export function useUpdateEmailPreference() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.organization_id ?? null;

  return useMutation({
    mutationFn: async ({
      categoryCode,
      subscribed,
    }: {
      categoryCode: string;
      subscribed: boolean;
    }) => {
      if (!user?.email) throw new Error("Authentification requise");
      const { error } = await supabase
        .from("email_subscriber_preferences")
        .upsert(
          {
            email: user.email,
            user_id: user.id,
            organization_id: orgId,
            category_code: categoryCode,
            subscribed,
            source: "preference_center",
          },
          { onConflict: "email,organization_id,category_code" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-preferences"] });
      toast.success("Préférence mise à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useEmailHistory(limit = 50) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["email-history", user?.email, limit],
    enabled: !!user?.email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_send_log")
        .select("id, message_id, template_name, status, created_at, error_message, metadata")
        .eq("recipient_email", user!.email!)
        .order("created_at", { ascending: false })
        .limit(limit * 2); // raw, will dedupe
      if (error) throw error;
      // Dedupe by message_id (latest status per email)
      const seen = new Set<string>();
      const deduped: typeof data = [];
      for (const row of data ?? []) {
        const key = row.message_id ?? row.id;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(row);
        }
      }
      return deduped.slice(0, limit);
    },
  });
}
