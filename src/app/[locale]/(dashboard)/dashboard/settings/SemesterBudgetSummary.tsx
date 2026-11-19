"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import type { BudgetData } from "./SemesterBudgetDialog";

type Summary = Pick<BudgetData, "totalAmountClp" | "allocations">;

export default function SemesterBudgetSummary({
  semesterId,
  revision,
  onConfigure,
}: {
  semesterId: string;
  revision: number;
  onConfigure: () => void;
}) {
  const t = useTranslations("SemesterSettingsPage");
  const format = useFormatter();
  const [budget, setBudget] = useState<Summary | "error" | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let current = true;
    apiFetch<Summary>(`/academic/semesters/${semesterId}/budget`)
      .then((data) => {
        if (current) setBudget(data);
      })
      .catch(() => {
        if (current) setBudget("error");
      });
    return () => {
      current = false;
    };
  }, [semesterId, revision, retry]);

  const configured =
    budget && budget !== "error" && budget.totalAmountClp > 0 ? budget : null;
  const money = (amount: number) =>
    format.number(amount, {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });
  const allocated =
    configured?.allocations.reduce((sum, item) => sum + item.amountClp, 0) ?? 0;

  return (
    <div className="space-y-3 border-t border-border p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
          <Wallet aria-hidden="true" className="size-4 shrink-0 text-primary" />
          {t("budgetTitle")}
        </h3>
        <button
          type="button"
          onClick={onConfigure}
          className="min-h-11 rounded-lg border border-primary/35 px-3 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {t(configured ? "editBudget" : "configureBudget")}
        </button>
      </div>
      {budget === null && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("budgetLoading")}
        </p>
      )}
      {budget === "error" && (
        <div role="alert" className="text-sm text-destructive">
          {t("budgetError")}{" "}
          <button
            type="button"
            onClick={() => {
              setBudget(null);
              setRetry((value) => value + 1);
            }}
            className="min-h-11 font-semibold underline"
          >
            {t("retry")}
          </button>
        </div>
      )}
      {budget && budget !== "error" && !configured && (
        <p className="text-sm text-muted-foreground">{t("budgetEmpty")}</p>
      )}
      {configured && (
        <>
          <dl className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
            {(
              [
                ["budgetTotal", configured.totalAmountClp],
                ["budgetAllocated", allocated],
                ["budgetRemaining", configured.totalAmountClp - allocated],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 bg-muted px-3 py-2.5 sm:block">
                <dt className="text-xs font-medium text-muted-foreground">
                  {t(label)}
                </dt>
                <dd className="wrap-anywhere text-base font-bold tabular-nums text-foreground sm:mt-1">
                  {money(value)}
                </dd>
              </div>
            ))}
          </dl>
          {configured.allocations.length > 0 && (
            <dl
              aria-label={t("budgetDistribution")}
              className="divide-y divide-border text-sm"
            >
              {configured.allocations.map(({ name, amountClp }) => (
                <div
                  key={name}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2"
                >
                  <dt className="min-w-0 wrap-anywhere text-muted-foreground">
                    {name}
                  </dt>
                  <dd className="font-medium tabular-nums text-foreground">
                    {money(amountClp)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </>
      )}
    </div>
  );
}
