"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";

type BudgetSummary = {
  semesterName: string;
  categoryName: string | null;
  allocatedClp: number | null;
  estimatedClp: number;
};

export default function HourlyTeachersBudget({ semesterId }: { semesterId: string }) {
  const t = useTranslations("TeachersPage.budget");
  const format = useFormatter();
  const [budget, setBudget] = useState<BudgetSummary>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch<BudgetSummary>(`/academic/semesters/${semesterId}/budget/hourly-teachers`)
      .then((summary) => { if (active) setBudget(summary); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [semesterId]);

  const money = (amount: number) =>
    format.number(amount, { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
  const ratio = budget?.allocatedClp ? budget.estimatedClp / budget.allocatedClp : null;

  return (
    <section aria-label={t("title")} className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-bold text-foreground">
          {budget ? t("semesterTitle", { semester: budget.semesterName }) : t("title")}
        </h2>
        {ratio !== null && (
          <p className={`font-bold tabular-nums ${ratio > 1 ? "text-destructive" : "text-primary"}`}>
            {t("usage", { percent: format.number(ratio, { style: "percent", maximumFractionDigits: 1 }) })}
          </p>
        )}
      </div>
      {failed && <p role="alert" className="mt-2 text-sm text-destructive">{t("error")}</p>}
      {!failed && !budget && <p role="status" className="mt-2 text-sm text-muted-foreground">{t("loading")}</p>}
      {budget && (
        <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">
              {budget.categoryName ? t("category", { name: budget.categoryName }) : t("allocated")}
            </dt>
            <dd className="font-semibold">
              {budget.allocatedClp === null ? t("unassigned") : money(budget.allocatedClp)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("estimated")}</dt>
            <dd className="font-semibold">{money(budget.estimatedClp)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
