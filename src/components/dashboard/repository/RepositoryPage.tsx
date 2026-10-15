"use client";
import { useEffect, useRef, useState } from "react";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import type { DocumentNode } from "graphql";
import {
  Eye,
  FlaskConical,
  FolderKanban,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { apiFetch } from "@/lib/api";
import { resolveApiBaseUrl } from "@/lib/runtime-config";
import Modal from "@/components/ui/Modal";
import PaginationControls from "@/components/ui/PaginationControls";
import { PageSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeletons";
import {
  PROJECT_STATUSES,
  type RepositoryKind,
  type RepositoryRecord,
} from "@/types/academic-repository";
import RepositoryEditor from "./RepositoryEditor";
import RepositoryDetails from "./RepositoryDetails";
import AcademicExcelImport from "./AcademicExcelImport";
import {
  fieldClass,
  primaryButton,
  secondaryButton,
} from "./repository-fields";
import {
  REPOSITORY_PROJECTS,
  REPOSITORY_RESEARCH,
  REPOSITORY_PROJECT_DETAIL,
  REPOSITORY_RESEARCH_DETAIL,
  type RepositoryProjectDetailData,
  type RepositoryResearchDetailData,
  type RepositoryProjectsData,
  type RepositoryResearchData,
  type RepositoryFilters,
} from "./repository-queries";

function createRepositoryClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: "/api/graphql",
      credentials: "include",
      fetch: async (_uri, options) => {
        const base = await resolveApiBaseUrl();
        if (!base) throw new Error("API_NOT_CONFIGURED");
        return fetch(`${base}/graphql`, options);
      },
    }),
  });
}

type Dialog =
  | { mode: "create" }
  | { mode: "details" | "edit" | "delete"; record: RepositoryRecord }
  | null;
export default function RepositoryPage({ kind }: { kind: RepositoryKind }) {
  const t = useTranslations("AcademicRepository");
  const format = useFormatter();
  const { activeRole } = useActiveRole();
  const [graphqlClient] = useState(createRepositoryClient);
  const allowed =
    activeRole === "SYSTEM_ADMIN" ||
    activeRole === "ACADEMIC_SECRETARY" ||
    activeRole === "ACADEMIC_PROCESS_ANALYST";
  const [rows, setRows] = useState<RepositoryRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [year, setYear] = useState("");
  const [sortBy, setSortBy] = useState(
    kind === "projects" ? "reportingYear" : "createdAt",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const lastInvalidYearToast = useRef("");
  const loadLabel = t("loadError");
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    const timeout = setTimeout(() => {
      const parsedYear = Number(year);
      const invalidYear =
        kind === "projects" &&
        year !== "" &&
        (!/^\d{4}$/.test(year) || parsedYear < 1900 || parsedYear > 2200);
      if (invalidYear) {
        if (active) {
          setRows([]);
          setTotal(0);
          setTotalPages(1);
          setError(null);
          setLoading(false);
          if (lastInvalidYearToast.current !== year) {
            toast.error(t("invalidYearToast"));
            lastInvalidYearToast.current = year;
          }
        }
        return;
      }
      lastInvalidYearToast.current = "";
      const filters: RepositoryFilters = {
        page,
        pageSize: 10,
        search: search.trim(),
        sortBy,
        sortOrder,
        ...(kind === "projects" && status ? { status } : {}),
        ...(kind === "projects" && year ? { reportingYear: parsedYear } : {}),
      };
      void graphqlClient
        .query<RepositoryProjectsData | RepositoryResearchData, { filters: RepositoryFilters }>({
          query: (kind === "projects" ? REPOSITORY_PROJECTS : REPOSITORY_RESEARCH) as DocumentNode,
          variables: { filters },
          fetchPolicy: "network-only",
        })
        .then((result) => {
          if (active) {
            if (!result.data) throw new Error(loadLabel);
            const data = "repositoryProjects" in result.data
              ? result.data.repositoryProjects
              : result.data.repositoryResearch;
            const pages = Math.max(1, data.totalPages);
            if (page > pages) {
              setPage(pages);
              return;
            }
            setRows(data.items.map((item) => ({
              ...item,
              participants: item.participants ?? [],
              _count: { outputs: item.outputCount },
            })));
            setTotal(data.total);
            setTotalPages(pages);
            setError(null);
          }
        })
        .catch((cause: unknown) => {
          if (!active) return;
          const message = cause instanceof Error ? cause.message : loadLabel;
          if (
            kind === "projects" &&
            /reportingYear.*(1900|2200)|year.*1900/i.test(message)
          ) {
            setRows([]);
            setTotal(0);
            setTotalPages(1);
            setError(null);
            toast.error(t("invalidYearToast"));
          } else {
            setError(message);
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [allowed, graphqlClient, kind, page, search, status, year, sortBy, sortOrder, reload, loadLabel, t]);
  const refresh = () => {
    setLoading(true);
    setReload((value) => value + 1);
  };
  const open = async (
    mode: "details" | "edit" | "delete",
    row: RepositoryRecord,
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await graphqlClient.query<RepositoryProjectDetailData | RepositoryResearchDetailData, { id: string }>({
        query: (kind === 'projects' ? REPOSITORY_PROJECT_DETAIL : REPOSITORY_RESEARCH_DETAIL) as DocumentNode,
        variables: { id: row.id },
        fetchPolicy: 'no-cache',
      });
      if (!result.data) throw new Error(loadLabel);
      const detail = 'repositoryProject' in result.data ? result.data.repositoryProject : result.data.repositoryResearchDetail;
      const record: RepositoryRecord = { ...detail, _count: { outputs: detail.outputCount } };
      setDialog({ mode, record });
    } catch (cause: unknown) {
      toast.error(cause instanceof Error ? cause.message : loadLabel);
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (dialog?.mode !== "delete" || busy) return;
    setBusy(true);
    const query = new URLSearchParams({
      expectedUpdatedAt: dialog.record.updatedAt,
    });
    const operation = apiFetch(
      `/academic/${kind}/${dialog.record.id}?${query}`,
      { method: "DELETE" },
    );
    toast.promise(operation, {
      loading: t("deleting"),
      success: t("deleted"),
      error: (cause: unknown) =>
        cause instanceof Error ? cause.message : t("deleteError"),
    });
    try {
      await operation;
      setDialog(null);
      refresh();
    } catch {
      /* Keep the confirmation open for retry or cancellation. */
    } finally {
      setBusy(false);
    }
  };
  if (activeRole === null) return <PageSkeleton label={t("loading")} />;
  if (!allowed)
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        {t("accessError")}
      </p>
    );
  const Icon = kind === "projects" ? FolderKanban : FlaskConical;
  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-black tracking-tight">
            <Icon className="h-7 w-7 text-primary" />
            {t(`${kind}.title`)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t(`${kind}.subtitle`)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AcademicExcelImport kind={kind} onImported={refresh} />
          <button
            type="button"
            className={primaryButton}
            onClick={() => setDialog({ mode: "create" })}
          >
            <Plus className="h-4 w-4" />
            {t(`${kind}.create`)}
          </button>
        </div>
      </header>
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex-1 text-xs font-medium text-muted-foreground">
          {t("search")}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4" />
            <input
              type="search"
              className={`${fieldClass} pl-9`}
              maxLength={100}
              value={search}
              placeholder={t("searchHint")}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
                setLoading(true);
              }}
            />
          </div>
        </label>
        {kind === "projects" && (
          <>
            <label className="text-xs font-medium text-muted-foreground">
              {t("fields.status")}
              <select
                className={fieldClass}
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                  setLoading(true);
                }}
              >
                <option value="">{t("allStatuses")}</option>
                {PROJECT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {t(`statuses.${value}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              {t("fields.reportingYear")}
              <input
                className={`${fieldClass} sm:w-28`}
                type="number"
                min={1900}
                max={2200}
                value={year}
                onChange={(event) => {
                  setYear(event.target.value);
                  setPage(1);
                  setLoading(true);
                }}
              />
            </label>
          </>
        )}
        <label className="text-xs font-medium text-muted-foreground">
          {t("sortBy")}
          <select
            className={fieldClass}
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value);
              setPage(1);
              setLoading(true);
            }}
          >
            {(kind === "projects"
              ? ["reportingYear", "title", "startsOn", "totalAmount", "status", "createdAt"]
              : ["createdAt", "title", "startsOn"]
            ).map((value) => (
              <option key={value} value={value}>{t(`sortFields.${value}`)}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          {t("sortOrder")}
          <select
            className={fieldClass}
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value as "asc" | "desc");
              setPage(1);
              setLoading(true);
            }}
          >
            <option value="desc">{t("descending")}</option>
            <option value="asc">{t("ascending")}</option>
          </select>
        </label>
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5"
        >
          <p className="text-sm">{error}</p>
          <button
            type="button"
            className={`${secondaryButton} mt-3`}
            onClick={refresh}
          >
            {t("retry")}
          </button>
        </div>
      ) : loading ? (
        <TableSkeleton label={t("loading")} />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Icon className="mx-auto h-9 w-9 text-primary/60" />
          <h2 className="mt-4 text-lg font-bold">
            {kind === "projects" && year && (!/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > 2200)
              ? t("invalidYearEmpty")
              : t(search || status || year ? "noMatches" : `${kind}.empty`)}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {kind === "projects" && year && (!/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > 2200)
              ? t("invalidYearHint")
              : t(search || status || year ? "searchHint" : "emptyHint")}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <p className="border-b border-border px-5 py-3 text-xs font-semibold text-muted-foreground">
            {t("total", { count: total })}
          </p>
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {row.code && (
                      <span className="font-mono font-semibold">
                        {row.code}
                      </span>
                    )}
                    {row.reportingYear && <span>{row.reportingYear}</span>}
                    {row.status && (
                      <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">
                        {t(`statuses.${row.status}`)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="text-left text-base font-bold text-foreground hover:text-primary"
                    disabled={busy}
                    onClick={() => void open("details", row)}
                  >
                    {row.title}
                  </button>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.academicUnit}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {row.startsOn
                      ? format.dateTime(new Date(row.startsOn), {
                          dateStyle: "medium",
                          timeZone: "UTC",
                        })
                      : t("unknown")}{" "}
                    ·{" "}
                    {t("participantCount", { count: row.participants.length })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    className={secondaryButton}
                    aria-label={t("viewRecord", { title: row.title })}
                    onClick={() => void open("details", row)}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only lg:not-sr-only">{t("view")}</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className={secondaryButton}
                    aria-label={t("editRecord", { title: row.title })}
                    onClick={() => void open("edit", row)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only lg:not-sr-only">{t("edit")}</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className={`${secondaryButton} text-red-600 dark:text-red-400`}
                    aria-label={t("deleteRecord", { title: row.title })}
                    onClick={() => void open("delete", row)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only lg:not-sr-only">
                      {t("delete")}
                    </span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!error && !loading && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalItems={total}
          onPageChange={(next) => {
            setPage(next);
            setLoading(true);
          }}
        />
      )}
      {(dialog?.mode === "create" || dialog?.mode === "edit") && (
        <RepositoryEditor
          kind={kind}
          record={dialog.mode === "edit" ? dialog.record : null}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            refresh();
          }}
        />
      )}
      {dialog?.mode === "details" && (
        <RepositoryDetails
          kind={kind}
          record={dialog.record}
          onClose={() => setDialog(null)}
          onEdit={() => void open("edit", dialog.record)}
        />
      )}
      {dialog?.mode === "delete" && (
        <Modal
          isOpen
          title={t(`${kind}.delete`)}
          description={t("deleteHint", { title: dialog.record.title })}
          size="md"
          onClose={() => {
            if (!busy) setDialog(null);
          }}
          closeOnEscape={!busy}
          closeOnBackdropClick={!busy}
          closeLabel={t("close")}
        >
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={busy}
              className={secondaryButton}
              onClick={() => setDialog(null)}
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={busy}
              className={`${primaryButton} bg-red-600 text-white`}
              onClick={() => void remove()}
            >
              {t(busy ? "deleting" : "confirmDelete")}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
