import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderAs } from "@/test/render";
import { installFakeApi, ok, fail } from "@/test/fake-api";
import type { Student } from "@/types/students";
import StudentsPage from "./StudentsPage";
import StudentDialog from "./StudentDialog";
import ImportStudentsDialog from "./ImportStudentsDialog";

vi.mock("sonner", () => ({ toast: { promise: vi.fn(), success: vi.fn() } }));
const semester = { id: "semester", name: "2026-2", isActive: true };
const course = { id: "course", name: "Biología marina", code: null };
const student: Student = {
  id: "student",
  name: "Ana Soto",
  email: "ana@example.com",
  enrollments: [
    {
      id: "enrollment",
      nrc: "10001",
      courseId: course.id,
      semesterId: semester.id,
      course,
      semester,
    },
  ],
};
const catalog = {
  semester,
  courses: [
    {
      nrc: "10001",
      courseId: "course",
      name: "Biología marina",
      code: null,
      teachers: [],
    },
    {
      nrc: "10002",
      courseId: "course-2",
      name: "Oceanografía",
      code: null,
      teachers: [],
    },
  ],
};
const response = {
  items: [student],
  total: 1,
  totalPages: 1,
  page: 1,
  pageSize: 10,
};

describe("Estudiantes", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());
  it("consulta estudiantes con filtros por NRC, búsqueda y paginación del backend", async () => {
    const api = installFakeApi({
      "GET /academic/courses/current": ok(catalog),
      "GET /academic/students": ok({ ...response, total: 12, totalPages: 2 }),
    });
    renderAs(<StudentsPage initialNrc="10001" />, ["ACADEMIC_SECRETARY"]);
    await screen.findByText("Ana Soto");
    expect(api.calls("GET /academic/students")[0].query.get("nrc")).toBe(
      "10001",
    );
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    await waitFor(() =>
      expect(
        api.calls("GET /academic/students").at(-1)?.query.get("page"),
      ).toBe("2"),
    );
    fireEvent.change(screen.getByLabelText("Buscar por nombre o correo"), {
      target: { value: "ana" },
    });
    await waitFor(() =>
      expect(
        api.calls("GET /academic/students").at(-1)?.query.get("search"),
      ).toBe("ana"),
    );
    expect(api.calls("GET /academic/students").at(-1)?.query.get("page")).toBe(
      "1",
    );
  });
  it.each([
    "ACADEMIC_PROCESS_ANALYST",
    "TEACHING_SUPPORT_COORDINATOR",
  ] as const)(
    "permite consultar a %s y oculta las acciones de escritura",
    async (role) => {
      installFakeApi({
        "GET /academic/courses/current": ok(catalog),
        "GET /academic/students": ok(response),
      });
      renderAs(<StudentsPage />, [role]);
      await screen.findByText("Ana Soto");
      expect(
        screen.queryByRole("button", { name: "Crear estudiante" }),
      ).toBeNull();
      expect(screen.queryByRole("button", { name: "Importar CSV" })).toBeNull();
      expect(screen.queryByRole("button", { name: /Editar Ana/ })).toBeNull();
    },
  );
  it("recupera una consulta fallida con reintentar", async () => {
    const api = installFakeApi({
      "GET /academic/courses/current": ok(catalog),
      "GET /academic/students": fail(500, "No disponible"),
    });
    renderAs(<StudentsPage />, ["ACADEMIC_SECRETARY"]);
    await screen.findByRole("alert");
    api.on("GET /academic/students", ok(response));
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Ana Soto")).toBeDefined();
  });
  it("crea el perfil manual y vincula un NRC seleccionado", async () => {
    const api = installFakeApi({
      "GET /academic/courses/current": ok(catalog),
      "POST /academic/students": ok(student),
    });
    const saved = vi.fn();
    renderAs(
      <StudentDialog
        student={null}
        initialNrc="10001"
        onSaved={saved}
        onClose={vi.fn()}
      />,
    );
    const selected = await screen.findByLabelText(/Biología marina/);
    expect(selected).toHaveProperty("checked", true);
    fireEvent.change(screen.getByLabelText("Nombre completo"), {
      target: { value: "Ana Soto" },
    });
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar estudiante" }));
    await waitFor(() => expect(saved).toHaveBeenCalledOnce());
    expect(api.calls("POST /academic/students")[0].body).toEqual({
      name: "Ana Soto",
      email: "ana@example.com",
      semesterId: "semester",
      nrcs: ["10001"],
    });
  });
  it("consulta la matrícula actual al editar y permite sustituir vínculos", async () => {
    const api = installFakeApi({
      "GET /academic/courses/current": ok(catalog),
      "GET /academic/students/student": ok(student),
      "PATCH /academic/students/student": ok(student),
    });
    renderAs(
      <StudentDialog student={student} onSaved={vi.fn()} onClose={vi.fn()} />,
    );
    const linked = await screen.findByLabelText(/Biología marina/);
    expect(linked).toHaveProperty("checked", true);
    fireEvent.click(linked);
    fireEvent.click(screen.getByLabelText(/Oceanografía/));
    fireEvent.click(screen.getByRole("button", { name: "Guardar estudiante" }));
    await waitFor(() =>
      expect(api.calls("PATCH /academic/students/student")).toHaveLength(1),
    );
    expect(api.calls("PATCH /academic/students/student")[0].body).toMatchObject(
      { semesterId: "semester", nrcs: ["10002"] },
    );
  });
  it("permite crear el perfil sin semestre y no envía matrículas", async () => {
    const api = installFakeApi({
      "GET /academic/courses/current": ok({ semester: null, courses: [] }),
      "POST /academic/students": ok(student),
    });
    renderAs(
      <StudentDialog student={null} onSaved={vi.fn()} onClose={vi.fn()} />,
    );
    await screen.findByText(/No hay semestre activo/);
    fireEvent.change(screen.getByLabelText("Nombre completo"), {
      target: { value: "Ana Soto" },
    });
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar estudiante" }));
    await waitFor(() =>
      expect(api.calls("POST /academic/students")).toHaveLength(1),
    );
    expect(api.calls("POST /academic/students")[0].body).toEqual({
      name: "Ana Soto",
      email: "ana@example.com",
    });
  });
  it("envía el CSV y el semestre visible y comunica los resultados", async () => {
    const api = installFakeApi({
      "GET /academic/courses/current": ok(catalog),
      "POST /academic/students/import-csv": ok({
        importedStudents: 1,
        createdStudents: 1,
        addedEnrollments: 1,
        semesterId: "semester",
      }),
    });
    const saved = vi.fn();
    renderAs(<ImportStudentsDialog onSaved={saved} onClose={vi.fn()} />);
    const input = await screen.findByLabelText("Archivo CSV");
    const csv = "nombre;correo;nrc1\nAna Soto;ana@example.com;10001";
    fireEvent.change(input, {
      target: {
        files: [new File([csv], "estudiantes.csv", { type: "text/csv" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Importar CSV" }));
    await waitFor(() => expect(saved).toHaveBeenCalledOnce());
    expect(api.calls("POST /academic/students/import-csv")[0].body).toEqual({
      csv,
      semesterId: "semester",
    });
  });
  it("mantiene el formulario abierto al rechazar un NRC del CSV", async () => {
    installFakeApi({
      "GET /academic/courses/current": ok(catalog),
      "POST /academic/students/import-csv": fail(
        400,
        "Fila 2: NRC inexistente",
      ),
    });
    const saved = vi.fn();
    renderAs(<ImportStudentsDialog onSaved={saved} onClose={vi.fn()} />);
    fireEvent.change(await screen.findByLabelText("Archivo CSV"), {
      target: { files: [new File(["x"], "estudiantes.csv")] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Importar CSV" }));
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Fila 2: NRC inexistente",
    );
    expect(saved).not.toHaveBeenCalled();
  });
  it("sin semestre impide importar matrículas", async () => {
    installFakeApi({
      "GET /academic/courses/current": ok({ semester: null, courses: [] }),
    });
    renderAs(<ImportStudentsDialog onSaved={vi.fn()} onClose={vi.fn()} />);
    await screen.findByText("Activa un semestre antes de importar matrículas.");
    expect(screen.getByLabelText("Archivo CSV")).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("button", { name: "Importar CSV" })).toHaveProperty(
      "disabled",
      true,
    );
  });
});
