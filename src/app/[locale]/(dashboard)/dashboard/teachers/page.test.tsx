import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TeachersPage from "./page";
import { renderAs } from "@/test/render";
import { fail, installFakeApi, ok } from "@/test/fake-api";
import type { Teacher } from "@/types/justifications";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    promise: (operation: Promise<unknown>) => operation,
  },
}));

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

function teacherList(items: Teacher[]) {
  return (request: { query: URLSearchParams }) => {
    const page = Number(request.query.get("page") ?? 1);
    const pageSize = Number(request.query.get("pageSize") ?? 10);
    const search = request.query.get("search")?.toLowerCase() ?? "";
    const active = request.query.get("isActive");
    const filtered = items.filter(
      (item) =>
        (active === null || String(item.isActive !== false) === active) &&
        `${item.name} ${item.email} ${item.assignments.map(({ nrc }) => nrc).join(" ")}`
          .toLowerCase()
          .includes(search),
    );
    return {
      body: {
        items: filtered.slice((page - 1) * pageSize, page * pageSize),
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
      },
    };
  };
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

  it("permite al analista consultar, crear, editar e importar profesores", async () => {
    installFakeApi({ "GET /academic/teachers": teacherList([teacher(1)]) });
    renderAs(<TeachersPage />, ["ACADEMIC_PROCESS_ANALYST"]);
    expect(await screen.findByText("Profesor 01")).toBeDefined();
    expect(screen.getByRole("button", { name: /Importar/ })).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Crear profesor" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /Editar Profesor 01/ }),
    ).toBeDefined();
  });

  it("busca por nombre, correo o NRC y pagina de a 10", async () => {
    const api = installFakeApi({
      "GET /academic/teachers": teacherList(
        Array.from({ length: 12 }, (_, index) => teacher(index + 1)),
      ),
    });
    renderAs(<TeachersPage />, ["ACADEMIC_SECRETARY"]);

    expect(await screen.findByText("Profesor 01")).toBeDefined();
    expect(screen.queryByText("Profesor 11")).toBeNull();
    expect(screen.getByText("Página 1 de 2 · 12 profesores")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(await screen.findByText("Profesor 11")).toBeDefined();
    expect(api.calls("GET /academic/teachers").at(-1)?.query.get("page")).toBe(
      "2",
    );

    fireEvent.change(
      screen.getByPlaceholderText("Buscar por nombre, correo o NRC…"),
      { target: { value: "10005" } },
    );
    expect(await screen.findByText("Profesor 05")).toBeDefined();
    expect(
      api.calls("GET /academic/teachers").at(-1)?.query.get("search"),
    ).toBe("10005");
    expect(api.calls("GET /academic/teachers").at(-1)?.query.get("page")).toBe(
      "1",
    );
    expect(screen.getByText("Página 1 de 1 · 1 profesores")).toBeDefined();

    fireEvent.change(
      screen.getByPlaceholderText("Buscar por nombre, correo o NRC…"),
      { target: { value: "nadie" } },
    );
    expect(
      await screen.findByText(
        "No hay profesores que coincidan con la búsqueda.",
      ),
    ).toBeDefined();
  });

  it("filtra profesores por estado y permite reactivarlos sin borrar sus datos", async () => {
    const inactive = { ...teacher(1), isActive: false };
    const active = { ...inactive, isActive: true };
    const api = installFakeApi({
      "GET /academic/teachers": teacherList([inactive]),
      "PATCH /academic/teachers/t-1/status": ok(active),
    });
    renderAs(<TeachersPage />, ["ACADEMIC_SECRETARY"]);

    expect(await screen.findByText("Profesor 01")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Estado"), {
      target: { value: "INACTIVE" },
    });
    await waitFor(() =>
      expect(
        api.calls("GET /academic/teachers").at(-1)?.query.get("isActive"),
      ).toBe("false"),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Activar al profesor Profesor 01" }),
    );
    expect(
      await screen.findByText(
        "Sus asignaciones, contratos y registros históricos se conservarán.",
      ),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Activar" }));

    await waitFor(() =>
      expect(api.calls("PATCH /academic/teachers/t-1/status")).toHaveLength(1),
    );
    expect(api.calls("PATCH /academic/teachers/t-1/status")[0].body).toEqual({
      isActive: true,
    });
    expect(
      api.calls("GET /academic/teachers").at(-1)?.query.get("isActive"),
    ).toBe("false");
  });

  it("importa el CSV enviando su contenido y recarga", async () => {
    const api = installFakeApi({
      "GET /academic/teachers": teacherList([]),
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
      "GET /academic/teachers": teacherList([]),
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
});
