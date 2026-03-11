import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface SpendResult {
  success: boolean;
  error?: string;
  new_balance?: number;
  balance?: number;
}

export function useSpendCredits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description: string }) => {
      if (!user?.id) throw new Error("Non authentifié");

      const { data, error } = await supabase.rpc("spend_credits", {
        _user_id: user.id,
        _amount: amount,
        _description: description,
      });

      if (error) throw error;

      const result = data as unknown as SpendResult;
      if (!result.success) {
        if (result.error === "insufficient_credits") {
          throw new Error(`Crédits insuffisants (solde: ${result.balance})`);
        }
        throw new Error(result.error || "Erreur inconnue");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_credits"] });
      queryClient.invalidateQueries({ queryKey: ["credit_transactions"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
