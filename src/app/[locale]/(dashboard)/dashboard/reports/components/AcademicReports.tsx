"use client";
import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { createCsv, downloadCsv } from "@/lib/csv";
import { useActiveRole } from "@/context/ActiveRoleContext";

const datasets = [
  "assistantships",
  "assistants",
  "teachers",
  "courses",
  "assignments",
  "semesters",
] as const;
type Report = {
  columns: string[];
  rows: Record<string, string | number | null>[];
};
const control =
  "h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary";

export default function AcademicReports() {
  const t = useTranslations("ReportsPage");
  const { activeRole } = useActiveRole();
  const allowed =
    activeRole === "SYSTEM_ADMIN" || activeRole === "ACADEMIC_PROCESS_ANALYST";
  const [dataset, setDataset] =
    useState<(typeof datasets)[number]>("assistantships");
  const [semesterId, setSemesterId] = useState("");
  const [semesters, setSemesters] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [search, setSearch] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const query = new URLSearchParams({
    dataset,
    ...(semesterId ? { semesterId } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  }).toString();
  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError(false);
      void Promise.all([
        apiFetch<Report>(`/academic/reports?${query}`, {
          signal: controller.signal,
        }),
        apiFetch<{ id: string; name: string }[]>("/academic/semesters", {
          signal: controller.signal,
        }),
      ])
        .then(([data, options]) => {
          if (!controller.signal.aborted) {
            setReport(data);
            setSemesters(options);
            setPage(1);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setError(true);
            setReport(null);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [allowed, query, retry]);
  const value = (row: Report["rows"][number], column: string) => {
    const raw = row[column];
    return column === "status" && (raw === "ACTIVE" || raw === "INACTIVE")
      ? t(`statuses.${raw}`)
      : String(raw ?? "—");
  };
  const exportReport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const operation = apiFetch<Report>(
        `/academic/reports/export?${query}`,
      ).then((data) => {
        const translated = data.rows.map((row) =>
          Object.fromEntries(
            data.columns.map((column) => [
              column,
              row[column] === null ? "" : value(row, column),
            ]),
          ),
        );
        downloadCsv(
          `${dataset}-${semesterId || "all"}.csv`,
          createCsv(
            data.columns,
            translated,
            data.columns.map((column) => t(`columns.${column}`)),
          ),
        );
      });
      toast.promise(operation, {
        loading: t("exporting"),
        success: t("exported"),
        error: t("error"),
      });
      await operation;
    } catch {
      /* Feedback is supplied by the toast. */
    } finally {
      setExporting(false);
    }
  };
  if (!activeRole)
    return (
      <p role="status" className="py-12 text-muted-foreground">
        {t("loading")}
      </p>
    );
  if (!allowed)
    return (
      <p role="alert" className="py-12 text-muted-foreground">
        {t("access")}
      </p>
    );
  const pages = Math.max(1, Math.ceil((report?.rows.length ?? 0) / 20));
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          disabled={loading || error || exporting || !report?.rows.length}
          onClick={() => void exportReport()}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {t("export")}
        </button>
      </header>
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3">
        <label className="grid gap-2 text-xs font-semibold text-muted-foreground">
          {t("dataset")}
          <select
            className={control}
            value={dataset}
            onChange={(event) =>
              setDataset(event.target.value as typeof dataset)
            }
          >
            {datasets.map((item) => (
              <option key={item} value={item}>
                {t(`datasets.${item}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-xs font-semibold text-muted-foreground">
          {t("semester")}
          <select
            className={control}
            value={semesterId}
            onChange={(event) => setSemesterId(event.target.value)}
          >
            <option value="">{t("allSemesters")}</option>
            {semesters.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-xs font-semibold text-muted-foreground">
          {t("search")}
          <input
            type="search"
            className={control}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 p-5 text-destructive"
        >
          {t("error")}
          <button
            type="button"
            onClick={() => setRetry((current) => current + 1)}
            className="ml-3 underline"
          >
            {t("retry")}
          </button>
        </div>
      ) : loading ? (
        <p
          role="status"
          className="animate-pulse rounded-2xl bg-muted p-12 text-center"
        >
          {t("loading")}
        </p>
      ) : !report?.rows.length ? (
        <p className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{t(`datasets.${dataset}`)}</caption>
              <thead className="bg-muted text-xs text-muted-foreground">
                <tr>
                  {report.columns.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="whitespace-nowrap px-4 py-3"
                    >
                      {t(`columns.${column}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.rows
                  .slice((page - 1) * 20, page * 20)
                  .map((row, index) => (
                    <tr key={index}>
                      {report.columns.map((column) => (
                        <td
                          key={column}
                          className="min-w-32 px-4 py-3 text-foreground"
                        >
                          {value(row, column)}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-sm text-muted-foreground">
            <p>{t("rows", { count: report.rows.length })}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                className="disabled:opacity-40"
              >
                {t("previous")}
              </button>
              <span>
                {page} / {pages}
              </span>
              <button
                type="button"
                disabled={page === pages}
                onClick={() => setPage((current) => current + 1)}
                className="disabled:opacity-40"
              >
                {t("next")}
              </button>
            </div>
          </footer>
        </div>
      )}
    </section>
  );
}
