import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Workshop {
  id: string;
  code: string;
  name: string;
  host_id: string;
  status: "lobby" | "active" | "paused" | "completed";
  current_card_id: string | null;
  current_step: number;
  config: any;
  timer_seconds: number | null;
  timer_started_at: string | null;
  created_at: string;
}

export interface WorkshopParticipant {
  id: string;
  workshop_id: string;
  user_id: string;
  display_name: string;
  role: "host" | "participant";
  is_connected: boolean;
  joined_at: string;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function useCreateWorkshop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const create = async (name: string, config: any = {}) => {
    if (!user) {
      toast.error("Connectez-vous pour créer un workshop");
      return;
    }
    setLoading(true);
    try {
      const code = generateCode();
      const { data: workshop, error } = await supabase
        .from("workshops")
        .insert({ name, code, host_id: user.id, config })
        .select()
        .single();
      if (error) throw error;

      // Add host as participant
      const profile = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
      await supabase.from("workshop_participants").insert({
        workshop_id: workshop.id,
        user_id: user.id,
        display_name: profile.data?.display_name || "Animateur",
        role: "host",
      });

      navigate(`/workshop/${workshop.id}`);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return { create, loading };
}

export function useJoinWorkshop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const join = async (code: string) => {
    if (!user) {
      toast.error("Connectez-vous pour rejoindre un workshop");
      return;
    }
    setLoading(true);
    try {
      const { data: workshop, error } = await supabase
        .from("workshops")
        .select("*")
        .eq("code", code.toUpperCase().trim())
        .single();
      if (error || !workshop) throw new Error("Code invalide ou workshop introuvable");
      if (workshop.status === "completed") throw new Error("Ce workshop est terminé");

      const profile = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
      await supabase.from("workshop_participants").upsert({
        workshop_id: workshop.id,
        user_id: user.id,
        display_name: profile.data?.display_name || "Participant",
        role: "participant",
        is_connected: true,
      }, { onConflict: "workshop_id,user_id" });

      navigate(`/workshop/${workshop.id}`);
    } catch (e: any) {
      toast.error(e.message || "Impossible de rejoindre");
    } finally {
      setLoading(false);
    }
  };

  return { join, loading };
}

export function useWorkshopRoom(workshopId: string | undefined) {
  const { user } = useAuth();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [participants, setParticipants] = useState<WorkshopParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  const isHost = workshop?.host_id === user?.id;

  // Fetch initial data
  useEffect(() => {
    if (!workshopId) return;
    
    const fetchData = async () => {
      const [wRes, pRes] = await Promise.all([
        supabase.from("workshops").select("*").eq("id", workshopId).single(),
        supabase.from("workshop_participants").select("*").eq("workshop_id", workshopId),
      ]);
      if (wRes.data) setWorkshop(wRes.data as unknown as Workshop);
      if (pRes.data) setParticipants(pRes.data as unknown as WorkshopParticipant[]);
      setLoading(false);
    };
    fetchData();
  }, [workshopId]);

  // Realtime subscriptions
  useEffect(() => {
    if (!workshopId) return;

    const channel = supabase
      .channel(`workshop-${workshopId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "workshops",
        filter: `id=eq.${workshopId}`,
      }, (payload) => {
        if (payload.eventType === "UPDATE") {
          setWorkshop(payload.new as unknown as Workshop);
        }
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "workshop_participants",
        filter: `workshop_id=eq.${workshopId}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setParticipants(prev => [...prev.filter(p => p.id !== (payload.new as any).id), payload.new as unknown as WorkshopParticipant]);
        } else if (payload.eventType === "UPDATE") {
          setParticipants(prev => prev.map(p => p.id === (payload.new as any).id ? payload.new as unknown as WorkshopParticipant : p));
        } else if (payload.eventType === "DELETE") {
          setParticipants(prev => prev.filter(p => p.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [workshopId]);

  // Host controls
  const updateWorkshop = useCallback(async (updates: any) => {
    if (!workshopId || !isHost) return;
    await supabase.from("workshops").update(updates).eq("id", workshopId);
  }, [workshopId, isHost]);

  const startWorkshop = () => updateWorkshop({ status: "active" });
  const pauseWorkshop = () => updateWorkshop({ status: "paused" });
  const resumeWorkshop = () => updateWorkshop({ status: "active" });
  const completeWorkshop = () => updateWorkshop({ status: "completed" });

  const goToCard = (cardId: string, step: number) => updateWorkshop({ 
    current_card_id: cardId, 
    current_step: step 
  } as any);

  return {
    workshop,
    participants,
    loading,
    isHost,
    startWorkshop,
    pauseWorkshop,
    resumeWorkshop,
    completeWorkshop,
    goToCard,
    updateWorkshop,
  };
}

export interface MyWorkshopItem {
  id: string;
  name: string;
  code: string;
  status: Workshop["status"];
  created_at: string;
  host_id: string;
  config: any;
  role: string;
  participant_count: number;
}

export function useMyWorkshops() {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<MyWorkshopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWorkshops([]);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      // Get workshops where user is participant
      const { data: participations } = await supabase
        .from("workshop_participants")
        .select("workshop_id, role")
        .eq("user_id", user.id);

      if (!participations || participations.length === 0) {
        setWorkshops([]);
        setLoading(false);
        return;
      }

      const workshopIds = participations.map((p) => p.workshop_id);
      const roleMap = Object.fromEntries(participations.map((p) => [p.workshop_id, p.role]));

      const { data: ws } = await supabase
        .from("workshops")
        .select("id, name, code, status, created_at, host_id")
        .in("id", workshopIds)
        .order("created_at", { ascending: false });

      // Get participant counts
      const { data: allParticipants } = await supabase
        .from("workshop_participants")
        .select("workshop_id")
        .in("workshop_id", workshopIds);

      const countMap: Record<string, number> = {};
      allParticipants?.forEach((p) => {
        countMap[p.workshop_id] = (countMap[p.workshop_id] || 0) + 1;
      });

      const items: MyWorkshopItem[] = (ws || []).map((w) => ({
        ...w,
        status: w.status as Workshop["status"],
        role: roleMap[w.id] || "participant",
        participant_count: countMap[w.id] || 0,
      }));

      setWorkshops(items);
      setLoading(false);
    };

    fetch();
  }, [user]);

  return { workshops, loading };
}
