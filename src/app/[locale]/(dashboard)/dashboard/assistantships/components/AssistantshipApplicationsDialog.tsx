"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import Modal from "@/components/ui/Modal";
import { apiFetch } from "@/lib/api";
import {
  applicationEndpoint,
  applicationStatuses,
  type ApplicationDetail,
  type ApplicationPage,
  type ApplicationStatus,
} from "../applications";
import { buttonClass, inputClass } from "./controls";
import AssistantshipApplicationReview from "./AssistantshipApplicationReview";

export default function AssistantshipApplicationsDialog({
  onClose,
  onComplete,
  canComplete,
}: {
  onClose: () => void;
  onComplete: (application: ApplicationDetail) => void;
  canComplete: boolean;
}) {
  const t = useTranslations("AssistantshipApplications");
  const format = useFormatter();
  const [status, setStatus] = useState<ApplicationStatus>("PENDING");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [result, setResult] = useState<ApplicationPage | "error" | null>(null);

  useEffect(() => {
    if (selectedId) return;
    let current = true;
    apiFetch<ApplicationPage>(
      `${applicationEndpoint}?status=${status}&page=${page}`,
    )
      .then((data) => {
        if (current) setResult(data);
      })
      .catch(() => {
        if (current) setResult("error");
      });
    return () => {
      current = false;
    };
  }, [status, page, selectedId, loadKey]);

  function goToPage(next: number) {
    setResult(null);
    setPage(next);
  }

  return (
    <Modal
      isOpen
      title={t(selectedId ? "detailTitle" : "title")}
      size="4xl"
      closeLabel={t("close")}
      closeOnEscape={!busy}
      closeOnBackdropClick={!busy}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      {selectedId ? (
        <AssistantshipApplicationReview
          key={selectedId}
          id={selectedId}
          onBack={() => {
            setSelectedId(null);
            setResult(null);
          }}
          onBusy={setBusy}
          canComplete={canComplete}
          onComplete={onComplete}
        />
      ) : (
        <div className="space-y-4">
          <label className="block max-w-xs space-y-1 text-sm font-semibold">
            <span>{t("filter")}</span>
            <select
              className={inputClass}
              value={status}
              onChange={(event) => {
                const selection = applicationStatuses.find(
                  (value) => value === event.target.value,
                );
                if (!selection) return;
                setStatus(selection);
                goToPage(1);
              }}
            >
              {applicationStatuses.map((value) => (
                <option key={value} value={value}>
                  {t(`filters.${value}`)}
                </option>
              ))}
            </select>
          </label>
          {result === null ? (
            <p role="status" className="py-5 text-sm text-muted-foreground">
              {t("loading")}
            </p>
          ) : result === "error" ? (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-2 text-sm text-destructive"
            >
              {t("loadError")}
              <button
                type="button"
                className={buttonClass}
                onClick={() => {
                  setResult(null);
                  setLoadKey((key) => key + 1);
                }}
              >
                {t("retry")}
              </button>
            </div>
          ) : (
            <>
              {result.items.length === 0 ? (
                <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
                  {t("empty")}
                </p>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {result.items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className="flex min-h-12 w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-start hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                      >
                        <span className="min-w-0">
                          <span className="block wrap-anywhere text-sm font-bold">
                            {item.name}
                          </span>
                          <span className="block wrap-anywhere text-sm text-muted-foreground">
                            {item.subject}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.status === "APPROVED" && (
                            <span className="block font-semibold text-primary">
                              {t(
                                item.assistantshipId
                                  ? "completed"
                                  : "awaitingSchedule",
                              )}
                            </span>
                          )}
                          {format.dateTime(new Date(item.submittedAt), {
                            dateStyle: "medium",
                            timeZone: "America/Santiago",
                          })}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {(page > 1 || result.hasMore) && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    className={buttonClass}
                    disabled={page === 1}
                    onClick={() => goToPage(page - 1)}
                  >
                    {t("previous")}
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {t("page", { page })}
                  </span>
                  <button
                    type="button"
                    className={buttonClass}
                    disabled={!result.hasMore}
                    onClick={() => goToPage(page + 1)}
                  >
                    {t("next")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
