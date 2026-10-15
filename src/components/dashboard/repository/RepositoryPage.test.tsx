import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import es from "../../../../messages/es.json";
import en from "../../../../messages/en.json";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderAs } from "@/test/render";
import { fail, installFakeApi, ok } from "@/test/fake-api";
import { DASHBOARD_SECTIONS, isRouteAllowed } from "@/config/navigation";
import type { RepositoryRecord } from "@/types/academic-repository";
import RepositoryPage from "./RepositoryPage";
import RepositoryEditor from "./RepositoryEditor";
import RepositoryDetails from "./RepositoryDetails";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), promise: vi.fn(), success: vi.fn() },
}));
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
  it.each([
    { locale: "es", messages: es, count: 0, label: "Sin resultados académicos asociados" },
    { locale: "es", messages: es, count: 1, label: "1 resultado académico asociado" },
    { locale: "es", messages: es, count: 3, label: "3 resultados académicos asociados" },
    { locale: "en", messages: en, count: 0, label: "No associated academic outputs" },
    { locale: "en", messages: en, count: 1, label: "1 associated academic output" },
    { locale: "en", messages: en, count: 3, label: "3 associated academic outputs" },
  ])("traduce los resultados asociados en $locale con cantidad $count", ({ locale, messages, count, label }) => {
    const onError = vi.fn();
    render(
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="America/Santiago" onError={onError}>
        <RepositoryDetails kind="projects" record={{ ...record, _count: { outputs: count } }} onClose={vi.fn()} onEdit={vi.fn()} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(label)).toBeDefined();
    expect(screen.queryByText("AcademicRepository.outputs")).toBeNull();
    expect(onError).not.toHaveBeenCalled();
  });
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
  it("previsualiza la planilla y confirma solo las filas válidas", async () => {
    const readAsDataUrl = vi
      .spyOn(FileReader.prototype, "readAsDataURL")
      .mockImplementation(function (this: FileReader) {
        Object.defineProperty(this, "result", {
          value: "data:application/octet-stream;base64,eA==",
        });
        queueMicrotask(() => this.dispatchEvent(new ProgressEvent("load")));
      });
    const api = installFakeApi({
      "GET /academic/projects": ok(page([])),
      "POST /academic/imports/projects/preview": ok({
        totalRows: 1,
        importable: 1,
        errors: [],
        duplicates: [],
        warnings: [],
        sample: [
          {
            row: 3,
            title: "Proyecto importado",
            code: "PR-25",
            reportingYear: 2025,
            academicUnit: "FCM",
          },
        ],
      }),
      "POST /academic/imports/projects/commit": ok({
        id: "import-job-1",
        status: "QUEUED",
      }),
      "GET /academic/imports/jobs/import-job-1": ok({
        id: "import-job-1",
        type: "PROJECTS",
        status: "COMPLETED",
        result: { imported: 1, skipped: 0, errors: [], duplicates: [] },
        error: null,
      }),
    });
    renderAs(<RepositoryPage kind="projects" />, ["ACADEMIC_PROCESS_ANALYST"]);
    await screen.findByText("Aún no hay proyectos registrados");
    fireEvent.click(screen.getByRole("button", { name: "Importar Excel" }));
    const input = screen.getByLabelText("Archivo .xlsx");
    fireEvent.change(input, {
      target: {
        files: [
          new File(["xlsx"], "proyectos.xlsx", {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
        ],
      },
    });
    await waitFor(() =>
      expect(api.calls("POST /academic/imports/projects/preview")).toHaveLength(
        1,
      ),
    );
    expect(await screen.findByText(/Proyecto importado/)).toBeDefined();
    expect(api.calls("POST /academic/imports/projects/preview")).toHaveLength(
      1,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Importar 1 proyectos" }),
    );
    await waitFor(() =>
      expect(api.calls("POST /academic/imports/projects/commit")).toHaveLength(
        1,
      ),
    );
    await waitFor(() =>
      expect(api.calls("GET /academic/imports/jobs/import-job-1")).toHaveLength(
        1,
      ),
    );
    readAsDataUrl.mockRestore();
  });
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
    expect(
      isRouteAllowed("/dashboard/research-outputs", DASHBOARD_SECTIONS, role),
    ).toBe(true);
  });
  it("reserva la navegación de resultados a los tres roles del repositorio", () => {
    expect(isRouteAllowed("/dashboard/research-outputs", DASHBOARD_SECTIONS, "TEACHING_SUPPORT_COORDINATOR")).toBe(false);
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
    expect(api.calls("GET /academic/projects/project-1")[0]).toMatchObject({
      operationName: 'RepositoryProjectDetail', credentials: 'include',
    });
  });
  it("formatea los montos del detalle según la moneda del proyecto", () => {
    renderAs(
      <RepositoryDetails
        kind="projects"
        record={{ ...record, currency: "CLP", totalAmount: "227700000" }}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
      ["ACADEMIC_PROCESS_ANALYST"],
    );
    expect(screen.getByText(/227\.700\.000/)).toBeDefined();
  });
  it('abre por GraphQL el detalle científico completo antes de editar una investigación', async () => {
    const investigation = { ...record, id: 'research-1', description: 'Descripción vigente', researchArea: 'Ecología',
      projectId: record.id, project: { id: record.id, title: 'Proyecto asociado', code: record.code } };
    const api = installFakeApi({
      'GET /academic/research': ok(page([investigation])),
      'GET /academic/research/research-1': ok(investigation),
      'GET /academic/projects': ok(page([record])),
      ...teachers(),
    });
    renderAs(<RepositoryPage kind='research' />, ['ACADEMIC_SECRETARY']);
    await screen.findByText(record.title);
    fireEvent.click(screen.getByRole('button', { name: `Editar ${record.title}` }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByDisplayValue(investigation.description)).toBeDefined();
    expect(within(dialog).getByDisplayValue(investigation.researchArea)).toBeDefined();
    expect(api.calls('GET /academic/research/research-1')[0]).toMatchObject({ operationName: 'RepositoryResearchDetail' });
  });
  it("muestra estado vacío y avisa cuando el año informado está incompleto", async () => {
    const api = installFakeApi({ "GET /academic/projects": ok(page([record])) });
    renderAs(<RepositoryPage kind="projects" />, ["ACADEMIC_SECRETARY"]);
    await screen.findByText(record.title);
    fireEvent.change(screen.getByLabelText("Año informado"), {
      target: { value: "202" },
    });
    expect(await screen.findByText("Sin registros para ese año")).toBeDefined();
    expect(toast.error).toHaveBeenCalledWith(
      "El año debe estar entre 1900 y 2200. Modifica el año informado.",
    );
    expect(api.calls("GET /academic/projects")).toHaveLength(1);
  });
  it("envía los criterios de orden elegidos al backend", async () => {
    const api = installFakeApi({ "GET /academic/projects": ok(page([record])) });
    renderAs(<RepositoryPage kind="projects" />, ["ACADEMIC_PROCESS_ANALYST"]);
    await screen.findByText(record.title);
    fireEvent.change(screen.getByLabelText("Ordenar por"), {
      target: { value: "totalAmount" },
    });
    fireEvent.change(screen.getByLabelText("Dirección"), {
      target: { value: "asc" },
    });
    await waitFor(() => {
      const call = api.calls("GET /academic/projects").at(-1);
      expect(call?.query.get("sortBy")).toBe("totalAmount");
      expect(call?.query.get("sortOrder")).toBe("asc");
    });
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
  it('consulta por GraphQL las opciones y bloquea proyectos ocupados por otra investigación', async () => {
    const investigation = { ...record, id: 'research-1', projectId: 'current' };
    const api = installFakeApi({ ...teachers(), 'GET /academic/projects': ok(page([
      { ...record, id: 'occupied', title: 'Proyecto ocupado', code: null, research: { id: 'research-2', title: 'Otra investigación' } },
      { ...record, id: 'current', title: 'Proyecto actual', code: null, research: { id: 'research-1', title: 'Investigación actual' } },
      { ...record, id: 'free', title: 'Proyecto disponible', code: null, research: null },
    ])) });
    renderAs(<RepositoryEditor kind='research' record={investigation} onClose={vi.fn()} onSaved={vi.fn()} />, ['ACADEMIC_PROCESS_ANALYST']);
    const occupied = await screen.findByRole('option', { name: 'Proyecto ocupado' });
    expect(occupied.hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('option', { name: 'Proyecto actual' }).hasAttribute('disabled')).toBe(false);
    expect(screen.getByRole('option', { name: 'Proyecto disponible' }).hasAttribute('disabled')).toBe(false);
    expect(api.calls('GET /academic/projects')[0]).toMatchObject({ operationName: 'RepositoryProjectOptions', credentials: 'include' });
  });
});
