"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { CircleAlert, type LucideIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import StatCard from "@/components/dashboard/widgets/StatCard";
import ActiveSemesterSummary from "./ActiveSemesterSummary";
import { MetricSkeleton } from "@/components/ui/LoadingSkeletons";

type Metric = {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  group?: "attention" | "general";
};

const groups = ["attention", "semester", "general"] as const;

export default function RoleDashboardStats({
  endpoint,
  metrics,
  sectionLabels,
}: {
  endpoint: string;
  metrics: Metric[];
  sectionLabels?: Partial<Record<(typeof groups)[number], string>>;
}) {
  const t = useTranslations("Dashboard");
  const loadingText = useTranslations("Loading");
  const format = useFormatter();
  const [values, setValues] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void apiFetch<Record<string, number>>(endpoint)
      .then((result) => {
        if (active) setValues(result);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [endpoint, attempt]);

  return (
    <>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-surface px-4 py-3 text-base text-foreground"
        >
          <CircleAlert aria-hidden="true" className="mt-1 size-5 shrink-0 text-danger" />
          <p>
            {t("metricsError")} {" "}
            <button
              type="button"
              className="min-h-11 font-semibold underline underline-offset-4"
              onClick={() => {
                setError(false);
                setLoading(true);
                setAttempt((previous) => previous + 1);
              }}
            >
              {t("retry")}
            </button>
          </p>
        </div>
      )}
      {loading && (
        <p role="status" className="sr-only">
          {loadingText("metrics")}
        </p>
      )}
      {groups.map((group) => {
        const items = metrics.filter(
          (metric) => (metric.group ?? "semester") === group,
        );
        if (!items.length) return null;
        const title = sectionLabels?.[group] ?? t(`groups.${group}`);

        return (
          <section key={group} className="space-y-3" aria-label={title}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                {title}
              </h2>
              {group === "semester" && <ActiveSemesterSummary />}
            </div>
            <div
              aria-busy={loading}
              className={`grid gap-3 ${items.length > 1 ? "sm:grid-cols-2" : ""} ${items.length > 2 ? "xl:grid-cols-3" : ""}`}
            >
              {items.map(({ key, group, ...metric }) => {
                if (loading) return <MetricSkeleton key={key} compact />;
                const value = values?.[key];
                return (
                  <StatCard
                    key={key}
                    {...metric}
                    value={value === undefined ? "—" : format.number(value)}
                    highlighted={
                      group === "attention" && value !== undefined && value > 0
                    }
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}
