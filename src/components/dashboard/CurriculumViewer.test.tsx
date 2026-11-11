import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderAs } from "@/test/render";
import type { Career } from "@/types/careers";
import CurriculumViewer from "./CurriculumViewer";
const career: Career = {
  id: "career",
  name: "Biología Marina",
  code: "BM",
  isActive: true,
  updatedAt: "2026-11-11T12:00:00Z",
  curriculumVersions: [
    {
      id: "old",
      cohortYear: 2024,
      _count: { students: 0 },
      courses: [
        {
          id: "a",
          courseId: "a",
          termNumber: 1,
          course: { id: "a", code: null, name: "Plan anterior" },
        },
      ],
    },
    {
      id: "current",
      cohortYear: 2026,
      _count: { students: 0 },
      courses: [
        {
          id: "b",
          courseId: "b",
          termNumber: 1,
          course: { id: "b", code: "BIO", name: "Biología" },
        },
        {
          id: "c",
          courseId: "c",
          termNumber: 2,
          course: { id: "c", code: null, name: "Química" },
        },
        {
          id: "d",
          courseId: "d",
          termNumber: 3,
          course: { id: "d", code: null, name: "Ecología" },
        },
      ],
    },
  ],
};
describe("CurriculumViewer", () => {
  it("ordena por año, ubica dos semestres por columna y muestra la cohorte más reciente", () => {
    renderAs(<CurriculumViewer career={career} onClose={vi.fn()} />, [
      "ACADEMIC_PROCESS_ANALYST",
    ]);
    expect(screen.getByRole("combobox")).toHaveProperty("value", "current");
    const yearOne = screen.getByRole("region", { name: "Año 1" });
    const yearTwo = screen.getByRole("region", { name: "Año 2" });
    expect(within(yearOne).getByText("Biología")).toBeDefined();
    expect(within(yearOne).getByText("Química")).toBeDefined();
    expect(within(yearTwo).getByText("Ecología")).toBeDefined();
    expect(within(yearTwo).getByText("Semestre 4")).toBeDefined();
    expect(
      within(yearTwo).getByText("Sin asignaturas registradas"),
    ).toBeDefined();
  });
  it("cambia de cohorte sin mezclar sus asignaturas", () => {
    renderAs(<CurriculumViewer career={career} onClose={vi.fn()} />, [
      "ACADEMIC_SECRETARY",
    ]);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "old" },
    });
    expect(screen.getByText("Plan anterior")).toBeDefined();
    expect(screen.queryByText("Biología")).toBeNull();
    expect(screen.queryByRole("region", { name: "Año 2" })).toBeNull();
  });
  it("muestra el estado vacío y permite cerrar", () => {
    const close = vi.fn();
    renderAs(
      <CurriculumViewer
        career={{ ...career, curriculumVersions: [] }}
        onClose={close}
      />,
      ["ACADEMIC_PROCESS_ANALYST"],
    );
    expect(
      screen.getByText("Esta carrera todavía no tiene mallas registradas."),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(close).toHaveBeenCalledOnce();
  });
});
