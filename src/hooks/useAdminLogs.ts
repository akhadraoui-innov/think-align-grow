import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export interface LogFilters {
  action: string;
  entityType: string;
  organizationId: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

const PAGE_SIZE = 25;

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
      let query = supabase
        .from("activity_logs")
        .select("*, organizations(name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filters.action) query = query.eq("action", filters.action);
      if (filters.entityType) query = query.eq("entity_type", filters.entityType);
      if (filters.organizationId) query = query.eq("organization_id", filters.organizationId);
      if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
      if (filters.dateTo) query = query.lte("created_at", filters.dateTo + "T23:59:59");
      if (filters.search) query = query.or(`action.ilike.%${filters.search}%,entity_id.ilike.%${filters.search}%`);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },
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
  };
}
