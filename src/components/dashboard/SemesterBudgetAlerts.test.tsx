import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import es from "../../../messages/es.json";
import DashboardPage from "@/app/[locale]/(dashboard)/dashboard/page";

const { fetchDashboard, activeRole } = vi.hoisted(() => ({
  fetchDashboard: vi.fn(),
  activeRole: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ apiFetch: fetchDashboard }));
vi.mock("@/context/ActiveRoleContext", () => ({
  useActiveRole: () => ({ activeRole: activeRole() }),
}));
vi.mock("@/components/dashboard/AcademicQuickLinks", () => ({
  default: () => null,
}));
vi.mock("@/components/dashboard/views/SystemAdminDashboard", () => ({
  default: () => <h1>Administración</h1>,
}));

const endpoint = "/dashboard/semester-budget-alerts";
const exampleAlert = {
  semesterId: "semester-1",
  semesterName: "2026-2",
  allocatedAmountClp: 925000,
  totalAmountClp: 1000000,
  currentPercentage: 92,
  thresholdPercentage: 90,
};

function renderDashboard(locale: "es" | "en" = "es") {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === "es" ? es : en}>
      <DashboardPage />
    </NextIntlClientProvider>,
  );
}

function expectBefore(first: HTMLElement, second: HTMLElement) {
  expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)
    .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
}

describe("Dashboard budget alerts", () => {
  beforeEach(() => {
    activeRole.mockReset().mockReturnValue("ACADEMIC_PROCESS_ANALYST");
    fetchDashboard.mockReset();
  });

  it("prioritizes a real allocation alert after the analyst title and before metrics and reports", async () => {
    fetchDashboard.mockImplementation(async (request: string) =>
      request === endpoint ? [exampleAlert] : { teachers: 27 },
    );
    renderDashboard();

    const region = screen.getByRole("region", { name: es.SemesterBudgetAlerts.sectionTitle });
    expect(await within(region).findByRole("heading", { name: "2026-2", level: 3 })).not.toBeNull();
    expect(within(region).getByText(/\$925\.000 de \$1\.000\.000/)).not.toBeNull();
    expect(within(region).getByText(/umbral de 90\s?%.*92\s?%/)).not.toBeNull();
    expectBefore(screen.getByRole("heading", { level: 1 }), region);
    expectBefore(region, await screen.findByText("27"));
    expectBefore(
      region,
      screen.getByRole("link", { name: new RegExp(es.DashboardViews.academicProcessAnalyst.actions.reports) }),
    );
    expect(fetchDashboard.mock.calls.filter(([request]) => request === endpoint)).toHaveLength(1);
  });

  it("distinguishes loading and no alerts without displaying a placeholder allocation", async () => {
    let finishAlerts: (alerts: typeof exampleAlert[]) => void = () => undefined;
    const pendingAlerts = new Promise<typeof exampleAlert[]>((resolve) => {
      finishAlerts = resolve;
    });
    fetchDashboard.mockImplementation(async (request: string) =>
      request === endpoint ? pendingAlerts : {},
    );
    renderDashboard();

    const region = screen.getByRole("region", { name: es.SemesterBudgetAlerts.sectionTitle });
    expect(within(region).getByRole("status").textContent).toBe(es.SemesterBudgetAlerts.loading);
    expect(within(region).queryByRole("progressbar")).toBeNull();

    await act(async () => finishAlerts([]));

    expect(within(region).getByRole("status").textContent).toBe(es.SemesterBudgetAlerts.empty);
    expect(within(region).queryByRole("alert")).toBeNull();
  });

  it("offers an English retry after a failed request and shows localized allocations on success", async () => {
    let alertRequests = 0;
    fetchDashboard.mockImplementation(async (request: string) => {
      if (request !== endpoint) return {};
      if (++alertRequests === 1) throw new Error("internal endpoint detail");
      return [exampleAlert];
    });
    renderDashboard("en");

    const region = screen.getByRole("region", { name: en.SemesterBudgetAlerts.sectionTitle });
    expect((await within(region).findByRole("alert")).textContent).toContain(en.SemesterBudgetAlerts.error);
    expect(within(region).queryByText("internal endpoint detail")).toBeNull();
    fireEvent.click(within(region).getByRole("button", { name: en.SemesterBudgetAlerts.retry }));

    const progress = await within(region).findByRole("progressbar", { name: en.SemesterBudgetAlerts.progress });
    expect(progress.getAttribute("aria-valuetext")).toBe("92%");
    expect(within(region).getByText(/CLP\s+925,000.*CLP\s+1,000,000/)).not.toBeNull();
    expect(within(region).queryByRole("alert")).toBeNull();
    expect(alertRequests).toBe(2);
  });

  it("preserves the banner before the administrator dashboard on success", async () => {
    activeRole.mockReturnValue("SYSTEM_ADMIN");
    fetchDashboard.mockResolvedValue([exampleAlert]);
    renderDashboard();

    const banner = await screen.findByRole("region", { name: es.SemesterBudgetAlerts.title });
    expectBefore(banner, screen.getByRole("heading", { name: "Administración" }));
    expect(within(banner).getByRole("heading", { name: "Alerta de presupuesto: 2026-2", level: 2 })).not.toBeNull();
  });

  it("keeps the administrator view free of an empty-state section", async () => {
    activeRole.mockReturnValue("SYSTEM_ADMIN");
    fetchDashboard.mockResolvedValue([]);
    await act(async () => { renderDashboard(); });

    expect(screen.queryByRole("region", { name: es.SemesterBudgetAlerts.sectionTitle })).toBeNull();
    expect(screen.queryByRole("region", { name: es.SemesterBudgetAlerts.title })).toBeNull();
  });
});
