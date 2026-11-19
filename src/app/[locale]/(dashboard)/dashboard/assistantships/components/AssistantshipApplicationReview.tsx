"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { Link } from "@/i18n/routing";
import { applicationEndpoint, type ApplicationDetail } from "../applications";
import { buttonClass, inputClass, primaryClass } from "./controls";

export default function AssistantshipApplicationReview({
  id,
  onBack,
  onBusy,
  onComplete,
  canComplete,
}: {
  id: string;
  onBack: () => void;
  onBusy: (busy: boolean) => void;
  onComplete: (application: ApplicationDetail) => void;
  canComplete: boolean;
}) {
  const t = useTranslations("AssistantshipApplications");
  const format = useFormatter();
  const formId = useId();
  const backButton = useRef<HTMLButtonElement>(null);
  const [application, setApplication] = useState<
    ApplicationDetail | "error" | null
  >(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    backButton.current?.focus();
  }, []);

  useEffect(() => {
    let current = true;
    apiFetch<ApplicationDetail>(`${applicationEndpoint}/${id}`)
      .then((data) => {
        if (current) setApplication(data);
      })
      .catch(() => {
        if (current) setApplication("error");
      });
    return () => {
      current = false;
    };
  }, [id, attempt]);

  function retry() {
    setApplication(null);
    setAttempt((value) => value + 1);
  }

  async function decide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const fields = new FormData(event.currentTarget);
    const status = fields.get("decision");
    if (status !== "APPROVED" && status !== "REJECTED") return;
    setSaving(true);
    onBusy(true);
    const operation = apiFetch<ApplicationDetail>(
      `${applicationEndpoint}/${id}/decision`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status,
          notify: fields.get("notify") === "on",
          reviewNote: fields.get("reviewNote"),
        }),
      },
    );
    toast.promise(operation, {
      loading: t("saving"),
      success: t(status === "APPROVED" ? "approved" : "rejected"),
      error: (error: unknown) =>
        t(
          error instanceof ApiError && error.status === 409
            ? "alreadyReviewed"
            : "saveError",
        ),
    });
    try {
      setApplication(await operation);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) retry();
    } finally {
      setSaving(false);
      onBusy(false);
    }
  }

  const date = (value: string) =>
    format.dateTime(new Date(value), {
      dateStyle: "medium",
      timeZone: "America/Santiago",
    });
  const detail = application === "error" ? null : application;

  return (
    <div className="space-y-5">
      <button
        ref={backButton}
        type="button"
        disabled={saving}
        onClick={onBack}
        className={buttonClass}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t("back")}
      </button>
      {application === null && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("loading")}
        </p>
      )}
      {application === "error" && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2 text-sm text-destructive"
        >
          {t("loadError")}
          <button type="button" className={buttonClass} onClick={retry}>
            {t("retry")}
          </button>
        </div>
      )}
      {detail && (
        <>
          <header className="border-b border-border pb-3">
            <h3 className="wrap-anywhere text-xl font-bold">{detail.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(`statuses.${detail.status}`)} · {date(detail.submittedAt)}
            </p>
          </header>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {(
              [
                ["email", detail.studentEmail],
                ["rut", detail.rut],
                ["phone", detail.phone],
                ["career", detail.submittedCareer],
                ["address", detail.address],
                ["subject", detail.subject],
                ["ppa", detail.ppa],
                ["motivation", detail.motivation],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className={label === "motivation" ? "sm:col-span-2" : ""}
              >
                <dt className="text-xs font-semibold text-muted-foreground">
                  {t(`fields.${label}`)}
                </dt>
                <dd className="mt-1 whitespace-pre-wrap wrap-anywhere text-sm">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="space-y-1 rounded-xl border border-border bg-muted/50 p-3 text-sm">
            <p className="font-semibold">{t("studentRecord")}</p>
            {detail.student ? (
              <>
                <p className="wrap-anywhere text-muted-foreground">
                  {detail.student.name}
                  {detail.student.career
                    ? ` · ${detail.student.career.name}`
                    : ""}
                </p>
                <Link
                  href={`/dashboard/students/${detail.student.id}/progress`}
                  className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:underline"
                >
                  {t("openStudent")}{" "}
                  <ExternalLink aria-hidden="true" className="size-4" />
                </Link>
              </>
            ) : (
              <p className="text-muted-foreground">{t("noStudent")}</p>
            )}
          </div>
          {detail.status === "PENDING" ? (
            <form
              method="post"
              onSubmit={(event) => void decide(event)}
              aria-busy={saving}
              className="space-y-3 rounded-xl border border-border p-4"
            >
              <div className="space-y-1">
                <label
                  htmlFor={`${formId}-decision`}
                  className="text-sm font-semibold"
                >
                  {t("decision")}
                </label>
                <select
                  id={`${formId}-decision`}
                  name="decision"
                  required
                  disabled={saving}
                  defaultValue=""
                  className={inputClass}
                >
                  <option value="" disabled>
                    {t("chooseDecision")}
                  </option>
                  <option value="APPROVED">{t("approve")}</option>
                  <option value="REJECTED">{t("reject")}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor={`${formId}-note`}
                  className="text-sm font-semibold"
                >
                  {t("reviewNote")}
                </label>
                <textarea
                  id={`${formId}-note`}
                  name="reviewNote"
                  rows={3}
                  maxLength={1000}
                  disabled={saving}
                  className={inputClass}
                />
              </div>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="notify"
                  disabled={saving}
                  className="size-4 shrink-0 accent-primary"
                />
                {t("notify")}
              </label>
              <button type="submit" disabled={saving} className={primaryClass}>
                {t(saving ? "saving" : "saveDecision")}
              </button>
            </form>
          ) : (
            <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
              {detail.reviewedAt && (
                <p className="text-muted-foreground">
                  {t("reviewedOn", { date: date(detail.reviewedAt) })}
                </p>
              )}
              {detail.reviewNote && (
                <p className="whitespace-pre-wrap wrap-anywhere">
                  {detail.reviewNote}
                </p>
              )}
              <p className="text-muted-foreground">
                {t(`notification.${detail.notification}`)}
              </p>
              {detail.status === "APPROVED" && (
                <>
                  <p className="font-semibold">
                    {t(
                      detail.assistantshipId ? "completed" : "awaitingSchedule",
                    )}
                  </p>
                  {!detail.assistantshipId && (
                    <button
                      type="button"
                      disabled={!canComplete}
                      onClick={() => onComplete(detail)}
                      className={primaryClass}
                    >
                      {t("complete")}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
