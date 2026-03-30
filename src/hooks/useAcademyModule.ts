import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMemo, useEffect, useCallback, useRef, useState } from "react";

export function useAcademyModule(moduleId: string | undefined, pathId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const startTimeRef = useRef(Date.now());

  // Reset timer on module change
  useEffect(() => { startTimeRef.current = Date.now(); }, [moduleId]);

  const { data: module, isLoading } = useQuery({
    queryKey: ["academy-module", moduleId],
    enabled: !!moduleId,
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_modules").select("*").eq("id", moduleId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: contents = [] } = useQuery({
    queryKey: ["academy-module-contents", moduleId],
    enabled: !!moduleId,
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_contents").select("*").eq("module_id", moduleId!).order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: pathData } = useQuery({
    queryKey: ["academy-path-name", pathId],
    enabled: !!pathId,
    queryFn: async () => {
      const { data } = await supabase.from("academy_paths").select("name, description, difficulty, certificate_enabled").eq("id", pathId!).single();
      return data;
    },
  });

  const { data: pathModules = [] } = useQuery({
    queryKey: ["academy-path-modules-nav", pathId],
    enabled: !!pathId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_path_modules")
        .select("module_id, sort_order, academy_modules(id, title, module_type, estimated_minutes, description)")
        .eq("path_id", pathId!)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: enrollment } = useQuery({
    queryKey: ["academy-enrollment-for-module", pathId, user?.id],
    enabled: !!pathId && !!user,
    queryFn: async () => {
      const { data } = await supabase.from("academy_enrollments").select("*").eq("path_id", pathId!).eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: currentProgress } = useQuery({
    queryKey: ["academy-module-progress", enrollment?.id, moduleId],
    enabled: !!enrollment && !!moduleId,
    queryFn: async () => {
      const { data } = await supabase.from("academy_progress").select("*").eq("enrollment_id", enrollment!.id).eq("module_id", moduleId!).maybeSingle();
      return data;
    },
  });

  const { data: allProgress = [] } = useQuery({
    queryKey: ["academy-all-progress-sidebar", enrollment?.id],
    enabled: !!enrollment,
    queryFn: async () => {
      const { data } = await supabase.from("academy_progress").select("module_id, status, score, time_spent_seconds").eq("enrollment_id", enrollment!.id);
      return data || [];
    },
  });

  const progressMap = useMemo(() => new Map(allProgress.map((p: any) => [p.module_id, p])), [allProgress]);
  const currentIndex = pathModules.findIndex((pm: any) => pm.module_id === moduleId);
  const nextModule = currentIndex >= 0 && currentIndex < pathModules.length - 1 ? pathModules[currentIndex + 1] : null;
  const prevModule = currentIndex > 0 ? pathModules[currentIndex - 1] : null;
  const completedCount = allProgress.filter((p: any) => p.status === "completed").length;
  const progressPct = pathModules.length > 0 ? Math.round((completedCount / pathModules.length) * 100) : 0;
  const isCompleted = (currentProgress as any)?.status === "completed";
  const totalTimeSpent = allProgress.reduce((s: number, p: any) => s + (p.time_spent_seconds || 0), 0);

  // Prefetch adjacent modules
  useEffect(() => {
    if (!pathModules.length || currentIndex < 0) return;
    const adjacent = [nextModule, prevModule].filter(Boolean);
    adjacent.forEach((pm: any) => {
      qc.prefetchQuery({
        queryKey: ["academy-module", pm.module_id],
        queryFn: async () => {
          const { data } = await supabase.from("academy_modules").select("*").eq("id", pm.module_id).single();
          return data;
        },
        staleTime: 5 * 60_000,
      });
      qc.prefetchQuery({
        queryKey: ["academy-module-contents", pm.module_id],
        queryFn: async () => {
          const { data } = await supabase.from("academy_contents").select("*").eq("module_id", pm.module_id).order("sort_order");
          return data || [];
        },
        staleTime: 5 * 60_000,
      });
    });
  }, [currentIndex, pathModules, nextModule, prevModule, qc]);

  const [certificateJustIssued, setCertificateJustIssued] = useState(false);

  const saveProgress = useCallback(async (score: number | null, status: string = "completed") => {
    if (!enrollment || !moduleId || !user) return;
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    const payload = {
      enrollment_id: enrollment.id, module_id: moduleId, user_id: user.id, status, score,
      time_spent_seconds: timeSpent,
      ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
      ...(status === "in_progress" && !currentProgress ? { started_at: new Date().toISOString() } : {}),
    };
    if (currentProgress) {
      await supabase.from("academy_progress").update({
        status: payload.status, score: payload.score,
        time_spent_seconds: (currentProgress as any).time_spent_seconds + timeSpent,
        ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
      }).eq("id", (currentProgress as any).id);
    } else {
      await supabase.from("academy_progress").insert(payload);
    }

    // Auto-certification: check if path is now fully completed
    if (status === "completed" && pathData?.certificate_enabled && pathModules.length > 0) {
      const newCompleted = completedCount + (isCompleted ? 0 : 1);
      if (newCompleted >= pathModules.length) {
        // Check no certificate exists yet
        const { data: existingCert } = await supabase
          .from("academy_certificates")
          .select("id")
          .eq("user_id", user.id)
          .eq("path_id", pathId!)
          .maybeSingle();
        if (!existingCert) {
          // Calculate average score
          const allScores = allProgress
            .filter((p: any) => p.module_id !== moduleId && p.score != null)
            .map((p: any) => p.score as number);
          if (score != null) allScores.push(score);
          const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
          const totalTime = allProgress.reduce((s: number, p: any) => s + (p.time_spent_seconds || 0), 0) + timeSpent;

          // Build modules detail
          const modulesDetail = pathModules.map((pm: any) => {
            const mod = pm.academy_modules;
            const prog = pm.module_id === moduleId
              ? { score, time_spent_seconds: timeSpent }
              : allProgress.find((p: any) => p.module_id === pm.module_id);
            return {
              title: mod?.title || "",
              type: mod?.module_type || "",
              score: (prog as any)?.score || 0,
              time_minutes: Math.round(((prog as any)?.time_spent_seconds || 0) / 60),
            };
          });

          await supabase.from("academy_certificates").insert({
            user_id: user.id,
            path_id: pathId!,
            enrollment_id: enrollment.id,
            certificate_data: {
              score: avgScore,
              total_time_hours: Math.round(totalTime / 3600 * 10) / 10,
              modules_completed: pathModules.length,
              modules_total: pathModules.length,
              holder_name: user.email?.split("@")[0] || "Apprenant",
              path_name: pathData?.name || "",
              modules_detail: modulesDetail,
              issued_by: "GROWTHINNOV",
            },
          });

          // Update enrollment status
          await supabase.from("academy_enrollments").update({
            status: "completed",
            completed_at: new Date().toISOString(),
          }).eq("id", enrollment.id);

          setCertificateJustIssued(true);
        }
      }
    }

    qc.invalidateQueries({ queryKey: ["academy-module-progress"] });
    qc.invalidateQueries({ queryKey: ["academy-progress"] });
    qc.invalidateQueries({ queryKey: ["academy-all-progress-sidebar"] });
    qc.invalidateQueries({ queryKey: ["user-certificates"] });
  }, [enrollment, moduleId, user, currentProgress, qc, pathData, pathModules, completedCount, isCompleted, allProgress, pathId]);

  const getModuleStatus = useCallback((modId: string, idx: number) => {
    const p = progressMap.get(modId) as any;
    if (p?.status === "completed") return "completed" as const;
    if (p?.status === "in_progress") return "in_progress" as const;
    if (!enrollment) return "available" as const;
    if (idx === 0) return "available" as const;
    for (let i = 0; i < idx; i++) {
      const prevP = progressMap.get(pathModules[i]?.module_id) as any;
      if (prevP?.status !== "completed") return "locked" as const;
    }
    return "available" as const;
  }, [progressMap, enrollment, pathModules]);

  return {
    module, isLoading, contents, pathData, pathModules,
    enrollment, currentProgress, allProgress, progressMap,
    currentIndex, nextModule, prevModule,
    completedCount, progressPct, isCompleted, totalTimeSpent,
    saveProgress, getModuleStatus, certificateJustIssued,
  };
}
