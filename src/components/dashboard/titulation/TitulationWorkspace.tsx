"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEventHandler, ReactNode } from "react";
import {
  CalendarDays,
  FileText,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActiveRole } from "@/context/ActiveRoleContext";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PaginationControls from "@/components/ui/PaginationControls";
import Modal from "@/components/ui/Modal";
import SearchField from "@/components/ui/SearchField";
import SearchHighlight from "@/components/ui/SearchHighlight";
import FilterTabs from "@/components/ui/FilterTabs";
import {
  SkeletonStatus,
  TableSkeleton,
} from "@/components/ui/LoadingSkeletons";
import Skeleton from "@/components/ui/Skeleton";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { apiFetch } from "@/lib/api";
import {
  academicPrimaryActionClass,
  academicSecondaryActionClass,
} from "@/components/dashboard/academic/academicActionStyles";
import TitulationProcessForm from "./TitulationProcessForm";
import TitulationRecordDetails from "./TitulationRecordDetails";
import TitulationOutcomeBadge from "./TitulationOutcomeBadge";
import type {
  TitulationListItem,
  TitulationFilterOptions,
  TitulationPageResult,
  TitulationProcess,
  TitulationStage,
  TitulationView,
  TitulationOutcome,
} from "./titulation-types";

const PAGE_SIZE = 10;
const VIEWS: readonly TitulationView[] = [
  "REVIEW",
  "ACTIVE",
  "GRADUATED",
  "ALL",
];
const OUTCOMES: readonly TitulationOutcome[] = [
  "UNCONFIRMED",
  "IN_PROGRESS",
  "GRADUATED",
  "NOT_GRADUATED",
];
const STAGES: readonly TitulationStage[] = [
  "UNCLASSIFIED",
  "INTAKE",
  "REVIEW",
  "DEFENSE",
  "CLOSED",
];
const PERIOD_PATTERN = /^[1-9][0-9]{3}-S[12]$/;
const CAREER_ID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
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

function buildListBody(
  page: number,
  search: string,
  stage: string,
  careerId: string,
  period: string,
  view: TitulationView,
  outcome: string,
) {
  return JSON.stringify({
    page,
    pageSize: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(stage !== "ALL" ? { stage } : {}),
    ...(careerId !== "ALL" ? { careerId } : {}),
    ...(period !== "ALL" ? { period } : {}),
    ...(view !== "ALL" ? { view } : {}),
    ...(outcome !== "ALL" ? { outcome } : {}),
  });
}

function isTitulationFilterOptions(
  value: unknown,
): value is TitulationFilterOptions {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;

  const options = value as Partial<TitulationFilterOptions>;
  return (
    Array.isArray(options.periods) &&
    options.periods.every(
      (period) => typeof period === "string" && PERIOD_PATTERN.test(period),
    ) &&
    Array.isArray(options.careers) &&
    options.careers.every(
      (career) =>
        typeof career === "object" &&
        career !== null &&
        typeof career.id === "string" &&
        CAREER_ID_PATTERN.test(career.id) &&
        typeof career.name === "string" &&
        career.name.length > 0,
    ) &&
    typeof options.hasUndated === "boolean" &&
    typeof options.counts === "object" &&
    options.counts !== null &&
    VIEWS.every(
      (view) =>
        Number.isSafeInteger(options.counts?.[view]) &&
        (options.counts?.[view] ?? -1) >= 0,
    )
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  disabled = false,
  descriptionId,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  disabled?: boolean;
  descriptionId?: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="block min-w-0 text-sm font-semibold text-foreground"
    >
      {label}
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-describedby={descriptionId}
        className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-base font-normal text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </select>
    </label>
  );
}

function FilterFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-11 w-full rounded-xl" />
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
  const [view, setView] = useState<TitulationView>(() => {
    const initial = getInitialQuery("view", "ALL") as TitulationView;
    return VIEWS.includes(initial) ? initial : "ALL";
  });
  const [outcome, setOutcome] = useState(() => {
    const initial = getInitialQuery("outcome", "ALL");
    return OUTCOMES.includes(initial as TitulationOutcome) ? initial : "ALL";
  });
  const resetPage = useCallback(() => setPage(1), []);
  const {
    input: searchInput,
    query: search,
    isWaiting,
    change: changeSearch,
    reset: resetSearch,
  } = useSearchQuery(resetPage);
  const [stage, setStage] = useState(() => {
    const initial = getInitialQuery("stage", "ALL");
    return initial === "ALL" || STAGES.includes(initial as TitulationStage)
      ? initial
      : "ALL";
  });
  const [careerId, setCareerId] = useState(() => {
    const initial = getInitialQuery("careerId", "ALL");
    return initial === "ALL" || CAREER_ID_PATTERN.test(initial)
      ? initial
      : "ALL";
  });
  const [period, setPeriod] = useState(() => {
    const initial = getInitialQuery("period", "ALL");
    return initial === "ALL" ||
      initial === "UNRECORDED" ||
      PERIOD_PATTERN.test(initial)
      ? initial
      : "ALL";
  });
  const [filterOptions, setFilterOptions] =
    useState<TitulationFilterOptions | null>(null);
  const [filterOptionsError, setFilterOptionsError] = useState(false);
  const [filterOptionsRetry, setFilterOptionsRetry] = useState(0);
  const [result, setResult] = useState<TitulationPageResult | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [linkedProcessId] = useState(() => {
    const initial = getInitialQuery("processId", "");
    return CAREER_ID_PATTERN.test(initial) ? initial : null;
  });
  const [selectedId, setSelectedId] = useState<string | null>(linkedProcessId);
  const [loadedDetail, setLoadedDetail] = useState<{
    key: string;
    process: TitulationProcess;
  } | null>(null);
  const [detailErrorKey, setDetailErrorKey] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [deletingProcess, setDeletingProcess] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [editingProcess, setEditingProcess] =
    useState<TitulationProcess | null>(null);
  const filterCareerId =
    filterOptions &&
    careerId !== "ALL" &&
    !filterOptions.careers.some((career) => career.id === careerId)
      ? "ALL"
      : careerId;
  const filterPeriod =
    filterOptions &&
    ((period === "UNRECORDED" && !filterOptions.hasUndated) ||
      (period !== "ALL" &&
        period !== "UNRECORDED" &&
        !filterOptions.periods.includes(period)))
      ? "ALL"
      : period;
  const requestKey = `${view}|${outcome}|${page}|${search}|${stage}|${filterCareerId}|${filterPeriod}|${refreshKey}`;
  const [completedRequestKey, setCompletedRequestKey] = useState<string | null>(
    null,
  );
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
  const detailError =
    Boolean(selectedId) && detailErrorKey === selectedDetailKey;
  const filterOptionsLoading = filterOptions === null && !filterOptionsError;

  function displayDefenseDate({
    defenseDate,
    source,
    stage,
  }: TitulationListItem) {
    const historical = source === "LEGACY_ACCESS" || stage === "CLOSED";
    return formatDate(
      defenseDate,
      locale,
      t(historical ? "defenseDateUnrecorded" : "defenseDatePending"),
    );
  }

  function refreshSelectedProcess() {
    if (!selectedId) return;

    const detailKey = `${selectedId}|${refreshKey}`;
    void apiFetch<TitulationProcess>(
      `/academic/titulations/${encodeURIComponent(selectedId)}`,
      { cache: "no-store" },
    )
      .then((process) => {
        setLoadedDetail({ key: detailKey, process });
        setDetailErrorKey(null);
      })
      .catch(() => setDetailErrorKey(detailKey));
  }

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    if (view !== "ALL") url.searchParams.set("view", view);
    else url.searchParams.delete("view");
    if (outcome !== "ALL") url.searchParams.set("outcome", outcome);
    else url.searchParams.delete("outcome");
    if (stage !== "ALL") url.searchParams.set("stage", stage);
    else url.searchParams.delete("stage");
    if (page > 1) url.searchParams.set("page", String(page));
    else url.searchParams.delete("page");
    if (filterCareerId !== "ALL")
      url.searchParams.set("careerId", filterCareerId);
    else url.searchParams.delete("careerId");
    if (filterPeriod !== "ALL") url.searchParams.set("period", filterPeriod);
    else url.searchParams.delete("period");
    window.history.replaceState(window.history.state, "", url);
  }, [filterCareerId, filterPeriod, page, stage, view, outcome]);

  useEffect(() => {
    const onPopState = () => {
      const nextView = getInitialQuery("view", "ALL") as TitulationView;
      setView(VIEWS.includes(nextView) ? nextView : "ALL");
      const nextOutcome = getInitialQuery("outcome", "ALL");
      setOutcome(
        OUTCOMES.includes(nextOutcome as TitulationOutcome)
          ? nextOutcome
          : "ALL",
      );
      const nextStage = getInitialQuery("stage", "ALL");
      const nextCareerId = getInitialQuery("careerId", "ALL");
      const nextPeriod = getInitialQuery("period", "ALL");
      const nextPage = getInitialPage();
      resetSearch();
      setStage(
        nextStage === "ALL" || STAGES.includes(nextStage as TitulationStage)
          ? nextStage
          : "ALL",
      );
      setCareerId(
        nextCareerId === "ALL" || CAREER_ID_PATTERN.test(nextCareerId)
          ? nextCareerId
          : "ALL",
      );
      setPeriod(
        nextPeriod === "ALL" ||
          nextPeriod === "UNRECORDED" ||
          PERIOD_PATTERN.test(nextPeriod)
          ? nextPeriod
          : "ALL",
      );
      setPage(nextPage);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [resetSearch]);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch<unknown>("/academic/titulations/filters", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (controller.signal.aborted) return;
        if (!isTitulationFilterOptions(response))
          throw new Error("Invalid titulation filters response");
        setFilterOptions(response);
        setFilterOptionsError(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFilterOptionsError(true);
      });
    return () => controller.abort();
  }, [filterOptionsRetry, refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch<TitulationPageResult>("/academic/titulations/search", {
      method: "POST",
      body: buildListBody(
        page,
        search,
        stage,
        filterCareerId,
        filterPeriod,
        view,
        outcome,
      ),
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
          current &&
          (current === linkedProcessId ||
            nextResult.items.some((item) => item.id === current))
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
  }, [
    filterCareerId,
    filterPeriod,
    page,
    requestKey,
    search,
    stage,
    view,
    outcome,
    linkedProcessId,
  ]);

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
    setView("ALL");
    setOutcome("ALL");
    setCareerId("ALL");
    setPeriod("ALL");
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

  const deleteSelectedProcess = async () => {
    if (!selectedProcess || deletingProcess) return;
    setDeletingProcess(true);
    setDeleteError(false);
    try {
      await apiFetch<{ success: boolean }>(
        `/academic/titulations/${encodeURIComponent(selectedProcess.id)}`,
        { method: "DELETE" },
      );
      setDeleteConfirmationOpen(false);
      setLoadedDetail(null);
      setSelectedId(null);
      setDeleteSuccess(true);
      setRefreshKey((value) => value + 1);
    } catch {
      setDeleteError(true);
    } finally {
      setDeletingProcess(false);
    }
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
            <button
              type="button"
              onClick={openCreate}
              className={academicPrimaryActionClass}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("createProcess")}
            </button>
          ) : undefined
        }
      />
      {deleteSuccess && (
        <p
          role="status"
          className="rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-foreground"
        >
          {t("delete.success")}
        </p>
      )}

      <section aria-label={t("workflow.navigation")} className="space-y-3">
        <FilterTabs
          label={t("workflow.navigation")}
          value={view}
          options={VIEWS.map((value) => ({
            value,
            label: t(`views.${value}`),
            count: filterOptions?.counts[value],
          }))}
          onChange={(value) => {
            setView(value);
            setOutcome("ALL");
            setPage(1);
            setSelectedId(null);
          }}
        />
        <p className="max-w-prose text-base leading-relaxed text-muted-foreground">
          {t(`viewHelp.${view}`)}
        </p>
      </section>

      <section
        aria-label={t("filters.title")}
        className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
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
        <div
          className={`grid gap-4 sm:grid-cols-2 ${view === "ALL" || view === "REVIEW" ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}
        >
          {(view === "ALL" || view === "REVIEW") && (
            <FilterSelect
              id="titulation-outcome-filter"
              label={t("workflow.outcome")}
              value={outcome}
              onChange={(event) => {
                setOutcome(event.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">{t("workflow.allOutcomes")}</option>
              {OUTCOMES.map((value) => (
                <option key={value} value={value}>
                  {t(`outcomes.${value}`)}
                </option>
              ))}
            </FilterSelect>
          )}
          <FilterSelect
            id="titulation-stage-filter"
            label={t("stageFilterLabel")}
            value={stage}
            onChange={(event) => {
              setStage(event.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">{t("allStages")}</option>
            {STAGES.map((value) => (
              <option key={value} value={value}>
                {t(`statuses.${value}`)}
              </option>
            ))}
          </FilterSelect>
          {filterOptionsLoading ? (
            <SkeletonStatus
              label={t("filters.loading")}
              className="grid gap-4 sm:col-span-2 sm:grid-cols-2"
            >
              <FilterFieldSkeleton />
              <FilterFieldSkeleton />
            </SkeletonStatus>
          ) : filterOptions ? (
            <>
              <FilterSelect
                id="titulation-career-filter"
                label={t("filters.career")}
                value={filterCareerId}
                disabled={filterOptions.careers.length === 0}
                onChange={(event) => {
                  setCareerId(event.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">{t("filters.allCareers")}</option>
                {filterOptions.careers.map((career) => (
                  <option key={career.id} value={career.id}>
                    {career.name}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                id="titulation-period-filter"
                label={t("filters.period")}
                value={filterPeriod}
                disabled={
                  filterOptions.periods.length === 0 &&
                  !filterOptions.hasUndated
                }
                descriptionId="titulation-period-help"
                onChange={(event) => {
                  setPeriod(event.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">{t("filters.allPeriods")}</option>
                {filterOptions.periods.map((value) => {
                  const match = /^(\d{4})-S([12])$/.exec(value);
                  if (!match) return null;
                  return (
                    <option key={value} value={value}>
                      {t("filters.periodOption", {
                        year: match[1],
                        semester: match[2],
                      })}
                    </option>
                  );
                })}
                {filterOptions.hasUndated && (
                  <option value="UNRECORDED">{t("filters.undated")}</option>
                )}
              </FilterSelect>
            </>
          ) : null}
        </div>
        {filterOptions && (
          <p
            id="titulation-period-help"
            className="text-sm leading-relaxed text-muted-foreground"
          >
            {t("filters.periodHelp")}
          </p>
        )}
        {filterOptionsError && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-danger/30 bg-danger/10 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm leading-relaxed text-foreground">
              {t("filters.loadError")}
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterOptionsError(false);
                setFilterOptionsRetry((value) => value + 1);
              }}
              className={academicSecondaryActionClass}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t("filters.retry")}
            </button>
          </div>
        )}
      </section>

      {loadError ? (
        <section
          role="alert"
          className="flex flex-col gap-4 rounded-2xl border border-danger/30 bg-danger/10 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm leading-relaxed text-foreground">
            {t("errors.load")}
          </p>
          <button
            type="button"
            onClick={retryList}
            className={academicSecondaryActionClass}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("retry")}
          </button>
        </section>
      ) : loading && !result?.total ? (
        <TableSkeleton rows={4} columns={4} label={t("loading")} />
      ) : result && result.total === 0 ? (
        <section className="rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            {t("empty.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {search ||
            view !== "ALL" ||
            outcome !== "ALL" ||
            stage !== "ALL" ||
            filterCareerId !== "ALL" ||
            filterPeriod !== "ALL"
              ? t("empty.noMatches")
              : t("empty.description")}
          </p>
        </section>
      ) : (
        <section className="titulation-workspace-grid grid items-start gap-5">
          <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="space-y-2 border-b border-border bg-muted/20 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">
                  {t("casesTitle")}
                </h2>
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
                  summary={
                    <span role="status">
                      {loading ? t("loading") : summary}
                    </span>
                  }
                  onPageChange={setPage}
                  className="[&_button]:min-h-11 [&_button]:min-w-11"
                  showSinglePage
                />
              </nav>
            </div>
            <ul
              className="divide-y divide-border"
              aria-label={t("casesTitle")}
              aria-busy={loading}
            >
              {items.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={t("selectCase", {
                        id: item.reference,
                        students: item.studentName,
                      })}
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
                            <span className="font-semibold text-foreground">
                              <SearchHighlight
                                text={item.studentName}
                                query={search}
                              />
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                              <SearchHighlight
                                text={item.reference}
                                query={search}
                              />
                            </span>
                          </span>
                          <span className="mt-1 block line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {item.thesisTopic ? (
                              <SearchHighlight
                                text={item.thesisTopic}
                                query={search}
                              />
                            ) : (
                              t("missingValue")
                            )}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            <SearchHighlight
                              text={item.careerName}
                              query={search}
                            />{" "}
                            · {item.degree || t("missingValue")}
                          </span>
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <TitulationOutcomeBadge
                          outcome={item.outcome}
                          label={t(`outcomes.${item.outcome}`)}
                        />
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
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
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {t("detail.eyebrow")}
                </p>
                <h2
                  id="titulation-detail-title"
                  className="mt-1 text-lg font-semibold text-foreground"
                >
                  {t("detail.title")}
                </h2>
                {selectedSummary && (
                  <p className="mt-1 break-all text-sm text-muted-foreground">
                    {selectedSummary.reference}
                  </p>
                )}
              </div>
              {canManage && selectedProcess && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={openEdit}
                    className={academicSecondaryActionClass}
                  >
                    {t("editProcess")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(false);
                      setDeleteSuccess(false);
                      setDeleteConfirmationOpen(true);
                    }}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-destructive/30 px-3 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {t("deleteProcess")}
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-5 p-5">
              {detailLoading ? (
                <div
                  role="status"
                  aria-label={t("detail.loading")}
                  aria-busy="true"
                  className="space-y-3"
                >
                  <div className="h-12 animate-pulse rounded-xl bg-skeleton" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="h-16 animate-pulse rounded-xl bg-skeleton" />
                    <div className="h-16 animate-pulse rounded-xl bg-skeleton" />
                    <div className="h-16 animate-pulse rounded-xl bg-skeleton" />
                    <div className="h-16 animate-pulse rounded-xl bg-skeleton" />
                  </div>
                </div>
              ) : detailError ? (
                <div role="alert" className="space-y-3">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("detail.error")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setRefreshKey((value) => value + 1)}
                    className={academicSecondaryActionClass}
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {t("retry")}
                  </button>
                </div>
              ) : selectedProcess ? (
                <TitulationRecordDetails
                  process={selectedProcess}
                  query={search}
                  defenseDate={displayDefenseDate(selectedProcess)}
                  canManage={canManage}
                  onAttachmentUploaded={refreshSelectedProcess}
                />
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("selectCasePrompt")}
                </p>
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
      <Modal
        isOpen={deleteConfirmationOpen && selectedProcess !== null}
        onClose={() => {
          if (!deletingProcess) setDeleteConfirmationOpen(false);
        }}
        title={t("delete.title")}
        description={
          selectedProcess
            ? t("delete.description", {
                reference: selectedProcess.reference,
                name: selectedProcess.studentName,
              })
            : undefined
        }
        closeLabel={t("close")}
        closeOnBackdropClick={!deletingProcess}
        closeOnEscape={!deletingProcess}
        showCloseButton={!deletingProcess}
        footer={
          <>
            <button
              type="button"
              disabled={deletingProcess}
              onClick={() => setDeleteConfirmationOpen(false)}
              className={academicSecondaryActionClass}
            >
              {t("delete.cancel")}
            </button>
            <button
              type="button"
              disabled={deletingProcess}
              onClick={() => void deleteSelectedProcess()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {deletingProcess ? t("delete.pending") : t("delete.confirm")}
            </button>
          </>
        }
      >
        {deleteError && (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
          >
            {t("delete.error")}
          </p>
        )}
      </Modal>
    </div>
  );
}
