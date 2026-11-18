"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  Plus,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActiveRole } from "@/context/ActiveRoleContext";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PaginationControls from "@/components/ui/PaginationControls";
import SearchField from "@/components/ui/SearchField";
import SearchHighlight from "@/components/ui/SearchHighlight";
import { TableSkeleton } from "@/components/ui/LoadingSkeletons";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { apiFetch } from "@/lib/api";
import {
  academicPrimaryActionClass,
  academicSecondaryActionClass,
} from "@/components/dashboard/academic/academicActionStyles";
import TitulationProcessForm from "./TitulationProcessForm";
import TitulationDocumentDrafts from "./TitulationDocumentDrafts";
import TitulationAttachments from "./TitulationAttachments";
import TitulationStageBadge from "./TitulationStageBadge";
import type {
  TitulationDocumentStatus,
  TitulationListItem,
  TitulationPageResult,
  TitulationProcess,
  TitulationStage,
} from "./titulation-types";

const PAGE_SIZE = 10;
const STAGES: readonly TitulationStage[] = [
  "UNCLASSIFIED",
  "INTAKE",
  "REVIEW",
  "DEFENSE",
  "CLOSED",
];
const DOCUMENT_FIELDS = [
  ["defenseAnnexesStatus", "defenseAnnexes"],
  ["thesisSummaryStatus", "thesisSummary"],
  ["libraryFormStatus", "libraryForm"],
  ["actaStatus", "acta"],
  ["evaluationsStatus", "evaluations"],
] as const satisfies readonly [
  keyof TitulationListItem,
  "defenseAnnexes" | "thesisSummary" | "libraryForm" | "acta" | "evaluations",
][];

function getInitialQuery(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return new URLSearchParams(window.location.search).get(key) ?? fallback;
}

function getInitialPage(): number {
  const value = Number(getInitialQuery("page", "1"));
  return Number.isSafeInteger(value) && value > 0 ? value : 1;
}

function formatDate(value: string | null, locale: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function buildListBody(page: number, search: string, stage: string) {
  return JSON.stringify({
    page,
    pageSize: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(stage !== "ALL" ? { stage } : {}),
  });
}

function FieldValue({
  label,
  value,
  missingValue,
  query = "",
}: {
  label: string;
  value: string | null;
  missingValue: string;
  query?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-background p-3">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm leading-relaxed text-foreground">
        {value ? <SearchHighlight text={value} query={query} /> : missingValue}
      </dd>
    </div>
  );
}

export default function TitulationWorkspace() {
  const t = useTranslations("TitulationPage");
  const locale = useLocale();
  const { activeRole } = useActiveRole();
  const canManage =
    activeRole === "SYSTEM_ADMIN" ||
    activeRole === "ACADEMIC_SECRETARY" ||
    activeRole === "TEACHING_SUPPORT_COORDINATOR";
  const [page, setPage] = useState(getInitialPage);
  const resetPage = useCallback(() => setPage(1), []);
  const { input: searchInput, query: search, isWaiting, change: changeSearch, reset: resetSearch } =
    useSearchQuery(resetPage);
  const [stage, setStage] = useState(() => {
    const initial = getInitialQuery("stage", "ALL");
    return initial === "ALL" || STAGES.includes(initial as TitulationStage)
      ? initial
      : "ALL";
  });
  const [result, setResult] = useState<TitulationPageResult | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadedDetail, setLoadedDetail] = useState<{
    key: string;
    process: TitulationProcess;
  } | null>(null);
  const [detailErrorKey, setDetailErrorKey] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<TitulationProcess | null>(null);
  const requestKey = `${page}|${search}|${stage}|${refreshKey}`;
  const [completedRequestKey, setCompletedRequestKey] = useState<string | null>(null);
  const [loadErrorKey, setLoadErrorKey] = useState<string | null>(null);
  const selectedDetailKey = selectedId ? `${selectedId}|${refreshKey}` : "";
  const selectedProcess =
    loadedDetail?.key === selectedDetailKey ? loadedDetail.process : null;
  const loading = completedRequestKey !== requestKey;
  const loadError = loadErrorKey === requestKey;
  const detailLoading =
    Boolean(selectedId) &&
    loadedDetail?.key !== selectedDetailKey &&
    detailErrorKey !== selectedDetailKey;
  const detailError = Boolean(selectedId) && detailErrorKey === selectedDetailKey;

  function displayDefenseDate({ defenseDate, source, stage }: TitulationListItem) {
    const historical = source === "LEGACY_ACCESS" || stage === "CLOSED";
    return formatDate(
      defenseDate,
      locale,
      t(historical ? "defenseDateUnrecorded" : "defenseDatePending"),
    );
  }

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    if (stage !== "ALL") url.searchParams.set("stage", stage);
    else url.searchParams.delete("stage");
    if (page > 1) url.searchParams.set("page", String(page));
    else url.searchParams.delete("page");
    window.history.replaceState(window.history.state, "", url);
  }, [page, stage]);

  useEffect(() => {
    const onPopState = () => {
      const nextStage = getInitialQuery("stage", "ALL");
      const nextPage = getInitialPage();
      resetSearch();
      setStage(
        nextStage === "ALL" || STAGES.includes(nextStage as TitulationStage)
          ? nextStage
          : "ALL",
      );
      setPage(nextPage);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [resetSearch]);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch<TitulationPageResult>("/academic/titulations/search", {
      method: "POST",
      body: buildListBody(page, search, stage),
      cache: "no-store",
      signal: controller.signal,
    })
      .then((nextResult) => {
        if (controller.signal.aborted) return;

        const lastPage = Math.max(1, nextResult.totalPages);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }

        setResult(nextResult);
        setLoadErrorKey(null);
        setCompletedRequestKey(requestKey);
        setSelectedId((current) =>
          current && nextResult.items.some((item) => item.id === current)
            ? current
            : (nextResult.items[0]?.id ?? null),
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadErrorKey(requestKey);
          setCompletedRequestKey(requestKey);
        }
      });
    return () => controller.abort();
  }, [page, requestKey, search, stage]);

  useEffect(() => {
    if (!selectedId) return;

    const controller = new AbortController();
    apiFetch<TitulationProcess>(
      `/academic/titulations/${encodeURIComponent(selectedId)}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then((process) => {
        if (controller.signal.aborted) return;

        setLoadedDetail({ key: selectedDetailKey, process });
        setDetailErrorKey(null);
      })
      .catch(() => {
        if (!controller.signal.aborted) setDetailErrorKey(selectedDetailKey);
      });
    return () => controller.abort();
  }, [selectedDetailKey, selectedId]);

  const selectedSummary = useMemo(
    () => result?.items.find((item) => item.id === selectedId) ?? null,
    [result?.items, selectedId],
  );

  const retryList = useCallback(() => setRefreshKey((value) => value + 1), []);

  const handleSaved = (saved: TitulationProcess) => {
    setFormOpen(false);
    setEditingProcess(null);
    resetSearch();
    setStage("ALL");
    setPage(1);
    setSelectedId(saved.id);
    setRefreshKey((value) => value + 1);
  };

  const openCreate = () => {
    setEditingProcess(null);
    setFormOpen(true);
  };

  const openEdit = () => {
    if (!selectedProcess) return;
    setEditingProcess(selectedProcess);
    setFormOpen(true);
  };

  const items = result?.items ?? [];
  const totalPages = Math.max(1, result?.totalPages ?? 1);
  const displayedPage = result?.page ?? page;
  const offset = (displayedPage - 1) * PAGE_SIZE;
  const summary = t("pagination.summary", {
    first: offset + 1,
    last: offset + items.length,
    total: result?.total ?? 0,
  });

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          canManage ? (
            <button type="button" onClick={openCreate} className={academicPrimaryActionClass}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("createProcess")}
            </button>
          ) : undefined
        }
      />

      <section
        aria-label={t("filters.title")}
        className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_15rem] md:items-start"
      >
        <SearchField
          label={t("searchLabel")}
          value={searchInput}
          onChange={changeSearch}
          placeholder={t("searchPlaceholder")}
          help={t("searchHelp")}
          maxLength={100}
          pending={isWaiting || (Boolean(search) && loading)}
        />
        <label className="block min-w-0 text-sm font-semibold text-foreground">
          {t("stageFilterLabel")}
          <select
            value={stage}
            onChange={(event) => {
              setStage(event.target.value);
              setPage(1);
            }}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-base font-normal text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <option value="ALL">{t("allStages")}</option>
            {STAGES.map((value) => (
              <option key={value} value={value}>
                {t(`statuses.${value}`)}
              </option>
            ))}
          </select>
        </label>
      </section>

      {loadError ? (
        <section
          role="alert"
          className="flex flex-col gap-4 rounded-2xl border border-danger/30 bg-danger/10 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm leading-relaxed text-foreground">{t("errors.load")}</p>
          <button type="button" onClick={retryList} className={academicSecondaryActionClass}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("retry")}
          </button>
        </section>
      ) : loading && !result?.total ? (
        <TableSkeleton rows={4} columns={4} label={t("loading" )} />
      ) : result && result.total === 0 ? (
        <section className="rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">{t("empty.title")}</h2>
          <p className="mx-auto mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {search || stage !== "ALL" ? t("empty.noMatches") : t("empty.description")}
          </p>
        </section>
      ) : (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
          <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="space-y-2 border-b border-border bg-muted/20 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">{t("casesTitle")}</h2>
                <button
                  type="button"
                  onClick={retryList}
                  aria-label={t("refresh")}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <nav aria-label={t("pagination.label")}>
                <PaginationControls
                  page={displayedPage}
                  totalPages={totalPages}
                  summary={<span role="status">{loading ? t("loading") : summary}</span>}
                  onPageChange={setPage}
                  className="[&_button]:min-h-11 [&_button]:min-w-11"
                  showSinglePage
                />
              </nav>
            </div>
            <ul className="divide-y divide-border" aria-label={t("casesTitle")} aria-busy={loading}>
              {items.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={t("selectCase", { id: item.reference, students: item.studentName })}
                      onClick={() => setSelectedId(item.id)}
                      className={`grid w-full gap-3 px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${
                        isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                      }`}
                    >
                      <span className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                          <UserRound className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-semibold text-foreground"><SearchHighlight text={item.studentName} query={search} /></span>
                            <span className="text-xs font-medium text-muted-foreground"><SearchHighlight text={item.reference} query={search} /></span>
                          </span>
                          <span className="mt-1 block line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {item.thesisTopic ? <SearchHighlight text={item.thesisTopic} query={search} /> : t("missingValue")}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            <SearchHighlight text={item.careerName} query={search} /> · {item.degree || t("missingValue")}
                          </span>
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <TitulationStageBadge stage={item.stage} label={t(`statuses.${item.stage}`)} />
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                          {displayDefenseDate(item)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <aside
            aria-labelledby="titulation-detail-title"
            className="min-w-0 rounded-2xl border border-border bg-card shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t("detail.eyebrow")}</p>
                <h2 id="titulation-detail-title" className="mt-1 text-lg font-semibold text-foreground">
                  {t("detail.title")}
                </h2>
                {selectedSummary && (
                  <p className="mt-1 break-all text-sm text-muted-foreground">{selectedSummary.reference}</p>
                )}
              </div>
              {canManage && selectedProcess && (
                <button type="button" onClick={openEdit} className={academicSecondaryActionClass}>
                  {t("editProcess")}
                </button>
              )}
            </div>
            <div className="space-y-5 p-5">
              {detailLoading ? (
                <div role="status" aria-label={t("detail.loading")} aria-busy="true" className="space-y-3">
                  <div className="h-12 animate-pulse rounded-xl bg-muted" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="h-16 animate-pulse rounded-xl bg-muted" />
                    <div className="h-16 animate-pulse rounded-xl bg-muted" />
                    <div className="h-16 animate-pulse rounded-xl bg-muted" />
                    <div className="h-16 animate-pulse rounded-xl bg-muted" />
                  </div>
                </div>
              ) : detailError ? (
                <div role="alert" className="space-y-3">
                  <p className="text-sm leading-relaxed text-muted-foreground">{t("detail.error")}</p>
                  <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className={academicSecondaryActionClass}>
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {t("retry")}
                  </button>
                </div>
              ) : selectedProcess ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-foreground"><SearchHighlight text={selectedProcess.studentName} query={search} /></p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {t(`sources.${selectedProcess.source}`)}
                      </span>
                      <TitulationStageBadge
                        stage={selectedProcess.stage}
                        label={t(`statuses.${selectedProcess.stage}`)}
                      />
                    </div>
                  </div>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <FieldValue label={t("form.studentRut")} value={selectedProcess.studentRut} missingValue={t("missingValue")} query={search} />
                    <FieldValue label={t("form.studentEmail")} value={selectedProcess.studentEmail} missingValue={t("missingValue")} query={search} />
                    <FieldValue label={t("form.studentPhone")} value={selectedProcess.studentPhone} missingValue={t("missingValue")} />
                    <FieldValue label={t("form.career")} value={selectedProcess.careerName} missingValue={t("missingValue")} query={search} />
                    <FieldValue label={t("form.degree")} value={selectedProcess.degree} missingValue={t("missingValue")} />
                    <FieldValue label={t("form.defenseDate")} value={displayDefenseDate(selectedProcess)} missingValue={t("missingValue")} />
                    <div className="rounded-xl border border-border bg-background p-3 sm:col-span-2">
                      <dt className="text-xs font-semibold text-muted-foreground">{t("form.thesisTopic")}</dt>
                      <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{selectedProcess.thesisTopic ? <SearchHighlight text={selectedProcess.thesisTopic} query={search} /> : t("missingValue")}</dd>
                    </div>
                  </dl>
                  <section aria-labelledby="titulation-committee-title">
                    <h3 id="titulation-committee-title" className="text-sm font-semibold text-foreground">{t("committeeTitle")}</h3>
                    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                      <FieldValue label={t("committeeRoles.guide")} value={selectedProcess.guideName} missingValue={t("missingValue")} query={search} />
                      <FieldValue label={t("committeeRoles.coGuide")} value={selectedProcess.coGuideName} missingValue={t("missingValue")} query={search} />
                      <FieldValue label={t("committeeRoles.reviewerOne")} value={selectedProcess.reviewerOneName} missingValue={t("missingValue")} query={search} />
                      <FieldValue label={t("committeeRoles.reviewerTwo")} value={selectedProcess.reviewerTwoName} missingValue={t("missingValue")} query={search} />
                    </dl>
                  </section>
                  <section aria-labelledby="titulation-documents-title">
                    <h3 id="titulation-documents-title" className="text-sm font-semibold text-foreground">{t("documentsTitle")}</h3>
                    <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
                      {DOCUMENT_FIELDS.map(([field, document]) => {
                        const status = selectedProcess[field] as TitulationDocumentStatus;
                        return (
                          <li key={field} className="flex min-h-11 items-center justify-between gap-3 px-3 py-2">
                            <span className="min-w-0 text-sm text-foreground">{t(`documents.${document}`)}</span>
                            <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                              {t(`documentStatus.${status}`)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("documentsManualNote")}</p>
                  </section>
                  {canManage && (
                    <TitulationAttachments
                      key={`${selectedProcess.id}-attachments`}
                      processId={selectedProcess.id}
                    />
                  )}
                  {canManage && (
                    <TitulationDocumentDrafts
                      key={`${selectedProcess.id}-drafts`}
                      processId={selectedProcess.id}
                      reference={selectedProcess.reference}
                      drafts={selectedProcess.documentDrafts ?? []}
                    />
                  )}
                </>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">{t("selectCasePrompt")}</p>
              )}
            </div>
          </aside>
        </section>
      )}

      {formOpen && (
        <TitulationProcessForm
          process={editingProcess}
          onClose={() => {
            setFormOpen(false);
            setEditingProcess(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
