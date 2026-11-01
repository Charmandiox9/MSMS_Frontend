"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { apiFetch } from "@/lib/api";
import { CardsSkeleton, PageSkeleton } from "@/components/ui/LoadingSkeletons";
import PaginationControls from "@/components/ui/PaginationControls";

type RightType = "ACCESS" | "RECTIFICATION" | "SUPPRESSION" | "OPPOSITION" | "PORTABILITY" | "BLOCKING";
type RequestStatus = "RECEIVED" | "VERIFYING" | "IN_PROGRESS" | "COMPLETED" | "DENIED" | "CLOSED";

type DataRightsRequest = {
  id: string;
  rightType: RightType;
  status: RequestStatus;
  details?: string | null;
  responseNote: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  dueAt: string;
  extendedAt?: string | null;
  extensionNote?: string | null;
  respondedAt?: string | null;
  subject?: { id: string; name: string; email: string } | null;
};

type RequestQueue = {
  items: DataRightsRequest[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const rightTypes: RightType[] = ["ACCESS", "RECTIFICATION", "SUPPRESSION", "OPPOSITION", "PORTABILITY", "BLOCKING"];
const transitions: Record<RequestStatus, RequestStatus[]> = {
  RECEIVED: ["VERIFYING", "DENIED"],
  VERIFYING: ["IN_PROGRESS", "DENIED"],
  IN_PROGRESS: ["COMPLETED", "DENIED"],
  COMPLETED: ["CLOSED"],
  DENIED: ["CLOSED"],
  CLOSED: [],
};

export default function DataRightsRequests() {
  const t = useTranslations("DataRightsRequestPage");
  const locale = useLocale();
  const { activeRole } = useActiveRole();
  const canManageQueue = activeRole === "SYSTEM_ADMIN" || activeRole === "PRIVACY_OFFICER";
  const [rightType, setRightType] = useState<RightType>("ACCESS");
  const [details, setDetails] = useState("");
  const [mine, setMine] = useState<DataRightsRequest[]>([]);
  const [queue, setQueue] = useState<RequestQueue | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [nextStatuses, setNextStatuses] = useState<Record<string, RequestStatus | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [queuePage, setQueuePage] = useState(1);
  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }),
    [locale],
  );
  const reloadData = useCallback(() => {
    setLoading(true);
    setReload((value) => value + 1);
  }, []);

  useEffect(() => {
    if (activeRole === null) return;
    let active = true;
    void Promise.all([
      apiFetch<DataRightsRequest[]>("/privacy/requests/mine"),
      canManageQueue ? apiFetch<RequestQueue>(`/privacy/requests/queue?page=${queuePage}&pageSize=20`) : Promise.resolve(null),
    ])
      .then(([ownRequests, adminQueue]) => {
        if (!active) return;
        setMine(ownRequests);
        setQueue(adminQueue);
      })
      .catch((error: unknown) => {
        if (active) toast.error(error instanceof Error ? error.message : t("errors.load"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [activeRole, canManageQueue, queuePage, reload, t]);

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const created = await apiFetch<DataRightsRequest>("/privacy/requests", {
        method: "POST",
        body: JSON.stringify({ rightType, ...(details.trim() ? { details: details.trim() } : {}) }),
      });
      toast.success(t("success.submitted", { reference: created.id }));
      setDetails("");
      reloadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.submit"));
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (request: DataRightsRequest) => {
    const status = nextStatuses[request.id];
    if (!status) return;
    const responseNote = notes[request.id]?.trim();
    if ((status === "COMPLETED" || status === "DENIED") && !responseNote) {
      toast.error(t("errors.responseRequired"));
      return;
    }
    setBusyId(request.id);
    try {
      await apiFetch<DataRightsRequest>(`/privacy/requests/${request.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, ...(responseNote ? { responseNote } : {}) }),
      });
      toast.success(t("success.updated"));
      setNotes((current) => ({ ...current, [request.id]: "" }));
      setNextStatuses((current) => ({ ...current, [request.id]: undefined }));
      reloadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.update"));
    } finally {
      setBusyId(null);
    }
  };

  const extendDeadline = async (request: DataRightsRequest) => {
    const note = notes[request.id]?.trim();
    if (!note) {
      toast.error(t("errors.extensionReasonRequired"));
      return;
    }
    setBusyId(request.id);
    try {
      await apiFetch<DataRightsRequest>(`/privacy/requests/${request.id}/extend-deadline`, {
        method: "PATCH",
        body: JSON.stringify({ note }),
      });
      toast.success(t("success.extended"));
      setNotes((current) => ({ ...current, [request.id]: "" }));
      reloadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.update"));
    } finally {
      setBusyId(null);
    }
  };

  if (activeRole === null) return <PageSkeleton label={t("loading")} />;

  return (
    <section className="space-y-8">
      <header className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("eyebrow")}</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{t("description")}</p>
      </header>

      <form onSubmit={submitRequest} className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[1fr_auto] sm:items-end sm:p-6">
        <label className="space-y-2 text-sm font-medium text-card-foreground" htmlFor="right-type">
          <span>{t("form.rightLabel")}</span>
          <select
            id="right-type"
            className="block min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            value={rightType}
            onChange={(event) => setRightType(event.target.value as RightType)}
          >
            {rightTypes.map((right) => (
              <option key={right} value={right}>{t(`rights.${right}`)}</option>
            ))}
          </select>
        </label>
        {rightType !== "ACCESS" && (
          <>
            <label className="space-y-2 text-sm font-medium text-card-foreground sm:col-span-2" htmlFor="request-details">
              <span>{t(`form.detailsLabel.${rightType}`)}</span>
              <textarea
                id="request-details"
                aria-describedby="request-details-hint"
                className="block min-h-28 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                maxLength={4000}
                onChange={(event) => setDetails(event.target.value)}
                required
                value={details}
              />
            </label>
            <p id="request-details-hint" className="text-xs font-normal leading-5 text-muted-foreground sm:col-span-2">{t("form.detailsHint")}</p>
            {rightType === "BLOCKING" && <p className="text-xs font-medium leading-5 text-muted-foreground sm:col-span-2">{t("form.blockingDeadline")}</p>}
          </>
        )}
        <button
          className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {t(submitting ? "form.submitting" : "form.submit")}
        </button>
        <p className="text-xs leading-5 text-muted-foreground sm:col-span-2">{t("form.noSensitiveDetails")}</p>
      </form>

      <section aria-labelledby="mine-heading" className="space-y-4">
        <h2 id="mine-heading" className="text-xl font-semibold text-foreground">{t("mine.title")}</h2>
        {loading ? <CardsSkeleton count={2} label={t("loading")} /> : mine.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">{t("mine.empty")}</p>
        ) : (
          <ul className="space-y-3">
            {mine.map((request) => (
              <li key={request.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-card-foreground">{t(`rights.${request.rightType}`)}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{t("mine.reference", { reference: request.id })}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t("mine.created", { date: dateFormat.format(new Date(request.createdAt)) })}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{request.rightType === "BLOCKING" ? t("mine.blockingDue", { date: dateFormat.format(new Date(request.dueAt)) }) : t("mine.due", { date: dateFormat.format(new Date(request.dueAt)) })}</p>
                    {request.extendedAt && <p className="mt-1 text-xs text-muted-foreground">{t("mine.extended")}</p>}
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">{t(`statuses.${request.status}`)}</span>
                </div>
                {request.responseNote && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{request.responseNote}</p>}
                {request.details && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{request.details}</p>}
                {request.extensionNote && <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("mine.extensionReason", { reason: request.extensionNote })}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManageQueue && (
        <section aria-labelledby="queue-heading" className="space-y-4">
          <h2 id="queue-heading" className="text-xl font-semibold text-foreground">{t("queue.title")}</h2>
          {loading ? <CardsSkeleton count={3} label={t("loading")} /> : !queue?.items.length ? (
            <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">{t("queue.empty")}</p>
          ) : (
            <ul className="space-y-3">
              {queue.items.map((request) => (
                <li key={request.id} className="space-y-4 rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-card-foreground">{request.subject?.name ?? t("queue.subjectRemoved")}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{request.subject?.email ?? t("queue.subjectRemoved")}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{t("queue.request", { right: t(`rights.${request.rightType}`), date: dateFormat.format(new Date(request.createdAt)) })}</p>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">{request.rightType === "BLOCKING" ? t("queue.blockingDue", { date: dateFormat.format(new Date(request.dueAt)) }) : t("queue.due", { date: dateFormat.format(new Date(request.dueAt)) })}</p>
                      {request.extendedAt && <p className="mt-1 text-xs text-muted-foreground">{t("queue.extended")}</p>}
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">{t(`statuses.${request.status}`)}</span>
                  </div>
                  {request.details && <p className="whitespace-pre-wrap rounded-xl bg-muted p-4 text-sm leading-6 text-foreground">{t("queue.details", { details: request.details })}</p>}
                  {request.responseNote && <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{request.responseNote}</p>}
                  {transitions[request.status].length > 0 && (
                    <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
                      <label className="space-y-2 text-xs font-medium text-muted-foreground" htmlFor={`status-${request.id}`}>
                        <span>{t("queue.nextStatus")}</span>
                        <select
                          id={`status-${request.id}`}
                          key={`${request.id}-${request.status}`}
                          className="block min-h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                          defaultValue=""
                          onChange={(event) => {
                            const value = event.target.value as RequestStatus;
                            setNextStatuses((current) => ({ ...current, [request.id]: value }));
                          }}
                          disabled={busyId === request.id}
                        >
                          <option value="" disabled>{t("queue.chooseStatus")}</option>
                          {transitions[request.status].map((status) => <option key={status} value={status}>{t(`statuses.${status}`)}</option>)}
                        </select>
                      </label>
                      <label className="space-y-2 text-xs font-medium text-muted-foreground" htmlFor={`response-${request.id}`}>
                        <span>{t("queue.responseOrExtensionLabel")}</span>
                        <textarea
                          id={`response-${request.id}`}
                          maxLength={2000}
                          className="block min-h-10 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                          value={notes[request.id] ?? ""}
                          onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))}
                        />
                      </label>
                      <div className="space-y-2 text-xs leading-5 text-muted-foreground">
                        <p>{t("queue.responseHint")}</p>
                        {nextStatuses[request.id] === "DENIED" && <p>{t("queue.denialHint")}</p>}
                        {request.rightType !== "BLOCKING" && ["RECEIVED", "VERIFYING", "IN_PROGRESS"].includes(request.status) && !request.extendedAt && (
                          <button
                            className="min-h-10 rounded-lg border border-border px-3 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={busyId === request.id}
                            onClick={() => void extendDeadline(request)}
                            type="button"
                          >
                            {t("queue.extendDeadline")}
                          </button>
                        )}
                      </div>
                      <button
                        className="min-h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:col-start-3"
                        disabled={busyId === request.id || !nextStatuses[request.id]}
                        onClick={() => void updateStatus(request)}
                        type="button"
                      >
                        {t(busyId === request.id ? "queue.saving" : "queue.save")}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!loading && queue && queue.totalPages > 1 && (
            <PaginationControls
              page={queue.page}
              totalPages={queue.totalPages}
              totalItems={queue.total}
              onPageChange={setQueuePage}
            />
          )}
        </section>
      )}
    </section>
  );
}
