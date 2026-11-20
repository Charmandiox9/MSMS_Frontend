import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAs } from "@/test/render";
import { installFakeApi, ok } from "@/test/fake-api";
import { toast } from "sonner";
import SemesterBudgetDialog from "./SemesterBudgetDialog";

vi.mock("sonner", () => ({ toast: { promise: vi.fn((promise: Promise<unknown>) => promise), success: vi.fn(), error: vi.fn() } }));

const initial = {
  semesterId: "sem-1", semesterName: "2026-2", totalAmountClp: 1000000,
  allocations: [{ name: "Profesores por hora", amountClp: 400000 }],
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
});
