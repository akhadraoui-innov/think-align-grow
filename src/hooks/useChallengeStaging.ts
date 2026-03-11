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
          setItems(prev => [...prev.filter(i => i.id !== (payload.new as StagingItem).id), payload.new as StagingItem]);
        } else if (payload.eventType === "DELETE") {
          setItems(prev => prev.filter(i => i.id !== (payload.old as any).id));
        } else if (payload.eventType === "UPDATE") {
          setItems(prev => prev.map(i => i.id === (payload.new as StagingItem).id ? payload.new as StagingItem : i));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workshopId]);

  const stageCard = useCallback(async (subjectId: string, cardId: string) => {
    if (!workshopId || !user) return;
    // Local dedup check
    if (items.some(i => i.card_id === cardId && i.subject_id === subjectId)) return;
    const { error } = await supabase
      .from("challenge_staging")
      .upsert({
        workshop_id: workshopId,
        subject_id: subjectId,
        card_id: cardId,
        user_id: user.id,
      }, { onConflict: "workshop_id,subject_id,card_id,user_id" });
    if (error) toast.error("Erreur lors de l'ajout en zone de tri");
  }, [workshopId, user, items]);

  const unstageCard = useCallback(async (itemId: string) => {
    // Optimistic removal
    const removed = items.find(i => i.id === itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
    const { error } = await supabase
      .from("challenge_staging")
      .delete()
      .eq("id", itemId);
    if (error) {
      // Rollback
      if (removed) setItems(prev => [...prev, removed]);
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

  return { items, stageCard, unstageCard, updateStagingFormat };
}
