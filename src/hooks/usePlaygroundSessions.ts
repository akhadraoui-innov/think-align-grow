import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Placement = {
  card_id: string;
  x_pct: number;
  y_pct: number;
  scale: number;
  z: number;
};

export type SessionCategory = {
  type: "all" | "phase" | "pillar";
  value: string | null;
};

export type PlaygroundSession = {
  id: string;
  toolkit_id: string;
  user_id: string;
  name: string;
  layout: string;
  card_scale_global: number;
  placements: Placement[];
  category: SessionCategory | null;
  created_at: string;
  updated_at: string;
};

export function usePlaygroundSessions(toolkitId: string | undefined) {
  const qc = useQueryClient();

  const { data: sessions = [], refetch } = useQuery({
    queryKey: ["playground-sessions", toolkitId],
    enabled: !!toolkitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playground_sessions")
        .select("*")
        .eq("toolkit_id", toolkitId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PlaygroundSession[];
    },
  });

  const create = useCallback(
    async (params: {
      name: string;
      placements: Placement[];
      card_scale_global: number;
      category: SessionCategory | null;
    }) => {
      if (!toolkitId) return null;
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        toast.error("Non authentifié");
        return null;
      }
      const { data, error } = await supabase
        .from("playground_sessions")
        .insert({
          toolkit_id: toolkitId,
          user_id: u.user.id,
          name: params.name,
          layout: "plateau",
          card_scale_global: params.card_scale_global,
          placements: params.placements as any,
          category: params.category as any,
        })
        .select("*")
        .single();
      if (error) {
        toast.error("Échec sauvegarde : " + error.message);
        return null;
      }
      qc.invalidateQueries({ queryKey: ["playground-sessions", toolkitId] });
      return data as unknown as PlaygroundSession;
    },
    [toolkitId, qc]
  );

  const update = useCallback(
    async (
      id: string,
      patch: Partial<Pick<PlaygroundSession, "name" | "placements" | "card_scale_global" | "category">>
    ) => {
      const { error } = await supabase
        .from("playground_sessions")
        .update(patch as any)
        .eq("id", id);
      if (error) {
        toast.error("Auto-save échouée");
        return false;
      }
      qc.invalidateQueries({ queryKey: ["playground-sessions", toolkitId] });
      return true;
    },
    [qc, toolkitId]
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("playground_sessions").delete().eq("id", id);
      if (error) {
        toast.error("Suppression échouée");
        return false;
      }
      qc.invalidateQueries({ queryKey: ["playground-sessions", toolkitId] });
      return true;
    },
    [qc, toolkitId]
  );

  return { sessions, refetch, create, update, remove };
}

/** Auto-save debounced quand une session est active */
export function useAutoSave(
  activeId: string | null,
  payload: { placements: Placement[]; card_scale_global: number; category: SessionCategory | null },
  update: (id: string, patch: any) => Promise<boolean>,
  delay = 2000
) {
  const timer = useRef<number | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (!activeId) return;
    if (first.current) {
      first.current = false;
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      update(activeId, payload);
    }, delay);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, JSON.stringify(payload)]);
}
