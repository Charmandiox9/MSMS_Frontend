"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UserRoleCode } from "@/types/auth";
import WelcomeLoadingScreen from "@/components/auth/WelcomeLoadingScreen";

export type DashboardStartupTask =
  | "active-semester"
  | "budget-alerts"
  | "budget-overview"
  | "coordinator-inbox"
  | "dashboard-metrics";

type DashboardStartupContextValue = {
  isReady: boolean;
  markDashboardPageReady: () => void;
  completeTask: (task: DashboardStartupTask) => void;
};

const STARTUP_TASKS_BY_ROLE: Record<
  UserRoleCode,
  readonly DashboardStartupTask[]
> = {
  SYSTEM_ADMIN: ["budget-alerts", "dashboard-metrics"],
  ACADEMIC_SECRETARY: [
    "active-semester",
    "budget-alerts",
    "dashboard-metrics",
  ],
  ACADEMIC_PROCESS_ANALYST: [
    "budget-alerts",
    "budget-overview",
    "dashboard-metrics",
  ],
  TEACHING_SUPPORT_COORDINATOR: [
    "active-semester",
    "budget-alerts",
    "coordinator-inbox",
    "dashboard-metrics",
  ],
  PRIVACY_OFFICER: ["dashboard-metrics"],
};

const DEFAULT_STARTUP_TASKS: readonly DashboardStartupTask[] = ["budget-alerts"];

const DashboardStartupContext = createContext<DashboardStartupContextValue>({
  isReady: false,
  markDashboardPageReady: () => undefined,
  completeTask: () => undefined,
});

function getTransitionDurationMs(): number {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--motion-duration-page-transition")
    .trim();
  const duration = Number.parseFloat(value);

  if (!Number.isFinite(duration)) return 240;
  if (value.endsWith("ms")) return duration;
  if (value.endsWith("s")) return duration * 1000;
  return 240;
}

export function useDashboardStartup(): DashboardStartupContextValue {
  return useContext(DashboardStartupContext);
}

export function DashboardStartupProvider({
  children,
  activeRole,
  displayName,
  enabled,
  onComplete,
}: {
  children: ReactNode;
  activeRole: UserRoleCode | null;
  displayName?: string;
  enabled: boolean;
  onComplete: () => void;
}) {
  const [completedTasks, setCompletedTasks] = useState<
    ReadonlySet<DashboardStartupTask>
  >(() => new Set());
  const [dashboardPageReady, setDashboardPageReady] = useState(false);
  const expectedTasks = activeRole
    ? STARTUP_TASKS_BY_ROLE[activeRole]
    : DEFAULT_STARTUP_TASKS;
  const isReady =
    dashboardPageReady &&
    expectedTasks.every((task) => completedTasks.has(task));

  const markDashboardPageReady = useCallback(() => {
    setDashboardPageReady(true);
  }, []);

  const completeTask = useCallback((task: DashboardStartupTask) => {
    setCompletedTasks((current) => {
      if (current.has(task)) return current;
      const next = new Set(current);
      next.add(task);
      return next;
    });
  }, []);

  const contextValue = useMemo(
    () => ({ isReady, markDashboardPageReady, completeTask }),
    [isReady, markDashboardPageReady, completeTask],
  );

  useEffect(() => {
    if (!enabled || !isReady) return;

    const timeout = window.setTimeout(onComplete, getTransitionDurationMs());
    return () => window.clearTimeout(timeout);
  }, [enabled, isReady, onComplete]);

  const isExiting = enabled && isReady;

  return (
    <DashboardStartupContext.Provider value={contextValue}>
      <div
        aria-hidden={enabled}
        className="min-h-dvh"
        inert={enabled}
      >
        {children}
      </div>
      {enabled && (
        <WelcomeLoadingScreen
          phase="preparing"
          displayName={displayName}
          activeRole={activeRole}
          exiting={isExiting}
        />
      )}
    </DashboardStartupContext.Provider>
  );
}
