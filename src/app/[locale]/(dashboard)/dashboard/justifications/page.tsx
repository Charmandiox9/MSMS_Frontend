"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Clock3,
  Expand,
  FileText,
  Inbox,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { apiFetch } from "@/lib/api";
import {
  CardsSkeleton,
  MetricsSkeleton,
  PageSkeleton,
} from "@/components/ui/LoadingSkeletons";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import JustificationStatusBadge from "@/components/dashboard/justifications/JustificationStatusBadge";
import JustificationDetailModal from "@/components/dashboard/justifications/JustificationDetailModal";
import PaginationControls from "@/components/ui/PaginationControls";
import { useInboxAutoRefresh } from "./hooks/useInboxAutoRefresh";
import type {
  Justification,
  JustificationInboxEntry,
  JustificationReasonCategory,
  JustificationStatus,
} from "@/types/justifications";

const STATUS_ORDER: JustificationStatus[] = ["PENDING", "ACCEPTED", "REJECTED"];
const PAGE_SIZE = 5;

function formatDate(value: string): string {
  try {
    const [y, m, d] = value.slice(0, 10).split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const formatted = new Intl.DateTimeFormat("es-CL", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return value;
  }
}

export default function JustificationsPage() {
  const t = useTranslations("JustificationsPage");
  const { activeRole } = useActiveRole();

  const [inbox, setInbox] = useState<JustificationInboxEntry[]>([]);
  const [history, setHistory] = useState<Justification[]>([]);
  const [filter, setFilter] = useState<"ALL" | JustificationStatus>("ALL");
  const [incomingPage, setIncomingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [selected, setSelected] = useState<Justification | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const inboxRevision = useRef(0);
  const [expandedPanel, setExpandedPanel] = useState<
    "incoming" | "history" | null
  >(null);

  const canReview = activeRole === "TEACHING_SUPPORT_COORDINATOR";
  const loadErrorMessage = t("errors.load");

  useEffect(() => {
    if (!canReview) return;
    let active = true;
    Promise.all([
      apiFetch<JustificationInboxEntry[]>("/justifications/inbox"),
      apiFetch<Justification[]>("/justifications"),
    ])
      .then(([incoming, processed]) => {
        if (!active) return;
        setInbox(incoming);
        setHistory(processed);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const message =
          cause instanceof Error ? cause.message : loadErrorMessage;
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [canReview, loadErrorMessage]);

  const receiveIncoming = useCallback((incoming: JustificationInboxEntry[]) => {
    setInbox(incoming);
    setIncomingPage((page) =>
      Math.min(page, Math.max(1, Math.ceil(incoming.length / PAGE_SIZE))),
    );
  }, []);
  const inboxRefreshError = useInboxAutoRefresh({
    enabled: canReview && !loading,
    revision: inboxRevision,
    onRefresh: receiveIncoming,
  });

  const filteredHistory = useMemo(() => {
    return filter === "ALL"
      ? history
      : history.filter((item) => item.status === filter);
  }, [filter, history]);

  const incomingPages = Math.max(1, Math.ceil(inbox.length / PAGE_SIZE));
  const historyPages = Math.max(
    1,
    Math.ceil(filteredHistory.length / PAGE_SIZE),
  );
  const currentIncomingPage = Math.min(incomingPage, incomingPages);
  const currentHistoryPage = Math.min(historyPage, historyPages);
  const visibleInbox = inbox.slice(
    (currentIncomingPage - 1) * PAGE_SIZE,
    currentIncomingPage * PAGE_SIZE,
  );
  const visibleHistory = filteredHistory.slice(
    (currentHistoryPage - 1) * PAGE_SIZE,
    currentHistoryPage * PAGE_SIZE,
  );

  const openIncoming = async (entry: JustificationInboxEntry) => {
    setActionError(null);
    try {
      const justification = await apiFetch<Justification>(
        `/justifications/inbox/${entry.id}/open`,
        { method: "POST" },
      );
      inboxRevision.current += 1;
      setInbox((items) => items.filter((item) => item.id !== entry.id));
      setIncomingPage((page) =>
        Math.min(page, Math.max(1, Math.ceil((inbox.length - 1) / PAGE_SIZE))),
      );
      setHistoryPage(1);
      setHistory((items) => [
        justification,
        ...items.filter((item) => item.id !== justification.id),
      ]);
      setSelected(justification);
      toast.info(t("notifications.entered"));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t("errors.open");
      setActionError(message);
      toast.error(message);
    }
  };

  const handleDecision = async (
    status: Exclude<JustificationStatus, "PENDING">,
    category: JustificationReasonCategory,
    rejectionReason?: string,
  ) => {
    if (!selected) {
      return;
    }
    setActionError(null);
    setIsProcessing(true);
    try {
      const updated = await apiFetch<Justification>(
        `/justifications/${selected.id}/decision`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
            rejectionReason:
              status === "REJECTED" ? rejectionReason : undefined,
            reasonCategory: category,
          }),
        },
      );
      setHistory((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
      const removedFromFilter =
        filter !== "ALL" &&
        selected.status === filter &&
        updated.status !== filter;
      setHistoryPage((page) =>
        Math.min(
          page,
          Math.max(
            1,
            Math.ceil(
              (filteredHistory.length - Number(removedFromFilter)) / PAGE_SIZE,
            ),
          ),
        ),
      );
      setSelected(null);
      toast.success(
        status === "ACCEPTED"
          ? t("notifications.accepted")
          : t("notifications.rejected"),
      );
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : t("errors.decision");
      setActionError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const openEvidence = async (id: string) => {
    try {
      const result = await apiFetch<{ downloadUrl: string }>(
        `/justifications/${id}/evidence-url`,
      );
      window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : t("errors.evidence");
      setActionError(message);
      toast.error(message);
    }
  };

  if (activeRole === null) {
    return <PageSkeleton label={t("loading")} />;
  }

  if (activeRole !== "TEACHING_SUPPORT_COORDINATOR") {
    return (
      <div className="py-20 text-center text-sm font-medium text-muted-foreground">
        {t("errors.access")}
      </div>
    );
  }

  const incomingContent = loading ? (
    <CardsSkeleton label={t("loading")} />
  ) : inbox.length === 0 ? (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
      <Inbox className="mb-3 h-6 w-6 text-muted-foreground" />
      <span>{t("incoming.empty")}</span>
    </div>
  ) : (
    <div className="space-y-3">
      {visibleInbox.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => void openIncoming(entry)}
          className="w-full rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-foreground">
                {entry.subjectName}
                {entry.nrc ? ` · NRC ${entry.nrc}` : ""}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span>{entry.studentEmail}</span>
                <span>·</span>
                <span>{formatDate(entry.absenceDate)}</span>
                {entry.blocks && entry.blocks.length > 0 && (
                  <>
                    <span>·</span>
                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-bold text-primary">
                      Bloque {entry.blocks.join(", ")}
                    </span>
                  </>
                )}
              </p>
            </div>
            <JustificationStatusBadge status="UNREAD" size="sm" />
          </div>
          <p className="mt-3 text-xs font-medium text-primary">
            {t("incoming.openHint")}
          </p>
        </button>
      ))}
    </div>
  );

  const historyContent = (
    <>
      <div className="mb-4 flex shrink-0 flex-wrap gap-2">
        {["ALL", ...STATUS_ORDER].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setFilter(value as "ALL" | JustificationStatus);
              setHistoryPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              filter === value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {value === "ALL"
              ? t("filters.all")
              : t(`statuses.${value.toLowerCase()}` as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      {loading ? (
        <CardsSkeleton label={t("loading")} />
      ) : filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          <FileText className="mb-3 h-6 w-6 text-muted-foreground" />
          <span>{t("history.empty")}</span>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleHistory.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelected(item);
                setActionError(null);
              }}
              className="w-full rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-muted/40 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-foreground">
                    {item.subjectName}
                    {item.nrc ? ` · NRC ${item.nrc}` : ""}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{item.studentEmail}</span>
                    <span>·</span>
                    <span>{formatDate(item.absenceDate)}</span>
                    {item.blocks && item.blocks.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-bold text-primary">
                          Bloque {item.blocks.join(", ")}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <JustificationStatusBadge status={item.status} size="sm" />
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {actionError && (
        <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm font-semibold text-accent">
          {actionError}
        </div>
      )}

      {loading ? (
        <MetricsSkeleton
          count={3}
          compact
          className="grid gap-4 md:grid-cols-3"
          label={t("loading")}
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon={Inbox}
            label={t("stats.incoming")}
            value={inbox.length}
            tone="cyan"
          />
          <SummaryCard
            icon={Clock3}
            label={t("stats.pending")}
            value={history.filter((item) => item.status === "PENDING").length}
            tone="amber"
          />
          <SummaryCard
            icon={Check}
            label={t("stats.resolved")}
            value={history.filter((item) => item.status !== "PENDING").length}
            tone="green"
          />
        </section>
      )}

      {inboxRefreshError && (
        <p
          role="status"
          className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground"
        >
          {t("incoming.refreshError")}
        </p>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel
          title={t("incoming.title")}
          subtitle={`${t("incoming.subtitle")} ${t("incoming.autoRefresh")}`}
          expandLabel={t("expand")}
          onExpand={() => setExpandedPanel("incoming")}
          footer={
            !loading &&
            incomingPages > 1 && (
              <PaginationControls
                page={currentIncomingPage}
                totalPages={incomingPages}
                totalItems={inbox.length}
                onPageChange={setIncomingPage}
              />
            )
          }
        >
          {incomingContent}
        </Panel>

        <Panel
          title={t("history.title")}
          subtitle={t("history.subtitle")}
          expandLabel={t("expand")}
          onExpand={() => setExpandedPanel("history")}
          footer={
            !loading &&
            historyPages > 1 && (
              <PaginationControls
                page={currentHistoryPage}
                totalPages={historyPages}
                totalItems={filteredHistory.length}
                onPageChange={setHistoryPage}
              />
            )
          }
        >
          {historyContent}
        </Panel>
      </section>

      {expandedPanel && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-5xl">
            <Panel
              title={
                expandedPanel === "incoming"
                  ? t("incoming.title")
                  : t("history.title")
              }
              subtitle={
                expandedPanel === "incoming"
                  ? `${t("incoming.subtitle")} ${t("incoming.autoRefresh")}`
                  : t("history.subtitle")
              }
              expanded
              closeLabel={t("detail.close")}
              onClose={() => setExpandedPanel(null)}
              footer={
                !loading &&
                (expandedPanel === "incoming" ? incomingPages : historyPages) >
                  1 && (
                  <PaginationControls
                    page={
                      expandedPanel === "incoming"
                        ? currentIncomingPage
                        : currentHistoryPage
                    }
                    totalPages={
                      expandedPanel === "incoming"
                        ? incomingPages
                        : historyPages
                    }
                    totalItems={
                      expandedPanel === "incoming"
                        ? inbox.length
                        : filteredHistory.length
                    }
                    onPageChange={
                      expandedPanel === "incoming"
                        ? setIncomingPage
                        : setHistoryPage
                    }
                  />
                )
              }
            >
              {expandedPanel === "incoming" ? incomingContent : historyContent}
            </Panel>
          </div>
        </div>
      )}

      <JustificationDetailModal
        item={selected}
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        onEvidence={openEvidence}
        mode="decision"
        onDecision={handleDecision}
        isProcessing={isProcessing}
      />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: "cyan" | "amber" | "green";
}) {
  const toneClasses = {
    cyan: "bg-ocean-cyan/15 text-ocean-cyan",
    amber: "bg-accent/15 text-accent",
    green: "bg-secondary/15 text-secondary",
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${toneClasses[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-black text-foreground">{value}</p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  footer,
  expanded = false,
  expandLabel,
  closeLabel,
  onExpand,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  expanded?: boolean;
  expandLabel?: string;
  closeLabel?: string;
  onExpand?: () => void;
  onClose?: () => void;
}) {
  return (
    <section
      className={`flex flex-col rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6 ${
        expanded ? "h-[min(85vh,54rem)]" : "min-h-[28rem]"
      }`}
    >
      <div className="mb-5 flex shrink-0 items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            aria-label={expandLabel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-primary/50 hover:bg-muted hover:text-foreground"
          >
            <Expand className="h-4 w-4" />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-primary/50 hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div
        data-lenis-prevent
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
      >
        {children}
      </div>
      {footer && (
        <div className="mt-4 shrink-0 border-t border-border pt-4">
          {footer}
        </div>
      )}
    </section>
  );
}
