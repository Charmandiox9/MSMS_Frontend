"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import FormModal from "@/components/ui/FormModal";
import { apiFetch } from "@/lib/api";
import {
  academicPrimaryActionClass,
  academicSecondaryActionClass,
} from "./academicActionStyles";
import {
  academicDegrees,
  hourlyTeacherCategories,
  teacherCertifications,
  type AcademicDegree,
  type HourlyTeacherCategory,
  type TeacherCertification,
  type HourlyRateCatalog,
} from "@/types/hourly-payments";

const fieldClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground";

export default function HourlyPayRatesDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  const t = useTranslations("HourlyPayments");
  const format = useFormatter();
  const [catalog, setCatalog] = useState<HourlyRateCatalog | null>(null);
  const [category, setCategory] = useState<HourlyTeacherCategory>("NEW");
  const [degree, setDegree] = useState<AcademicDegree>("PROFESSIONAL");
  const [certification, setCertification] =
    useState<TeacherCertification>("NONE");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const loadError = t("loadError");
  const diving = category.startsWith("DIVING_");

  useEffect(() => {
    let active = true;
    apiFetch<HourlyRateCatalog>("/academic/hourly-payments/rates")
      .then((result) => {
        if (active) {
          setCatalog(result);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : loadError);
      });
    return () => {
      active = false;
    };
  }, [retry, loadError]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!catalog?.semester || saving) return;
    setSaving(true);
    setError(null);
    const operation = apiFetch("/academic/hourly-payments/rates", {
      method: "POST",
      body: JSON.stringify({
        semesterId: catalog.semester.id,
        category,
        academicDegree: diving ? "NOT_APPLICABLE" : degree,
        certification: category === "EXISTING" ? certification : "NONE",
        hourlyRateClp: Number(amount),
      }),
    });
    toast.promise(operation, {
      loading: t("savingRate"),
      success: t("rateSaved"),
      error: (cause: unknown) =>
        cause instanceof Error ? cause.message : t("saveError"),
    });
    try {
      await operation;
      setAmount("");
      setRetry((count) => count + 1);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      key={retry}
      isOpen
      title={t("ratesTitle")}
      description={t("ratesDescription")}
      size="2xl"
      closeLabel={t("close")}
      onClose={() => {
        if (!saving) onClose();
      }}
      closeOnEscape={!saving}
      closeOnBackdropClick={!saving}
      footer={
        <>
          <button
            type="button"
            disabled={saving}
            data-modal-dismiss
            onClick={onClose}
            className={academicSecondaryActionClass}
          >
            {t("close")}
          </button>
          <button
            type="submit"
            form="hourly-rate-editor"
            disabled={saving || !catalog?.semester}
            className={academicPrimaryActionClass}
          >
            {t(saving ? "savingRate" : "saveRate")}
          </button>
        </>
      }
    >
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
          <button
            type="button"
            disabled={saving}
            className="ml-2 underline"
            onClick={() => setRetry((count) => count + 1)}
          >
            {t("retry")}
          </button>
        </p>
      )}
      {!catalog && !error && <p role="status">{t("loading")}</p>}
      {catalog &&
        (!catalog.semester ? (
          <p>{t("noSemester")}</p>
        ) : (
          <div className="space-y-5">
            <p className="text-sm font-bold">{catalog.semester.name}</p>
            <form
              id="hourly-rate-editor"
              onSubmit={(event) => void submit(event)}
              className="space-y-3"
            >
              <p className="text-xs leading-5 text-muted-foreground">
                {t("rateFormHelp")}
              </p>
              <fieldset disabled={saving} className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  {t("category")}
                  <select
                    value={category}
                    onChange={(event) => {
                      const next = event.target.value as HourlyTeacherCategory;
                      setCategory(next);
                      if (
                        !next.startsWith("DIVING_") &&
                        degree === "NOT_APPLICABLE"
                      )
                        setDegree("PROFESSIONAL");
                      if (next !== "EXISTING") setCertification("NONE");
                    }}
                    className={fieldClass}
                  >
                    {hourlyTeacherCategories.map((item) => (
                      <option key={item} value={item}>
                        {t(`categories.${item}`)}
                      </option>
                    ))}
                  </select>
                </label>
                {!diving && (
                  <label className="text-sm">
                    {t("degree")}
                    <select
                      value={degree}
                      onChange={(event) =>
                        setDegree(event.target.value as AcademicDegree)
                      }
                      className={fieldClass}
                    >
                      {academicDegrees
                        .filter((item) => item !== "NOT_APPLICABLE")
                        .map((item) => (
                          <option key={item} value={item}>
                            {t(`degrees.${item}`)}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                {category === "EXISTING" && (
                  <label className="text-sm">
                    {t("certification")}
                    <select
                      value={certification}
                      onChange={(event) =>
                        setCertification(
                          event.target.value as TeacherCertification,
                        )
                      }
                      className={fieldClass}
                    >
                      {teacherCertifications.map((item) => (
                        <option key={item} value={item}>
                          {t(`certifications.${item}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="text-sm">
                  {t("hourlyRate")}
                  <input
                    required
                    type="number"
                    min="0.01"
                    max="9999999999.99"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className={fieldClass}
                  />
                </label>
              </fieldset>
            </form>
            {!catalog.rates.length ? (
              <p className="text-sm text-muted-foreground">{t("noRates")}</p>
            ) : (
              <section className="space-y-3" aria-labelledby="hourly-rate-list-title">
                <h2
                  id="hourly-rate-list-title"
                  className="text-sm font-bold text-foreground"
                >
                  {t("ratesListTitle")}
                </h2>
                <div className="hidden grid-cols-[minmax(0,1fr)_10rem_8rem] gap-4 border-y border-border bg-muted/40 px-4 py-3 text-center text-xs font-semibold text-muted-foreground sm:grid">
                  <span>{t("rateProfile")}</span>
                  <span>{t("rateValueLabel")}</span>
                  <span>{t("actions")}</span>
                </div>
                <ul className="divide-y divide-border border-y border-border">
                  {catalog.rates.map((rate) => (
                    <li
                      key={rate.id}
                      className="grid gap-3 px-2 py-4 sm:grid-cols-[minmax(0,1fr)_10rem_8rem] sm:items-center sm:gap-4 sm:px-4"
                    >
                      <dl className="min-w-0 divide-y divide-border rounded-xl border border-border bg-muted/20">
                        <div className="grid min-w-0 grid-cols-[minmax(6.5rem,0.8fr)_minmax(0,1.2fr)] items-center gap-3 px-3 py-2">
                          <dt className="text-xs font-semibold text-muted-foreground">
                            {t("category")}
                          </dt>
                          <dd className="min-w-0 justify-self-end break-words rounded-full bg-primary/10 px-2.5 py-1 text-right text-xs font-semibold text-primary">
                            {t(`categories.${rate.category}`)}
                          </dd>
                        </div>
                        <div className="grid min-w-0 grid-cols-[minmax(6.5rem,0.8fr)_minmax(0,1.2fr)] items-center gap-3 px-3 py-2">
                          <dt className="text-xs font-semibold text-muted-foreground">
                            {t("degree")}
                          </dt>
                          <dd className="min-w-0 break-words text-right text-sm font-medium text-foreground">
                            {t(`degrees.${rate.academicDegree}`)}
                          </dd>
                        </div>
                        <div className="grid min-w-0 grid-cols-[minmax(6.5rem,0.8fr)_minmax(0,1.2fr)] items-center gap-3 px-3 py-2">
                          <dt className="text-xs font-semibold text-muted-foreground">
                            {t("certification")}
                          </dt>
                          <dd className="min-w-0 break-words text-right text-sm font-medium text-foreground">
                            {t(`certifications.${rate.certification}`)}
                          </dd>
                        </div>
                      </dl>
                      <div className="flex items-center justify-between gap-3 sm:justify-center sm:border-l sm:border-border sm:pl-3">
                        <span className="text-xs font-medium text-muted-foreground sm:hidden">
                          {t("rateValueLabel")}
                        </span>
                        <span className="font-bold tabular-nums text-foreground">
                          {format.number(Number(rate.hourlyRateClp), {
                            style: "currency",
                            currency: "CLP",
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={saving}
                        data-modal-dirty
                        className="min-h-10 justify-self-center px-3 text-sm font-semibold text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60 sm:border-l sm:border-border sm:pl-4"
                        onClick={() => {
                          setCategory(rate.category);
                          setDegree(rate.academicDegree);
                          setCertification(rate.certification);
                          setAmount(rate.hourlyRateClp);
                        }}
                      >
                        {t("editRate")}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        ))}
    </FormModal>
  );
}
