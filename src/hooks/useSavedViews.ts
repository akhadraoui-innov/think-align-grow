import { useCallback, useEffect, useState } from "react";

export interface SavedView {
  id: string;
  name: string;
  /** URL search-params string (without leading "?"). */
  params: string;
  builtin?: boolean;
  createdAt: string;
}

const PREFIX = "admin.savedViews.";

function read(pageKey: string): SavedView[] {
  try {
    const raw = localStorage.getItem(PREFIX + pageKey);
    if (!raw) return [];
    return JSON.parse(raw) as SavedView[];
  } catch {
    return [];
  }
}

function write(pageKey: string, views: SavedView[]) {
  try {
    localStorage.setItem(PREFIX + pageKey, JSON.stringify(views));
    window.dispatchEvent(new Event(`heeplab:savedViews:${pageKey}`));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * CRUD over named filter presets, persisted in localStorage per page.
 *
 * - `pageKey` namespaces the views (e.g. "users", "organizations").
 * - Built-in views are merged in but cannot be deleted.
 */
export function useSavedViews(pageKey: string, builtins: SavedView[] = []) {
  const [userViews, setUserViews] = useState<SavedView[]>(() => read(pageKey));

  useEffect(() => {
    const sync = () => setUserViews(read(pageKey));
    window.addEventListener(`heeplab:savedViews:${pageKey}`, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(`heeplab:savedViews:${pageKey}`, sync);
      window.removeEventListener("storage", sync);
    };
  }, [pageKey]);

  const all: SavedView[] = [
    ...builtins.map((b) => ({ ...b, builtin: true })),
    ...userViews,
  ];

  const save = useCallback(
    (name: string, params: string): SavedView => {
      const view: SavedView = {
        id: crypto.randomUUID(),
        name: name.trim().slice(0, 80),
        params,
        createdAt: new Date().toISOString(),
      };
      const next = [view, ...userViews];
      setUserViews(next);
      write(pageKey, next);
      return view;
    },
    [pageKey, userViews],
  );

  const remove = useCallback(
    (id: string) => {
      const next = userViews.filter((v) => v.id !== id);
      setUserViews(next);
      write(pageKey, next);
    },
    [pageKey, userViews],
  );

  const rename = useCallback(
    (id: string, name: string) => {
      const next = userViews.map((v) =>
        v.id === id ? { ...v, name: name.trim().slice(0, 80) } : v,
      );
      setUserViews(next);
      write(pageKey, next);
    },
    [pageKey, userViews],
  );

  return { views: all, userViews, save, remove, rename };
}
