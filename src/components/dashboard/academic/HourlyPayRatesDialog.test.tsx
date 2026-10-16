import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAs } from "@/test/render";
import { installFakeApi, ok } from "@/test/fake-api";
import HourlyPayRatesDialog from "./HourlyPayRatesDialog";

vi.mock("sonner", () => ({ toast: { promise: vi.fn() } }));
describe("Tarifas PH", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("guarda una tarifa compatible con la categoría de buceo en el semestre activo", async () => {
    const api = installFakeApi({
      "GET /academic/hourly-payments/rates": ok({
        semester: { id: "semester", name: "2026-20" },
        rates: [],
      }),
      "POST /academic/hourly-payments/rates": ok({}),
    });
    renderAs(<HourlyPayRatesDialog onClose={vi.fn()} />);
    fireEvent.change(await screen.findByLabelText("Categoría"), {
      target: { value: "DIVING_PRINCIPAL" },
    });
    fireEvent.change(
      screen.getByLabelText("Valor mensual por hora directa (CLP)"),
      { target: { value: "66000" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar tarifa" }));
    await waitFor(() =>
      expect(api.calls("POST /academic/hourly-payments/rates")).toHaveLength(1),
    );
    expect(api.calls("POST /academic/hourly-payments/rates")[0].body).toEqual({
      semesterId: "semester",
      category: "DIVING_PRINCIPAL",
      academicDegree: "NOT_APPLICABLE",
      certification: "NONE",
      hourlyRateClp: 66000,
    });
  });
  it("restablece el grado aplicable al cambiar de una tarifa de buceo a una de profesor nuevo", async () => {
    const api = installFakeApi({
      "GET /academic/hourly-payments/rates": ok({
        semester: { id: "semester", name: "2026-20" },
        rates: [
          {
            id: "rate",
            category: "DIVING_PRINCIPAL",
            academicDegree: "NOT_APPLICABLE",
            certification: "NONE",
            hourlyRateClp: "66000",
          },
        ],
      }),
      "POST /academic/hourly-payments/rates": ok({}),
    });
    renderAs(<HourlyPayRatesDialog onClose={vi.fn()} />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Editar tarifa" }),
    );
    fireEvent.change(screen.getByLabelText("Categoría"), {
      target: { value: "NEW" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar tarifa" }));
    await waitFor(() =>
      expect(api.calls("POST /academic/hourly-payments/rates")).toHaveLength(1),
    );
    expect(
      api.calls("POST /academic/hourly-payments/rates")[0].body,
    ).toMatchObject({
      category: "NEW",
      academicDegree: "PROFESSIONAL",
      certification: "NONE",
    });
  });
});
