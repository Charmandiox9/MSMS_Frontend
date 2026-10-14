import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderAs } from "@/test/render";
import { installFakeApi, ok } from "@/test/fake-api";
import AcademicCharts from "./AcademicCharts";

afterEach(() => vi.unstubAllGlobals());

describe("Academic charts", () => {
  it("shows repository, budget, research output, and PH indicators to the secretary", async () => {
    const api = installFakeApi({
      "GET /academic/reports": ({ query }) => ({ body: {
        columns: [],
        rows: query.get("dataset") === "projects" ? [{ reportingYear: 2026, title: "Centro costero", fundingSource: "ANID", status: "IN_PROGRESS", currency: "CLP", totalAmount: "227700000", vraContribution: "1200000" }]
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
    expect(screen.getAllByText(/227\.700\.000/)).toHaveLength(2);
    expect(screen.getByText("Centro costero")).toBeDefined();
    expect(screen.getByText("Aporte VRA")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Presupuesto desde"), { target: { value: "2025-03-01" } });
    fireEvent.change(screen.getByLabelText("Presupuesto hasta"), { target: { value: "2025-09-30" } });
    await waitFor(() => {
      const projectsRequest = api.calls("GET /academic/reports").filter((request) => request.query.get("dataset") === "projects").at(-1);
      expect(projectsRequest?.query.get("startsOn")).toBe("2025-03-01");
      expect(projectsRequest?.query.get("endsOn")).toBe("2025-09-30");
    });
  });
});
