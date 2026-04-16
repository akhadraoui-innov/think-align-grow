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
  const qc = useQueryClient();
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
      return next;
    },
    onSuccess: (_n, v) => qc.invalidateQueries({ queryKey: ["practice-versions", v.practiceId] }),
  });
}

export function useRestoreVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ practiceId, snapshot }: { practiceId: string; snapshot: any }) => {
      const { id, created_at, updated_at, ...rest } = snapshot ?? {};
      const { error } = await supabase
        .from("academy_practices")
        .update(rest)
        .eq("id", practiceId);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["admin-practices"] });
      qc.invalidateQueries({ queryKey: ["practice-versions", v.practiceId] });
      toast.success("Version restaurée");
    },
    onError: (e: any) => toast.error(e.message ?? "Erreur de restauration"),
  });
}

export function usePracticeAnalytics(practiceId?: string) {
  return useQuery({
    queryKey: ["practice-analytics", practiceId],
    queryFn: async () => {
      if (!practiceId) return null;
      const { data: sessions } = await supabase
        .from("academy_practice_sessions")
        .select("id, score, completed_at, started_at, metadata")
        .eq("practice_id", practiceId);
      const all = sessions ?? [];
      const total = all.length;
      const completed = all.filter(s => s.completed_at).length;
      const scores = all.map(s => s.score).filter((s): s is number => typeof s === "number");
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      // Per variant
      const variants: Record<string, { label: string; total: number; completed: number; avg: number; scores: number[] }> = {};
      for (const s of all) {
        const vId = (s.metadata as any)?.variant_id ?? "default";
        const vLabel = (s.metadata as any)?.variant_label ?? "Sans variante";
        if (!variants[vId]) variants[vId] = { label: vLabel, total: 0, completed: 0, avg: 0, scores: [] };
        variants[vId].total++;
        if (s.completed_at) variants[vId].completed++;
        if (typeof s.score === "number") variants[vId].scores.push(s.score);
      }
      Object.values(variants).forEach(v => {
        v.avg = v.scores.length ? Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length) : 0;
      });

      return {
        total,
        completed,
        completionRate: total ? Math.round((completed / total) * 100) : 0,
        avgScore,
        variants,
      };
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

// ── Practice Variants (A/B) ──
export function usePracticeVariants(practiceId?: string) {
  return useQuery({
    queryKey: ["practice-variants", practiceId],
    queryFn: async () => {
      if (!practiceId) return [];
      const { data, error } = await supabase
        .from("practice_variants")
        .select("*")
        .eq("practice_id", practiceId)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!practiceId,
  });
}

export function useUpsertVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id?: string; practice_id: string; variant_label: string; system_prompt: string; weight: number; is_active?: boolean }) => {
      if (payload.id) {
        const { error } = await supabase.from("practice_variants").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("practice_variants").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["practice-variants", v.practice_id] }),
    onError: (e: any) => toast.error(e.message ?? "Erreur variante"),
  });
}

export function useDeleteVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; practice_id: string }) => {
      const { error } = await supabase.from("practice_variants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["practice-variants", v.practice_id] }),
  });
}

// ── Practice Blocks Library ──
export function usePracticeBlocks(kind?: string) {
  return useQuery({
    queryKey: ["practice-blocks", kind ?? "all"],
    queryFn: async () => {
      let q = supabase.from("practice_blocks").select("*").order("updated_at", { ascending: false });
      if (kind) q = q.eq("kind", kind);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id?: string; kind: string; name: string; description?: string; content: any; is_global?: boolean; tags?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (payload.id) {
        const { error } = await supabase.from("practice_blocks").update(payload as any).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("practice_blocks").insert({
          kind: payload.kind,
          name: payload.name,
          description: payload.description ?? "",
          content: payload.content,
          is_global: payload.is_global ?? true,
          tags: payload.tags ?? [],
          created_by: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["practice-blocks"] });
      toast.success("Bloc enregistré");
    },
    onError: (e: any) => toast.error(e.message ?? "Erreur bloc"),
  });
}

export function useDeleteBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("practice_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["practice-blocks"] }),
  });
}

// ── AI Co-pilot ──
export function useCopilot() {
  return useMutation({
    mutationFn: async ({ action, context }: { action: string; context: any }) => {
      const { data, error } = await supabase.functions.invoke("practice-copilot", {
        body: { action, context },
      });
      if (error) throw error;
      return data?.result ?? data;
    },
    onError: (e: any) => toast.error(e.message ?? "Erreur Co-pilote"),
  });
}
