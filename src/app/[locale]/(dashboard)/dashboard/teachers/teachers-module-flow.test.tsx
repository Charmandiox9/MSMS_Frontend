import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TeachersPage from "./page";
import { renderAs } from "@/test/render";
import { fail, installFakeApi, ok } from "@/test/fake-api";
import type { Teacher } from "@/types/justifications";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function mockTeacher(
  index: number,
  nrcs: string[] = [String(10000 + index)],
  isActive = true,
): Teacher {
  return {
    id: `teacher-${index}`,
    name: `Profesor ${String(index).padStart(2, "0")}`,
    email: `profesor${index}@ucn.cl`,
    employeeCode: `DOC-00${index}`,
    academicDegree: index % 2 === 0 ? "Doctor en Informática" : "Magíster en Ciencias",
    professionalTitle: "Ingeniero Civil en Computación",
    institution: "Universidad Católica del Norte",
    joinedOn: "2024-03-01T00:00:00.000Z",
    isActive,
    assignments: nrcs.map((nrc) => ({
      id: `assign-${index}-${nrc}`,
      nrc,
      course: { code: `INF-${nrc}`, name: `Curso ${nrc}` },
      semester: { name: "2026-2", isActive: true },
    })),
  };
}

describe("Flujo Integral del Módulo Académico / Docentes (E2E Frontend)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it(
    "Flujo 1: Alta completa de docente con acreditación académica y asignaturas vinculadas",
    async () => {
    let teachersList: Teacher[] = [];

    const api = installFakeApi({
      "GET /academic/teachers": () => ({ status: 200, body: teachersList }),
      "GET /academic/courses": ok([
        { nrc: "10001", course: { code: "MAT-101", name: "Cálculo I" } },
        { nrc: "10002", course: { code: "INF-201", name: "Estructuras de Datos" } },
      ]),
      "POST /academic/teachers": (req) => {
        const body = req.body as Partial<Teacher> & { nrcs?: string[] };
        const newTeacher: Teacher = {
          id: "teacher-created-1",
          name: body.name || "",
          email: body.email || "",
          employeeCode: body.employeeCode || "",
          academicDegree: body.academicDegree,
          professionalTitle: body.professionalTitle,
          institution: body.institution,
          joinedOn: body.joinedOn,
          isActive: true,
          assignments: (body.nrcs || []).map((nrc) => ({
            id: `assign-created-${nrc}`,
            nrc,
            course: { code: `CRS-${nrc}`, name: `Curso ${nrc}` },
            semester: { name: "2026-2", isActive: true },
          })),
        };
        teachersList = [newTeacher];
        return { status: 201, body: newTeacher };
      },
    });

    renderAs(<TeachersPage />, ["ACADEMIC_SECRETARY"]);

    expect(
      await screen.findByText("No hay profesores cargados para el semestre activo."),
    ).toBeDefined();

    // 1. Abrir modal de creación
    fireEvent.click(screen.getByRole("button", { name: "Registrar docente" }));
    expect(await screen.findByText("Registrar nuevo docente")).toBeDefined();

    const dialog = screen.getByRole("dialog");

    // 2. Comprobar cumplimiento Ley N° 21.719
    expect(within(dialog).getAllByText(/Ley N° 21.719/).length).toBeGreaterThan(0);

    // 3. Rellenar datos principales y acreditación
    fireEvent.change(within(dialog).getByLabelText(/Nombre completo/), {
      target: { value: "Dra. Valentina Lagos" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Correo institucional/), {
      target: { value: "valentina.lagos@ucn.cl" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Código de empleado/), {
      target: { value: "DOC-204" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Grado académico/), {
      target: { value: "Doctora en Inteligencia Artificial" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Título profesional/), {
      target: { value: "Ingeniera Civil en Informática" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Institución de egreso/), {
      target: { value: "Universidad Católica del Norte" },
    });

    // 4. Agregar NRC manual
    const manualNrcInput = within(dialog).getByPlaceholderText(/10001/);
    fireEvent.change(manualNrcInput, { target: { value: "10001" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Vincular NRC" }));

    // Validar chip del NRC agregado
    expect(within(dialog).getByRole("button", { name: "Eliminar NRC 10001" })).toBeDefined();

    // 5. Enviar formulario desde el botón del modal
    const submitBtn = within(dialog).getByRole("button", { name: "Registrar docente" });
    fireEvent.click(submitBtn);

    // 6. Verificar invocación al backend con la estructura esperada
    await waitFor(() => {
      const calls = api.calls("POST /academic/teachers");
      expect(calls).toHaveLength(1);
      expect(calls[0].body).toEqual(
        expect.objectContaining({
          name: "Dra. Valentina Lagos",
          email: "valentina.lagos@ucn.cl",
          employeeCode: "DOC-204",
          academicDegree: "Doctora en Inteligencia Artificial",
          professionalTitle: "Ingeniera Civil en Informática",
          institution: "Universidad Católica del Norte",
          nrcs: ["10001"],
        }),
      );
    });

    // 7. Verificar que la nómina muestre a la nueva docente registrada
    expect(await screen.findByText("Dra. Valentina Lagos")).toBeDefined();
    expect(screen.getByText("Doctora en Inteligencia Artificial")).toBeDefined();
    expect(screen.getByText("NRC 10001")).toBeDefined();
  }, 15000);

  it("Flujo 2: Edición completa de docente y actualización de acreditación / asignaturas", async () => {
    let currentTeacher = mockTeacher(1, ["10001"]);

    const api = installFakeApi({
      "GET /academic/teachers": () => ({ status: 200, body: [currentTeacher] }),
      "GET /academic/courses": ok([]),
      "PATCH /academic/teachers/teacher-1": (req) => {
        const body = req.body as Partial<Teacher> & { nrcs?: string[] };
        currentTeacher = {
          ...currentTeacher,
          academicDegree: body.academicDegree ?? currentTeacher.academicDegree,
          professionalTitle: body.professionalTitle ?? currentTeacher.professionalTitle,
          assignments: (body.nrcs || []).map((nrc) => ({
            id: `assign-${nrc}`,
            nrc,
            course: { code: `CRS-${nrc}`, name: `Curso ${nrc}` },
            semester: { name: "2026-2", isActive: true },
          })),
        };
        return { status: 200, body: currentTeacher };
      },
    });

    renderAs(<TeachersPage />, ["ACADEMIC_SECRETARY"]);
    expect(await screen.findByText("Profesor 01")).toBeDefined();

    // 1. Abrir modal de edición
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(await screen.findByText("Editar información del docente")).toBeDefined();

    const dialog = screen.getByRole("dialog");

    // 2. Verificar prellenado de campos
    const degreeInput = within(dialog).getByLabelText(/Grado académico/) as HTMLInputElement;
    expect(degreeInput.value).toBe(currentTeacher.academicDegree);

    // 3. Modificar datos
    fireEvent.change(degreeInput, {
      target: { value: "Doctor en Ciencias de la Ingeniería" },
    });

    // 4. Agregar otro NRC manual
    const manualNrcInput = within(dialog).getByPlaceholderText(/10001/);
    fireEvent.change(manualNrcInput, { target: { value: "20002" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Vincular NRC" }));
    expect(within(dialog).getByText(/NRC 20002/)).toBeDefined();

    // 5. Guardar cambios
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));

    // 6. Verificar invocación al endpoint PATCH
    await waitFor(() => {
      const calls = api.calls("PATCH /academic/teachers/teacher-1");
      expect(calls).toHaveLength(1);
      expect(calls[0].body).toEqual(
        expect.objectContaining({
          academicDegree: "Doctor en Ciencias de la Ingeniería",
          nrcs: expect.arrayContaining(["10001", "20002"]),
        }),
      );
    });

    // 7. Verificar reflejo de datos en la nómina
    expect(
      await screen.findByText("Doctor en Ciencias de la Ingeniería"),
    ).toBeDefined();
  });

  it("Flujo 3: Desactivación asistida con alerta de asignaturas y posterior reactivación", async () => {
    let teacherRecord = mockTeacher(1, ["10001"], true);

    const api = installFakeApi({
      "GET /academic/teachers": () => ({ status: 200, body: [teacherRecord] }),
      "PATCH /academic/teachers/teacher-1/status": (req) => {
        const body = req.body as { isActive: boolean };
        teacherRecord = { ...teacherRecord, isActive: body.isActive };
        return { status: 200, body: teacherRecord };
      },
    });

    renderAs(<TeachersPage />, ["ACADEMIC_SECRETARY"]);
    expect(await screen.findByText("Profesor 01")).toBeDefined();

    // 1. Clic en botón "Desactivar"
    fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));

    // 2. Modal de confirmación y alerta de asignaciones asociadas
    expect(await screen.findByText("¿Desactivar docente?")).toBeDefined();
    expect(
      screen.getByText(/10001 · Curso 10001/),
    ).toBeDefined();

    // 3. Confirmar desactivación
    fireEvent.click(screen.getByRole("button", { name: "Confirmar desactivación" }));

    await waitFor(() => {
      expect(api.calls("PATCH /academic/teachers/teacher-1/status")).toHaveLength(1);
      expect(api.calls("PATCH /academic/teachers/teacher-1/status")[0].body).toEqual({
        isActive: false,
      });
    });

    // 4. Filtrar por Inactivos para encontrar al docente desactivado
    fireEvent.click(screen.getByRole("button", { name: "Inactivos" }));
    expect(await screen.findByText("Profesor 01")).toBeDefined();

    // 5. Debe mostrarse el botón "Activar"
    const activateBtn = screen.getByRole("button", { name: "Activar" });
    fireEvent.click(activateBtn);

    // 6. Modal de reactivación
    expect(await screen.findByText("¿Activar docente?")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Reactivar docente" }));

    await waitFor(() => {
      expect(api.calls("PATCH /academic/teachers/teacher-1/status")).toHaveLength(2);
      expect(api.calls("PATCH /academic/teachers/teacher-1/status")[1].body).toEqual({
        isActive: true,
      });
    });
  });

  it("Flujo 4: Búsqueda reactiva, filtros de estado combinados y paginación en nómina", async () => {
    const list = [
      mockTeacher(1, ["10001"], true),
      mockTeacher(2, ["10002"], true),
      mockTeacher(3, ["10003"], false),
      ...Array.from({ length: 9 }, (_, i) => mockTeacher(i + 4, [`1000${i + 4}`], true)),
    ];

    installFakeApi({
      "GET /academic/teachers": () => ({ status: 200, body: list }),
    });

    renderAs(<TeachersPage />, ["ACADEMIC_SECRETARY"]);
    expect(await screen.findByText("Profesor 01")).toBeDefined();

    // Verificación de paginación inicial (12 profesores totales, 10 por página)
    expect(screen.getByText("Página 1 de 2 · 12 profesores")).toBeDefined();

    // Filtrar solo inactivos
    fireEvent.click(screen.getByRole("button", { name: "Inactivos" }));
    expect(screen.getByText("Profesor 03")).toBeDefined();
    expect(screen.queryByText("Profesor 01")).toBeNull();
    expect(screen.getByText("Página 1 de 1 · 1 profesores")).toBeDefined();

    // Volver a todos
    fireEvent.click(screen.getByRole("button", { name: "Todos" }));
    expect(screen.getByText("Profesor 01")).toBeDefined();

    // Buscar por NRC específico
    const searchInput = screen.getByPlaceholderText("Buscar por nombre, correo o NRC…");
    fireEvent.change(searchInput, { target: { value: "10002" } });
    expect(screen.getByText("Profesor 02")).toBeDefined();
    expect(screen.queryByText("Profesor 01")).toBeNull();

    // Buscar término inexistente
    fireEvent.change(searchInput, { target: { value: "inexistente" } });
    expect(
      screen.getByText("No hay profesores que coincidan con la búsqueda."),
    ).toBeDefined();

    // Limpiar búsqueda
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByText("Profesor 01")).toBeDefined();
  });

  it("Flujo 5: Manejo seguro de conflictos de backend (409) sin comprometer la vista ni exponer datos", async () => {
    installFakeApi({
      "GET /academic/teachers": ok([]),
      "GET /academic/courses": ok([]),
      "POST /academic/teachers": fail(409, "El correo electrónico ya se encuentra registrado."),
    });

    renderAs(<TeachersPage />, ["ACADEMIC_SECRETARY"]);
    expect(
      await screen.findByText("No hay profesores cargados para el semestre activo."),
    ).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Registrar docente" }));
    expect(await screen.findByText("Registrar nuevo docente")).toBeDefined();

    const dialog = screen.getByRole("dialog");

    fireEvent.change(within(dialog).getByLabelText(/Nombre completo/), {
      target: { value: "Docente Existente" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Correo institucional/), {
      target: { value: "existente@ucn.cl" },
    });

    fireEvent.click(within(dialog).getByRole("button", { name: "Registrar docente" }));

    // Debe mostrar el error en el modal sin cerrarlo ni quebrar la app
    expect(
      await screen.findByText("El correo electrónico ya se encuentra registrado."),
    ).toBeDefined();
    expect(screen.getByText("Registrar nuevo docente")).toBeDefined();
  });
});
