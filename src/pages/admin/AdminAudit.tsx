import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, ShieldAlert, Download, RefreshCw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { usePermissions } from "@/hooks/usePermissions";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useSavedViews, type SavedView } from "@/hooks/useSavedViews";
import { SavedViewsMenu } from "@/components/admin/SavedViewsMenu";

const filterSchema = z.object({
  actor: z.string().default(""),
  action: z.string().default(""),
  entityType: z.string().default("all"),
  page: z.coerce.number().default(0),
});

const BUILTIN_VIEWS: SavedView[] = [
  { id: "builtin-org-updates", name: "Mises à jour orgs", params: "action=org.update", createdAt: "2026-04-27T00:00:00Z" },
  { id: "builtin-bulk", name: "Actions en masse", params: "action=bulk", createdAt: "2026-04-27T00:00:00Z" },
];

type AuditLog = {
  id: number;
  occurred_at: string;
  actor_id: string | null;
  actor_email: string | null;
  organization_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  payload: any;
  prev_hash: string | null;
  current_hash: string;
};

const PAGE_SIZE = 50;

export default function AdminAudit() {
  const perms = usePermissions();
  const [filters, setFilters, resetFilters] = useUrlFilters(filterSchema);
  const [, setSearchParams] = useSearchParams();
  const { views, save, remove } = useSavedViews("audit", BUILTIN_VIEWS);
  const { actor, action, entityType, page } = filters;
  const setActor = (v: string) => setFilters({ actor: v, page: 0 });
  const setAction = (v: string) => setFilters({ action: v, page: 0 });
  const setEntityType = (v: string) => setFilters({ entityType: v, page: 0 });
  const setPage = (p: number | ((cur: number) => number)) => {
    const next = typeof p === "function" ? p(page) : p;
    setFilters({ page: next });
  };

  const currentParams = useMemo(() => {
    const sp = new URLSearchParams();
    if (actor) sp.set("actor", actor);
    if (action) sp.set("action", action);
    if (entityType !== "all") sp.set("entityType", entityType);
    return sp.toString();
  }, [actor, action, entityType]);

  const applyView = (params: string) => {
    setSearchParams(new URLSearchParams(params), { replace: true });
  };

  const integrity = useQuery({
    queryKey: ["audit-chain-integrity"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("verify_audit_chain_integrity");
      if (error) throw error;
      return data as { valid: boolean; broken_at?: number | null; checked: number; message?: string };
    },
    refetchInterval: 60_000,
  });

  const entityTypesQuery = useQuery({
    queryKey: ["audit-entity-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs_immutable")
        .select("entity_type")
        .not("entity_type", "is", null)
        .limit(500);
      if (error) throw error;
      const set = new Set<string>();
      (data ?? []).forEach((r: any) => r.entity_type && set.add(r.entity_type));
      return Array.from(set).sort();
    },
  });

  const logsQuery = useQuery({
    queryKey: ["audit-logs", actor, action, entityType, page],
    queryFn: async () => {
      let q = supabase
        .from("audit_logs_immutable")
        .select("*", { count: "exact" })
        .order("occurred_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (actor) q = q.ilike("actor_email", `%${actor}%`);
      if (action) q = q.ilike("action", `%${action}%`);
      if (entityType !== "all") q = q.eq("entity_type", entityType);
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as AuditLog[], count: count ?? 0 };
    },
  });

  const exportCsv = () => {
    const rows = logsQuery.data?.rows ?? [];
    const header = ["occurred_at", "actor_email", "action", "entity_type", "entity_id", "current_hash"];
    const csv = [
      header.join(","),
      ...rows.map(r => header.map(h => JSON.stringify((r as any)[h] ?? "")).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (perms.loading) return <AdminShell><div /></AdminShell>;
  if (!perms.has("admin.logs.view")) {
    return (
      <AdminShell>
        <Card className="p-12 text-center m-6">
          <p className="text-sm text-muted-foreground">Accès refusé.</p>
        </Card>
      </AdminShell>
    );
  }

  const total = logsQuery.data?.count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Audit log immuable</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Journal append-only à chaîne de hash SHA-256 — preuve d'intégrité non répudiable.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {integrity.isLoading ? (
              <Badge variant="outline" className="gap-1.5"><Loader2 className="h-3 w-3 animate-spin" />Vérification…</Badge>
            ) : integrity.data?.valid ? (
              <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/10 text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Chaîne intègre · {integrity.data.checked} entrées
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                Chaîne rompue à #{integrity.data?.broken_at}
              </Badge>
            )}
            <SavedViewsMenu
              views={views}
              currentParams={currentParams}
              onApply={applyView}
              onSave={save}
              onRemove={remove}
            />
            <Button size="sm" variant="outline" onClick={() => integrity.refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>

        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Acteur (email)" value={actor} onChange={e => { setActor(e.target.value); setPage(0); }} />
            <Input placeholder="Action (ex: org.update)" value={action} onChange={e => { setAction(e.target.value); setPage(0); }} />
            <Select value={entityType} onValueChange={v => { setEntityType(v); setPage(0); }}>
              <SelectTrigger><SelectValue placeholder="Type d'entité" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les entités</SelectItem>
                {(entityTypesQuery.data ?? []).map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCsv} className="gap-2">
              <Download className="h-4 w-4" /> Export CSV ({(logsQuery.data?.rows ?? []).length})
            </Button>
          </div>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Quand</TableHead>
                <TableHead>Acteur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entité</TableHead>
                <TableHead className="text-right">Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsQuery.isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow>
              ) : (logsQuery.data?.rows ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune entrée</TableCell></TableRow>
              ) : (
                logsQuery.data!.rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(r.occurred_at), "dd MMM HH:mm:ss", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-xs">{r.actor_email ?? <span className="text-muted-foreground italic">système</span>}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{r.action}</Badge></TableCell>
                    <TableCell className="text-xs">
                      {r.entity_type ? <span>{r.entity_type}{r.entity_id ? ` · ${r.entity_id.slice(0, 8)}…` : ""}</span> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <code className="text-[10px] text-muted-foreground" title={r.current_hash}>{r.current_hash.slice(0, 12)}…</code>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t">
              <p className="text-xs text-muted-foreground">Page {page + 1} / {totalPages} · {total} entrées</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Précédent</Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Suivant</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
