import { act, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Users } from "lucide-react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import RoleDashboardStats from "./RoleDashboardStats";

const { fetchMetrics } = vi.hoisted(() => ({ fetchMetrics: vi.fn() }));
vi.mock("@/lib/api", () => ({ apiFetch: fetchMetrics }));
vi.mock("./AcademicQuickLinks", () => ({ default: () => null }));

function renderStats() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <RoleDashboardStats
        endpoint="/dashboard/test"
        metrics={[
          {
            key: "users",
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
    fetchMetrics.mockRejectedValue(new Error("offline"));
    renderStats();
    expect((await screen.findByRole("alert")).textContent).toContain(
      messages.Dashboard.metricsError,
    );
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    expect(screen.getByText("—")).not.toBeNull();
    expect(screen.queryByText("0")).toBeNull();
  });
});
