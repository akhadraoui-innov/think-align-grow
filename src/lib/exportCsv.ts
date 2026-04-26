/**
 * RFC 4180-compliant CSV export.
 * - Quotes fields containing commas, quotes, or newlines.
 * - Escapes quotes by doubling them.
 * - UTF-8 BOM prepended for Excel/Numbers compatibility.
 * - Arrays serialized as `;`-joined strings.
 * - Objects serialized as JSON.
 */

export interface CsvColumn<T> {
  key: string;
  label: string;
  /** Optional value extractor. Defaults to `row[key]`. */
  value?: (row: T) => unknown;
}

function serializeValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) {
    return v
      .map((item) =>
        typeof item === "object" && item !== null
          ? (item as Record<string, unknown>).name ??
            (item as Record<string, unknown>).label ??
            JSON.stringify(item)
          : String(item),
      )
      .join(";");
  }
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return "";
    }
  }
  return String(v);
}

function escapeField(s: string): string {
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function rowsToCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeField(c.label)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          const raw = col.value
            ? col.value(row)
            : (row as Record<string, unknown>)[col.key];
          return escapeField(serializeValue(raw));
        })
        .join(","),
    )
    .join("\r\n");
  return `${header}\r\n${body}`;
}

export function downloadCsv(filename: string, csv: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportRowsToCsv<T>(rows: T[], columns: CsvColumn<T>[], filename: string) {
  const csv = rowsToCsv(rows, columns);
  downloadCsv(filename, csv);
}
