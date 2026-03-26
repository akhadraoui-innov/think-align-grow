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

      // Debounce rapid updates
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        try {
          const payload: Record<string, unknown> = {
            messages: messages as unknown as Record<string, unknown>[],
          };
          if (evaluation) {
            payload.evaluation = evaluation as unknown as Record<string, unknown>;
            payload.score = score ?? evaluation.score;
            payload.completed_at = new Date().toISOString();
          }

          if (sessionId) {
            await supabase
              .from("academy_practice_sessions")
              .update(payload)
              .eq("id", sessionId);
          } else {
            const { data } = await supabase
              .from("academy_practice_sessions")
              .insert({
                user_id: user.id,
                practice_id: practiceId,
                messages: messages as unknown as Record<string, unknown>[],
                ...(evaluation
                  ? {
                      evaluation: evaluation as unknown as Record<string, unknown>,
                      score: score ?? evaluation.score,
                      completed_at: new Date().toISOString(),
                    }
                  : {}),
              })
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
    async (
      messages: SessionMessage[],
      evaluation: SessionEvaluation
    ) => {
      if (previewMode || !user) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);

      try {
        const payload = {
          messages: messages as unknown as Record<string, unknown>[],
          evaluation: evaluation as unknown as Record<string, unknown>,
          score: evaluation.score,
          completed_at: new Date().toISOString(),
        };

        if (sessionId) {
          await supabase
            .from("academy_practice_sessions")
            .update(payload)
            .eq("id", sessionId);
        } else {
          await supabase
            .from("academy_practice_sessions")
            .insert({
              user_id: user.id,
              practice_id: practiceId,
              ...payload,
            });
        }
      } catch (err) {
        console.error("Session complete error:", err);
      }
    },
    [user, practiceId, sessionId, previewMode]
  );

  return { sessionId, persistSession, completeSession };
}
