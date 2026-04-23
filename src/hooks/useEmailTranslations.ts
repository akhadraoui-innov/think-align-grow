import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailTemplateTranslation {
  id: string;
  template_id: string;
  locale: string;
  subject: string;
  markdown_body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const SUPPORTED_LOCALES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];

export function useEmailTranslations(templateId: string | null) {
  return useQuery({
    queryKey: ["email-translations", templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("email_template_translations" as any) as any)
        .select("*")
        .eq("template_id", templateId!)
        .order("locale");
      if (error) throw error;
      return (data || []) as unknown as EmailTemplateTranslation[];
    },
  });
}

export function useUpsertEmailTranslation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id?: string;
      template_id: string;
      locale: string;
      subject: string;
      markdown_body: string;
      is_active?: boolean;
    }) => {
      const row = {
        template_id: payload.template_id,
        locale: payload.locale,
        subject: payload.subject,
        markdown_body: payload.markdown_body,
        is_active: payload.is_active ?? true,
      };
      const { data, error } = payload.id
        ? await (supabase.from("email_template_translations" as any) as any).update(row).eq("id", payload.id).select().single()
        : await (supabase.from("email_template_translations" as any) as any).insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["email-translations", vars.template_id] });
    },
  });
}

export function useDeleteEmailTranslation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, template_id }: { id: string; template_id: string }) => {
      const { error } = await (supabase.from("email_template_translations" as any) as any).delete().eq("id", id);
      if (error) throw error;
      return { template_id };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["email-translations", data.template_id] });
    },
  });
}
