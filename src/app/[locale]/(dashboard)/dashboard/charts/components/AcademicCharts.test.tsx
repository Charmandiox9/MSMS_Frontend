import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderAs } from "@/test/render";
import { installFakeApi, ok, fail } from "@/test/fake-api";
import AcademicCharts from "./AcademicCharts";

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => localStorage.clear());

describe("Academic charts", () => {
  it('bloquea coordinación sin consultar la API', async () => {
    const api = installFakeApi();
    renderAs(<AcademicCharts />, ['TEACHING_SUPPORT_COORDINATOR']);
    await screen.findByRole('alert');
    expect(api.requests).toHaveLength(0);
  });
  it('permite reintentar una consulta GraphQL fallida y cargar indicadores vacíos', async () => {
    const api = installFakeApi({ 'POST /graphql': fail(500, 'error') });
    renderAs(<AcademicCharts />, ['ACADEMIC_PROCESS_ANALYST']);
    await screen.findByRole('alert');
    api.on('POST /graphql', ok({ data: { academicCharts: { projects: { columns: [], rows: [], totalRows: 0 },
      researchByYear: [], outputs: [], hourlyByComponent: [], semesters: [] } } }));
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByText('Proyectos por estado');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(api.calls('POST /graphql')).toHaveLength(2);
  });
  it("shows repository, budget, research output, and PH indicators to the secretary", async () => {
    const columns = ['reportingYear', 'startsOn', 'title', 'fundingSource', 'status', 'currency', 'totalAmount', 'vraContribution'];
    const projectRows = [
      { reportingYear: 2026, startsOn: '2026-03-15', title: 'Centro costero', fundingSource: 'ANID', status: 'IN_PROGRESS', currency: 'CLP', totalAmount: '227700000', vraContribution: '1200000' },
      { reportingYear: 2026, startsOn: '2026-07-02', title: 'Estudio de mareas', fundingSource: 'UCN', status: 'COMPLETED', currency: 'CLP', totalAmount: '500000', vraContribution: '0' },
    ];
    const api = installFakeApi({
      'POST /graphql': ok({ data: { academicCharts: {
        projects: { columns, rows: projectRows.map((row) => ({ values: columns.map((column) => row[column as keyof typeof row]) })), totalRows: 2 },
        researchByYear: [{ label: '2026', value: '1' }],
        outputs: [{ kind: 'ARTICLE', reportingYear: 2026, count: 1 }],
        hourlyByComponent: [{ label: 'LECTURE', value: '30000', count: 1 }],
        semesters: [{ id: 'semester', name: '2026-2' }],
      } } }),
    });
    renderAs(<AcademicCharts />, ["ACADEMIC_SECRETARY"]);

    expect(await screen.findByText("Gráficos e indicadores")).toBeDefined();
    expect(screen.getByText("Proyectos por estado")).toBeDefined();
    expect(screen.getByText("Presupuesto registrado por moneda")).toBeDefined();
    expect(screen.getByText("Pagos PH estimados por componente")).toBeDefined();
    expect(screen.getByText(/227\.700\.000/)).toBeDefined();
    expect(screen.getByText("Centro costero")).toBeDefined();
    expect(screen.getByText("Estudio de mareas")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Ver detalles de Centro costero" }));
    const projectDialog = screen.getByRole("dialog");
    expect(within(projectDialog).getByText("Aporte VRA")).toBeDefined();
    expect(within(projectDialog).getByText("Fecha de inicio")).toBeDefined();
    fireEvent.click(within(projectDialog).getByRole("button", { name: "Cerrar detalle" }));
    expect(api.calls('POST /graphql')).toHaveLength(1);
    expect(api.calls('GET /academic/reports')).toHaveLength(0);

    fireEvent.change(screen.getByLabelText("Presupuesto desde"), { target: { value: "2025-03-01" } });
    fireEvent.change(screen.getByLabelText("Presupuesto hasta"), { target: { value: "2025-09-30" } });
    await waitFor(() => {
      const request = api.calls('POST /graphql').at(-1)?.body as { variables: { filters: { startsOn?: string; endsOn?: string } } };
      expect(request.variables.filters.startsOn).toBe('2025-03-01');
      expect(request.variables.filters.endsOn).toBe('2025-09-30');
    });
    fireEvent.click(screen.getAllByRole("button", { name: /Aporte VRA/ })[0]);
    expect(screen.queryByText("Estudio de mareas")).toBeNull();
    expect(screen.getByRole("button", { name: "Limpiar filtros" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    fireEvent.click(within(screen.getByRole("group", { name: "Presupuesto registrado por moneda · CLP" })).getByRole("button", { name: "2026" }));
    expect(await screen.findByText("Presupuesto agrupado por mes de inicio · 2026")).toBeDefined();
    fireEvent.click(within(screen.getByRole("group", { name: "Presupuesto agrupado por mes de inicio · 2026" })).getByRole("button", { name: "marzo" }));
    expect(screen.queryByText("Estudio de mareas")).toBeNull();
  });
});
