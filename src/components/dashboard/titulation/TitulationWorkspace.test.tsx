import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderAs } from "@/test/render";
import type {
  TitulationPageResult,
  TitulationProcess,
} from "./titulation-types";
import TitulationWorkspace from "./TitulationWorkspace";

type ApiFetchMock = (path: string, init?: RequestInit) => Promise<unknown>;

const { apiFetchMock, apiFetchFileMock, downloadBlobMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn<ApiFetchMock>(),
  apiFetchFileMock:
    vi.fn<(path: string, contentType: string) => Promise<Blob>>(),
  downloadBlobMock: vi.fn<(filename: string, blob: Blob) => void>(),
}));

vi.mock("@/lib/api", () => ({
  apiFetch: apiFetchMock,
  apiFetchFile: apiFetchFileMock,
}));
vi.mock("@/lib/download", () => ({ downloadBlob: downloadBlobMock }));

const listItem = {
  id: "process-1",
  reference: "TIT-2026-1234ABCD",
  studentName: "Daniel Ignacio Durán García",
  thesisTopic: "Ecología de comunidades costeras",
  degree: "Biólogo Marino",
  careerName: "Biología Marina",
  source: "LEGACY_ACCESS",
  defenseDate: "2026-12-12T00:00:00.000Z",
  stage: "REVIEW",
  outcome: "GRADUATED",
  defenseAnnexesStatus: "RECEIVED",
  thesisSummaryStatus: "PENDING",
  libraryFormStatus: "PENDING",
  actaStatus: "PENDING",
  evaluationsStatus: "PENDING",
  updatedAt: "2026-11-17T12:00:00.000Z",
} satisfies TitulationPageResult["items"][number];

const pageResult: TitulationPageResult = {
  items: [listItem],
  total: 1,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

const filterOptions = {
  periods: ["2026-S2", "2026-S1", "2025-S2"],
  careers: [
    { id: "11111111-1111-4111-8111-111111111111", name: "Biología Marina" },
  ],
  hasUndated: true,
  counts: { ALL: 1, REVIEW: 1, ACTIVE: 0, GRADUATED: 1 },
};

const detail: TitulationProcess = {
  ...listItem,
  studentId: "22222222-2222-4222-8222-222222222222",
  student: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Nombre Ficticio",
    email: null,
    rut: "11111111-1",
  },
  documentDrafts: ["thesis-summary"],
  studentRut: "12.345.678-5",
  studentEmail: "daniel@example.cl",
  studentPhone: "+56912345678",
  careerId: null,
  guideName: "Profesora guía",
  coGuideName: null,
  reviewerOneName: "Profesor corrector",
  reviewerTwoName: null,
  createdAt: "2026-10-01T12:00:00.000Z",
};

describe("TitulationWorkspace", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/es/dashboard/titulation");
    apiFetchMock.mockReset();
    apiFetchFileMock.mockReset();
    downloadBlobMock.mockReset();
    apiFetchMock.mockImplementation((path: string) => {
      if (path === "/academic/titulations/search")
        return Promise.resolve(pageResult);
      if (path === "/academic/titulations/filters")
        return Promise.resolve(filterOptions);
      if (path === "/academic/careers/options") {
        return Promise.resolve([
          {
            id: "career-biology-marine",
            code: "BM",
            name: "Biología Marina",
            isActive: true,
            curriculumVersions: [],
          },
        ]);
      }
      if (path === "/academic/titulations/process-1/attachments")
        return Promise.resolve([]);
      return Promise.resolve(detail);
    });
  });

  it("downloads the available Word draft for the selected record", async () => {
    const file = new Blob(["docx"]);
    apiFetchFileMock.mockResolvedValue(file);
    renderAs(<TitulationWorkspace />, ["TEACHING_SUPPORT_COORDINATOR"]);

    fireEvent.click(await screen.findByText("Generar documentos Word"));
    fireEvent.click(
      await screen.findByRole("button", { name: "Descargar Anexo B (.docx)" }),
    );

    await waitFor(() =>
      expect(downloadBlobMock).toHaveBeenCalledWith(
        "TIT-2026-1234ABCD-thesis-summary.docx",
        file,
      ),
    );
    expect(apiFetchFileMock).toHaveBeenCalledWith(
      "/academic/titulations/process-1/documents/thesis-summary",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });

  it("keeps Word draft downloads unavailable to review-only roles", async () => {
    renderAs(<TitulationWorkspace />, ["ACADEMIC_PROCESS_ANALYST"]);

    await screen.findByText("12.345.678-5");
    expect(
      screen.queryByRole("button", { name: "Descargar Anexo B (.docx)" }),
    ).toBeNull();
    expect(apiFetchFileMock).not.toHaveBeenCalled();
  });

  it("loads persisted records and requests personal details for the selected record", async () => {
    renderAs(<TitulationWorkspace />, ["ACADEMIC_SECRETARY"]);

    expect(
      await screen.findByRole("heading", { name: "Titulaciones" }),
    ).toBeDefined();
    expect(
      await screen.findByText("Daniel Ignacio Durán García"),
    ).toBeDefined();
    expect(await screen.findByText("12.345.678-5")).toBeDefined();
    expect(screen.queryByText(/datos ficticios|maqueta/i)).toBeNull();
    expect(apiFetchMock).toHaveBeenCalledWith(
      "/academic/titulations/search",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ page: 1, pageSize: 10 }),
        cache: "no-store",
      }),
    );
  });

  it.each([
    ["LEGACY_ACCESS", "UNCLASSIFIED", "Sin fecha registrada"],
    ["MANUAL", "CLOSED", "Sin fecha registrada"],
    ["MANUAL", "INTAKE", "Fecha de defensa por confirmar"],
  ] as const)(
    "shows the expected missing date for %s in %s",
    async (source, stage, label) => {
      const record = { ...listItem, defenseDate: null, source, stage };
      apiFetchMock.mockImplementation((path) => {
        if (path === "/academic/titulations/filters")
          return Promise.resolve(filterOptions);
        return Promise.resolve(
          path.endsWith("/search")
            ? { ...pageResult, items: [record] }
            : { ...detail, ...record },
        );
      });
      renderAs(<TitulationWorkspace />, ["ACADEMIC_SECRETARY"]);

      await screen.findByText("12.345.678-5");
      expect(screen.getAllByText(label)).toHaveLength(
        label === "Sin fecha registrada" ? 3 : 2,
      );
    },
  );

  it("keeps the linked page and shows pagination above the current records", async () => {
    window.history.replaceState(null, "", "/es/dashboard/titulation?page=2");
    const records = Array.from({ length: 23 }, (_, index) => ({
      ...listItem,
      id: `process-${index + 1}`,
      studentName: `Estudiante ${index + 1}`,
    }));
    const requestedPages: number[] = [];
    apiFetchMock.mockImplementation((path, init) => {
      if (path === "/academic/titulations/filters")
        return Promise.resolve(filterOptions);
      if (path !== "/academic/titulations/search")
        return Promise.resolve(detail);
      const { page, pageSize } = JSON.parse(String(init?.body)) as Pick<
        TitulationPageResult,
        "page" | "pageSize"
      >;
      requestedPages.push(page);
      return Promise.resolve({
        items: records.slice((page - 1) * pageSize, page * pageSize),
        total: records.length,
        page,
        pageSize,
        totalPages: Math.ceil(records.length / pageSize),
      } satisfies TitulationPageResult);
    });

    vi.useFakeTimers();
    try {
      renderAs(<TitulationWorkspace />, ["ACADEMIC_SECRETARY"]);
      await act(async () => vi.advanceTimersByTimeAsync(300));

      const pagination = screen.getByRole("navigation", {
        name: "Paginación de expedientes",
      });
      const list = screen.getByRole("list", {
        name: "Expedientes de titulación",
      });
      expect(
        pagination.compareDocumentPosition(list) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(
        within(pagination).getByText("11–20 de 23 expedientes"),
      ).toBeDefined();
      expect(within(list).getAllByRole("listitem")).toHaveLength(10);
      expect(requestedPages).toEqual([2]);

      await act(async () => {
        fireEvent.click(
          within(pagination).getByRole("button", { name: "Página siguiente" }),
        );
      });

      expect(
        within(pagination).getByText("21–23 de 23 expedientes"),
      ).toBeDefined();
      expect(within(list).getAllByRole("listitem")).toHaveLength(3);
      expect(
        within(pagination)
          .getByRole("button", { name: "Página siguiente" })
          .hasAttribute("disabled"),
      ).toBe(true);
      expect(window.location.search).toBe("?page=3");
      expect(requestedPages).toEqual([2, 3]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows one registration action when there are no records", async () => {
    apiFetchMock.mockImplementation((path: string) =>
      path === "/academic/titulations/filters"
        ? Promise.resolve(filterOptions)
        : path === "/academic/titulations/search"
          ? Promise.resolve({
              items: [],
              total: 0,
              page: 1,
              pageSize: 10,
              totalPages: 0,
            })
          : Promise.resolve(detail),
    );
    renderAs(<TitulationWorkspace />, ["ACADEMIC_SECRETARY"]);

    expect(
      await screen.findByRole("heading", {
        name: "No hay expedientes para mostrar",
      }),
    ).toBeDefined();
    expect(
      screen.getAllByRole("button", { name: "Registrar proceso" }),
    ).toHaveLength(1);
  });

  it("passes search, stage, career and defense period filters to the API", async () => {
    renderAs(<TitulationWorkspace />, ["ACADEMIC_SECRETARY"]);

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Buscar expediente" }),
      {
        target: { value: "Durán" },
      },
    );
    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/academic/titulations/search",
        expect.objectContaining({
          body: expect.stringContaining('"search":"Durán"'),
        }),
      ),
    );
    expect(window.location.search).not.toContain("Dur");

    fireEvent.change(
      screen.getByRole("combobox", { name: "Etapa del proceso" }),
      {
        target: { value: "DEFENSE" },
      },
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Carrera" }), {
      target: { value: "11111111-1111-4111-8111-111111111111" },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: "Semestre y año de defensa" }),
      { target: { value: "2026-S1" } },
    );
    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/academic/titulations/search",
        expect.objectContaining({
          body: expect.stringContaining('"stage":"DEFENSE"'),
        }),
      ),
    );
    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/academic/titulations/search",
        expect.objectContaining({
          body: expect.stringContaining(
            '"careerId":"11111111-1111-4111-8111-111111111111"',
          ),
        }),
      ),
    );
    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/academic/titulations/search",
        expect.objectContaining({
          body: expect.stringContaining('"period":"2026-S1"'),
        }),
      ),
    );
    expect(window.location.search).toContain("stage=DEFENSE");
    expect(window.location.search).toContain(
      "careerId=11111111-1111-4111-8111-111111111111",
    );
    expect(window.location.search).toContain("period=2026-S1");
  });

  it("filters records with no recorded defense date", async () => {
    renderAs(<TitulationWorkspace />, ["ACADEMIC_SECRETARY"]);

    fireEvent.change(
      await screen.findByRole("combobox", {
        name: "Semestre y año de defensa",
      }),
      { target: { value: "UNRECORDED" } },
    );

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/academic/titulations/search",
        expect.objectContaining({
          body: expect.stringContaining('"period":"UNRECORDED"'),
        }),
      ),
    );
    expect(window.location.search).toContain("period=UNRECORDED");
  });

  it("filters graduates without requiring their historical stage to be closed", async () => {
    renderAs(<TitulationWorkspace />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(await screen.findByRole("button", { name: /^Titulados/ }));
    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/academic/titulations/search",
        expect.objectContaining({
          body: expect.stringContaining('"view":"GRADUATED"'),
        }),
      ),
    );
    expect(window.location.search).toContain("view=GRADUATED");
    expect(
      await screen.findByRole("link", {
        name: "Consultar trayectoria académica",
      }),
    ).toHaveProperty(
      "pathname",
      "/dashboard/students/22222222-2222-4222-8222-222222222222/progress",
    );
  });

  it("saves the graduation result independently from the process stage", async () => {
    renderAs(<TitulationWorkspace />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(
      await screen.findByRole("button", { name: "Editar proceso" }),
    );
    const dialog = screen.getByRole("dialog");
    await within(dialog).findByRole("option", { name: "Biología Marina" });
    fireEvent.change(within(dialog).getByLabelText(/Carrera/), {
      target: { value: "career-biology-marine" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));
    fireEvent.change(within(dialog).getByLabelText("Situación de titulación"), {
      target: { value: "GRADUATED" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Guardar cambios" }),
    );
    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/academic/titulations/process-1",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"outcome":"GRADUATED"'),
        }),
      ),
    );
  });

  it("debounces typing, highlights the original spelling, and clears immediately", async () => {
    vi.useFakeTimers();
    try {
      const { container } = renderAs(<TitulationWorkspace />, [
        "ACADEMIC_SECRETARY",
      ]);
      await act(async () => vi.advanceTimersByTimeAsync(0));
      const input = screen.getByRole<HTMLInputElement>("searchbox", {
        name: "Buscar expediente",
      });
      const requests = () =>
        apiFetchMock.mock.calls
          .filter(([path]) => path === "/academic/titulations/search")
          .map(([, init]) => String(init?.body));

      fireEvent.change(input, { target: { value: "DU" } });
      await act(async () => vi.advanceTimersByTimeAsync(200));
      fireEvent.change(input, { target: { value: "DURAN" } });
      expect(screen.getByText("Buscando…")).toBeDefined();
      await act(async () => vi.advanceTimersByTimeAsync(299));
      expect(requests()).toEqual(['{"page":1,"pageSize":10}']);
      await act(async () => vi.advanceTimersByTimeAsync(1));
      expect(requests()[1]).toContain('"search":"DURAN"');
      expect(
        Array.from(
          container.querySelectorAll("mark"),
          (element) => element.textContent,
        ),
      ).toEqual(["Durán", "Durán"]);
      expect(window.location.search).not.toContain("DURAN");

      fireEvent.click(screen.getByRole("button", { name: "Borrar búsqueda" }));
      expect(input.value).toBe("");
      expect(document.activeElement).toBe(input);
      expect(requests().at(-1)).toBe('{"page":1,"pageSize":10}');
    } finally {
      await act(async () => vi.advanceTimersByTimeAsync(0));
      vi.useRealTimers();
    }
  });

  it("opens the real registration form for a role that can manage processes", async () => {
    renderAs(<TitulationWorkspace />, ["ACADEMIC_SECRETARY"]);

    fireEvent.click(
      await screen.findByRole("button", { name: "Registrar proceso" }),
    );
    const dialog = screen.getByRole("dialog");

    expect(
      within(dialog).getByRole("heading", {
        name: "Registrar proceso de titulación",
      }),
    ).toBeDefined();
    expect(
      within(dialog).getByRole("textbox", { name: /RUT del estudiante/ }),
    ).toBeDefined();
    expect(within(dialog).getByText("Paso 1 de 3")).toBeDefined();
    await within(dialog).findByRole("option", { name: "Biología Marina" });
    expect(
      within(dialog)
        .getByRole("button", { name: "Continuar" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  it("shows input examples below the fields instead of in placeholders", async () => {
    renderAs(<TitulationWorkspace />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(
      await screen.findByRole("button", { name: "Registrar proceso" }),
    );

    const dialog = screen.getByRole("dialog");
    await within(dialog).findByRole("option", { name: "Biología Marina" });
    expect(
      dialog.querySelectorAll("input[placeholder], textarea[placeholder]"),
    ).toHaveLength(0);
    expect(
      within(dialog).getByText("Elige la carrera correspondiente."),
    ).toBeDefined();
    expect(within(dialog).getByText("Nombre Ficticio")).toBeDefined();
    expect(within(dialog).getByText("11.111.111-1")).toBeDefined();
    expect(within(dialog).getByText("estudiante@example.com")).toBeDefined();
    expect(within(dialog).getByText("+56 9 0000 0000")).toBeDefined();
    expect(within(dialog).getByText("Título Ficticio")).toBeDefined();

    fireEvent.change(
      within(dialog).getByLabelText(/Nombre completo del estudiante/),
      {
        target: { value: "Camila Soto" },
      },
    );
    fireEvent.change(within(dialog).getByLabelText(/Carrera/), {
      target: { value: "career-biology-marine" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));

    expect(
      dialog.querySelectorAll("input[placeholder], textarea[placeholder]"),
    ).toHaveLength(0);
    expect(within(dialog).getByText("Tema de tesis ficticio")).toBeDefined();
    expect(within(dialog).getAllByText("Docente Ficticio")).toHaveLength(4);
  });

  it("sends the completed form to the API without create-only status fields", async () => {
    renderAs(<TitulationWorkspace />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(
      await screen.findByRole("button", { name: "Registrar proceso" }),
    );

    const dialog = screen.getByRole("dialog");
    await within(dialog).findByRole("option", { name: "Biología Marina" });
    fireEvent.change(
      within(dialog).getByLabelText(/Nombre completo del estudiante/),
      {
        target: { value: "Camila Soto" },
      },
    );
    fireEvent.change(
      within(dialog).getByRole("textbox", { name: /RUT del estudiante/ }),
      {
        target: { value: "12.345.678-5" },
      },
    );
    fireEvent.change(within(dialog).getByLabelText(/Carrera/), {
      target: { value: "career-biology-marine" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Título al que opta/), {
      target: { value: "Biólogo Marino" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));

    fireEvent.change(within(dialog).getByLabelText(/Tema de tesis/), {
      target: { value: "Estudio de comunidades costeras" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Profesor guía/), {
      target: { value: "Profesora guía" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Registrar proceso" }),
    );

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/academic/titulations",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    const createCall = apiFetchMock.mock.calls.find(
      ([path]) => path === "/academic/titulations",
    );
    const payload: unknown = JSON.parse(createCall?.[1]?.body as string);
    expect(payload).not.toHaveProperty("stage");
    expect(payload).not.toHaveProperty("actaStatus");
  });

  it("uses the selected academic student when registering a process", async () => {
    const fallback = apiFetchMock.getMockImplementation();
    apiFetchMock.mockImplementation((path, init) =>
      path === "/academic/titulations/students/search"
        ? Promise.resolve([
            {
              id: "22222222-2222-4222-8222-222222222222",
              name: "Alumno Ficticio",
              rut: "11111111-1",
              email: null,
              careerId: "career-biology-marine",
            },
          ])
        : (fallback?.(path, init) ?? Promise.resolve(null)),
    );
    renderAs(<TitulationWorkspace />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(
      await screen.findByRole("button", { name: "Registrar proceso" }),
    );
    const dialog = screen.getByRole("dialog");
    await within(dialog).findByRole("option", { name: "Biología Marina" });
    fireEvent.change(
      within(dialog).getByRole("searchbox", {
        name: "Buscar alumno registrado",
      }),
      { target: { value: "Ficticio" } },
    );
    fireEvent.click(
      await within(dialog).findByRole("button", { name: /Alumno Ficticio/ }),
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Registrar proceso" }),
    );
    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/academic/titulations",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining(
            '"studentId":"22222222-2222-4222-8222-222222222222"',
          ),
        }),
      ),
    );
  });

  it("saves only after an explicit click on the final action", async () => {
    renderAs(<TitulationWorkspace />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(
      await screen.findByRole("button", { name: "Registrar proceso" }),
    );

    const dialog = screen.getByRole("dialog");
    await within(dialog).findByRole("option", { name: "Biología Marina" });
    fireEvent.change(
      within(dialog).getByLabelText(/Nombre completo del estudiante/),
      {
        target: { value: "Camila Soto" },
      },
    );
    fireEvent.change(within(dialog).getByLabelText(/Carrera/), {
      target: { value: "career-biology-marine" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));

    expect(within(dialog).getByText("Paso 3 de 3")).toBeDefined();
    const form = dialog.querySelector("form");
    const saveButton = within(dialog).getByRole("button", {
      name: "Registrar proceso",
    });
    expect(saveButton.getAttribute("type")).toBe("button");

    if (!form) throw new Error("Titulation form was not rendered");
    fireEvent.submit(form);
    fireEvent.click(saveButton, { detail: 2 });
    expect(
      apiFetchMock.mock.calls.some(
        ([path]) => path === "/academic/titulations",
      ),
    ).toBe(false);

    fireEvent.click(saveButton);
    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/academic/titulations",
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  it("rejects letters in a phone number before continuing", async () => {
    renderAs(<TitulationWorkspace />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(
      await screen.findByRole("button", { name: "Registrar proceso" }),
    );

    const dialog = screen.getByRole("dialog");
    await within(dialog).findByRole("option", { name: "Biología Marina" });
    fireEvent.change(
      within(dialog).getByLabelText(/Nombre completo del estudiante/),
      {
        target: { value: "Camila Soto" },
      },
    );
    fireEvent.change(within(dialog).getByLabelText(/Carrera/), {
      target: { value: "career-biology-marine" },
    });
    const phone = within(dialog).getByLabelText("Teléfono (opcional)");
    fireEvent.change(phone, { target: { value: "+56 9 AB12 3456" } });
    fireEvent.blur(phone);

    expect(
      within(dialog).getByText(
        "Revisa el teléfono: usa entre 8 y 24 caracteres numéricos y separadores permitidos.",
      ),
    ).toBeDefined();
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));
    expect(within(dialog).getByText("Paso 1 de 3")).toBeDefined();
    expect(
      apiFetchMock.mock.calls.some(
        ([path]) => path === "/academic/titulations",
      ),
    ).toBe(false);
  });

  it("allows missing optional data and keeps a blank RUT empty", async () => {
    renderAs(<TitulationWorkspace />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(
      await screen.findByRole("button", { name: "Registrar proceso" }),
    );

    const dialog = screen.getByRole("dialog");
    await within(dialog).findByRole("option", { name: "Biología Marina" });
    fireEvent.change(
      within(dialog).getByLabelText(/Nombre completo del estudiante/),
      {
        target: { value: "Nombre Apellido" },
      },
    );
    fireEvent.change(within(dialog).getByLabelText(/Carrera/), {
      target: { value: "career-biology-marine" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Registrar proceso" }),
    );

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/academic/titulations",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    const createCall = apiFetchMock.mock.calls.find(
      ([path]) => path === "/academic/titulations",
    );
    const payload: unknown = JSON.parse(createCall?.[1]?.body as string);
    expect(payload).toMatchObject({
      studentRut: null,
      studentEmail: null,
      studentPhone: null,
      thesisTopic: null,
      degree: null,
      guideName: null,
      careerId: "career-biology-marine",
    });
    expect(payload).not.toHaveProperty("careerName");
  });

  it("reports an invalid RUT when leaving the field", async () => {
    renderAs(<TitulationWorkspace />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(
      await screen.findByRole("button", { name: "Registrar proceso" }),
    );

    const dialog = screen.getByRole("dialog");
    const rut = within(dialog).getByRole("textbox", {
      name: /RUT del estudiante/,
    });
    fireEvent.change(rut, { target: { value: "12.345.678-0" } });
    fireEvent.blur(rut);

    expect(
      within(dialog).getByText(
        "Revisa el RUT: el formato o el dígito verificador no son válidos.",
      ),
    ).toBeDefined();
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));
    expect(within(dialog).getByText("Paso 1 de 3")).toBeDefined();
  });

  it("keeps the process list read-only for academic process analysts", async () => {
    renderAs(<TitulationWorkspace />, ["ACADEMIC_PROCESS_ANALYST"]);

    expect(
      await screen.findByText("Daniel Ignacio Durán García"),
    ).toBeDefined();
    expect(
      screen.queryByRole("button", { name: "Registrar proceso" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Editar proceso" })).toBeNull();
  });
});
