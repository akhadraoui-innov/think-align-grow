import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/hooks/useAuth";

export function useUCMProjects() {
  const { activeOrgId } = useActiveOrg();
  return useQuery({
    queryKey: ["ucm-projects", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ucm_projects")
        .select("*, ucm_sectors(label, icon), ucm_use_cases(count)")
        .eq("organization_id", activeOrgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUCMProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ["ucm-project", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ucm_projects")
        .select("*, ucm_sectors(*)")
        .eq("id", projectId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUCMUseCases(projectId: string | undefined) {
  return useQuery({
    queryKey: ["ucm-use-cases", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ucm_use_cases")
        .select("*")
        .eq("project_id", projectId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useUCMAnalyses(projectId: string | undefined) {
  return useQuery({
    queryKey: ["ucm-analyses", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ucm_analyses")
        .select("*")
        .eq("project_id", projectId!)
        .eq("is_current", true);
      if (error) throw error;
      return data;
    },
  });
}

export function useUCMGlobalSections(projectId: string | undefined) {
  return useQuery({
    queryKey: ["ucm-global-sections", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ucm_global_sections")
        .select("*")
        .eq("project_id", projectId!)
        .eq("is_current", true);
      if (error) throw error;
      return data;
    },
  });
}

export function useUCMSectors() {
  return useQuery({
    queryKey: ["ucm-sectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ucm_sectors")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useUCMAnalysisSections() {
  return useQuery({
    queryKey: ["ucm-analysis-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ucm_analysis_sections")
        .select("*")
        .is("organization_id", null)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateUCMProject() {
  const qc = useQueryClient();
  const { activeOrgId } = useActiveOrg();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { company: string; context?: string }) => {
      const { data: project, error } = await supabase
        .from("ucm_projects")
        .insert({ ...data, organization_id: activeOrgId!, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return project;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ucm-projects"] }),
  });
}

export function useGenerateUCM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data, error } = await supabase.functions.invoke("ucm-generate", {
        body: { project_id: projectId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, projectId) => {
      qc.invalidateQueries({ queryKey: ["ucm-use-cases", projectId] });
      qc.invalidateQueries({ queryKey: ["ucm-project", projectId] });
    },
  });
}

export function useAnalyzeUCM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { use_case_id: string; section_id: string; mode?: string; project_id: string }) => {
      const { data, error } = await supabase.functions.invoke("ucm-analyze", {
        body: { use_case_id: params.use_case_id, section_id: params.section_id, mode: params.mode || "brief" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ["ucm-analyses", params.project_id] });
    },
  });
}

export function useSynthesizeUCM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { project_id: string; section_id: string }) => {
      const { data, error } = await supabase.functions.invoke("ucm-synthesize", {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ["ucm-global-sections", params.project_id] });
    },
  });
}
