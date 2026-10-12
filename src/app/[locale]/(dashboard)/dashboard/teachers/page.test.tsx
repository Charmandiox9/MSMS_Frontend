import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TeachersPage from "./page";
import { renderAs } from "@/test/render";
import { fail, installFakeApi, ok } from "@/test/fake-api";
import { teachersApi } from "@/test/fixtures";
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

  it.each([
    ["ACADEMIC_PROCESS_ANALYST"],
    ["TEACHING_SUPPORT_COORDINATOR"],
  ] as const)(
    "permite consultar profesores a %s y oculta la importación",
    async (role) => {
      installFakeApi({ "GET /academic/teachers": teachersApi([teacher(1)]) });
      renderAs(<TeachersPage />, [role]);
      expect(await screen.findByText("Profesor 01")).toBeDefined();
      expect(screen.queryByRole("button", { name: /Importar/ })).toBeNull();
    },
  );

  it("busca por nombre, correo o NRC y pagina de a 10 en el backend", async () => {
    const api = installFakeApi({
      "GET /academic/teachers": teachersApi(
        Array.from({ length: 12 }, (_, index) => teacher(index + 1)),
      ),
    });
    renderAs(<TeachersPage />, ["ACADEMIC_SECRETARY"]);

    expect(await screen.findByText("Profesor 01")).toBeDefined();
    expect(screen.queryByText("Profesor 11")).toBeNull();
    expect(screen.getByText("Página 1 de 2 · 12 profesores")).toBeDefined();
    const [first] = api.calls("GET /academic/teachers");
    expect(first.query.get("page")).toBe("1");
    expect(first.query.get("pageSize")).toBe("10");
    expect(first.query.has("search")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(await screen.findByText("Profesor 11")).toBeDefined();
    expect(api.calls("GET /academic/teachers").at(-1)?.query.get("page")).toBe(
      "2",
    );

    fireEvent.change(
      screen.getByPlaceholderText("Buscar por nombre, correo o NRC…"),
      { target: { value: " 10005 " } },
    );
    expect(
      await screen.findByText("Página 1 de 1 · 1 profesores"),
    ).toBeDefined();
    expect(screen.getByText("Profesor 05")).toBeDefined();
    const lastSearch = api.calls("GET /academic/teachers").at(-1)!;
    expect(lastSearch.query.get("search")).toBe("10005");
    expect(lastSearch.query.get("page")).toBe("1");

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

  it("espera a que el usuario deje de escribir antes de buscar", async () => {
    const api = installFakeApi({
      "GET /academic/teachers": teachersApi([teacher(1), teacher(2)]),
    });
    renderAs(<TeachersPage />, ["ACADEMIC_SECRETARY"]);
    await screen.findByText("Profesor 01");
    const input = screen.getByPlaceholderText(
      "Buscar por nombre, correo o NRC…",
    );

    for (const value of ["P", "Pr", "Pro", "Profesor 02"]) {
      fireEvent.change(input, { target: { value } });
    }

    await waitFor(() =>
      expect(
        api
          .calls("GET /academic/teachers")
          .map((request) => request.query.get("search")),
      ).toContain("Profesor 02"),
    );
    const searches = api
      .calls("GET /academic/teachers")
      .map((request) => request.query.get("search"))
      .filter(Boolean);
    expect(searches).toEqual(["Profesor 02"]);
  });

  it("vuelve a la última página si la actual quedó fuera de rango", async () => {
    let teachers = Array.from({ length: 12 }, (_, index) => teacher(index + 1));
    installFakeApi({
      "GET /academic/teachers": (request) => teachersApi(teachers)(request),
      "POST /academic/teachers/import-roster": ok({
        importedTeachers: 1,
        importedAssignments: 1,
      }),
    });
    renderAs(<TeachersPage />, ["ACADEMIC_SECRETARY"]);
    await screen.findByText("Profesor 01");
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    await screen.findByText("Profesor 11");

    teachers = teachers.slice(0, 3);
    fireEvent.change(csvInput(), {
      target: { files: [new File(["x"], "profesores.csv")] },
    });

    expect(
      await screen.findByText("Página 1 de 1 · 3 profesores"),
    ).toBeDefined();
    expect(screen.getByText("Profesor 03")).toBeDefined();
  });

  it("importa el CSV enviando su contenido y recarga", async () => {
    const api = installFakeApi({
      "GET /academic/teachers": teachersApi([]),
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
      "GET /academic/teachers": teachersApi([]),
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
