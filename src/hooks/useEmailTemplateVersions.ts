import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailTemplateVersion {
  id: string;
  template_id: string;
  version: number;
  subject: string;
  markdown_body: string;
  variables: any;
  created_at: string;
  created_by: string | null;
}

export function useEmailTemplateVersions(templateId: string | null) {
  return useQuery({
    queryKey: ["email-template-versions", templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_template_versions")
        .select("*")
        .eq("template_id", templateId!)
        .order("version", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as EmailTemplateVersion[];
    },
  });
}

export function useRestoreEmailTemplateVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, version }: { templateId: string; version: EmailTemplateVersion }) => {
      const { data, error } = await supabase
        .from("email_templates")
        .update({
          subject: version.subject,
          markdown_body: version.markdown_body,
          variables: version.variables,
        })
        .eq("id", templateId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["email-templates"] });
      qc.invalidateQueries({ queryKey: ["email-template", vars.templateId] });
      qc.invalidateQueries({ queryKey: ["email-template-versions", vars.templateId] });
    },
  });
}
