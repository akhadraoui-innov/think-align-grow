import { useQuery, useQueryClient } from "@tanstack/react-query";
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

  return {
    balance: credits?.balance ?? 0,
    lifetimeEarned: credits?.lifetime_earned ?? 0,
    transactions: transactions ?? [],
    isLoading,
    hasCredits: (amount: number) => (credits?.balance ?? 0) >= amount,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ["user_credits", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["credit_transactions", user?.id] });
    },
  };
}
