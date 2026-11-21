import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IntlProvider } from "@/test/render";
import {
  DashboardStartupProvider,
  useDashboardStartup,
} from "./DashboardStartupContext";

function DashboardContent() {
  const { markDashboardPageReady, completeTask } = useDashboardStartup();

  useEffect(() => {
    markDashboardPageReady();
  }, [markDashboardPageReady]);

  return (
    <div id="dashboard-test-content">
      <p>Dashboard content</p>
      <button id="metrics-ready" onClick={() => completeTask("dashboard-metrics")}>
        Metrics ready
      </button>
      <button id="semester-ready" onClick={() => completeTask("active-semester")}>
        Semester ready
      </button>
      <button id="alerts-ready" onClick={() => completeTask("budget-alerts")}>
        Alerts ready
      </button>
    </div>
  );
}

describe("DashboardStartupProvider", () => {
  afterEach(() => vi.useRealTimers());

  it("keeps the welcome overlay until every initial role resource is ready", async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    render(
      <IntlProvider>
        <DashboardStartupProvider
          activeRole="ACADEMIC_SECRETARY"
          displayName="Ana Pérez"
          enabled
          onComplete={onComplete}
        >
          <DashboardContent />
        </DashboardStartupProvider>
      </IntlProvider>,
    );

    expect(screen.getByRole("heading", { name: "Te damos la bienvenida Ana Pérez" })).toBeDefined();
    expect(
      document
        .getElementById("dashboard-test-content")
        ?.closest("[inert]")
        ?.hasAttribute("inert"),
    ).toBe(true);
    expect(screen.getByRole("main").dataset.exiting).toBe("false");

    fireEvent.click(document.getElementById("metrics-ready") as HTMLButtonElement);
    fireEvent.click(document.getElementById("alerts-ready") as HTMLButtonElement);

    expect(screen.getByRole("main").dataset.exiting).toBe("false");
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(document.getElementById("semester-ready") as HTMLButtonElement);
    expect(screen.getByRole("main").dataset.exiting).toBe("true");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(240);
    });

    expect(onComplete).toHaveBeenCalledOnce();
  });
});
