import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ConditionRule = {
  path: string;
  op: "==" | "!=" | ">" | ">=" | "<" | "<=" | "in" | "contains" | "exists";
  value: any;
};
export type ConditionsDSL = { all?: ConditionRule[]; any?: ConditionRule[] };

export interface EmailAutomation {
  id: string;
  code: string;
  organization_id: string | null;
  name: string;
  description?: string | null;
  trigger_event: string;
  conditions: ConditionsDSL | Record<string, never>;
  template_code: string;
  delay_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useEmailAutomations(organizationId?: string | null) {
  return useQuery({
    queryKey: ["email-automations", organizationId ?? "global"],
    queryFn: async () => {
      const query = supabase
        .from("email_automations")
        .select("*")
        .order("organization_id", { ascending: true, nullsFirst: true })
        .order("trigger_event");
      if (organizationId === null) {
        query.is("organization_id", null);
      } else if (organizationId) {
        query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as EmailAutomation[];
    },
  });
}

export function useUpsertEmailAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<EmailAutomation> & { code: string; name: string; trigger_event: string; template_code: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const row = { ...payload, created_by: (payload as any).created_by ?? user?.id ?? null };
      if (payload.id) {
        const { data, error } = await supabase.from("email_automations").update(row).eq("id", payload.id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("email_automations").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-automations"] }),
  });
}

export function useDeleteEmailAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-automations"] }),
  });
}

export const TRIGGER_EVENTS = [
  { value: "user.created", label: "Création de compte", payloadHints: ["firstName", "displayName"] },
  { value: "user.status.suspended", label: "Compte suspendu", payloadHints: ["displayName"] },
  { value: "user.inactive", label: "Inactivité (N jours)", payloadHints: ["firstName", "daysInactive"] },
  { value: "org.invitation.sent", label: "Invitation envoyée", payloadHints: ["inviterName", "orgName", "acceptUrl"] },
  { value: "subscription.upgraded", label: "Abonnement upgrade", payloadHints: ["planName"] },
  { value: "subscription.downgraded", label: "Abonnement downgrade", payloadHints: ["planName"] },
  { value: "credits.low", label: "Crédits faibles", payloadHints: ["balance", "threshold"] },
  { value: "academy.path.completed", label: "Parcours Academy terminé", payloadHints: ["pathName", "score"] },
  { value: "academy.path.enrolled", label: "Inscription parcours", payloadHints: ["pathName"] },
  { value: "campaign.scheduled", label: "Campagne planifiée (manuel)", payloadHints: [] },
];

export const CONDITION_OPS: Array<{ value: ConditionRule["op"]; label: string }> = [
  { value: "==", label: "égal à" },
  { value: "!=", label: "différent de" },
  { value: ">", label: ">" },
  { value: ">=", label: "≥" },
  { value: "<", label: "<" },
  { value: "<=", label: "≤" },
  { value: "in", label: "dans (liste)" },
  { value: "contains", label: "contient" },
  { value: "exists", label: "existe" },
];
