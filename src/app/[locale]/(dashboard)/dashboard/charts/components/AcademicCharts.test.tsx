import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderAs } from "@/test/render";
import { installFakeApi, ok } from "@/test/fake-api";
import AcademicCharts from "./AcademicCharts";

afterEach(() => vi.unstubAllGlobals());

describe("Academic charts", () => {
  it("shows repository, budget, research output, and PH indicators to the secretary", async () => {
    const api = installFakeApi({
      "GET /academic/reports": ({ query }) => ({ body: {
        columns: [],
        rows: query.get("dataset") === "projects" ? [
          { reportingYear: 2026, startsOn: "2026-03-15", title: "Centro costero", fundingSource: "ANID", status: "IN_PROGRESS", currency: "CLP", totalAmount: "227700000", vraContribution: "1200000" },
          { reportingYear: 2026, startsOn: "2026-07-02", title: "Estudio de mareas", fundingSource: "UCN", status: "COMPLETED", currency: "CLP", totalAmount: "500000", vraContribution: "0" },
        ]
          : query.get("dataset") === "research" ? [{ startsOn: "2026-01-01" }]
          : query.get("dataset") === "researchOutputs" ? [{ kind: "ARTICLE", reportingYear: 2026 }]
          : [{ component: "LECTURE", estimatedPaymentClp: 30000 }],
      } }),
      "GET /academic/semesters": ok([{ id: "semester", name: "2026-2" }]),
    });
    renderAs(<AcademicCharts />, ["ACADEMIC_SECRETARY"]);

    expect(await screen.findByText("Gráficos e indicadores")).toBeDefined();
    expect(screen.getByText("Proyectos por estado")).toBeDefined();
    expect(screen.getByText("Presupuesto registrado por moneda")).toBeDefined();
    expect(screen.getByText("Pagos PH estimados por componente")).toBeDefined();
    expect(screen.getByText(/227\.700\.000/)).toBeDefined();
    expect(screen.getByText("Centro costero")).toBeDefined();
    expect(screen.getByText("Aporte VRA")).toBeDefined();
    expect(screen.getByText("Estudio de mareas")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Presupuesto desde"), { target: { value: "2025-03-01" } });
    fireEvent.change(screen.getByLabelText("Presupuesto hasta"), { target: { value: "2025-09-30" } });
    await waitFor(() => {
      const projectsRequest = api.calls("GET /academic/reports").filter((request) => request.query.get("dataset") === "projects").at(-1);
      expect(projectsRequest?.query.get("startsOn")).toBe("2025-03-01");
      expect(projectsRequest?.query.get("endsOn")).toBe("2025-09-30");
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
