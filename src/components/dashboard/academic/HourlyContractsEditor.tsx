"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import {
  teachingComponents,
  type HourlyContractInput,
  type HourlyRateCatalog,
  type HourlyPaymentPreview,
  type TeacherHourlyContracts,
} from "@/types/hourly-payments";
import type { CurrentCourseCatalog } from "@/types/academic";

const fieldClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export default function HourlyContractsEditor({
  semesterId,
  teacherId,
  courses,
  value,
  onChange,
  onReady,
  disabled,
}: {
  semesterId: string;
  teacherId?: string;
  courses: CurrentCourseCatalog["courses"];
  value: HourlyContractInput[];
  onChange: (value: HourlyContractInput[]) => void;
  onReady: (ready: boolean) => void;
  disabled: boolean;
}) {
  const t = useTranslations("HourlyPayments");
  const format = useFormatter();
  const [catalog, setCatalog] = useState<HourlyRateCatalog | null>(null);
  const [calculated, setCalculated] = useState<{
    request: string;
    result: HourlyPaymentPreview;
  } | null>(null);
  const [loadFailure, setLoadFailure] = useState<string | null>(null);
  const [previewFailure, setPreviewFailure] = useState<{
    request: string;
    message: string;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const fallbackError = t("loadError");
  const semesterChanged = t("semesterChanged");

  useEffect(() => {
    let active = true;
    onReady(false);
    Promise.all([
      apiFetch<HourlyRateCatalog>("/academic/hourly-payments/rates"),
      teacherId
        ? apiFetch<TeacherHourlyContracts>(
            `/academic/hourly-payments/teachers/${teacherId}`,
          )
        : Promise.resolve(null),
    ])
      .then(([rates, saved]) => {
        if (!active) return;
        if (
          rates.semester?.id !== semesterId ||
          (saved && saved.semesterId !== semesterId)
        )
          throw new Error(semesterChanged);
        setCatalog(rates);
        if (saved)
          onChange(
            saved.contracts.map((contract) => ({
              id: contract.id,
              nrc: contract.nrc,
              payRateId: contract.payRateId,
              component: contract.component,
              parallel: contract.parallel,
              directHours: Number(contract.directHours),
              startsOn: contract.startsOn.slice(0, 10),
              endsOn: contract.endsOn.slice(0, 10),
            })),
          );
        setLoadFailure(null);
      })
      .catch((cause: unknown) => {
        if (active)
          setLoadFailure(
            cause instanceof Error ? cause.message : fallbackError,
          );
      });
    return () => {
      active = false;
    };
  }, [
    semesterId,
    teacherId,
    retry,
    onChange,
    onReady,
    fallbackError,
    semesterChanged,
  ]);

  const serialized = JSON.stringify(value);
  const preview = calculated?.request === serialized ? calculated.result : null;
  const error =
    loadFailure ??
    (previewFailure?.request === serialized ? previewFailure.message : null);
  const complete =
    value.length > 0 &&
    value.every(
      (line) =>
        line.nrc &&
        line.payRateId &&
        line.parallel.trim() &&
        line.startsOn &&
        line.endsOn &&
        line.directHours > 0,
    );
  const calculating = !!catalog && complete && !preview && !error;
  useEffect(() => {
    if (!catalog) return;
    let active = true;
    onReady(false);
    const lines = JSON.parse(serialized) as HourlyContractInput[];
    if (!lines.length) {
      onReady(true);
      return;
    }
    if (
      lines.some(
        (line) =>
          !line.nrc ||
          !line.payRateId ||
          !line.parallel.trim() ||
          !line.startsOn ||
          !line.endsOn ||
          line.directHours <= 0,
      )
    ) {
      return;
    }
    const timer = setTimeout(() => {
      apiFetch<HourlyPaymentPreview>("/academic/hourly-payments/preview", {
        method: "POST",
        body: JSON.stringify({ semesterId, teacherId, contracts: lines }),
      })
        .then((result) => {
          if (active) {
            setCalculated({ request: serialized, result });
            setPreviewFailure(null);
            onReady(true);
          }
        })
        .catch((cause: unknown) => {
          if (active)
            setPreviewFailure({
              request: serialized,
              message: cause instanceof Error ? cause.message : fallbackError,
            });
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [catalog, serialized, semesterId, teacherId, onReady, fallbackError]);

  const update = (index: number, patch: Partial<HourlyContractInput>) => {
    onReady(false);
    onChange(
      value.map((line, at) => (at === index ? { ...line, ...patch } : line)),
    );
  };
  const money = (amount: string) =>
    format.number(Number(amount), {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });
  return (
    <fieldset
      disabled={disabled}
      className="space-y-4 border-t border-border pt-4"
    >
      <legend className="text-sm font-bold">{t("contracts")}</legend>
      <p className="text-xs text-muted-foreground">{t("calculationHint")}</p>
      {error && (
        <div role="alert" className="text-sm text-destructive">
          {error}
          {!catalog && (
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => {
                setLoadFailure(null);
                setRetry((count) => count + 1);
              }}
            >
              {t("retry")}
            </button>
          )}
        </div>
      )}
      {!catalog && !error && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("loading")}
        </p>
      )}
      {catalog && (
        <>
          {!catalog.rates.length && (
            <p className="text-sm text-muted-foreground">{t("noRates")}</p>
          )}
          {!value.length && (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          )}
          {value.map((line, index) => (
            <div
              key={line.id ?? `new-${index}`}
              className="space-y-3 rounded-xl border border-border p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">
                  {t("contractNumber", { number: index + 1 })}
                </p>
                <button
                  type="button"
                  className="text-sm text-destructive underline"
                  onClick={() => {
                    onReady(false);
                    onChange(value.filter((_, at) => at !== index));
                  }}
                >
                  {t("remove")}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  {t("course")}
                  <select
                    required
                    value={line.nrc}
                    onChange={(event) =>
                      update(index, { nrc: event.target.value })
                    }
                    className={fieldClass}
                  >
                    <option value="">{t("select")}</option>
                    {courses.map((course) => (
                      <option key={course.nrc} value={course.nrc}>
                        {course.nrc} · {course.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  {t("rate")}
                  <select
                    required
                    value={line.payRateId}
                    onChange={(event) =>
                      update(index, { payRateId: event.target.value })
                    }
                    className={fieldClass}
                  >
                    <option value="">{t("select")}</option>
                    {catalog.rates.map((rate) => (
                      <option key={rate.id} value={rate.id}>
                        {t(`categories.${rate.category}`)} ·{" "}
                        {t(`degrees.${rate.academicDegree}`)} ·{" "}
                        {t(`certifications.${rate.certification}`)} ·{" "}
                        {money(rate.hourlyRateClp)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  {t("component")}
                  <select
                    value={line.component}
                    onChange={(event) =>
                      update(index, {
                        component: event.target
                          .value as HourlyContractInput["component"],
                      })
                    }
                    className={fieldClass}
                  >
                    {teachingComponents.map((component) => (
                      <option key={component} value={component}>
                        {t(`components.${component}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  {t("parallel")}
                  <input
                    required
                    maxLength={50}
                    value={line.parallel}
                    onChange={(event) =>
                      update(index, { parallel: event.target.value })
                    }
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm">
                  {t("hours")}
                  <input
                    required
                    type="number"
                    min="0.01"
                    max="168"
                    step="0.01"
                    value={line.directHours || ""}
                    onChange={(event) =>
                      update(index, { directHours: Number(event.target.value) })
                    }
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm">
                  {t("startsOn")}
                  <input
                    required
                    type="date"
                    value={line.startsOn}
                    max={line.endsOn || undefined}
                    onChange={(event) =>
                      update(index, { startsOn: event.target.value })
                    }
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm">
                  {t("endsOn")}
                  <input
                    required
                    type="date"
                    value={line.endsOn}
                    min={line.startsOn || undefined}
                    onChange={(event) =>
                      update(index, { endsOn: event.target.value })
                    }
                    className={fieldClass}
                  />
                </label>
              </div>
              {preview?.lines[index] && (
                <div className="space-y-2 text-sm" aria-live="polite">
                  <p>
                    {t("monthlyAmount")}:{" "}
                    <strong>
                      {money(preview.lines[index].calculation.monthlyAmountClp)}
                    </strong>
                  </p>
                  <ul className="grid gap-2 sm:grid-cols-3">
                    {preview.lines[index].calculation.months.map((month) => (
                      <li
                        key={month.month}
                        className="rounded-lg bg-primary/5 p-2"
                      >
                        {format.dateTime(
                          new Date(`${month.month}-01T12:00:00Z`),
                          { month: "long", year: "numeric", timeZone: "UTC" },
                        )}
                        <br />
                        {t("days", { count: month.days })} ·{" "}
                        {money(month.amountClp)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            disabled={
              !catalog.rates.length || !courses.length || value.length >= 100
            }
            className="rounded-xl border border-primary/30 px-3 py-2 text-sm font-bold text-primary disabled:opacity-50"
            onClick={() => {
              onReady(false);
              onChange([
                ...value,
                {
                  nrc: courses[0]?.nrc ?? "",
                  payRateId: "",
                  component: "LECTURE",
                  parallel: "",
                  directHours: 3,
                  startsOn: catalog.semester?.startsOn.slice(0, 10) ?? "",
                  endsOn: catalog.semester?.endsOn.slice(0, 10) ?? "",
                },
              ]);
            }}
          >
            {t("addContract")}
          </button>
        </>
      )}
      {calculating && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("calculating")}
        </p>
      )}
      {preview && (
        <p className="text-lg font-bold text-primary" aria-live="polite">
          {t("semesterTotal")}: {money(preview.totalAmountClp)}
        </p>
      )}
    </fieldset>
  );
}
