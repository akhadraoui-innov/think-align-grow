import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useExportEmailData() {
  return useMutation({
    mutationFn: async (userId?: string) => {
      const { data, error } = await supabase.rpc("export_user_email_data", {
        _user_id: userId ?? undefined,
      });
      if (error) throw error;
      return data as Record<string, unknown>;
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `email-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export téléchargé");
    },
    onError: (e: Error) => toast.error(`Export échoué : ${e.message}`),
  });
}

export function useEraseEmailData() {
  return useMutation({
    mutationFn: async (userId?: string) => {
      const { data, error } = await supabase.rpc("erase_user_email_data", {
        _user_id: userId ?? undefined,
      });
      if (error) throw error;
      const result = data as { success?: boolean; error?: string; logs_anonymized?: number; preferences_deleted?: number; tokens_deleted?: number };
      if (!result?.success) throw new Error(result?.error ?? "erase_failed");
      return result;
    },
    onSuccess: (result) => {
      toast.success(
        `Données effacées : ${result.logs_anonymized ?? 0} logs anonymisés, ${result.preferences_deleted ?? 0} préférences supprimées.`,
      );
    },
    onError: (e: Error) => toast.error(`Effacement échoué : ${e.message}`),
  });
}
