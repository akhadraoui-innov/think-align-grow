import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, startOfDay, parseISO } from "date-fns";

export interface ObsFilters {
  orgIds: string[];
  assetTypes: string[];
  userId: string | null;
  dateRange: { from: Date; to: Date };
}

const ASSET_TYPES = ["path", "quiz", "exercise", "practice", "persona", "campaign"] as const;
const ACADEMY_ENTITY_TYPES = [
  "academy_path", "academy_quiz", "academy_exercise",
  "academy_practice", "academy_persona", "academy_campaign",
];

const defaultFilters: ObsFilters = {
  orgIds: [],
  assetTypes: [],
  userId: null,
  dateRange: { from: subDays(new Date(), 28), to: new Date() },
};

export function useObservability() {
  const [filters, setFilters] = useState<ObsFilters>(defaultFilters);

  // ---- Query 1: All versions in range ----
  const versionsQuery = useQuery({
    queryKey: ["obs-versions", filters.dateRange.from.toISOString(), filters.dateRange.to.toISOString(), filters.assetTypes, filters.userId],
    queryFn: async () => {
      let q = supabase
        .from("academy_asset_versions")
        .select("id, asset_type, asset_id, change_summary, changed_by, created_at, snapshot, version_number")
        .gte("created_at", filters.dateRange.from.toISOString())
        .lte("created_at", filters.dateRange.to.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);

      if (filters.assetTypes.length > 0) {
        q = q.in("asset_type", filters.assetTypes);
      }
      if (filters.userId) {
        q = q.eq("changed_by", filters.userId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  // ---- Query 2: Activity logs for academy entities ----
  const logsQuery = useQuery({
    queryKey: ["obs-logs", filters.dateRange.from.toISOString(), filters.dateRange.to.toISOString(), filters.orgIds, filters.userId],
    queryFn: async () => {
      let q = supabase
        .from("activity_logs")
        .select("id, action, entity_type, entity_id, user_id, organization_id, metadata, created_at")
        .in("entity_type", ACADEMY_ENTITY_TYPES)
        .gte("created_at", filters.dateRange.from.toISOString())
        .lte("created_at", filters.dateRange.to.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);

      if (filters.orgIds.length > 0) {
        q = q.in("organization_id", filters.orgIds);
      }
      if (filters.userId) {
        q = q.eq("user_id", filters.userId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  // ---- Query 3: Profiles lookup ----
  const profilesQuery = useQuery({
    queryKey: ["obs-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, avatar_url, email");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // ---- Query 4: Organizations lookup ----
  const orgsQuery = useQuery({
    queryKey: ["obs-orgs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, logo_url, primary_color");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // ---- Query 5: Observatory assets (pre-calculated) ----
  const catalogueQuery = useQuery({
    queryKey: ["obs-catalogue", filters.orgIds, filters.assetTypes],
    queryFn: async () => {
      let q = supabase
        .from("observatory_assets")
        .select("*")
        .order("last_modified_at", { ascending: false })
        .limit(1000);

      if (filters.orgIds.length > 0) {
        q = q.in("organization_id", filters.orgIds);
      }
      if (filters.assetTypes.length > 0) {
        q = q.in("asset_type", filters.assetTypes);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const profileMap = useMemo(() => {
    const map = new Map<string, { display_name: string | null; avatar_url: string | null; email: string | null }>();
    (profilesQuery.data ?? []).forEach((p) => {
      map.set(p.user_id, p);
      map.set(p.id, p); // also index by profile.id for created_by references
    });
    return map;
  }, [profilesQuery.data]);

  const orgMap = useMemo(() => {
    const map = new Map<string, { name: string; logo_url: string | null; primary_color: string | null }>();
    (orgsQuery.data ?? []).forEach((o) => map.set(o.id, o));
    return map;
  }, [orgsQuery.data]);

  // ---- KPIs (derived from observatory_assets) ----
  const kpis = useMemo(() => {
    const catalogue = catalogueQuery.data ?? [];
    const today = startOfDay(new Date());

    const totalAssets = catalogue.length;
    const totalVersions = catalogue.reduce((sum, a) => sum + Math.max(1, a.version_count ?? 0), 0);

    // Extract unique contributors from all assets
    const contributorSet = new Set<string>();
    catalogue.forEach((a) => {
      (a.contributor_ids ?? []).forEach((id: string) => contributorSet.add(id));
      if (a.last_modified_by) contributorSet.add(a.last_modified_by);
    });
    const activeContributors = contributorSet.size;

    // Count distinct orgs (null = Growthinnov counts as 1)
    const orgSet = new Set(catalogue.map((a) => a.organization_id || "growthinnov"));
    const activeOrgs = orgSet.size;

    // Assets modified today
    const todayModifications = catalogue.filter(
      (a) => new Date(a.last_modified_at) >= today
    ).length;

    return { totalAssets, totalVersions, activeContributors, activeOrgs, todayVersions: todayModifications };
  }, [catalogueQuery.data]);

  // ---- Chart data (28 days grouped by asset_type) ----
  const chartData = useMemo(() => {
    const versions = versionsQuery.data ?? [];
    const days: Record<string, Record<string, number>> = {};

    for (let i = 27; i >= 0; i--) {
      const day = format(subDays(new Date(), i), "yyyy-MM-dd");
      days[day] = {};
      ASSET_TYPES.forEach((t) => (days[day][t] = 0));
    }

    versions.forEach((v) => {
      const day = format(parseISO(v.created_at), "yyyy-MM-dd");
      if (days[day] && ASSET_TYPES.includes(v.asset_type as any)) {
        days[day][v.asset_type] = (days[day][v.asset_type] || 0) + 1;
      }
    });

    return Object.entries(days).map(([date, counts]) => ({
      date: format(parseISO(date), "dd/MM"),
      ...counts,
    }));
  }, [versionsQuery.data]);

  // ---- Timeline (merged versions + logs) ----
  const timeline = useMemo(() => {
    const versions = (versionsQuery.data ?? []).map((v) => ({
      id: v.id,
      type: "version" as const,
      assetType: v.asset_type,
      assetId: v.asset_id,
      userId: v.changed_by,
      orgId: (v.snapshot as Record<string, unknown> | null)?.organization_id as string | undefined,
      summary: v.change_summary || "modification",
      action: "updated",
      createdAt: v.created_at,
    }));

    const logs = (logsQuery.data ?? []).map((l) => ({
      id: l.id,
      type: "log" as const,
      assetType: l.entity_type?.replace("academy_", "") ?? "unknown",
      assetId: l.entity_id,
      userId: l.user_id,
      orgId: l.organization_id,
      summary: JSON.stringify(l.metadata ?? {}),
      action: l.action,
      createdAt: l.created_at,
    }));

    const merged = [...versions, ...logs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    let filtered = merged;
    if (filters.orgIds.length > 0) {
      filtered = filtered.filter((item) => item.orgId && filters.orgIds.includes(item.orgId));
    }

    return filtered.slice(0, 100);
  }, [versionsQuery.data, logsQuery.data, filters.orgIds]);

  // ---- Coverage matrix from observatory_assets ----
  const coverageMatrix = useMemo(() => {
    const catalogue = catalogueQuery.data ?? [];
    const matrix: Record<string, Record<string, number>> = {};

    catalogue.forEach((a) => {
      const orgId = a.organization_id;
      if (!orgId) return;
      if (!matrix[orgId]) {
        matrix[orgId] = {};
        ASSET_TYPES.forEach((t) => (matrix[orgId][t] = 0));
      }
      if (ASSET_TYPES.includes(a.asset_type as any)) {
        matrix[orgId][a.asset_type] = (matrix[orgId][a.asset_type] || 0) + 1;
      }
    });

    return Object.entries(matrix).map(([orgId, counts]) => ({
      orgId,
      orgName: orgMap.get(orgId)?.name ?? orgId.slice(0, 8),
      ...counts,
    }));
  }, [catalogueQuery.data, orgMap]);

  // ---- Export CSV ----
  const exportCsv = () => {
    const rows = timeline.map((item) => {
      const profile = item.userId ? profileMap.get(item.userId) : null;
      const org = item.orgId ? orgMap.get(item.orgId) : null;
      return {
        date: item.createdAt,
        type: item.type,
        asset_type: item.assetType,
        action: item.action,
        summary: item.summary,
        user: profile?.display_name || profile?.email || item.userId || "",
        organization: org?.name || "",
      };
    });

    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => `"${String((r as any)[h] || "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `observability_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    filters,
    setFilters,
    kpis,
    chartData,
    timeline,
    coverageMatrix,
    catalogue: catalogueQuery.data ?? [],
    profileMap,
    orgMap,
    orgs: orgsQuery.data ?? [],
    isLoading: versionsQuery.isLoading || logsQuery.isLoading || catalogueQuery.isLoading,
    exportCsv,
    ASSET_TYPES,
  };
}
