"use client";
import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { createApiGraphqlClient } from '@/lib/graphql-client';
import { ACADEMIC_REPORT, REPORT_SEMESTERS, unpackReport, type ReportFilters } from '@/lib/academic-analytics';
import { createCsv, downloadCsv } from "@/lib/csv";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { PageSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeletons";

const datasets = [
  "assistantships",
  "assistants",
  "teachers",
  "courses",
  "assignments",
  "semesters",
  "projects",
  "research",
  "researchOutputs",
  "hourlyContracts",
] as const;
type Report = {
  columns: string[];
  rows: Record<string, string | number | null>[];
  totalRows?: number;
};
const control =
  "h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary";

export default function AcademicReports() {
  const t = useTranslations("ReportsPage");
  const { activeRole } = useActiveRole();
  const [graphqlClient] = useState(createApiGraphqlClient);
  const allowed =
    activeRole === "SYSTEM_ADMIN" ||
    activeRole === "ACADEMIC_SECRETARY" ||
    activeRole === "ACADEMIC_PROCESS_ANALYST";
  const [dataset, setDataset] =
    useState<(typeof datasets)[number]>("assistantships");
  const [semesterId, setSemesterId] = useState("");
  const [reportingYear, setReportingYear] = useState("");
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
  const baseQuery = new URLSearchParams({
    dataset,
    ...(semesterId ? { semesterId } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(reportingYear ? { reportingYear } : {}),
  }).toString();
  const isDatabasePaged = ["projects", "research", "researchOutputs"].includes(
    dataset,
  );
  const query = new URLSearchParams(baseQuery);
  if (isDatabasePaged) {
    query.set("page", String(page));
    query.set("pageSize", "20");
  }
  const queryString = query.toString();
  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    const params = new URLSearchParams(queryString);
    const filters: ReportFilters = { dataset: params.get('dataset') ?? 'assistantships' };
    for (const key of ['semesterId', 'search'] as const) {
      const value = params.get(key);
      if (value) filters[key] = value;
    }
    for (const key of ['reportingYear', 'page', 'pageSize'] as const) {
      const value = params.get(key);
      if (value) filters[key] = Number(value);
    }
    const timer = setTimeout(() => {
      setLoading(true);
      setError(false);
      void Promise.all([
        graphqlClient.query({ query: ACADEMIC_REPORT, variables: { filters }, fetchPolicy: 'no-cache', context: { fetchOptions: { signal: controller.signal } } }),
        graphqlClient.query({ query: REPORT_SEMESTERS, fetchPolicy: 'cache-first', context: { fetchOptions: { signal: controller.signal } } }),
      ])
        .then(([data, options]) => {
          if (!controller.signal.aborted) {
            if (!data.data || !options.data) throw new Error('EMPTY_RESPONSE');
            setReport(unpackReport(data.data.academicReport));
            setSemesters(options.data.academicReportSemesters);
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
  }, [allowed, graphqlClient, queryString, retry]);
  const value = (row: Report["rows"][number], column: string) => {
    const raw = row[column];
    if (raw === null || raw === undefined) return "—";
    if (
      [
        "totalAmount",
        "vraContribution",
        "vridtContribution",
        "recoveryAmount",
        "facultyContribution",
        "depreciationAmount",
        "profitabilityAmount",
        "hourlyRateClp",
        "monthlyAmountClp",
        "estimatedPaymentClp",
      ].includes(column)
    ) {
      const currency = column.endsWith("Clp")
        ? "CLP"
        : String(row.currency ?? "CLP");
      const amount = Number(raw);
      if (Number.isFinite(amount))
        return new Intl.NumberFormat("es-CL", {
          style: "currency",
          currency,
          maximumFractionDigits: currency === "CLP" ? 0 : 2,
        }).format(amount);
    }
    return column === "status" && (raw === "ACTIVE" || raw === "INACTIVE")
      ? t(`statuses.${raw}`)
      : String(raw ?? "—");
  };
  const exportReport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const operation = apiFetch<Report>(
        `/academic/reports/export?${baseQuery}`,
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
  if (!activeRole) return <PageSkeleton label={t("loading")} />;
  if (!allowed)
    return (
      <p role="alert" className="py-12 text-muted-foreground">
        {t("access")}
      </p>
    );
  const rowCount = report?.totalRows ?? report?.rows.length ?? 0;
  const pages = Math.max(1, Math.ceil(rowCount / 20));
  const visibleRows = isDatabasePaged
    ? (report?.rows ?? [])
    : (report?.rows.slice((page - 1) * 20, page * 20) ?? []);
  const supportsYear = [
    "projects",
    "research",
    "researchOutputs",
    "hourlyContracts",
  ].includes(dataset);
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
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4">
        <label className="grid gap-2 text-xs font-semibold text-muted-foreground">
          {t("dataset")}
          <select
            className={control}
            value={dataset}
            onChange={(event) => {
              setPage(1);
              setDataset(event.target.value as typeof dataset);
            }}
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
            onChange={(event) => {
              setPage(1);
              setSemesterId(event.target.value);
            }}
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
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
          />
        </label>
        {supportsYear && (
          <label className="grid gap-2 text-xs font-semibold text-muted-foreground">
            {t("year")}
            <input
              className={control}
              type="number"
              min={1900}
              max={2200}
              value={reportingYear}
              onChange={(event) => {
                setPage(1);
                setReportingYear(event.target.value);
              }}
            />
          </label>
        )}
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
        <TableSkeleton columns={6} label={t("loading")} />
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
                {visibleRows.map((row, index) => (
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
            <p>{t("rows", { count: rowCount })}</p>
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
