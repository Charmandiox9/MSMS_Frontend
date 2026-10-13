import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderAs } from "@/test/render";
import { installFakeApi, ok, fail } from "@/test/fake-api";
import { downloadCsv } from "@/lib/csv";
import AcademicReports from "./AcademicReports";

vi.mock("@/lib/csv", async (original) => ({
  ...(await original<typeof import("@/lib/csv")>()),
  downloadCsv: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { promise: vi.fn() } }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("Academic reports", () => {
  it("allows the analyst to query and export every matching row across pages", async () => {
    const rows = Array.from({ length: 25 }, (_, index) => ({
      name: `Ayudante ${index}`,
    }));
    const api = installFakeApi({
      "GET /academic/semesters": ok([{ id: "semester", name: "2026-2" }]),
      "GET /academic/reports": ok({ columns: ["name"], rows }),
      "GET /academic/reports/export": ok({ columns: ["name"], rows }),
    });
    renderAs(<AcademicReports />, ["ACADEMIC_PROCESS_ANALYST"]);
    expect(await screen.findByText("Ayudante 0")).toBeDefined();
    expect(screen.queryByText("Ayudante 24")).toBeNull();
    fireEvent.change(screen.getByLabelText("Semestre"), {
      target: { value: "semester" },
    });
    fireEvent.change(screen.getByLabelText("Buscar en los datos"), {
      target: { value: "Ayudante" },
    });
    await waitFor(() =>
      expect(
        api.requests.some(
          (request) =>
            request.query.get("semesterId") === "semester" &&
            request.query.get("search") === "Ayudante",
        ),
      ).toBe(true),
    );
    await waitFor(() =>
      expect(
        (
          screen.getByRole("button", {
            name: "Exportar CSV",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false),
    );
    fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));
    await waitFor(() => expect(downloadCsv).toHaveBeenCalled());
    expect(vi.mocked(downloadCsv).mock.calls[0][1]).toContain("Ayudante 24");
    expect(
      api.requests
        .find((request) => request.path === "/academic/reports/export")
        ?.query.get("semesterId"),
    ).toBe("semester");
  });
  it("shows a retry action on server failure", async () => {
    installFakeApi({
      "GET /academic/semesters": ok([]),
      "GET /academic/reports": fail(500, "error"),
    });
    renderAs(<AcademicReports />, ["ACADEMIC_PROCESS_ANALYST"]);
    expect(await screen.findByRole("alert")).toBeDefined();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeDefined();
  });
  it("blocks other roles without issuing a report request", async () => {
    const api = installFakeApi();
    renderAs(<AcademicReports />, ["ACADEMIC_SECRETARY"]);
    expect(await screen.findByRole("alert")).toBeDefined();
    expect(api.requests).toHaveLength(0);
  });
});
