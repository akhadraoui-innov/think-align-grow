import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface SessionMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface SessionEvaluation {
  score: number;
  feedback: string;
  dimensions?: { name: string; score: number }[];
  recommendations?: string[];
}

export function useSimulatorSession(practiceId: string, previewMode = false) {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const persistSession = useCallback(
    async (
      messages: SessionMessage[],
      evaluation?: SessionEvaluation | null,
      score?: number
    ) => {
      if (previewMode || !user) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        try {
          const messagesJson = JSON.parse(JSON.stringify(messages));
          const evalJson = evaluation ? JSON.parse(JSON.stringify(evaluation)) : undefined;

          if (sessionId) {
            const updateData: Record<string, unknown> = { messages: messagesJson };
            if (evalJson) {
              updateData.evaluation = evalJson;
              updateData.score = score ?? evaluation!.score;
              updateData.completed_at = new Date().toISOString();
            }
            await supabase
              .from("academy_practice_sessions")
              .update(updateData)
              .eq("id", sessionId);
          } else {
            const insertData: Record<string, unknown> = {
              user_id: user.id,
              practice_id: practiceId,
              messages: messagesJson,
            };
            if (evalJson) {
              insertData.evaluation = evalJson;
              insertData.score = score ?? evaluation!.score;
              insertData.completed_at = new Date().toISOString();
            }
            const { data } = await supabase
              .from("academy_practice_sessions")
              .insert(insertData as any)
              .select("id")
              .single();
            if (data) setSessionId(data.id);
          }
        } catch (err) {
          console.error("Session persist error:", err);
        }
      }, 500);
    },
    [user, practiceId, sessionId, previewMode]
  );

  const completeSession = useCallback(
    async (messages: SessionMessage[], evaluation: SessionEvaluation): Promise<string | null> => {
      if (previewMode || !user) return null;
      if (debounceRef.current) clearTimeout(debounceRef.current);

      try {
        const messagesJson = JSON.parse(JSON.stringify(messages));
        const evalJson = JSON.parse(JSON.stringify(evaluation));

        const payload: Record<string, unknown> = {
          messages: messagesJson,
          evaluation: evalJson,
          score: evaluation.score,
          completed_at: new Date().toISOString(),
        };

        if (sessionId) {
          await supabase
            .from("academy_practice_sessions")
            .update(payload)
            .eq("id", sessionId);
          return sessionId;
        } else {
          const { data } = await supabase
            .from("academy_practice_sessions")
            .insert({
              user_id: user.id,
              practice_id: practiceId,
              ...payload,
            } as any)
            .select("id")
            .single();
          const newId = data?.id ?? null;
          if (newId) setSessionId(newId);
          return newId;
        }
      } catch (err) {
        console.error("Session complete error:", err);
        return sessionId;
      }
    },
    [user, practiceId, sessionId, previewMode]
  );

  return { sessionId, persistSession, completeSession };
}
