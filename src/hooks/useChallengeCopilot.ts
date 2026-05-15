import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CopilotMsg { role: "user" | "assistant"; content: string; ts: number }

export function useChallengeCopilot(sessionId: string | undefined, workshopId: string | undefined, ctx: { subject_id?: string | null; slot_id?: string | null; artifact_id?: string | null }) {
  const [messages, setMessages] = useState<CopilotMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const threadIdRef = useRef<string | null>(null);

  // Load thread
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const { data } = await (supabase as any)
        .from("challenge_copilot_threads")
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        threadIdRef.current = data.id;
        setMessages((data.messages as CopilotMsg[]) || []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  const persist = useCallback(async (msgs: CopilotMsg[]) => {
    if (!sessionId || !workshopId) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await (supabase as any)
      .from("challenge_copilot_threads")
      .upsert({
        id: threadIdRef.current ?? undefined,
        session_id: sessionId,
        workshop_id: workshopId,
        user_id: u.user.id,
        messages: msgs,
        updated_at: new Date().toISOString(),
      }, { onConflict: "session_id,user_id" })
      .select("id")
      .single()
      .then(({ data }: any) => { if (data?.id) threadIdRef.current = data.id; });
  }, [sessionId, workshopId]);

  const ask = useCallback(async (text: string) => {
    if (!text.trim() || !sessionId) return;
    const userMsg: CopilotMsg = { role: "user", content: text, ts: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setStreaming(true);
    try {
      const { data, error } = await supabase.functions.invoke("challenge-agent", {
        body: {
          mode: "copilot",
          session_id: sessionId,
          context: ctx,
          messages: next.map(m => ({ role: m.role, content: m.content })),
        },
      });
      if (error || !data?.answer) { toast.error("L'IA n'a pas répondu"); return; }
      const assistant: CopilotMsg = { role: "assistant", content: data.answer, ts: Date.now() };
      const final = [...next, assistant];
      setMessages(final);
      persist(final);
    } finally { setStreaming(false); }
  }, [sessionId, messages, ctx, persist]);

  const reset = useCallback(() => {
    setMessages([]);
    persist([]);
  }, [persist]);

  return { messages, loading, streaming, ask, reset };
}
