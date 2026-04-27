import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminLogs } from "@/hooks/useAdminLogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Search, Filter, Eye, Download } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useSavedViews, type SavedView } from "@/hooks/useSavedViews";
import { SavedViewsMenu } from "@/components/admin/SavedViewsMenu";

const ACTION_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  created: "default",
  updated: "secondary",
  deleted: "destructive",
  login: "outline",
};

const filterSchema = z.object({
  search: z.string().default(""),
  action: z.string().default(""),
  entityType: z.string().default(""),
  organizationId: z.string().default(""),
  dateFrom: z.string().default(""),
  dateTo: z.string().default(""),
});

const BUILTIN_VIEWS: SavedView[] = [
  { id: "builtin-deletes", name: "Suppressions", params: "action=deleted", createdAt: "2026-04-27T00:00:00Z" },
  { id: "builtin-logins", name: "Connexions", params: "action=login", createdAt: "2026-04-27T00:00:00Z" },
];

export default function AdminLogs() {
  const [filters, setFilters, resetFilters] = useUrlFilters(filterSchema);
  const [, setSearchParams] = useSearchParams();
  const { views, save, remove } = useSavedViews("logs", BUILTIN_VIEWS);

  // Bridge URL filters → existing hook (kept untouched for server-side query stability)
  const {
    logs, totalCount, logsLoading,
    setFilters: setHookFilters, page, setPage, totalPages, meta,
    profileMap, exportCsv,
  } = useAdminLogs();

  // Sync URL filters → hook on every change
  useMemo(() => {
    setHookFilters(filters);
    setPage(0);
  }, [filters.action, filters.entityType, filters.organizationId, filters.dateFrom, filters.dateTo, filters.search]);

  const [detailLog, setDetailLog] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters({ [key]: value } as any);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportCsv();
      toast.success("Export CSV téléchargé");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExporting(false);
    }
  };

  // Build current URL params string for SavedViews
  const currentParams = useMemo(() => {
    const sp = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) sp.set(k, String(v));
    });
    return sp.toString();
  }, [filters]);

  const applyView = (params: string) => {
    setSearchParams(new URLSearchParams(params), { replace: true });
  };

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Logs d'activité</h1>
            <p className="text-sm text-muted-foreground mt-1">Journal d'audit de la plateforme — {totalCount} entrée{totalCount > 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <SavedViewsMenu
              views={views}
              currentParams={currentParams}
              onApply={applyView}
              onSave={save}
              onRemove={remove}
            />
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
              <Download className="h-4 w-4 mr-1" />
              {exporting ? "Export…" : "Exporter CSV"}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 bg-transparent border-border/40"
            />
          </div>
          <Select value={filters.action || "all"} onValueChange={(v) => updateFilter("action", v === "all" ? "" : v)}>
            <SelectTrigger className="w-[150px]"><Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" /><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes actions</SelectItem>
              {meta.actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.entityType || "all"} onValueChange={(v) => updateFilter("entityType", v === "all" ? "" : v)}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              {meta.entityTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.organizationId || "all"} onValueChange={(v) => updateFilter("organizationId", v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Organisation" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes orgs</SelectItem>
              {meta.orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            type="date"
            className="w-[140px] text-sm"
            value={filters.dateFrom}
            onChange={(e) => updateFilter("dateFrom", e.target.value)}
            placeholder="Du"
          />
          <Input
            type="date"
            className="w-[140px] text-sm"
            value={filters.dateTo}
            onChange={(e) => updateFilter("dateTo", e.target.value)}
            placeholder="Au"
          />
          {currentParams && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border/40 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 border-b border-border/40">
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80">Date</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80">Utilisateur</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80">Action</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80">Type</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80">Entité</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80">Organisation</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80 w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">Chargement...</TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">Aucun log</TableCell></TableRow>
              ) : logs.map((log: any, i: number) => (
                <TableRow key={log.id} className={`border-b border-border/20 hover:bg-muted/20 ${i % 2 === 1 ? "bg-muted/5" : ""}`}>
                  <TableCell className="py-2.5 text-xs text-muted-foreground tabular-nums">
                    {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell className="py-2.5 text-sm text-foreground">
                    {profileMap[log.user_id] ?? log.user_id?.slice(0, 8) + "…"}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge variant={ACTION_COLORS[log.action] ?? "secondary"} className="text-[10px]">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground">{log.entity_type ?? "—"}</TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground font-mono">{log.entity_id?.slice(0, 8) ?? "—"}</TableCell>
                  <TableCell className="py-2.5 text-xs">{(log as any).organizations?.name ?? "—"}</TableCell>
                  <TableCell className="py-2.5">
                    {log.metadata && Object.keys(log.metadata as object).length > 0 && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDetailLog(log)}>
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground/70 tabular-nums">
              Page {page + 1} / {totalPages} — {totalCount} résultat{totalCount > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Detail */}
      <Dialog open={!!detailLog} onOpenChange={() => setDetailLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détail du log</DialogTitle>
            <DialogDescription>
              {detailLog && `${detailLog.action} — ${format(new Date(detailLog.created_at), "dd MMM yyyy HH:mm:ss", { locale: fr })}`}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted/30 border border-border/30 p-4 max-h-[400px] overflow-auto">
            <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
              {detailLog ? JSON.stringify(detailLog.metadata, null, 2) : ""}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
