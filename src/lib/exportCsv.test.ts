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
});
