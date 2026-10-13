import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TeachersPage from "./page";
import { renderAs } from "@/test/render";
import { fail, installFakeApi, ok } from "@/test/fake-api";
import type { Teacher } from "@/types/justifications";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function teacher(
  index: number,
  nrcs: string[] = [String(10000 + index)],
): Teacher {
  return {
    id: `t-${index}`,
    name: `Profesor ${String(index).padStart(2, "0")}`,
    email: `profesor${index}@ucn.cl`,
    assignments: nrcs.map((nrc) => ({
      id: `a-${index}-${nrc}`,
      nrc,
      course: { code: "MAT", name: "Cálculo" },
      semester: { name: "2026-2", isActive: true },
    })),
  };
}

function csvInput() {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("TeachersPage (padrón de profesores)", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it.each([["TEACHING_SUPPORT_COORDINATOR"]] as const)(
    "bloquea la vista para %s",
    async (role) => {
      const api = installFakeApi();
      renderAs(<TeachersPage />, [role]);

      expect(
        await screen.findByText("No tienes acceso a esta página."),
      ).toBeDefined();
      expect(api.requests).toHaveLength(0);
    },
  );

  it("permite consultar profesores al analista y oculta la importación", async () => {
    installFakeApi({ "GET /academic/teachers": ok([teacher(1)]) });
    renderAs(<TeachersPage />, ["ACADEMIC_PROCESS_ANALYST"]);
    expect(await screen.findByText("Profesor 01")).toBeDefined();
    expect(screen.queryByRole("button", { name: /Importar/ })).toBeNull();
  });

  it("busca por nombre, correo o NRC y pagina de a 10", async () => {
    installFakeApi({
      "GET /academic/teachers": ok(
        Array.from({ length: 12 }, (_, index) => teacher(index + 1)),
      ),
    });
    renderAs(<TeachersPage />, ["ACADEMIC_SECRETARY"]);

    expect(await screen.findByText("Profesor 01")).toBeDefined();
    expect(screen.queryByText("Profesor 11")).toBeNull();
    expect(screen.getByText("Página 1 de 2 · 12 profesores")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(screen.getByText("Profesor 11")).toBeDefined();

    fireEvent.change(
      screen.getByPlaceholderText("Buscar por nombre, correo o NRC…"),
      { target: { value: "10005" } },
    );
    expect(screen.getByText("Profesor 05")).toBeDefined();
    expect(screen.getByText("Página 1 de 1 · 1 profesores")).toBeDefined();

    fireEvent.change(
      screen.getByPlaceholderText("Buscar por nombre, correo o NRC…"),
      { target: { value: "nadie" } },
    );
    expect(
      screen.getByText("No hay profesores que coincidan con la búsqueda."),
    ).toBeDefined();
  });

  it("importa el CSV enviando su contenido y recarga", async () => {
    const api = installFakeApi({
      "GET /academic/teachers": ok([]),
      "POST /academic/teachers/import-roster": ok({
        importedTeachers: 2,
        importedAssignments: 3,
      }),
    });
    renderAs(<TeachersPage />, ["ACADEMIC_SECRETARY"]);
    await screen.findByText(
      "No hay profesores cargados para el semestre activo.",
    );

    const csv =
      "nombre;correo;nrc1;nrc2\nJuan Pérez;juan.perez@ucn.cl;10001;10002\nAna Soto;ana.soto@ucn.cl;10003;";
    fireEvent.change(csvInput(), {
      target: {
        files: [new File([csv], "profesores.csv", { type: "text/csv" })],
      },
    });

    expect(
      await screen.findByText("Se cargaron 2 profesores y 3 asignaciones."),
    ).toBeDefined();
    expect(api.calls("POST /academic/teachers/import-roster")[0].body).toEqual({
      csv,
    });
    await waitFor(() =>
      expect(api.calls("GET /academic/teachers")).toHaveLength(2),
    );
  });

  it("muestra el error del backend si el CSV es inválido", async () => {
    installFakeApi({
      "GET /academic/teachers": ok([]),
      "POST /academic/teachers/import-roster": fail(
        400,
        "Fila 2: correo inválido",
      ),
    });
    renderAs(<TeachersPage />, ["SYSTEM_ADMIN"]);
    await screen.findByText(
      "No hay profesores cargados para el semestre activo.",
    );

    fireEvent.change(csvInput(), {
      target: { files: [new File(["x"], "malo.csv")] },
    });

    expect(await screen.findByText("Fila 2: correo inválido")).toBeDefined();
  });

  it("permite abrir el modal de registro de nuevo docente a la secretaria", async () => {
    installFakeApi({ "GET /academic/teachers": ok([]) });
    renderAs(<TeachersPage />, ["ACADEMIC_SECRETARY"]);
    await screen.findByText(
      "No hay profesores cargados para el semestre activo.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Registrar docente" }));
    expect(screen.getByText("Registrar nuevo docente")).toBeDefined();
  });

  it("permite filtrar por estado y alternar la desactivación", async () => {
    const activeT = teacher(1);
    const inactiveT = { ...teacher(2), isActive: false };

    const api = installFakeApi({
      "GET /academic/teachers": ok([activeT, inactiveT]),
      "PATCH /academic/teachers/t-1/status": ok({
        ...activeT,
        isActive: false,
      }),
    });

    renderAs(<TeachersPage />, ["ACADEMIC_SECRETARY"]);
    expect(await screen.findByText("Profesor 01")).toBeDefined();
    expect(screen.getByText("Profesor 02")).toBeDefined();

    // Filtro Activos
    fireEvent.click(screen.getByRole("button", { name: "Activos" }));
    expect(screen.getByText("Profesor 01")).toBeDefined();
    expect(screen.queryByText("Profesor 02")).toBeNull();

    // Filtro Inactivos
    fireEvent.click(screen.getByRole("button", { name: "Inactivos" }));
    expect(screen.queryByText("Profesor 01")).toBeNull();
    expect(screen.getByText("Profesor 02")).toBeDefined();

    // Volver a Todos
    fireEvent.click(screen.getByRole("button", { name: "Todos" }));
    expect(screen.getByText("Profesor 01")).toBeDefined();

    // Abrir modal de desactivación para Profesor 01
    const deactivateBtns = screen.getAllByRole("button", { name: "Desactivar" });
    fireEvent.click(deactivateBtns[0]);
    expect(screen.getByText("¿Desactivar docente?")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar desactivación" }));
    await waitFor(() =>
      expect(api.calls("PATCH /academic/teachers/t-1/status")).toHaveLength(1),
    );
  });

  it("permite exportar la nómina de profesores a CSV", async () => {
    installFakeApi({
      "GET /academic/teachers": ok([teacher(1)]),
    });
    const createObjectURLMock = vi.fn().mockReturnValue("blob:test");
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    renderAs(<TeachersPage />, ["ACADEMIC_SECRETARY"]);
    expect(await screen.findByText("Profesor 01")).toBeDefined();

    const exportBtn = screen.getByRole("button", { name: "Exportar nómina" });
    fireEvent.click(exportBtn);

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });

  it("muestra antecedentes de acreditación y permite editar docente", async () => {
    const accreditedTeacher: Teacher = {
      id: "t-accred",
      name: "Dra. María Morales",
      email: "maria.morales@ucn.cl",
      academicDegree: "Doctora en Ciencias de la Computación",
      professionalTitle: "Ingeniera Civil en Informática",
      institution: "Universidad Católica del Norte",
      assignments: [],
    };

    installFakeApi({
      "GET /academic/teachers": ok([accreditedTeacher]),
    });

    renderAs(<TeachersPage />, ["ACADEMIC_SECRETARY"]);
    expect(await screen.findByText("Dra. María Morales")).toBeDefined();
    expect(
      screen.getByText("Doctora en Ciencias de la Computación"),
    ).toBeDefined();
    expect(
      screen.getByText("Ingeniera Civil en Informática"),
    ).toBeDefined();
    expect(
      screen.getByText("(Universidad Católica del Norte)"),
    ).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByText("Editar información del docente")).toBeDefined();
  });
});
