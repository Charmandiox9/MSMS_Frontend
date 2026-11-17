"use client";

import { useEffect, useState } from "react";
import { CircleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";

type BudgetAlert = {
  semesterId: string;
  semesterName: string;
  totalAmountClp: number;
  allocatedAmountClp: number;
  currentPercentage: number;
  thresholdPercentage: number;
};

export default function SemesterBudgetAlerts() {
  const t = useTranslations("SemesterBudgetAlerts");
  const locale = useLocale();
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);

  useEffect(() => {
    let active = true;
    apiFetch<BudgetAlert[]>("/dashboard/semester-budget-alerts")
      .then((data) => { if (active) setAlerts(data); })
      .catch(() => { if (active) setAlerts([]); });
    return () => { active = false; };
  }, []);

  if (!alerts.length) return null;
  const currency = new Intl.NumberFormat(locale === "es" ? "es-CL" : "en-US", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  return <section aria-label={t("title")} className="mb-6 space-y-3">
    {alerts.map((alert) => <article key={alert.semesterId} role="status" className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-foreground">
      <div className="flex items-start gap-3"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"/><div className="min-w-0 flex-1">
        <h2 className="font-bold">{t("title")}: {alert.semesterName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("message", { threshold: alert.thresholdPercentage, current: alert.currentPercentage })}</p>
        <p className="mt-2 text-xs font-semibold">{t("amounts", { allocated: currency.format(alert.allocatedAmountClp), total: currency.format(alert.totalAmountClp) })}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(alert.currentPercentage, 100)} aria-label={t("progress")}><div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(alert.currentPercentage, 100)}%` }}/></div>
      </div></div>
    </article>)}
  </section>;
}
