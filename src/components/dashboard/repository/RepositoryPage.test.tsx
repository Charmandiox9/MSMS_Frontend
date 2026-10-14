import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderAs } from "@/test/render";
import { fail, installFakeApi, ok } from "@/test/fake-api";
import { DASHBOARD_SECTIONS, isRouteAllowed } from "@/config/navigation";
import type { RepositoryRecord } from "@/types/academic-repository";
import RepositoryPage from "./RepositoryPage";
import RepositoryEditor from "./RepositoryEditor";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), promise: vi.fn() } }));
const record: RepositoryRecord = {
  id: "project-1",
  title: "Ecosistemas costeros",
  code: "MAR-1",
  academicUnit: "Ciencias del Mar",
  reportingYear: 2026,
  status: "REGISTERED",
  startsOn: null,
  endsOn: null,
  createdAt: "2026-10-14T12:00:00.000Z",
  updatedAt: "2026-10-14T12:00:00.000Z",
  participants: [],
  _count: { outputs: 0 },
  research: null,
};
const page = (items: RepositoryRecord[]) => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 10,
  totalPages: items.length ? 1 : 0,
});
const teachers = () => ({ "GET /academic/teachers": ok(page([])) });

describe("Páginas del repositorio académico", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());
  it.each(["projects", "research"] as const)(
    "bloquea coordinación en %s sin consultar datos",
    async (kind) => {
      const api = installFakeApi();
      renderAs(<RepositoryPage kind={kind} />, [
        "TEACHING_SUPPORT_COORDINATOR",
      ]);
      expect(
        await screen.findByText("No tienes acceso a esta página."),
      ).toBeDefined();
      expect(api.requests).toHaveLength(0);
      expect(
        isRouteAllowed(
          `/dashboard/${kind}`,
          DASHBOARD_SECTIONS,
          "TEACHING_SUPPORT_COORDINATOR",
        ),
      ).toBe(false);
    },
  );
  it.each([
    "SYSTEM_ADMIN",
    "ACADEMIC_SECRETARY",
    "ACADEMIC_PROCESS_ANALYST",
  ] as const)("permite los dos CRUD a %s", async (role) => {
    installFakeApi({ "GET /academic/projects": ok(page([record])) });
    renderAs(<RepositoryPage kind="projects" />, [role]);
    expect(await screen.findByText(record.title)).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Crear proyecto" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: `Editar ${record.title}` }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: `Eliminar ${record.title}` }),
    ).toBeDefined();
    expect(
      isRouteAllowed("/dashboard/research", DASHBOARD_SECTIONS, role),
    ).toBe(true);
  });
  it("filtra por búsqueda y estado y consulta el detalle antes de editar", async () => {
    const api = installFakeApi({
      "GET /academic/projects": ok(page([record])),
      "GET /academic/projects/project-1": ok(record),
      ...teachers(),
    });
    renderAs(<RepositoryPage kind="projects" />, ["ACADEMIC_PROCESS_ANALYST"]);
    await screen.findByText(record.title);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "costero" },
    });
    fireEvent.change(screen.getByLabelText("Estado"), {
      target: { value: "IN_PROGRESS" },
    });
    await waitFor(() =>
      expect(
        api.calls("GET /academic/projects").at(-1)?.query.get("status"),
      ).toBe("IN_PROGRESS"),
    );
    expect(
      api.calls("GET /academic/projects").at(-1)?.query.get("search"),
    ).toBe("costero");
    await screen.findByText(record.title);
    fireEvent.click(
      screen.getByRole("button", { name: `Editar ${record.title}` }),
    );
    expect(await screen.findByRole("dialog")).toBeDefined();
    expect(api.calls("GET /academic/projects/project-1")).toHaveLength(1);
  });
  it("muestra error con reintento y mantiene el formulario al fallar el guardado", async () => {
    const api = installFakeApi({
      "GET /academic/projects": fail(503, "No disponible"),
    });
    renderAs(<RepositoryPage kind="projects" />, ["ACADEMIC_SECRETARY"]);
    expect(await screen.findByRole("alert")).toBeDefined();
    api.on("GET /academic/projects", ok(page([])));
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(
      await screen.findByText("Aún no hay proyectos registrados"),
    ).toBeDefined();
    api.on("GET /academic/teachers", ok(page([])));
    api.on("POST /academic/projects", fail(409, "Código duplicado"));
    fireEvent.click(screen.getByRole("button", { name: "Crear proyecto" }));
    const dialog = await screen.findByRole("dialog");
    await waitFor(() =>
      expect(
        within(dialog)
          .getByRole("button", { name: "Guardar" })
          .hasAttribute("disabled"),
      ).toBe(false),
    );
    fireEvent.change(within(dialog).getByLabelText(/^Título/), {
      target: { value: "Nuevo proyecto" },
    });
    fireEvent.change(within(dialog).getByLabelText(/^Unidad académica/), {
      target: { value: "Unidad" },
    });
    fireEvent.submit(dialog.querySelector("form")!);
    await waitFor(() =>
      expect(api.calls("POST /academic/projects")).toHaveLength(1),
    );
    expect(within(dialog).getByDisplayValue("Nuevo proyecto")).toBeDefined();
    expect(api.calls("POST /academic/projects")[0].body).toMatchObject({
      totalAmount: null,
      code: null,
      participants: [],
    });
  });
  it("pide confirmación de eliminación y envía la versión del registro", async () => {
    const api = installFakeApi({
      "GET /academic/projects": ok(page([record])),
      "GET /academic/projects/project-1": ok(record),
      "DELETE /academic/projects/project-1": ok({ success: true }),
    });
    renderAs(<RepositoryPage kind="projects" />, ["SYSTEM_ADMIN"]);
    await screen.findByText(record.title);
    fireEvent.click(
      screen.getByRole("button", { name: `Eliminar ${record.title}` }),
    );
    await screen.findByRole("dialog");
    expect(api.calls("DELETE /academic/projects/project-1")).toHaveLength(0);
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar eliminación" }),
    );
    await waitFor(() =>
      expect(api.calls("DELETE /academic/projects/project-1")).toHaveLength(1),
    );
    expect(
      api
        .calls("DELETE /academic/projects/project-1")[0]
        .query.get("expectedUpdatedAt"),
    ).toBe(record.updatedAt);
  });
  it("actualiza una investigación conservando campos y vínculo, sin convertir desconocidos en cero", async () => {
    const investigation = {
      ...record,
      id: "research-1",
      projectId: record.id,
      description: "Texto científico",
      researchArea: "Ecología",
    };
    const onSaved = vi.fn();
    const api = installFakeApi({
      ...teachers(),
      "GET /academic/projects": ok(page([record])),
      "PUT /academic/research/research-1": ok(investigation),
    });
    renderAs(
      <RepositoryEditor
        kind="research"
        record={investigation}
        onClose={vi.fn()}
        onSaved={onSaved}
      />,
      ["ACADEMIC_PROCESS_ANALYST"],
    );
    await waitFor(() =>
      expect(
        screen
          .getByRole("button", { name: "Guardar" })
          .hasAttribute("disabled"),
      ).toBe(false),
    );
    fireEvent.change(screen.getByLabelText(/^Título/), {
      target: { value: "Actividad actualizada" },
    });
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(
      api.calls("PUT /academic/research/research-1")[0].body,
    ).toMatchObject({
      title: "Actividad actualizada",
      description: "Texto científico",
      researchArea: "Ecología",
      projectId: record.id,
      expectedUpdatedAt: record.updatedAt,
    });
  });
});
