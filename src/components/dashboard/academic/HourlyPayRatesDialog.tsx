"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { apiFetch } from "@/lib/api";
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
    <Modal
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
            <form onSubmit={(event) => void submit(event)}>
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
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
                >
                  {t(saving ? "savingRate" : "saveRate")}
                </button>
              </fieldset>
            </form>
            {!catalog.rates.length ? (
              <p className="text-sm text-muted-foreground">{t("noRates")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {catalog.rates.map((rate) => (
                  <li
                    key={rate.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <span>
                      {t(`categories.${rate.category}`)} ·{" "}
                      {t(`degrees.${rate.academicDegree}`)} ·{" "}
                      {t(`certifications.${rate.certification}`)}
                    </span>
                    <span className="font-bold tabular-nums">
                      {format.number(Number(rate.hourlyRateClp), {
                        style: "currency",
                        currency: "CLP",
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <button
                      type="button"
                      disabled={saving}
                      className="text-primary underline"
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
            )}
          </div>
        ))}
    </Modal>
  );
}
