import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type CanvasItemType = "card" | "sticky" | "group" | "arrow" | "icon" | "text";

export interface CanvasItem {
  id: string;
  workshop_id: string;
  type: CanvasItemType;
  card_id: string | null;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  content: Record<string, any>;
  color: string | null;
  created_by: string;
  from_item_id: string | null;
  to_item_id: string | null;
  parent_group_id: string | null;
  z_index: number;
  created_at: string;
  updated_at: string;
}

export function useCanvasItems(workshopId: string | undefined) {
  const { user } = useAuth();
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Fetch initial items
  useEffect(() => {
    if (!workshopId) return;
    
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from("workshop_canvas_items")
        .select("*")
        .eq("workshop_id", workshopId)
        .order("z_index");
      
      if (error) {
        console.error("Error fetching canvas items:", error);
        return;
      }
      setItems((data || []) as unknown as CanvasItem[]);
      setLoading(false);
    };
    
    fetchItems();
  }, [workshopId]);

  // Realtime subscription
  useEffect(() => {
    if (!workshopId) return;

    const channel = supabase
      .channel(`canvas-${workshopId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "workshop_canvas_items",
        filter: `workshop_id=eq.${workshopId}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setItems(prev => [...prev, payload.new as unknown as CanvasItem]);
        } else if (payload.eventType === "UPDATE") {
          setItems(prev => prev.map(item => 
            item.id === (payload.new as any).id ? payload.new as unknown as CanvasItem : item
          ));
        } else if (payload.eventType === "DELETE") {
          setItems(prev => prev.filter(item => item.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [workshopId]);

  // Add item
  const addItem = useCallback(async (
    type: CanvasItemType,
    x: number,
    y: number,
    options: {
      card_id?: string;
      content?: Record<string, any>;
      color?: string;
      width?: number;
      height?: number;
    } = {}
  ) => {
    if (!workshopId || !user) return null;

    const maxZ = items.reduce((max, item) => Math.max(max, item.z_index), 0);

    const { data, error } = await supabase
      .from("workshop_canvas_items")
      .insert({
        workshop_id: workshopId,
        type,
        x,
        y,
        card_id: options.card_id || null,
        content: options.content || {},
        color: options.color || null,
        width: options.width || null,
        height: options.height || null,
        created_by: user.id,
        z_index: maxZ + 1,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
      return null;
    }

    return data as unknown as CanvasItem;
  }, [workshopId, user, items]);

  // Update position (debounced)
  const updatePosition = useCallback((itemId: string, x: number, y: number) => {
    // Update local state immediately
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, x, y } : item
    ));

    // Debounce DB update
    const existing = debounceTimers.current.get(itemId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      await supabase
        .from("workshop_canvas_items")
        .update({ x, y })
        .eq("id", itemId);
      debounceTimers.current.delete(itemId);
    }, 300);

    debounceTimers.current.set(itemId, timer);
  }, []);

  // Update content (merges with existing content)
  const updateContent = useCallback(async (itemId: string, content: Record<string, any>) => {
    let mergedContent = content;
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        mergedContent = { ...item.content, ...content };
        return { ...item, content: mergedContent };
      }
      return item;
    }));

    await supabase
      .from("workshop_canvas_items")
      .update({ content: mergedContent })
      .eq("id", itemId);
  }, []);

  // Update size (for groups)
  const updateSize = useCallback(async (itemId: string, width: number, height: number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, width, height } : item
    ));

    await supabase
      .from("workshop_canvas_items")
      .update({ width, height })
      .eq("id", itemId);
  }, []);

  // Update color
  const updateColor = useCallback(async (itemId: string, color: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, color } : item
    ));

    await supabase
      .from("workshop_canvas_items")
      .update({ color })
      .eq("id", itemId);
  }, []);

  // Bring to front
  const bringToFront = useCallback(async (itemId: string) => {
    const maxZ = items.reduce((max, item) => Math.max(max, item.z_index), 0);
    
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, z_index: maxZ + 1 } : item
    ));

    await supabase
      .from("workshop_canvas_items")
      .update({ z_index: maxZ + 1 })
      .eq("id", itemId);
  }, [items]);

  // Delete item
  const deleteItem = useCallback(async (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));

    const { error } = await supabase
      .from("workshop_canvas_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  }, []);

  // Create arrow
  const createArrow = useCallback(async (fromItemId: string, toItemId: string) => {
    if (!workshopId || !user) return null;

    const maxZ = items.reduce((max, item) => Math.max(max, item.z_index), 0);

    const { data, error } = await supabase
      .from("workshop_canvas_items")
      .insert({
        workshop_id: workshopId,
        type: "arrow" as CanvasItemType,
        x: 0,
        y: 0,
        from_item_id: fromItemId,
        to_item_id: toItemId,
        created_by: user.id,
        z_index: maxZ + 1,
        content: {},
      })
      .select()
      .single();

    if (error) {
      toast.error("Erreur lors de la création de la flèche");
      console.error(error);
      return null;
    }

    return data as unknown as CanvasItem;
  }, [workshopId, user, items]);

  return {
    items,
    loading,
    addItem,
    updatePosition,
    updateContent,
    updateSize,
    updateColor,
    bringToFront,
    deleteItem,
    createArrow,
  };
}
