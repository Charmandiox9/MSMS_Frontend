import { describe, expect, it } from "vitest";
import { getCareerDegreeOptions } from "./career-degree-options";

describe("getCareerDegreeOptions", () => {
  it.each([
    { code: "BM", expected: ["Biólogo Marino", "Bióloga Marina"] },
    {
      code: "IA",
      expected: ["Ingeniero en Acuicultura", "Ingeniera en Acuicultura"],
    },
    {
      code: "8506",
      expected: [
        "Ingeniero en Prevención de Riesgos y Medioambiente",
        "Ingeniera en Prevención de Riesgos y Medioambiente",
      ],
    },
  ])("returns official title forms for career code $code", ({ code, expected }) => {
    expect(getCareerDegreeOptions(code)).toEqual(expected);
  });

  it("normalizes career codes and returns no options for unknown careers", () => {
    expect(getCareerDegreeOptions(" bm ")).toEqual([
      "Biólogo Marino",
      "Bióloga Marina",
    ]);
    expect(getCareerDegreeOptions("UNKNOWN")).toEqual([]);
    expect(getCareerDegreeOptions(null)).toEqual([]);
  });
});
