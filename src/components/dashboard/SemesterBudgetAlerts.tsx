"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CircleAlert, CircleCheck, RotateCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Skeleton from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/api";

type BudgetAlert = {
  semesterId: string;
  semesterName: string;
  totalAmountClp: number;
  allocatedAmountClp: number;
  currentPercentage: number;
  thresholdPercentage: number;
};

type AlertLoadState =
  | { status: "loading"; showSkeleton: boolean }
  | { status: "ready"; alerts: BudgetAlert[] }
  | { status: "error" };

type AlertVariant = "banner" | "section";

const SKELETON_DELAY_MS = 300;
const PANEL_CLASS = "rounded-2xl border p-4";

function BudgetAlertCard({
  alert,
  variant,
  currency,
  percent,
}: {
  alert: BudgetAlert;
  variant: AlertVariant;
  currency: Intl.NumberFormat;
  percent: Intl.NumberFormat;
}) {
  const t = useTranslations("SemesterBudgetAlerts");
  const Heading = variant === "section" ? "h3" : "h2";
  const current = percent.format(alert.currentPercentage / 100);
  const threshold = percent.format(alert.thresholdPercentage / 100);
  const progress = Math.max(0, Math.min(alert.currentPercentage, 100));

  return (
    <article
      className={`${PANEL_CLASS} border-border bg-warning-surface text-foreground`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div className="min-w-0 flex-1">
          <Heading className="font-semibold">
            {variant === "section" ? alert.semesterName : t("cardTitle", { semester: alert.semesterName })}
          </Heading>
          <p className="mt-1 text-sm text-foreground">
            {t("message", { threshold, current })}
          </p>
          <p className="mt-2 text-sm font-semibold tabular-nums">
            {t("amounts", {
              allocated: currency.format(alert.allocatedAmountClp),
              total: currency.format(alert.totalAmountClp),
            })}
          </p>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-valuetext={current}
            aria-label={t("progress")}
          >
            <div className="h-full rounded-full bg-warning" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </article>
  );
}

function BudgetAlertsSkeleton({ label, visible }: { label: string; visible: boolean }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div
        aria-hidden="true"
        className={`${PANEL_CLASS} flex items-start gap-3 border-border bg-card ${visible ? "" : "invisible"}`}
      >
        <Skeleton className="mt-0.5 h-5 w-5 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-6 w-32 max-w-full" />
          <Skeleton className="mt-1 h-5 w-4/5" />
          <Skeleton className="mt-2 h-5 w-3/5" />
          <Skeleton className="mt-3 h-2 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function SemesterBudgetAlerts({
  variant = "banner",
}: {
  variant?: AlertVariant;
}) {
  const t = useTranslations("SemesterBudgetAlerts");
  const locale = useLocale();
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<AlertLoadState>({
    status: "loading",
    showSkeleton: false,
  });

  useEffect(() => {
    let active = true;
    const timeout = variant === "section"
      ? window.setTimeout(() => {
          if (active) setState({ status: "loading", showSkeleton: true });
        }, SKELETON_DELAY_MS)
      : undefined;

    void apiFetch<BudgetAlert[]>("/dashboard/semester-budget-alerts")
      .then((alerts) => {
        if (active) setState({ status: "ready", alerts });
      })
      .catch(() => {
        if (active) setState({ status: "error" });
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [attempt, variant]);

  const retry = () => {
    headingRef.current?.focus();
    setState({ status: "loading", showSkeleton: false });
    setAttempt((current) => current + 1);
  };

  const alerts = state.status === "ready" ? state.alerts : [];
  if (variant === "banner" && !alerts.length) return null;

  const numberLocale = locale === "es" ? "es-CL" : locale;
  const currency = new Intl.NumberFormat(numberLocale, {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
  const percent = new Intl.NumberFormat(numberLocale, {
    style: "percent",
    maximumFractionDigits: 1,
  });

  const cards = alerts.map((alert) => (
    <BudgetAlertCard
      key={alert.semesterId}
      alert={alert}
      variant={variant}
      currency={currency}
      percent={percent}
    />
  ));

  if (variant === "banner") {
    return <section aria-label={t("title")} className="mb-6 space-y-3">{cards}</section>;
  }

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <h2
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        {t("sectionTitle")}
      </h2>
      {state.status === "loading" && (
        <BudgetAlertsSkeleton label={t("loading")} visible={state.showSkeleton} />
      )}
      {state.status === "error" && (
        <div className={`${PANEL_CLASS} border-border bg-danger-surface`}>
          <p className="flex items-start gap-3 text-foreground" role="alert">
            <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            {t("error")}
          </p>
          <button
            type="button"
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            onClick={retry}
          >
            <RotateCw aria-hidden="true" className="h-4 w-4" />
            {t("retry")}
          </button>
        </div>
      )}
      {state.status === "ready" && (
        alerts.length ? cards : (
          <div className={`${PANEL_CLASS} flex items-start gap-3 border-border bg-card text-muted-foreground`} role="status">
            <CircleCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <p>{t("empty")}</p>
          </div>
        )
      )}
    </section>
  );
}
