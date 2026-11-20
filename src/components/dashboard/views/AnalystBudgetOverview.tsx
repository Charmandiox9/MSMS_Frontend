"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { MetricsSkeleton } from "@/components/ui/LoadingSkeletons";
import { useDashboardStartup } from "@/context/DashboardStartupContext";

type BudgetOverview =
  | { state: "no-semester" }
  | { state: "no-budget"; semesterName: string }
  | {
      state: "ready";
      semesterName: string;
      totalClp: number;
      allocatedClp: number;
      unallocatedClp: number;
      estimatedClp: number;
      unpricedAssistantships: number;
      allocations: {
        id: string;
        name: string;
        allocatedClp: number;
        estimatedClp: number | null;
      }[];
      monthly: {
        month: string;
        hourlyClp: number;
        assistantshipsClp: number;
        accumulatedClp: number;
      }[];
    };

function BudgetTable({
  title,
  columns,
  children,
}: {
  title: string;
  columns: string[];
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-2">
      <h3 id={id} className="text-sm font-bold text-foreground">
        {title}
      </h3>
      <div
        role="region"
        aria-labelledby={id}
        tabIndex={0}
        className="max-w-full overflow-x-auto rounded-xl border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <table
          aria-labelledby={id}
          className="w-full border-separate border-spacing-0 text-start text-sm tabular-nums"
        >
          <thead className="bg-muted text-xs text-muted-foreground">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column}
                  scope="col"
                  className={`whitespace-nowrap px-3 py-2.5 ${index === 0 ? "text-start" : "text-end"}`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_td]:whitespace-nowrap [&_td]:border-t [&_td]:border-border [&_td]:px-3 [&_td]:py-2.5 [&_td]:text-end [&_th]:border-t [&_th]:border-border [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-start [&_th]:font-medium">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AnalystBudgetOverview() {
  const t = useTranslations("AnalystBudget");
  const format = useFormatter();
  const { completeTask } = useDashboardStartup();
  const headingId = useId();
  const [budget, setBudget] = useState<BudgetOverview | "error" | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    apiFetch<BudgetOverview>("/dashboard/semester-budget-overview")
      .then((result) => {
        if (current) setBudget(result);
      })
      .catch(() => {
        if (current) setBudget("error");
      })
      .finally(() => {
        if (current) completeTask("budget-overview");
      });
    return () => {
      current = false;
    };
  }, [attempt, completeTask]);

  const money = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });

  return (
    <section aria-labelledby={headingId} className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id={headingId}
          className="text-xl font-bold tracking-tight text-foreground"
        >
          {t("title")}
        </h2>
        {budget && budget !== "error" && "semesterName" in budget && (
          <span className="text-sm font-medium text-muted-foreground">
            {budget.semesterName}
          </span>
        )}
      </div>
      {budget === null && (
        <MetricsSkeleton count={4} compact label={t("loading")} />
      )}
      {budget === "error" && (
        <div
          role="alert"
          className="rounded-xl border border-border px-4 py-2 text-sm text-destructive"
        >
          {t("error")}{" "}
          <button
            type="button"
            className="min-h-11 font-semibold underline"
            onClick={() => {
              setBudget(null);
              setAttempt((previous) => previous + 1);
            }}
          >
            {t("retry")}
          </button>
        </div>
      )}
      {budget && budget !== "error" && budget.state !== "ready" && (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {t(budget.state === "no-budget" ? "noBudget" : "noSemester")}
        </p>
      )}
      {budget && budget !== "error" && budget.state === "ready" && (
        <>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border xl:grid-cols-4">
            {(
              [
                ["total", budget.totalClp],
                ["allocated", budget.allocatedClp],
                ["unallocated", budget.unallocatedClp],
                ["estimated", budget.estimatedClp],
              ] as const
            ).map(([label, amount]) => (
              <div key={label} className="min-w-0 bg-card p-3 sm:p-4">
                <dt className="text-xs font-medium text-muted-foreground">
                  {t(label)}
                </dt>
                <dd className="mt-1 wrap-anywhere text-lg font-bold tabular-nums text-foreground">
                  {money(amount)}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-muted-foreground">{t("estimateNote")}</p>
          {budget.unpricedAssistantships > 0 && (
            <p className="text-sm text-muted-foreground">
              {t("unpriced", { count: budget.unpricedAssistantships })}
            </p>
          )}
          <div className="grid min-w-0 gap-4 2xl:grid-cols-[1fr_1.2fr]">
            {budget.allocations.length > 0 ? (
              <BudgetTable
                title={t("categoryTitle")}
                columns={[t("category"), t("allocated"), t("estimated")]}
              >
                {budget.allocations.map((item) => (
                  <tr key={item.id} className="bg-card">
                    <th scope="row">{item.name}</th>
                    <td>{money(item.allocatedClp)}</td>
                    <td>
                      {item.estimatedClp === null
                        ? t("untracked")
                        : money(item.estimatedClp)}
                    </td>
                  </tr>
                ))}
              </BudgetTable>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("noAllocations")}
              </p>
            )}
            {budget.monthly.length > 0 ? (
              <BudgetTable
                title={t("monthlyTitle")}
                columns={[
                  t("month"),
                  t("hourly"),
                  t("assistantships"),
                  t("accumulated"),
                ]}
              >
                {budget.monthly.map((item) => (
                  <tr key={item.month} className="bg-card">
                    <th
                      scope="row"
                      className="sticky start-0 whitespace-nowrap bg-card"
                    >
                      {format.dateTime(new Date(`${item.month}-01T00:00:00Z`), {
                        month: "short",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </th>
                    <td>{money(item.hourlyClp)}</td>
                    <td>{money(item.assistantshipsClp)}</td>
                    <td className="font-semibold">
                      {money(item.accumulatedClp)}
                    </td>
                  </tr>
                ))}
              </BudgetTable>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("noCommitments")}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
