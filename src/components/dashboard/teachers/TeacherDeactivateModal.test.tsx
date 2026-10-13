import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TeacherDeactivateModal from "./TeacherDeactivateModal";
import { renderWithIntl } from "@/test/render";
import type { Teacher } from "@/types/justifications";

const activeTeacher: Teacher = {
  id: "t-1",
  name: "Dra. Patricia Morales",
  email: "patricia.morales@ucn.cl",
  isActive: true,
  assignments: [
    {
      id: "a-1",
      nrc: "10550",
      course: { code: "BIO", name: "Biología Marina" },
      semester: { name: "2026-2", isActive: true },
    },
  ],
};

const inactiveTeacher: Teacher = {
  id: "t-2",
  name: "Dr. Carlos Vega",
  email: "carlos.vega@ucn.cl",
  isActive: false,
  assignments: [],
};

describe("TeacherDeactivateModal", () => {
  it("renderiza advertencia de desactivación y asignaturas activas", () => {
    renderWithIntl(
      <TeacherDeactivateModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        teacher={activeTeacher}
      />,
    );

    expect(screen.getByText("¿Desactivar docente?")).toBeDefined();
    expect(
      screen.getByText(/Al desactivar a Dra. Patricia Morales/),
    ).toBeDefined();
    expect(screen.getByText(/10550 · Biología Marina/)).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Confirmar desactivación" }),
    ).toBeDefined();
  });

  it("renderiza mensaje de reactivación para docente inactivo", () => {
    renderWithIntl(
      <TeacherDeactivateModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        teacher={inactiveTeacher}
      />,
    );

    expect(screen.getByText("¿Activar docente?")).toBeDefined();
    expect(
      screen.getByText(/¿Deseas reactivar a Dr. Carlos Vega/),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Reactivar docente" }),
    ).toBeDefined();
  });

  it("ejecuta onConfirm al hacer clic en el botón de confirmación", () => {
    const onConfirm = vi.fn();
    renderWithIntl(
      <TeacherDeactivateModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        teacher={activeTeacher}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar desactivación" }),
    );
    expect(onConfirm).toHaveBeenCalledWith(activeTeacher);
  });
});
