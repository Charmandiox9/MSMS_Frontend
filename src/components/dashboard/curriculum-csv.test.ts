import { describe, expect, it } from "vitest";
import { parseCurriculumCsv } from "./curriculum-csv";

describe("parseCurriculumCsv", () => {
  it("lee el formato de malla, nombres con coma y filas repetidas", () => {
    expect(parseCurriculumCsv([
      "nombre_asignatura,semestre",
      '"Ciencia, Tecnología y Sociedad",6',
      "Formación Profesional Electiva,9",
      "Formación Profesional Electiva,9",
      "",
    ].join("\r\n"))).toEqual([
      { courseName: "Ciencia, Tecnología y Sociedad", termNumber: 6 },
      { courseName: "Formación Profesional Electiva", termNumber: 9 },
      { courseName: "Formación Profesional Electiva", termNumber: 9 },
    ]);
  });

  it("reports invalid headers and period numbers", () => {
    expect(() => parseCurriculumCsv("asignatura,semestre\nBiología,1")).toThrow("encabezados");
    expect(() => parseCurriculumCsv("nombre_asignatura,semestre\nBiología,21")).toThrow("fila 2");
  });
});
