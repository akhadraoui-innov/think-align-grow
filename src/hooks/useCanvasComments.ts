import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface CanvasComment {
  id: string;
  workshop_id: string;
  canvas_item_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export function useCanvasComments(workshopId: string | undefined, itemId: string | null) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CanvasComment[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch comments for selected item
  useEffect(() => {
    if (!workshopId || !itemId) {
      setComments([]);
      return;
    }

    setLoading(true);
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("workshop_comments")
        .select("*")
        .eq("canvas_item_id", itemId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
        return;
      }
      setComments((data || []) as unknown as CanvasComment[]);
      setLoading(false);
    };

    fetchComments();
  }, [workshopId, itemId]);

  // Realtime subscription
  useEffect(() => {
    if (!workshopId || !itemId) return;

    const channel = supabase
      .channel(`comments-${itemId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "workshop_comments",
        filter: `canvas_item_id=eq.${itemId}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setComments(prev => [...prev, payload.new as unknown as CanvasComment]);
        } else if (payload.eventType === "DELETE") {
          setComments(prev => prev.filter(c => c.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [workshopId, itemId]);

  // Add comment
  const addComment = useCallback(async (content: string) => {
    if (!workshopId || !itemId || !user || !content.trim()) return;

    const { error } = await supabase
      .from("workshop_comments")
      .insert({
        workshop_id: workshopId,
        canvas_item_id: itemId,
        user_id: user.id,
        content: content.trim(),
      });

    if (error) {
      toast.error("Erreur lors de l'ajout du commentaire");
      console.error(error);
    }
  }, [workshopId, itemId, user]);

  // Delete comment
  const deleteComment = useCallback(async (commentId: string) => {
    const { error } = await supabase
      .from("workshop_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  }, []);

  return {
    comments,
    loading,
    addComment,
    deleteComment,
  };
}
