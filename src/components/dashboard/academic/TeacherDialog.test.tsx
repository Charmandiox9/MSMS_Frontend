import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAs } from "@/test/render";
import { installFakeApi, ok, fail } from "@/test/fake-api";
import TeacherDialog from "./TeacherDialog";
import type { CurrentCourseCatalog } from "@/types/academic";

vi.mock("sonner", () => ({ toast: { promise: vi.fn() } }));
const teacher = {
  id: "teacher-1",
  name: "Ana Soto",
  email: "ana@example.com",
  employeeCode: "F123",
  assignments: [],
};
const catalog: CurrentCourseCatalog = {
  semester: { id: "semester", name: "2026-2" },
  courses: [
    {
      courseId: "course-1",
      nrc: "10001",
      name: "Biología marina",
      code: "BM",
      teachers: [teacher],
    },
    {
      courseId: "course-2",
      nrc: "10002",
      name: "Oceanografía",
      code: null,
      teachers: [],
    },
  ],
};
describe("TeacherDialog", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("crea un profesor con las asignaturas seleccionadas del semestre activo", async () => {
    const api = installFakeApi({
      "GET /academic/courses/current": ok(catalog),
      "POST /academic/teachers": ok(teacher),
    });
    const saved = vi.fn();
    renderAs(
      <TeacherDialog teacher={null} onClose={vi.fn()} onSaved={saved} />,
    );
    await screen.findByLabelText(/Oceanografía/);
    fireEvent.change(screen.getByLabelText("Nombre del profesor"), {
      target: { value: "Ana Soto" },
    });
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Título profesional"), {
      target: { value: "Bióloga Marina" },
    });
    fireEvent.change(screen.getByLabelText("Institución de egreso"), {
      target: { value: "Universidad Católica del Norte" },
    });
    fireEvent.click(screen.getByLabelText(/Oceanografía/));
    fireEvent.click(screen.getByRole("button", { name: "Guardar profesor" }));
    await waitFor(() => expect(saved).toHaveBeenCalledOnce());
    expect(api.calls("POST /academic/teachers")[0].body).toEqual({
      name: "Ana Soto",
      email: "ana@example.com",
      employeeCode: null,
      rut: null,
      academicUnit: null,
      academicDegree: null,
      certification: null,
      professionalTitle: "Bióloga Marina",
      institution: "Universidad Católica del Norte",
      joinedOn: null,
      leftOn: null,
      semesterId: "semester",
      nrcs: ["10002"],
    });
  });
  it("muestra vínculos existentes y permite editar, vincular y desvincular en una operación", async () => {
    const api = installFakeApi({
      "GET /academic/courses/current": ok(catalog),
      "PATCH /academic/teachers/teacher-1": ok(teacher),
    });
    renderAs(
      <TeacherDialog teacher={teacher} onClose={vi.fn()} onSaved={vi.fn()} />,
    );
    const linked = await screen.findByLabelText(/Biología marina/);
    expect((linked as HTMLInputElement).checked).toBe(true);
    fireEvent.click(linked);
    fireEvent.click(screen.getByLabelText(/Oceanografía/));
    fireEvent.change(screen.getByLabelText("Nombre del profesor"), {
      target: { value: "Ana Pérez" },
    });
    fireEvent.change(screen.getByLabelText("RUT"), {
      target: { value: "214933985" },
    });
    expect(screen.getByLabelText("RUT")).toHaveProperty(
      "value",
      "21.493.398-5",
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar profesor" }));
    await waitFor(() =>
      expect(api.calls("PATCH /academic/teachers/teacher-1")).toHaveLength(1),
    );
    expect(
      api.calls("PATCH /academic/teachers/teacher-1")[0].body,
    ).toMatchObject({
      name: "Ana Pérez",
      rut: "21493398-5",
      nrcs: ["10002"],
      semesterId: "semester",
    });
  });
  it("mantiene el formulario abierto y la selección si el backend rechaza el vínculo", async () => {
    installFakeApi({
      "GET /academic/courses/current": ok(catalog),
      "PATCH /academic/teachers/teacher-1": fail(
        409,
        "Tiene ayudantías asociadas",
      ),
    });
    const saved = vi.fn();
    renderAs(
      <TeacherDialog teacher={teacher} onClose={vi.fn()} onSaved={saved} />,
    );
    fireEvent.click(await screen.findByLabelText(/Biología marina/));
    fireEvent.click(screen.getByRole("button", { name: "Guardar profesor" }));
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Tiene ayudantías asociadas",
    );
    expect(saved).not.toHaveBeenCalled();
    expect(
      (screen.getByLabelText(/Biología marina/) as HTMLInputElement).checked,
    ).toBe(false);
  });
  it("sin semestre permite guardar el perfil sin enviar cambios de asignaturas", async () => {
    const api = installFakeApi({
      "GET /academic/courses/current": ok({ semester: null, courses: [] }),
      "PATCH /academic/teachers/teacher-1": ok(teacher),
    });
    renderAs(
      <TeacherDialog teacher={teacher} onClose={vi.fn()} onSaved={vi.fn()} />,
    );
    await screen.findByText(/No hay un semestre activo/);
    fireEvent.click(screen.getByRole("button", { name: "Guardar profesor" }));
    await waitFor(() =>
      expect(api.calls("PATCH /academic/teachers/teacher-1")).toHaveLength(1),
    );
    expect(api.calls("PATCH /academic/teachers/teacher-1")[0].body).toEqual({
      name: teacher.name,
      email: teacher.email,
      employeeCode: teacher.employeeCode,
      rut: null,
      academicUnit: null,
      academicDegree: null,
      certification: null,
      professionalTitle: null,
      institution: null,
      joinedOn: null,
      leftOn: null,
    });
  });
  it("permite reintentar la carga de opciones sin perder los datos del perfil", async () => {
    const api = installFakeApi({
      "GET /academic/courses/current": fail(500, "No disponible"),
    });
    renderAs(
      <TeacherDialog teacher={teacher} onClose={vi.fn()} onSaved={vi.fn()} />,
    );
    await screen.findByRole("alert");
    api.on("GET /academic/courses/current", ok(catalog));
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByLabelText(/Biología marina/);
    expect(screen.getByLabelText("Nombre del profesor")).toHaveProperty(
      "value",
      teacher.name,
    );
  });
});
