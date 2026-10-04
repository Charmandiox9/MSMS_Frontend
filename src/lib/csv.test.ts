import { describe, expect, it } from "vitest";
import { createCsv } from "./csv";

describe("CSV export", () => {
  it("escapes delimiters, quotes, newlines and spreadsheet formulas", () => {
    const csv = createCsv(
      ["name", "value"],
      [
        { name: 'Ana; "Pérez"\nUCN', value: '=HYPERLINK("x")' },
        { name: "Normal", value: 12 },
      ],
      ["Nombre", "Dato"],
    );
    expect(csv).toContain('"Ana; ""Pérez""\nUCN"');
    expect(csv).toContain('"\'=HYPERLINK(""x"")"');
    expect(csv).toContain('"Normal";"12"');
    expect(csv.startsWith('\uFEFF"Nombre";"Dato"')).toBe(true);
  });
});
