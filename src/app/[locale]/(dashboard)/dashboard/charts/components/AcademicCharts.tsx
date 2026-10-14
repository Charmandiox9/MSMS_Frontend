"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, BookOpen, FlaskConical, FolderKanban, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { PageSkeleton } from "@/components/ui/LoadingSkeletons";

type Row = Record<string, string | number | null>;
type Dataset = { columns: string[]; rows: Row[] };
type ChartData = { projects: Dataset; research: Dataset; researchOutputs: Dataset; hourlyContracts: Dataset };
type Semester = { id: string; name: string };
const filterClass = "h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

const currencyFormat = (currency: string) => new Intl.NumberFormat("es-CL", {
  style: "currency", currency, maximumFractionDigits: currency === "CLP" ? 0 : 2,
});

function aggregate(rows: Row[], key: string, amountKey?: string) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const label = String(row[key] ?? "Sin informar");
    const value = amountKey ? Number(row[amountKey] ?? 0) : 1;
    totals.set(label, (totals.get(label) ?? 0) + (Number.isFinite(value) ? value : 0));
  }
  return [...totals].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function BarPanel({ title, values, formatValue = (value: number) => new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(value), empty }: {
  title: string;
  values: { label: string; value: number }[];
  formatValue?: (value: number) => string;
  empty: string;
}) {
  const max = Math.max(1, ...values.map(({ value }) => value));
  return <section className="rounded-2xl border border-border bg-card p-5">
    <h2 className="text-base font-bold">{title}</h2>
    {values.length ? <ul className="mt-5 space-y-4">{values.map(({ label, value }) => <li key={label}>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm"><span className="truncate text-muted-foreground">{label}</span><strong className="shrink-0 tabular-nums">{formatValue(value)}</strong></div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${label}: ${formatValue(value)}`}><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.max(2, value / max * 100)}%` }} /></div>
    </li>)}</ul> : <p className="mt-5 text-sm text-muted-foreground">{empty}</p>}
  </section>;
}

function BudgetPanel({ title, values, empty }: { title: string; values: { currency: string; amount: number }[]; empty: string }) {
  return <section className="rounded-2xl border border-border bg-card p-5"><h2 className="text-base font-bold">{title}</h2>{values.length ? <ul className="mt-5 divide-y divide-border">{values.map(({ currency, amount }) => <li key={currency} className="flex items-baseline justify-between gap-4 py-3 text-sm"><span className="text-muted-foreground">{currency}</span><strong className="tabular-nums">{currencyFormat(currency).format(amount)}</strong></li>)}</ul> : <p className="mt-5 text-sm text-muted-foreground">{empty}</p>}</section>;
}

export default function AcademicCharts() {
  const t = useTranslations("ChartsPage");
  const { activeRole } = useActiveRole();
  const allowed = activeRole === "SYSTEM_ADMIN" || activeRole === "ACADEMIC_SECRETARY" || activeRole === "ACADEMIC_PROCESS_ANALYST";
  const [year, setYear] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    const request = (dataset: keyof ChartData) => {
      const query = new URLSearchParams({ dataset });
      if (year) query.set("reportingYear", year);
      if (dataset === "hourlyContracts" && semesterId) query.set("semesterId", semesterId);
      return apiFetch<Dataset>(`/academic/reports?${query}`, { signal: controller.signal });
    };
    setLoading(true);
    setError(false);
    void Promise.all([
      request("projects"), request("research"), request("researchOutputs"), request("hourlyContracts"),
      apiFetch<Semester[]>("/academic/semesters", { signal: controller.signal }),
    ]).then(([projects, research, researchOutputs, hourlyContracts, options]) => {
      if (controller.signal.aborted) return;
      setData({ projects, research, researchOutputs, hourlyContracts });
      setSemesters(options);
    }).catch(() => {
      if (!controller.signal.aborted) { setData(null); setError(true); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [allowed, year, semesterId, retry]);

  const charts = useMemo(() => {
    if (!data) return null;
    const budgets = new Map<string, number>();
    for (const project of data.projects.rows) {
      const currency = typeof project.currency === "string" ? project.currency : "";
      const amount = Number(project.totalAmount ?? 0);
      if (currency && Number.isFinite(amount)) budgets.set(currency, (budgets.get(currency) ?? 0) + amount);
    }
    return {
      projectStatuses: aggregate(data.projects.rows, "status"),
      outputKinds: aggregate(data.researchOutputs.rows, "kind"),
      outputsByYear: aggregate(data.researchOutputs.rows, "reportingYear"),
      researchByYear: aggregate(data.research.rows.map((row) => ({ ...row, year: typeof row.startsOn === "string" ? row.startsOn.slice(0, 4) : "Sin fecha" })), "year"),
      hourlyByComponent: aggregate(data.hourlyContracts.rows, "component", "estimatedPaymentClp"),
      budgets: [...budgets].map(([currency, amount]) => ({ currency, amount })),
    };
  }, [data]);
  const metrics: { Icon: LucideIcon; label: string; value: number }[] = data ? [
    { Icon: FolderKanban, label: t("projects"), value: data.projects.rows.length },
    { Icon: FlaskConical, label: t("research"), value: data.research.rows.length },
    { Icon: BookOpen, label: t("outputs"), value: data.researchOutputs.rows.length },
    { Icon: Wallet, label: t("hourlyContracts"), value: data.hourlyContracts.rows.length },
  ] : [];

  if (!activeRole) return <PageSkeleton label={t("loading")} />;
  if (!allowed) return <p role="alert" className="py-12 text-muted-foreground">{t("access")}</p>;
  return <section className="space-y-6">
    <header><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{t("eyebrow")}</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-black"><BarChart3 className="h-7 w-7 text-primary" />{t("title")}</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t("subtitle")}</p></header>
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
      <label className="grid gap-2 text-xs font-semibold text-muted-foreground">{t("year")}<input className={filterClass} type="number" min={1900} max={2200} value={year} onChange={(event) => setYear(event.target.value)} /></label>
      <label className="grid gap-2 text-xs font-semibold text-muted-foreground">{t("semester")}<select className={filterClass} value={semesterId} onChange={(event) => setSemesterId(event.target.value)}><option value="">{t("allSemesters")}</option>{semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}</select></label>
    </div>
    {error ? <div role="alert" className="rounded-2xl border border-destructive/30 p-5 text-destructive">{t("error")} <button type="button" className="ml-2 underline" onClick={() => setRetry((value) => value + 1)}>{t("retry")}</button></div> : loading || !data || !charts ? <div role="status" className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">{t("loading")}</div> : <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ Icon, label, value }) => <article key={label} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-3 text-sm text-muted-foreground"><Icon className="h-5 w-5 text-primary" />{label}</div><p className="mt-4 text-3xl font-black tabular-nums">{new Intl.NumberFormat("es-CL").format(value)}</p></article>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarPanel title={t("projectStatuses")} values={charts.projectStatuses} empty={t("empty")} formatValue={(value) => new Intl.NumberFormat("es-CL").format(value)} />
        <BudgetPanel title={t("budgets")} values={charts.budgets} empty={t("empty")} />
        <BarPanel title={t("outputKinds")} values={charts.outputKinds.map(({ label, value }) => ({ label: t(`kinds.${label}`), value }))} empty={t("empty")} formatValue={(value) => new Intl.NumberFormat("es-CL").format(value)} />
        <BarPanel title={t("outputsByYear")} values={charts.outputsByYear} empty={t("empty")} formatValue={(value) => new Intl.NumberFormat("es-CL").format(value)} />
        <BarPanel title={t("researchByYear")} values={charts.researchByYear} empty={t("empty")} formatValue={(value) => new Intl.NumberFormat("es-CL").format(value)} />
        <BarPanel title={t("hourlyByComponent")} values={charts.hourlyByComponent.map(({ label, value }) => ({ label: t(`components.${label}`), value }))} empty={t("empty")} formatValue={(value) => currencyFormat("CLP").format(value)} />
      </div>
    </>}
  </section>;
}
