import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderAs } from "@/test/render";
import { installFakeApi, ok, fail } from "@/test/fake-api";
import AcademicCharts from "./AcademicCharts";

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => localStorage.clear());

describe("Academic charts", () => {
  it("bloquea coordinación sin consultar la API", async () => {
    const api = installFakeApi();
    renderAs(<AcademicCharts />, ["TEACHING_SUPPORT_COORDINATOR"]);
    await screen.findByRole("alert");
    expect(api.requests).toHaveLength(0);
  });
  it("permite reintentar una consulta GraphQL fallida y cargar indicadores vacíos", async () => {
    const api = installFakeApi({ "POST /graphql": fail(500, "error") });
    renderAs(<AcademicCharts />, ["ACADEMIC_PROCESS_ANALYST"]);
    await screen.findByRole("alert");
    api.on(
      "POST /graphql",
      ok({
        data: {
          academicCharts: {
            projectsByDepartment: [],
            publicationsByDepartment: [],
            projects: { columns: [], rows: [], totalRows: 0 },
            researchByYear: [],
            outputs: [],
            hourlyByComponent: [],
            semesters: [],
          },
        },
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByText("Proyectos por estado");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(api.calls("POST /graphql")).toHaveLength(2);
  });
  it("mantiene los gráficos solicitados y muestra conteos por departamento sin presupuestos", async () => {
    const api = installFakeApi({
      "POST /graphql": ok({
        data: {
          academicCharts: {
            projects: {
              columns: ["status"],
              rows: [{ values: ["IN_PROGRESS"] }, { values: ["COMPLETED"] }],
              totalRows: 2,
            },
            projectsByDepartment: [
              { label: "Biología Marina", value: "1" },
              { label: "", value: "1" },
            ],
            publicationsByDepartment: [
              { label: "Biología Marina", value: "3" },
              { label: "", value: "2" },
            ],
            researchByYear: [{ label: "2026", value: "1" }],
            outputs: [{ kind: "ARTICLE", reportingYear: 2026, count: 1 }],
            hourlyByComponent: [{ label: "LECTURE", value: "30000", count: 1 }],
            semesters: [],
          },
        },
      }),
    });
    renderAs(<AcademicCharts />, ["ACADEMIC_SECRETARY"]);
    await screen.findByText("Proyectos por estado");
    expect(screen.queryByText("Presupuesto registrado por moneda")).toBeNull();
    expect(
      screen.getByText("Cantidad de proyectos por departamento"),
    ).toBeDefined();
    expect(
      screen.getByText("Cantidad de publicaciones por departamento"),
    ).toBeDefined();
    expect(screen.getAllByText("Sin asignar")).toHaveLength(2);
    expect(screen.getByText("Pagos PH estimados por componente")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Proyectos desde"), {
      target: { value: "2025-03-01" },
    });
    fireEvent.change(screen.getByLabelText("Proyectos hasta"), {
      target: { value: "2025-09-30" },
    });
    await waitFor(() => {
      const body = api.calls("POST /graphql").at(-1)?.body as {
        variables: { filters: { startsOn?: string; endsOn?: string } };
      };
      expect(body.variables.filters).toMatchObject({
        startsOn: "2025-03-01",
        endsOn: "2025-09-30",
      });
    });
    expect(api.calls("GET /academic/reports")).toHaveLength(0);
  });
});
