import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DeleteMode = "anonymize" | "hard_delete";

interface DeleteUserPayload {
  userId: string;
  mode: DeleteMode;
  userLabel?: string;
}

interface DeleteUserResult {
  success: boolean;
  mode: DeleteMode;
  archive: unknown;
}

const ERROR_LABELS: Record<string, string> = {
  forbidden: "Vous n'avez pas les droits pour supprimer ce compte.",
  invalid_session: "Session invalide. Reconnectez-vous.",
  invalid_user_id: "Identifiant utilisateur invalide.",
  cannot_delete_self: "Vous ne pouvez pas vous supprimer vous-même.",
  cannot_delete_super_admin: "Impossible de supprimer un Super Admin.",
  auth_delete_failed: "Échec de la suppression du compte d'authentification.",
  internal_error: "Une erreur inattendue est survenue.",
};

function downloadArchive(archive: unknown, userId: string) {
  try {
    const blob = new Blob([JSON.stringify(archive, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rgpd-export-${userId}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.warn("[useDeleteUser] archive download failed", e);
  }
}

export function useDeleteUser() {
  return useMutation<DeleteUserResult, Error, DeleteUserPayload>({
    mutationFn: async ({ userId, mode }) => {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: userId, mode },
      });
      if (error) throw new Error(error.message || "internal_error");
      const result = data as { success?: boolean; mode?: DeleteMode; archive?: unknown; error?: string };
      if (!result?.success) {
        const code = result?.error || "internal_error";
        throw new Error(code);
      }
      return {
        success: true,
        mode: result.mode || mode,
        archive: result.archive,
      };
    },
    onSuccess: (result, variables) => {
      if (result.archive) downloadArchive(result.archive, variables.userId);
      const label = variables.userLabel ? ` (${variables.userLabel})` : "";
      toast.success(
        result.mode === "hard_delete"
          ? `Compte supprimé définitivement${label}. Archive RGPD téléchargée.`
          : `Compte anonymisé${label}. Archive RGPD téléchargée.`,
      );
    },
    onError: (err) => {
      const code = err.message || "internal_error";
      toast.error(ERROR_LABELS[code] ?? `Suppression échouée : ${code}`);
    },
  });
}
