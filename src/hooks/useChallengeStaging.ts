import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { CardFormat } from "@/components/challenge/FormatSelector";

export interface StagingItem {
  id: string;
  workshop_id: string;
  subject_id: string;
  card_id: string;
  user_id: string;
  format: string;
  sort_order: number;
  created_at: string;
}

export function useChallengeStaging(workshopId: string | undefined) {
  const { user } = useAuth();
  const [items, setItems] = useState<StagingItem[]>([]);

  useEffect(() => {
    if (!workshopId) return;
    supabase
      .from("challenge_staging")
      .select("*")
      .eq("workshop_id", workshopId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setItems(data as StagingItem[]);
      });
  }, [workshopId]);

  // Realtime
  useEffect(() => {
    if (!workshopId) return;
    const channel = supabase
      .channel(`challenge-staging-${workshopId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "challenge_staging",
        filter: `workshop_id=eq.${workshopId}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setItems(prev => [...prev.filter(i => i.id !== (payload.new as StagingItem).id), payload.new as StagingItem]
            .sort((a, b) => a.sort_order - b.sort_order));
        } else if (payload.eventType === "DELETE") {
          setItems(prev => prev.filter(i => i.id !== (payload.old as any).id));
        } else if (payload.eventType === "UPDATE") {
          setItems(prev => prev.map(i => i.id === (payload.new as StagingItem).id ? payload.new as StagingItem : i)
            .sort((a, b) => a.sort_order - b.sort_order));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workshopId]);

  const stageCard = useCallback(async (subjectId: string, cardId: string) => {
    if (!workshopId || !user) return;
    if (items.some(i => i.card_id === cardId && i.subject_id === subjectId)) return;
    const maxOrder = items.reduce((max, i) => Math.max(max, i.sort_order), 0);
    const { error } = await supabase
      .from("challenge_staging")
      .upsert({
        workshop_id: workshopId,
        subject_id: subjectId,
        card_id: cardId,
        user_id: user.id,
        sort_order: maxOrder + 1,
      }, { onConflict: "workshop_id,subject_id,card_id,user_id" });
    if (error) toast.error("Erreur lors de l'ajout en zone de tri");
  }, [workshopId, user, items]);

  const unstageCard = useCallback(async (itemId: string) => {
    const removed = items.find(i => i.id === itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
    const { error } = await supabase
      .from("challenge_staging")
      .delete()
      .eq("id", itemId);
    if (error) {
      if (removed) setItems(prev => [...prev, removed].sort((a, b) => a.sort_order - b.sort_order));
      toast.error("Erreur lors du retrait de la zone de tri");
    }
  }, [items]);

  const updateStagingFormat = useCallback(async (itemId: string, format: CardFormat) => {
    const { error } = await supabase
      .from("challenge_staging")
      .update({ format })
      .eq("id", itemId);
    if (error) toast.error("Erreur lors du changement de format");
  }, []);

  const reorderItems = useCallback(async (draggedItemId: string, targetItemId: string) => {
    if (draggedItemId === targetItemId) return;

    setItems(prev => {
      const newItems = [...prev];
      const dragIdx = newItems.findIndex(i => i.id === draggedItemId);
      const targetIdx = newItems.findIndex(i => i.id === targetItemId);
      if (dragIdx === -1 || targetIdx === -1) return prev;

      const [dragged] = newItems.splice(dragIdx, 1);
      newItems.splice(targetIdx, 0, dragged);

      // Update sort_order locally
      const updated = newItems.map((item, idx) => ({ ...item, sort_order: idx }));

      // Persist in background
      Promise.all(
        updated.map(item =>
          supabase.from("challenge_staging").update({ sort_order: item.sort_order }).eq("id", item.id)
        )
      ).catch(() => toast.error("Erreur lors du réordonnancement"));

      return updated;
    });
  }, []);

  return { items, stageCard, unstageCard, updateStagingFormat, reorderItems };
}
