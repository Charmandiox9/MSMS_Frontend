import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Users } from "lucide-react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import RoleDashboardStats from "./RoleDashboardStats";

const { fetchMetrics } = vi.hoisted(() => ({ fetchMetrics: vi.fn() }));
vi.mock("@/lib/api", () => ({ apiFetch: fetchMetrics }));

function renderStats() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <RoleDashboardStats
        endpoint="/dashboard/test"
        metrics={[
          {
            key: "users",
            group: "general",
            title: "Usuarios",
            description: "Usuarios activos",
            icon: Users,
          },
        ]}
      />
    </NextIntlClientProvider>,
  );
}

describe("Dashboard metric loading", () => {
  beforeEach(() => {
    fetchMetrics.mockReset();
  });

  it("shows an accessible loading state without provisional numbers, then displays the response", async () => {
    let resolve: (value: Record<string, number>) => void = () => undefined;
    fetchMetrics.mockReturnValue(
      new Promise<Record<string, number>>((complete) => {
        resolve = complete;
      }),
    );
    renderStats();
    expect(screen.getByRole("status").textContent).toContain(
      "Cargando indicadores",
    );
    expect(screen.queryByText("0")).toBeNull();
    expect(screen.queryByText("…")).toBeNull();
    await act(async () => {
      resolve({ users: 42 });
    });
    expect(await screen.findByText("42")).not.toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Usuarios activos")).not.toBeNull();
  });

  it("ends loading on failure and shows an error rather than a false zero", async () => {
    fetchMetrics
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ users: 5 });
    renderStats();
    expect((await screen.findByRole("alert")).textContent).toContain(
      messages.Dashboard.metricsError,
    );
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    expect(screen.getByText("—")).not.toBeNull();
    expect(screen.queryByText("0")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("5")).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("puts actionable work first and shows the active semester independently", async () => {
    fetchMetrics.mockImplementation(async (path: string) =>
      path === "/academic/semesters"
        ? [
            { name: "2025-2", isActive: false },
            {
              name: "2026-2",
              isActive: true,
              startsOn: "2026-08-10",
              endsOn: "2026-12-18",
            },
          ]
        : { assistantships: 7, pending: 3 },
    );
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <RoleDashboardStats
          endpoint="/dashboard/test"
          metrics={[
            {
              key: "assistantships",
              title: "Ayudantías",
              description: "Registradas",
              icon: Users,
            },
            {
              key: "pending",
              title: "Justificaciones pendientes",
              description: "En revisión",
              icon: Users,
              group: "attention",
              href: "/dashboard/justifications",
            },
          ]}
        />
      </NextIntlClientProvider>,
    );
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(["Por atender", "Actividad del semestre"]);
    const attention = screen.getByRole("region", { name: "Por atender" });
    const link = await within(attention).findByRole("link", {
      name: /Justificaciones pendientes/,
    });
    expect(link.getAttribute("href")).toContain("/dashboard/justifications");
    expect(within(attention).getByText("3")).toBeDefined();
    const semester = screen.getByRole("region", {
      name: "Actividad del semestre",
    });
    expect(await within(semester).findByText(/2026-2.*10.*18/)).toBeDefined();
    expect(within(semester).getByText("7")).toBeDefined();
    expect(within(semester).queryByText(/2025-2/)).toBeNull();
  });
});
