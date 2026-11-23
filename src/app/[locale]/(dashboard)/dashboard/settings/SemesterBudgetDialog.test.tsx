import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAs } from "@/test/render";
import { installFakeApi, ok } from "@/test/fake-api";
import { toast } from "sonner";
import SemesterBudgetDialog from "./SemesterBudgetDialog";

vi.mock("sonner", () => ({ toast: { promise: vi.fn((promise: Promise<unknown>) => promise), success: vi.fn(), error: vi.fn() } }));

const initial = {
  semesterId: "sem-1", semesterName: "2026-2", totalAmountClp: 1000000,
  allocations: [{ code: "HOURLY_TEACHERS", name: "Profesores por hora", amountClp: 400000 }],
  thresholds: [{ percentage: 80, roleCodes: ["ACADEMIC_SECRETARY"] }],
  roleOptions: [{ code: "ACADEMIC_SECRETARY", name: "Secretario Docente" }],
};

describe("SemesterBudgetDialog", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads configuration and saves the selected semester budget", async () => {
    const api = installFakeApi({
      "GET /academic/semesters/sem-1/budget": ok(initial),
      "PUT /academic/semesters/sem-1/budget": ok(initial),
    });
    const onClose = vi.fn();
    renderAs(<SemesterBudgetDialog semesterId="sem-1" semesterName="2026-2" onClose={onClose} />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(await screen.findByRole("button", { name: "Guardar presupuesto" }));
    await waitFor(() => expect(api.calls("PUT /academic/semesters/sem-1/budget")).toHaveLength(1));
    expect(api.calls("PUT /academic/semesters/sem-1/budget")[0].body).toMatchObject({ totalAmountClp: 1000000 });
    expect(api.calls("PUT /academic/semesters/sem-1/budget")[0].body).not.toHaveProperty("semesterId");
    expect(api.calls("PUT /academic/semesters/sem-1/budget")[0].body).not.toHaveProperty("roleOptions");
    expect(onClose).toHaveBeenCalledOnce();
    expect(toast.promise).toHaveBeenCalled();
  });

  it("precarga las dos categorías vinculadas para un presupuesto nuevo", async () => {
    installFakeApi({
      "GET /academic/semesters/sem-1/budget": ok({ ...initial, allocations: [] }),
    });
    renderAs(<SemesterBudgetDialog semesterId="sem-1" semesterName="2026-2" onClose={vi.fn()} />, ["ACADEMIC_SECRETARY"]);

    const [teachers, assistantships] = await screen.findAllByLabelText("Vincular con");
    expect(teachers).toHaveProperty("value", "HOURLY_TEACHERS");
    expect(assistantships).toHaveProperty("value", "ASSISTANTSHIPS");
  });

  it("permite recuperar una categoría precargada o vincular una categoría con nombre propio", async () => {
    const api = installFakeApi({
      "GET /academic/semesters/sem-1/budget": ok(initial),
      "PUT /academic/semesters/sem-1/budget": ok(initial),
    });
    renderAs(<SemesterBudgetDialog semesterId="sem-1" semesterName="2026-2" onClose={vi.fn()} />, ["ACADEMIC_SECRETARY"]);

    fireEvent.click(await screen.findByRole("button", { name: "Agregar Ayudantías" }));
    expect(screen.getAllByLabelText("Vincular con")[1]).toHaveProperty("value", "ASSISTANTSHIPS");
    fireEvent.click(screen.getAllByRole("button", { name: "Quitar categoría" })[1]);
    fireEvent.click(screen.getByRole("button", { name: "Agregar categoría" }));
    fireEvent.change(screen.getAllByLabelText("Categoría")[1], { target: { value: "Apoyo de laboratorio" } });
    const newLink = screen.getAllByLabelText("Vincular con")[1];
    expect(screen.getAllByRole("option", { name: "Profesores por hora" })[1]).toHaveProperty("disabled", true);
    fireEvent.change(newLink, { target: { value: "ASSISTANTSHIPS" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar presupuesto" }));

    await waitFor(() => expect(api.calls("PUT /academic/semesters/sem-1/budget")[0]?.body).toMatchObject({
      allocations: [...initial.allocations, { code: "ASSISTANTSHIPS", name: "Apoyo de laboratorio", amountClp: 0 }],
    }));
  });
});
