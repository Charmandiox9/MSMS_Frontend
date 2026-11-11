"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { apiFetch } from "@/lib/api";
import { CardsSkeleton, PageSkeleton } from "@/components/ui/LoadingSkeletons";
import PaginationControls from "@/components/ui/PaginationControls";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import DataRightsStatusBadge from "@/components/dashboard/privacy/DataRightsStatusBadge";

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

type RequestView = "new" | "mine" | "queue";

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
  const [activeView, setActiveView] = useState<RequestView | null>(null);
  const [rightType, setRightType] = useState<RightType>("ACCESS");
  const [details, setDetails] = useState("");
  const [mine, setMine] = useState<DataRightsRequest[]>([]);
  const [queue, setQueue] = useState<RequestQueue | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [extensionReasons, setExtensionReasons] = useState<Record<string, string>>({});
  const [nextStatuses, setNextStatuses] = useState<Record<string, RequestStatus | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [queuePage, setQueuePage] = useState(1);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
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
        body: JSON.stringify({
          rightType,
          ...(rightType !== "ACCESS" && details.trim()
            ? { details: details.trim() }
            : {}),
        }),
      });
      toast.success(t("success.submitted", { reference: created.id }));
      setDetails("");
      setActiveView("mine");
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
    const note = extensionReasons[request.id]?.trim();
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
      setExtensionReasons((current) => ({ ...current, [request.id]: "" }));
      reloadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.update"));
    } finally {
      setBusyId(null);
    }
  };

  if (activeRole === null) return <PageSkeleton label={t("loading")} />;
  const selectedView = activeView ?? (canManageQueue ? "queue" : "new");
  const availableViews: RequestView[] = canManageQueue
    ? ["queue", "new", "mine"]
    : ["new", "mine"];
  const viewLabels: Record<RequestView, string> = {
    new: t("tabs.new"),
    mine: t("tabs.mine"),
    queue: t("tabs.queue"),
  };
  const focusView = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keyToIndex: Record<string, number> = {
      ArrowRight: (index + 1) % availableViews.length,
      ArrowLeft: (index - 1 + availableViews.length) % availableViews.length,
      Home: 0,
      End: availableViews.length - 1,
    };
    const nextIndex = keyToIndex[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    const nextView = availableViews[nextIndex];
    if (!nextView) return;
    setActiveView(nextView);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <section className="space-y-8">
      <DashboardPageHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("description")} />

      <div role="tablist" aria-label={t("tabs.label")} className="flex flex-wrap gap-2 border-b border-border">
        {availableViews.map((view, index) => (
          <button key={view} ref={(element) => { tabRefs.current[index] = element; }} tabIndex={selectedView === view ? 0 : -1} onKeyDown={(event) => focusView(event, index)} type="button" role="tab" aria-selected={selectedView === view} aria-controls={`requests-${view}-panel`} onClick={() => setActiveView(view)} className={`rounded-t-xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selectedView === view ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {viewLabels[view]}
          </button>
        ))}
      </div>

      {selectedView === "new" && (
      <section id="requests-new-panel" role="tabpanel" aria-label={t("tabs.new")} tabIndex={0} className="space-y-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-card-foreground">{t("form.panelTitle")}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{t("form.panelDescription")}</p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          {["choose", "describe", "track"].map((step, index) => (
            <li key={step} className="flex gap-3 rounded-xl bg-muted p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
              <span className="text-sm leading-5 text-foreground">{t(`form.steps.${step}`)}</span>
            </li>
          ))}
        </ol>
      </div>

      <form onSubmit={submitRequest} className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <label className="space-y-2 text-sm font-medium text-card-foreground" htmlFor="right-type">
          <span>{t("form.rightLabel")}</span>
          <select
            id="right-type"
            className="block min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            value={rightType}
            onChange={(event) => {
              setRightType(event.target.value as RightType);
              setDetails("");
            }}
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
        <p className="text-xs leading-5 text-muted-foreground">{t("form.noSensitiveDetails")}</p>
      </form>
      </section>
      )}

      {selectedView === "mine" && <section id="requests-mine-panel" role="tabpanel" aria-labelledby="mine-heading" tabIndex={0} className="space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <h2 id="mine-heading" className="text-xl font-semibold text-foreground">{t("mine.title")}</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{t("mine.description")}</p>
        {loading ? <CardsSkeleton count={2} label={t("loading")} /> : mine.length === 0 ? (
          <div className="space-y-4 rounded-2xl border border-dashed border-border bg-card p-8">
            <p className="text-sm text-muted-foreground">{t("mine.empty")}</p>
            <button type="button" onClick={() => setActiveView("new")} className="min-h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{t("mine.newRequest")}</button>
          </div>
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
                  <DataRightsStatusBadge status={request.status} />
                </div>
                {request.responseNote && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground"><span className="font-semibold text-foreground">{t("mine.response")}: </span>{request.responseNote}</p>}
                {request.details && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{t("mine.details", { details: request.details })}</p>}
                {request.extensionNote && <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("mine.extensionReason", { reason: request.extensionNote })}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>}

      {canManageQueue && selectedView === "queue" && (
        <section id="requests-queue-panel" role="tabpanel" aria-labelledby="queue-heading" tabIndex={0} className="space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <h2 id="queue-heading" className="text-xl font-semibold text-foreground">{t("queue.title")}</h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{t("queue.description")}</p>
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
                    <DataRightsStatusBadge status={request.status} />
                  </div>
                  {request.details && <p className="whitespace-pre-wrap rounded-xl bg-muted p-4 text-sm leading-6 text-foreground">{t("queue.details", { details: request.details })}</p>}
                  {request.responseNote && <p className="whitespace-pre-wrap rounded-xl border border-border bg-muted p-4 text-sm leading-6 text-foreground"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("queue.currentResponse")}</span>{request.responseNote}</p>}
                  {transitions[request.status].length > 0 && (
                    <div className="space-y-4 border-t border-border pt-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
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
                        <span>{t("queue.responseLabel")}</span>
                        <textarea
                          id={`response-${request.id}`}
                          aria-describedby={`response-hint-${request.id}`}
                          maxLength={2000}
                          className="block min-h-10 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                          value={notes[request.id] ?? ""}
                          onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))}
                        />
                      </label>
                      <button
                        className="min-h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:col-start-3"
                        disabled={busyId === request.id || !nextStatuses[request.id]}
                        onClick={() => void updateStatus(request)}
                        type="button"
                      >
                        {t(busyId === request.id ? "queue.saving" : "queue.save")}
                      </button>
                    </div>
                    <div className="space-y-2 text-xs leading-5 text-muted-foreground">
                      <p id={`response-hint-${request.id}`}>{t("queue.responseHint")}</p>
                      {nextStatuses[request.id] === "DENIED" && <p>{t("queue.denialHint")}</p>}
                    </div>
                    {request.rightType !== "BLOCKING" && ["RECEIVED", "VERIFYING", "IN_PROGRESS"].includes(request.status) && !request.extendedAt && (
                      <div className="grid gap-3 rounded-xl bg-muted p-4 sm:grid-cols-[1fr_auto] sm:items-end">
                        <label className="space-y-2 text-xs font-medium text-foreground" htmlFor={`extension-${request.id}`}>
                          <span>{t("queue.extensionReasonLabel")}</span>
                          <textarea
                            id={`extension-${request.id}`}
                            maxLength={1000}
                            className="block min-h-20 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                            value={extensionReasons[request.id] ?? ""}
                            onChange={(event) => setExtensionReasons((current) => ({ ...current, [request.id]: event.target.value }))}
                          />
                        </label>
                        <button
                          className="min-h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={busyId === request.id}
                          onClick={() => void extendDeadline(request)}
                          type="button"
                        >
                          {t("queue.extendDeadline")}
                        </button>
                      </div>
                    )}
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
