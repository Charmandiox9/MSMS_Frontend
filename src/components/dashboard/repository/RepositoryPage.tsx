"use client";
import { useEffect, useState } from "react";
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
import Modal from "@/components/ui/Modal";
import PaginationControls from "@/components/ui/PaginationControls";
import { PageSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeletons";
import type { PaginatedResponse } from "@/types/pagination";
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

type Dialog =
  | { mode: "create" }
  | { mode: "details" | "edit" | "delete"; record: RepositoryRecord }
  | null;
export default function RepositoryPage({ kind }: { kind: RepositoryKind }) {
  const t = useTranslations("AcademicRepository");
  const format = useFormatter();
  const { activeRole } = useActiveRole();
  const allowed =
    activeRole === "SYSTEM_ADMIN" ||
    activeRole === "ACADEMIC_SECRETARY" ||
    activeRole === "ACADEMIC_PROCESS_ANALYST";
  const [rows, setRows] = useState<RepositoryRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [year, setYear] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const loadLabel = t("loadError");
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    const timeout = setTimeout(() => {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: "10",
        search: search.trim(),
      });
      if (kind === "projects" && status) query.set("status", status);
      if (kind === "projects" && year) query.set("reportingYear", year);
      apiFetch<PaginatedResponse<RepositoryRecord>>(
        `/academic/${kind}?${query}`,
      )
        .then((data) => {
          if (active) {
            const pages = Math.max(1, data.totalPages);
            if (page > pages) {
              setPage(pages);
              return;
            }
            setRows(data.items);
            setTotal(data.total);
            setTotalPages(pages);
            setError(null);
          }
        })
        .catch((cause: unknown) => {
          if (active)
            setError(cause instanceof Error ? cause.message : loadLabel);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [allowed, kind, page, search, status, year, reload, loadLabel]);
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
      const record = await apiFetch<RepositoryRecord>(
        `/academic/${kind}/${row.id}`,
      );
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
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-end">
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
            {t(search || status || year ? "noMatches" : `${kind}.empty`)}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(search || status || year ? "searchHint" : "emptyHint")}
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
          onEdit={() => setDialog({ mode: "edit", record: dialog.record })}
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
