import { describe, expect, it } from "vitest";
import {
  formatChileanRut,
  isValidChileanRut,
  normalizeChileanRut,
} from "./chilean-rut";

describe("formato de RUT chileno", () => {
  it("aplica separadores y dígito verificador al completar ocho dígitos base", () => {
    expect(formatChileanRut("214933985")).toBe("21.493.398-5");
  });

  it("permite escribir el dígito verificador después del guion automático", () => {
    expect(formatChileanRut("2.149.339-85")).toBe("21.493.398-5");
  });

  it("admite K y conserva el formato al editar un RUT existente", () => {
    expect(formatChileanRut("1234567k")).toBe("1.234.567-K");
    expect(formatChileanRut("12.345.678-5")).toBe("12.345.678-5");
  });

  it("envía el RUT sin separadores visuales", () => {
    expect(normalizeChileanRut("21.493.398-5")).toBe("21493398-5");
  });

  it("valida el dígito verificador con y sin formato", () => {
    expect(isValidChileanRut("12.345.678-5")).toBe(true);
    expect(isValidChileanRut("214933985")).toBe(true);
    expect(isValidChileanRut("11.111.111-1")).toBe(true);
    expect(isValidChileanRut("99.999.999-9")).toBe(true);
    expect(isValidChileanRut("12.345.678-0")).toBe(false);
    expect(isValidChileanRut("texto")).toBe(false);
  });
});
