import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminPractice {
  id: string;
  title: string;
  scenario: string;
  system_prompt: string;
  practice_type: string;
  type_config: any;
  evaluation_rubric: any[];
  evaluation_dimensions: any[];
  ai_assistance_level: string;
  phases: any[];
  max_exchanges: number;
  difficulty: string | null;
  tags: string[];
  module_id: string | null;
  organization_id: string | null;
  is_public: boolean;
  coaching_mode: string;
  objectives: any[];
  success_criteria: any;
  evaluation_strategy: string;
  evaluation_weights: any;
  restitution_template: any;
  attached_data: any[];
  model_override: string | null;
  temperature_override: number | null;
  audience: string | null;
  universe: string | null;
  estimated_minutes: number | null;
  hints: any[];
  guardrails: any[];
  status: string;
  created_at: string;
  updated_at: string;
}

export function useAdminPractices() {
  return useQuery({
    queryKey: ["admin-practices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_practices")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AdminPractice[];
    },
  });
}

export function usePracticeOrganizations(practiceId?: string) {
  return useQuery({
    queryKey: ["practice-organizations", practiceId],
    queryFn: async () => {
      if (!practiceId) return [];
      const { data, error } = await supabase
        .from("practice_organizations")
        .select("id, organization_id, assigned_at, organizations(id, name)")
        .eq("practice_id", practiceId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!practiceId,
  });
}

export function usePracticeAssignments(practiceId?: string) {
  return useQuery({
    queryKey: ["practice-assignments", practiceId],
    queryFn: async () => {
      if (!practiceId) return [];
      const { data, error } = await supabase
        .from("practice_user_assignments")
        .select("*")
        .eq("practice_id", practiceId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!practiceId,
  });
}

export function usePracticeVersions(practiceId?: string) {
  return useQuery({
    queryKey: ["practice-versions", practiceId],
    queryFn: async () => {
      if (!practiceId) return [];
      const { data, error } = await supabase
        .from("practice_versions")
        .select("*")
        .eq("practice_id", practiceId)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!practiceId,
  });
}

export function useUpdatePractice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<AdminPractice> }) => {
      const { error } = await supabase
        .from("academy_practices")
        .update(patch as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-practices"] });
      qc.invalidateQueries({ queryKey: ["practice", vars.id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erreur de sauvegarde"),
  });
}

export function useCreatePractice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<AdminPractice>) => {
      const { data, error } = await supabase
        .from("academy_practices")
        .insert({
          title: payload.title ?? "Nouvelle pratique",
          practice_type: payload.practice_type ?? "conversation",
          scenario: payload.scenario ?? "",
          system_prompt: payload.system_prompt ?? "",
          ...(payload as any),
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as AdminPractice;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-practices"] }),
  });
}

export function useDeletePractice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academy_practices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-practices"] }),
  });
}

export function useDuplicatePractice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: src, error: e1 } = await supabase
        .from("academy_practices").select("*").eq("id", id).single();
      if (e1) throw e1;
      const { id: _id, created_at: _c, updated_at: _u, ...rest } = src as any;
      const { data, error } = await supabase
        .from("academy_practices")
        .insert({ ...rest, title: `${rest.title} (copie)`, status: "draft" })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-practices"] });
      toast.success("Pratique dupliquée");
    },
  });
}

export function useSnapshotPractice() {
  return useMutation({
    mutationFn: async ({ practiceId, summary }: { practiceId: string; summary?: string }) => {
      const { data: practice } = await supabase
        .from("academy_practices").select("*").eq("id", practiceId).single();
      const { data: last } = await supabase
        .from("practice_versions")
        .select("version_number").eq("practice_id", practiceId)
        .order("version_number", { ascending: false }).limit(1).maybeSingle();
      const next = (last?.version_number ?? 0) + 1;
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("practice_versions").insert({
        practice_id: practiceId,
        version_number: next,
        snapshot: practice as any,
        change_summary: summary ?? "Auto-snapshot",
        changed_by: user?.id,
      });
      if (error) throw error;
    },
  });
}

export function usePracticeAnalytics(practiceId?: string) {
  return useQuery({
    queryKey: ["practice-analytics", practiceId],
    queryFn: async () => {
      if (!practiceId) return null;
      const { data: sessions } = await supabase
        .from("academy_practice_sessions")
        .select("id, score, completed_at, started_at")
        .eq("practice_id", practiceId);
      const total = sessions?.length ?? 0;
      const completed = sessions?.filter(s => s.completed_at).length ?? 0;
      const scores = (sessions ?? []).map(s => s.score).filter((s): s is number => typeof s === "number");
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      return { total, completed, completionRate: total ? Math.round((completed / total) * 100) : 0, avgScore };
    },
    enabled: !!practiceId,
  });
}

export function useAddPracticeOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ practiceId, organizationId }: { practiceId: string; organizationId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("practice_organizations")
        .insert({ practice_id: practiceId, organization_id: organizationId, assigned_by: user?.id });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["practice-organizations", v.practiceId] }),
  });
}

export function useRemovePracticeOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, practiceId }: { id: string; practiceId: string }) => {
      const { error } = await supabase.from("practice_organizations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["practice-organizations", v.practiceId] }),
  });
}

export function useAddPracticeAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { practiceId: string; userId: string; organizationId?: string; dueDate?: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("practice_user_assignments").insert({
        practice_id: payload.practiceId,
        user_id: payload.userId,
        organization_id: payload.organizationId ?? null,
        due_date: payload.dueDate ?? null,
        notes: payload.notes ?? null,
        assigned_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["practice-assignments", v.practiceId] }),
  });
}

export function useRemovePracticeAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, practiceId }: { id: string; practiceId: string }) => {
      const { error } = await supabase.from("practice_user_assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["practice-assignments", v.practiceId] }),
  });
}
