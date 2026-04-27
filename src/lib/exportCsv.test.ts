import { describe, it, expect } from "vitest";
import { rowsToCsv } from "@/lib/exportCsv";

describe("exportCsv — rowsToCsv (RFC 4180)", () => {
  it("renders header and simple rows", () => {
    const csv = rowsToCsv(
      [{ name: "Ada", age: 36 }, { name: "Linus", age: 54 }],
      [
        { key: "name", label: "Nom" },
        { key: "age", label: "Âge" },
      ],
    );
    expect(csv).toBe("Nom,Âge\r\nAda,36\r\nLinus,54");
  });

  it("escapes commas, quotes and newlines", () => {
    const csv = rowsToCsv(
      [{ s: 'Hello, "world"\nbye' }],
      [{ key: "s", label: "Texte" }],
    );
    expect(csv).toContain('"Hello, ""world""\nbye"');
  });

  it("serializes arrays with semicolons", () => {
    const csv = rowsToCsv(
      [{ roles: ["admin", "owner"] }],
      [{ key: "roles", label: "Rôles" }],
    );
    expect(csv).toContain("admin;owner");
  });

  it("uses custom value extractor", () => {
    const csv = rowsToCsv(
      [{ a: 1, b: 2 }],
      [{ key: "sum", label: "Somme", value: (r) => r.a + r.b }],
    );
    expect(csv).toContain("3");
  });

  it("renders null and undefined as empty fields", () => {
    const csv = rowsToCsv(
      [{ a: null, b: undefined, c: 0 }],
      [
        { key: "a", label: "A" },
        { key: "b", label: "B" },
        { key: "c", label: "C" },
      ],
    );
    expect(csv).toBe("A,B,C\r\n,,0");
  });

  it("serializes Date and nested objects", () => {
    const d = new Date("2026-01-15T10:30:00.000Z");
    const csv = rowsToCsv(
      [{ when: d, meta: { foo: "bar" } }],
      [
        { key: "when", label: "When" },
        { key: "meta", label: "Meta" },
      ],
    );
    expect(csv).toContain("2026-01-15T10:30:00.000Z");
    expect(csv).toContain('"{""foo"":""bar""}"');
  });

  it("handles arrays of objects via name/label fallback", () => {
    const csv = rowsToCsv(
      [{ items: [{ name: "Alpha" }, { label: "Beta" }, { other: "x" }] }],
      [{ key: "items", label: "Items" }],
    );
    expect(csv).toContain("Alpha;Beta;");
    // unknown shape is JSON-serialized
    expect(csv).toContain("other");
  });

  it("returns header only on empty rows", () => {
    const csv = rowsToCsv([], [{ key: "x", label: "X" }]);
    expect(csv).toBe("X\r\n");
  });
});
