import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "./page";
import { toast } from "sonner";
import { renderAs } from "@/test/render";
import { fail, installFakeApi, ok } from "@/test/fake-api";

vi.mock("sonner", () => ({ toast: { promise: vi.fn() } }));

const SEMESTERS = [
  {
    id: "s-1",
    name: "2026-1",
    startsOn: "2026-03-02T00:00:00.000Z",
    endsOn: "2026-07-10T00:00:00.000Z",
    isActive: false,
  },
  {
    id: "s-2",
    name: "2026-2",
    startsOn: "2026-08-03T00:00:00.000Z",
    endsOn: "2026-12-11T00:00:00.000Z",
    isActive: true,
  },
];

describe("SettingsPage (semestre activo)", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("bloquea la vista para Apoyo Docente", async () => {
    const api = installFakeApi();
    renderAs(<SettingsPage />, ["TEACHING_SUPPORT_COORDINATOR"]);

    expect(
      await screen.findByText("No tienes acceso a esta página."),
    ).toBeDefined();
    expect(api.requests).toHaveLength(0);
  });

  it("lista los semestres con sus fechas sin desfase horario", async () => {
    installFakeApi({
      "GET /academic/semesters": ok(SEMESTERS),
      "GET /academic/semesters/s-2/budget": ok({
        totalAmountClp: 0,
        allocations: [],
      }),
    });
    renderAs(<SettingsPage />, ["ACADEMIC_SECRETARY"]);

    expect(await screen.findByText("2026-2")).toBeDefined();
    const active = screen.getByRole("region", { name: "Semestre activo" });
    expect(
      within(active).getByText(/3.*ago.*2026.*11.*dic.*2026/),
    ).toBeDefined();
    expect(
      await screen.findByText(
        "El semestre activo aún no tiene presupuesto configurado.",
      ),
    ).toBeDefined();
    const history = screen.getByRole("region", {
      name: "Historial de semestres",
    });
    expect(within(history).getByText("2026-1")).toBeDefined();
    expect(within(history).queryByText("2026-2")).toBeNull();
  });

  it("activa un semestre y recarga la lista", async () => {
    const api = installFakeApi({
      "GET /academic/semesters": ok([]),
      "POST /academic/semesters/activate": ok({ id: "s-3" }),
    });
    renderAs(<SettingsPage />, ["ACADEMIC_SECRETARY"]);
    await screen.findByText("Todavía no hay semestres registrados.");
    fireEvent.click(screen.getByRole("button", { name: "Activar semestre" }));

    fireEvent.change(screen.getByLabelText("Nombre del semestre"), {
      target: { value: "2027-1" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de inicio"), {
      target: { value: "2027-03-01" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de término"), {
      target: { value: "2027-07-09" },
    });
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Activar semestre",
      }),
    );

    await waitFor(() =>
      expect(toast.promise).toHaveBeenCalledWith(
        expect.any(Promise),
        expect.objectContaining({
          success: "El semestre 2027-1 quedó activo.",
        }),
      ),
    );
    expect(api.calls("POST /academic/semesters/activate")[0].body).toEqual({
      name: "2027-1",
      startsOn: "2027-03-01",
      endsOn: "2027-07-09",
    });
    await waitFor(() =>
      expect(api.calls("GET /academic/semesters")).toHaveLength(2),
    );
  });

  it("edita el semestre activo por id y conserva sus fechas", async () => {
    const api = installFakeApi({
      "GET /academic/semesters": ok(SEMESTERS),
      "GET /academic/semesters/s-2/budget": ok({
        totalAmountClp: 0,
        allocations: [],
      }),
      "PATCH /academic/semesters/s-2": ok(SEMESTERS[1]),
    });
    renderAs(<SettingsPage />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(
      await screen.findByRole("button", { name: "Editar semestre activo" }),
    );
    fireEvent.change(screen.getByLabelText("Nombre del semestre"), {
      target: { value: "2026-20" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() =>
      expect(api.calls("PATCH /academic/semesters/s-2")).toHaveLength(1),
    );
    expect(api.calls("PATCH /academic/semesters/s-2")[0].body).toEqual({
      name: "2026-20",
      startsOn: "2026-08-03",
      endsOn: "2026-12-11",
    });
    expect(api.calls("POST /academic/semesters/activate")).toHaveLength(0);
  });

  it("muestra el error de validación del backend al activar", async () => {
    installFakeApi({
      "GET /academic/semesters": ok([]),
      "POST /academic/semesters/activate": fail(
        400,
        "La fecha de término debe ser posterior al inicio",
      ),
    });
    renderAs(<SettingsPage />, ["SYSTEM_ADMIN"]);
    await screen.findByText("Todavía no hay semestres registrados.");
    fireEvent.click(screen.getByRole("button", { name: "Activar semestre" }));

    fireEvent.change(screen.getByLabelText("Nombre del semestre"), {
      target: { value: "2027-1" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de inicio"), {
      target: { value: "2027-07-09" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de término"), {
      target: { value: "2027-03-01" },
    });
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Activar semestre",
      }),
    );

    expect(
      await screen.findByText(
        "La fecha de término debe ser posterior al inicio",
      ),
    ).toBeDefined();
  });

  it("permite a Análisis ver y guardar el presupuesto sin editar el período académico", async () => {
    const initial = {
      totalAmountClp: 1000000,
      allocations: [{ name: "Ayudantías", amountClp: 200000 }],
      thresholds: [],
      roleOptions: [],
    };
    let current = initial;
    const api = installFakeApi({
      "GET /academic/semesters": ok(SEMESTERS),
      "GET /academic/semesters/s-2/budget": () => ({ body: current }),
      "PUT /academic/semesters/s-2/budget": () => {
        current = { ...initial, totalAmountClp: 1500000 };
        return { body: current };
      },
    });
    renderAs(<SettingsPage />, ["ACADEMIC_PROCESS_ANALYST"]);

    expect(await screen.findByText("Ayudantías")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Activar semestre" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Editar semestre activo" })).toBeNull();
    expect(screen.getByRole("button", { name: "Presupuesto de 2026-1" })).toBeDefined();
    expect(screen.getByText(/1\.000\.000/)).toBeDefined();
    expect(screen.getByText(/800\.000/)).toBeDefined();
    expect(api.calls("GET /academic/semesters/s-1/budget")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Editar presupuesto" }));
    fireEvent.click(
      await within(screen.getByRole("dialog")).findByRole("button", {
        name: "Guardar presupuesto",
      }),
    );
    expect(await screen.findByText(/1\.500\.000/)).toBeDefined();
    expect(api.calls("PUT /academic/semesters/s-2/budget")).toHaveLength(1);
    expect(screen.getByText(/1\.300\.000/)).toBeDefined();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
