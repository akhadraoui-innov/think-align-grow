import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";

export interface LogFilters {
  action: string;
  entityType: string;
  organizationId: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

const PAGE_SIZE = 25;

function buildQuery(filters: LogFilters) {
  let query = supabase
    .from("activity_logs")
    .select("*, organizations(name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.action) query = query.eq("action", filters.action);
  if (filters.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters.organizationId) query = query.eq("organization_id", filters.organizationId);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo + "T23:59:59");
  if (filters.search) query = query.or(`action.ilike.%${filters.search}%,entity_id.ilike.%${filters.search}%`);
  return query;
}

export function useAdminLogs() {
  const [filters, setFilters] = useState<LogFilters>({
    action: "",
    entityType: "",
    organizationId: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });
  const [page, setPage] = useState(0);

  const logsQuery = useQuery({
    queryKey: ["admin-logs", filters, page],
    queryFn: async () => {
      const query = buildQuery(filters).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },
  });

  // Resolve user_ids to display_names
  const userIds = useMemo(() => {
    const ids = new Set<string>();
    for (const log of logsQuery.data?.data ?? []) {
      if (log.user_id) ids.add(log.user_id);
    }
    return [...ids];
  }, [logsQuery.data?.data]);

  const profilesQuery = useQuery({
    queryKey: ["admin-logs-profiles", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", userIds);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const p of data ?? []) {
        map[p.user_id] = p.display_name || p.email || p.user_id.slice(0, 8);
      }
      return map;
    },
    enabled: userIds.length > 0,
  });

  // Distinct values for filter dropdowns
  const filtersMetaQuery = useQuery({
    queryKey: ["admin-logs-meta"],
    queryFn: async () => {
      const [actionsRes, typesRes, orgsRes] = await Promise.all([
        supabase.from("activity_logs").select("action").limit(500),
        supabase.from("activity_logs").select("entity_type").limit(500),
        supabase.from("organizations").select("id, name").order("name"),
      ]);
      const actions = [...new Set((actionsRes.data ?? []).map((r) => r.action).filter(Boolean))].sort();
      const entityTypes = [...new Set((typesRes.data ?? []).map((r) => r.entity_type).filter(Boolean))].sort();
      return { actions, entityTypes, orgs: orgsRes.data ?? [] };
    },
  });

  // CSV export function
  const exportCsv = async () => {
    const query = buildQuery(filters).limit(5000);
    const { data, error } = await query;
    if (error) throw error;

    // Resolve all user_ids for export
    const exportUserIds = [...new Set((data ?? []).map((l) => l.user_id).filter(Boolean))];
    let profileMap: Record<string, string> = {};
    if (exportUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", exportUserIds);
      for (const p of profiles ?? []) {
        profileMap[p.user_id] = p.display_name || p.email || p.user_id.slice(0, 8);
      }
    }

    const header = "Date,Utilisateur,Action,Type,Entité,Organisation\n";
    const rows = (data ?? []).map((l: any) => {
      const date = new Date(l.created_at).toISOString();
      const user = profileMap[l.user_id] ?? l.user_id?.slice(0, 8);
      const org = l.organizations?.name ?? "";
      return `"${date}","${user}","${l.action}","${l.entity_type ?? ""}","${l.entity_id ?? ""}","${org}"`;
    });

    const blob = new Blob([header + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    logs: logsQuery.data?.data ?? [],
    totalCount: logsQuery.data?.count ?? 0,
    logsLoading: logsQuery.isLoading,
    filters,
    setFilters,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil((logsQuery.data?.count ?? 0) / PAGE_SIZE)),
    meta: filtersMetaQuery.data ?? { actions: [], entityTypes: [], orgs: [] },
    profileMap: profilesQuery.data ?? {},
    exportCsv,
  };
}
