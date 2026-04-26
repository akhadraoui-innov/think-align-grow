import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Manages multi-row selection over a (filtered) list.
 *
 * - `visibleIds` is the source of truth for "select all" — it operates on the
 *   currently filtered/sorted view, never on the raw dataset.
 * - Selection is automatically pruned when items disappear from `visibleIds`
 *   (e.g. after a filter change or refetch).
 */
export function useBulkSelection(visibleIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  // Auto-prune on visibility change
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(visibleIds);
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (visible.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [visibleIds]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setAll = useCallback((ids: string[], on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isAllSelected = useMemo(
    () => visibleIds.length > 0 && visibleIds.every((id) => selected.has(id)),
    [visibleIds, selected],
  );

  const isSomeSelected = useMemo(
    () => !isAllSelected && visibleIds.some((id) => selected.has(id)),
    [visibleIds, selected, isAllSelected],
  );

  return {
    selected,
    selectedIds: Array.from(selected),
    count: selected.size,
    toggle,
    setAll,
    clear,
    isAllSelected,
    isSomeSelected,
  };
}
