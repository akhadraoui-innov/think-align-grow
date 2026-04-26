import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Download } from "lucide-react";
import { exportRowsToCsv, type CsvColumn } from "@/lib/exportCsv";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  /** Optional value extractor used for CSV export (defaults to row[key]). */
  exportValue?: (row: T) => unknown;
  /** Hide this column from CSV export. */
  exportHide?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKey?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  actions?: React.ReactNode;
  /** Controlled search value (URL-driven). When provided, internal search becomes controlled. */
  search?: string;
  onSearchChange?: (value: string) => void;
  // ── Bulk selection ──
  selectable?: boolean;
  getRowId?: (row: T) => string;
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: (selectedIds: string[], clear: () => void) => React.ReactNode;
  // ── Export ──
  exportable?: boolean;
  exportFilename?: string;
  onExport?: (rowCount: number) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchKey,
  searchPlaceholder = "Rechercher...",
  pageSize = 10,
  onRowClick,
  actions,
  search: controlledSearch,
  onSearchChange,
  selectable = false,
  getRowId,
  onSelectionChange,
  bulkActions,
  exportable = false,
  exportFilename = "export",
  onExport,
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState("");
  const search = controlledSearch ?? internalSearch;
  const setSearch = (v: string) => {
    if (onSearchChange) onSearchChange(v);
    else setInternalSearch(v);
  };

  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const filtered = useMemo(() => {
    let result = data;
    if (search && searchKey) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        String(row[searchKey] ?? "").toLowerCase().includes(q),
      );
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [data, search, searchKey, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  // Auto-prune selection when filter changes
  const visibleIds = useMemo(
    () => (selectable && getRowId ? filtered.map(getRowId) : []),
    [filtered, selectable, getRowId],
  );

  useEffect(() => {
    if (!selectable) return;
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(visibleIds);
      const next = new Set<string>();
      let changed = false;
      for (const id of prev) {
        if (visible.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [visibleIds, selectable]);

  useEffect(() => {
    if (!selectable) return;
    onSelectionChange?.(Array.from(selected));
  }, [selected, selectable, onSelectionChange]);

  const isAllVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const isSomeVisibleSelected =
    !isAllVisibleSelected && visibleIds.some((id) => selected.has(id));

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (isAllVisibleSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleExport = () => {
    const csvCols: CsvColumn<T>[] = columns
      .filter((c) => !c.exportHide)
      .map((c) => ({
        key: c.key,
        label: c.label,
        value: c.exportValue,
      }));
    exportRowsToCsv(filtered, csvCols, exportFilename);
    onExport?.(filtered.length);
  };

  const colSpan = columns.length + (selectable ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {searchKey && (
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder={searchPlaceholder}
              className="pl-9 bg-transparent border-border/40 focus-visible:ring-primary/30"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          {exportable && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={handleExport}
              disabled={filtered.length === 0}
              title={`Exporter ${filtered.length} ligne${filtered.length > 1 ? "s" : ""}`}
            >
              <Download className="h-3.5 w-3.5" />
              Exporter
            </Button>
          )}
          {actions}
        </div>
      </div>

      <div className="rounded-xl border border-border/40 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 backdrop-blur-sm border-b border-border/40">
              {selectable && (
                <TableHead className="w-10 py-3">
                  <Checkbox
                    checked={
                      isAllVisibleSelected
                        ? true
                        : isSomeVisibleSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={toggleAllVisible}
                    aria-label="Sélectionner tout"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80 py-3"
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ChevronUp className="h-3 w-3 text-primary" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-primary" />
                        )
                      ) : (
                        <ChevronDown className="h-3 w-3 opacity-30" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center text-muted-foreground py-12 text-sm">
                  Aucune donnée
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row, i) => {
                const id = selectable && getRowId ? getRowId(row) : (row.id || String(i));
                const isSelected = selectable && selected.has(id);
                return (
                  <TableRow
                    key={id}
                    data-state={isSelected ? "selected" : undefined}
                    className={`
                      transition-colors border-b border-border/20
                      ${i % 2 === 1 ? "bg-muted/5" : ""}
                      ${isSelected ? "bg-primary/5" : ""}
                      ${onRowClick ? "cursor-pointer hover:bg-primary/5" : "hover:bg-muted/20"}
                    `}
                    onClick={(e) => {
                      // Don't trigger row click when clicking the checkbox cell
                      if ((e.target as HTMLElement).closest('[data-bulk-checkbox]')) return;
                      onRowClick?.(row);
                    }}
                  >
                    {selectable && (
                      <TableCell className="py-3 w-10" data-bulk-checkbox>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(id)}
                          aria-label="Sélectionner la ligne"
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key} className="py-3 text-sm">
                        {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground/70 tabular-nums">
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          {selectable && selected.size > 0 && ` · ${selected.size} sélectionné${selected.size > 1 ? "s" : ""}`}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum =
                  totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                      page === pageNum
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Floating bulk action bar */}
      {selectable && bulkActions && selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 rounded-full border border-border bg-background/95 backdrop-blur-md shadow-2xl px-4 py-2">
            <span className="text-sm font-medium tabular-nums">
              {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
            </span>
            <div className="h-4 w-px bg-border/50" />
            {bulkActions(Array.from(selected), clearSelection)}
            <div className="h-4 w-px bg-border/50" />
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearSelection}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
