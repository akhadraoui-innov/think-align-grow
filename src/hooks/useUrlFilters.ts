import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";

/**
 * Bidirectional sync between a typed filter state and the URL search params.
 *
 * - Reads initial state from URL (validated via Zod schema, falls back to defaults).
 * - Pushes updates back to the URL using `replace` (no history pollution).
 * - Other URL params not in the schema are preserved.
 *
 * Usage:
 *   const schema = z.object({
 *     role: z.string().default("__all__"),
 *     status: z.enum(["__all__", "active", "suspended"]).default("__all__"),
 *     q: z.string().default(""),
 *   });
 *   const [filters, setFilters] = useUrlFilters(schema);
 */
export function useUrlFilters<S extends z.ZodObject<z.ZodRawShape>>(schema: S) {
  type T = z.infer<S>;
  const [params, setParams] = useSearchParams();
  const lastWrittenRef = useRef<string>("");

  const parsed: T = useMemo(() => {
    const raw: Record<string, string> = {};
    for (const key of Object.keys(schema.shape)) {
      const v = params.get(key);
      if (v != null) raw[key] = v;
    }
    const result = schema.safeParse(raw);
    return (result.success ? result.data : schema.parse({})) as T;
  }, [params, schema]);

  const update = useCallback(
    (patch: Partial<T> | ((current: T) => Partial<T>)) => {
      const next =
        typeof patch === "function"
          ? (patch as (c: T) => Partial<T>)(parsed)
          : patch;
      const merged = { ...parsed, ...next } as T;

      const newParams = new URLSearchParams(params);
      const defaults = schema.parse({}) as Record<string, unknown>;

      for (const key of Object.keys(schema.shape)) {
        const value = (merged as Record<string, unknown>)[key];
        const isDefault = value === defaults[key] || value === "" || value == null;
        if (isDefault) {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      }

      const serialized = newParams.toString();
      if (serialized === lastWrittenRef.current) return;
      lastWrittenRef.current = serialized;
      setParams(newParams, { replace: true });
    },
    [params, parsed, schema, setParams],
  );

  const reset = useCallback(() => {
    const newParams = new URLSearchParams(params);
    for (const key of Object.keys(schema.shape)) newParams.delete(key);
    setParams(newParams, { replace: true });
  }, [params, schema, setParams]);

  useEffect(() => {
    lastWrittenRef.current = params.toString();
  }, [params]);

  return [parsed, update, reset] as const;
}
