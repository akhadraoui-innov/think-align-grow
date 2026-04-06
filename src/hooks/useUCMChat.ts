import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUCMChatMessages(projectId: string | undefined) {
  return useQuery({
    queryKey: ["ucm-chat-messages", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ucm_chat_messages")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function useSendUCMChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { project_id: string; message: string }) => {
      const { data, error } = await supabase.functions.invoke("ucm-chat", {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ["ucm-chat-messages", params.project_id] });
    },
  });
}
