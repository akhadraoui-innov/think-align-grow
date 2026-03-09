import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useCredits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: credits, isLoading } = useQuery({
    queryKey: ["user_credits", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ["credit_transactions", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const spendCredits = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      if ((credits?.balance ?? 0) < amount) throw new Error("Crédits insuffisants");

      const { error: txError } = await supabase
        .from("credit_transactions")
        .insert({ user_id: user.id, amount: -amount, type: "spent", description });
      if (txError) throw txError;

      const { error: creditError } = await supabase
        .from("user_credits")
        .update({ balance: (credits?.balance ?? 0) - amount, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (creditError) throw creditError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_credits", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["credit_transactions", user?.id] });
    },
  });

  return {
    balance: credits?.balance ?? 0,
    lifetimeEarned: credits?.lifetime_earned ?? 0,
    transactions: transactions ?? [],
    isLoading,
    spendCredits,
    hasCredits: (amount: number) => (credits?.balance ?? 0) >= amount,
  };
}
