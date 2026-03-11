import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminWorkshops() {
  const list = useQuery({
    queryKey: ["admin-workshops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workshops")
        .select("*, organizations(id, name, slug, primary_color)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch host profiles and participant counts
  const extras = useQuery({
    queryKey: ["admin-workshops-extras"],
    enabled: !!list.data?.length,
    queryFn: async () => {
      const hostIds = [...new Set(list.data!.map((w) => w.host_id))];
      const workshopIds = list.data!.map((w) => w.id);

      const [profilesRes, participantsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, email").in("user_id", hostIds),
        supabase.from("workshop_participants").select("workshop_id").in("workshop_id", workshopIds),
      ]);

      const profileMap: Record<string, { display_name: string | null; email: string | null }> = {};
      for (const p of profilesRes.data || []) {
        profileMap[p.user_id] = p;
      }

      const countMap: Record<string, number> = {};
      for (const p of participantsRes.data || []) {
        countMap[p.workshop_id] = (countMap[p.workshop_id] || 0) + 1;
      }

      return { profileMap, countMap };
    },
  });

  return {
    workshops: list.data || [],
    isLoading: list.isLoading,
    profileMap: extras.data?.profileMap || {},
    participantCountMap: extras.data?.countMap || {},
  };
}
