import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailTemplate {
  id: string;
  code: string;
  organization_id: string | null;
  name: string;
  subject: string;
  markdown_body: string;
  variables: any;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export function useEmailTemplates(organizationId?: string | null) {
  return useQuery({
    queryKey: ["email-templates", organizationId ?? "global"],
    queryFn: async () => {
      const query = supabase
        .from("email_templates")
        .select("*")
        .order("organization_id", { ascending: true, nullsFirst: true })
        .order("name");
      if (organizationId !== undefined) {
        if (organizationId === null) {
          query.is("organization_id", null);
        } else {
          query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });
}

export function useEmailTemplate(id: string | null) {
  return useQuery({
    queryKey: ["email-template", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as EmailTemplate;
    },
  });
}

export function useUpsertEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<EmailTemplate> & { code: string; name: string; subject: string; markdown_body: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const row = {
        ...payload,
        created_by: payload.created_by ?? user?.id ?? null,
      };
      if (payload.id) {
        const { data, error } = await supabase
          .from("email_templates")
          .update(row)
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("email_templates")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-templates"] });
      qc.invalidateQueries({ queryKey: ["email-template"] });
    },
  });
}

export function useDeleteEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });
}
