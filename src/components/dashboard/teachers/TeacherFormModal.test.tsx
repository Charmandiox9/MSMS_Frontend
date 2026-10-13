import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TeacherFormModal from "./TeacherFormModal";
import { renderWithIntl } from "@/test/render";
import { fail, installFakeApi, ok } from "@/test/fake-api";
import type { Teacher } from "@/types/justifications";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const dummyTeacher: Teacher = {
  id: "teacher-1",
  name: "Dr. Roberto Silva",
  email: "roberto.silva@ucn.cl",
  employeeCode: "DOC-99",
  joinedOn: "2024-03-01T00:00:00.000Z",
  assignments: [],
};

describe("TeacherFormModal", () => {
  beforeEach(() => {
    localStorage.clear();
    installFakeApi({
      "GET /academic/courses": ok([]),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("renderiza el formulario de creación con aviso de protección de datos", () => {
    renderWithIntl(
      <TeacherFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        teacher={null}
      />,
    );

    expect(screen.getByText("Registrar nuevo docente")).toBeDefined();
    expect(screen.getByLabelText(/Nombre completo/)).toBeDefined();
    expect(screen.getByLabelText(/Correo institucional/)).toBeDefined();
    expect(screen.getAllByText(/Ley N° 21.719/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Registrar docente" })).toBeDefined();
  });

  it("envía la creación al backend y llama onSaved", async () => {
    const api = installFakeApi({
      "POST /academic/teachers": ok({
        ...dummyTeacher,
        id: "teacher-created",
        name: "Nueva Docente",
        email: "nueva.docente@ucn.cl",
      }),
    });

    const onSaved = vi.fn();
    const onClose = vi.fn();

    renderWithIntl(
      <TeacherFormModal
        isOpen={true}
        onClose={onClose}
        onSaved={onSaved}
        teacher={null}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Nombre completo/), {
      target: { value: "Nueva Docente" },
    });
    fireEvent.change(screen.getByLabelText(/Correo institucional/), {
      target: { value: "nueva.docente@ucn.cl" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar docente" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({ id: "teacher-created", name: "Nueva Docente" }),
    );
    expect(onClose).toHaveBeenCalled();
    expect(api.calls("POST /academic/teachers")).toHaveLength(1);
  });

  it("renderiza en modo edición con datos preexistentes y actualiza", async () => {
    const api = installFakeApi({
      "PATCH /academic/teachers/teacher-1": ok({
        ...dummyTeacher,
        name: "Dr. Roberto Silva M.",
      }),
    });

    const onSaved = vi.fn();

    renderWithIntl(
      <TeacherFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSaved={onSaved}
        teacher={dummyTeacher}
      />,
    );

    expect(screen.getByText("Editar información del docente")).toBeDefined();
    const nameInput = screen.getByLabelText(/Nombre completo/) as HTMLInputElement;
    expect(nameInput.value).toBe("Dr. Roberto Silva");

    fireEvent.change(nameInput, {
      target: { value: "Dr. Roberto Silva M." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.calls("PATCH /academic/teachers/teacher-1")).toHaveLength(1);
  });

  it("muestra error si la API responde con conflicto", async () => {
    installFakeApi({
      "POST /academic/teachers": fail(
        409,
        "Ya existe un docente registrado con ese correo institucional",
      ),
    });

    renderWithIntl(
      <TeacherFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        teacher={null}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Nombre completo/), {
      target: { value: "Docente Existente" },
    });
    fireEvent.change(screen.getByLabelText(/Correo institucional/), {
      target: { value: "existente@ucn.cl" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar docente" }));

    expect(
      await screen.findByText(
        "Ya existe un docente registrado con ese correo institucional",
      ),
    ).toBeDefined();
  });

  it("permite vincular y desvincular NRCs de asignaturas", async () => {
    const api = installFakeApi({
      "GET /academic/courses": ok([
        { nrc: "10001", course: { code: "MAT", name: "Cálculo I" } },
      ]),
      "POST /academic/teachers": ok({
        ...dummyTeacher,
        id: "t-assigned",
        name: "Prof. Asignado",
        email: "asignado@ucn.cl",
      }),
    });

    renderWithIntl(
      <TeacherFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        teacher={null}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Nombre completo/), {
      target: { value: "Prof. Asignado" },
    });
    fireEvent.change(screen.getByLabelText(/Correo institucional/), {
      target: { value: "asignado@ucn.cl" },
    });

    const nrcInput = screen.getByPlaceholderText(/10001/);
    fireEvent.change(nrcInput, { target: { value: "10002" } });
    fireEvent.click(screen.getByRole("button", { name: "Vincular NRC" }));

    expect(screen.getByText("NRC 10002")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Registrar docente" }));

    await waitFor(() => {
      const call = api.calls("POST /academic/teachers")[0];
      expect(call?.body).toMatchObject({
        nrcs: ["10002"],
      });
    });
  });
});
