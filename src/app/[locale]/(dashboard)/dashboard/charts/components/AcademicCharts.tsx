"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BarChart3, BookOpen, FlaskConical, FolderKanban, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { PageSkeleton } from "@/components/ui/LoadingSkeletons";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Row = Record<string, string | number | null>;
type Dataset = { columns: string[]; rows: Row[] };
type ChartData = { projects: Dataset; research: Dataset; researchOutputs: Dataset; hourlyContracts: Dataset };
type Semester = { id: string; name: string };
const filterClass = "h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";
const chartColors = ["#0f766e", "#0284c7", "#2563eb", "#7c3aed", "#d97706", "#e11d48"];
const chartTextColor = "var(--muted-foreground)";
const chartGridColor = "var(--border)";

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

function ChartPanel({ title, empty, children, className = "" }: {
  title: string;
  empty?: string;
  children?: ReactNode;
  className?: string;
}) {
  return <section className={`min-w-0 rounded-2xl border border-border bg-card p-5 ${className}`}>
    <h2 className="text-base font-bold">{title}</h2>
    {empty ? <p className="mt-5 text-sm text-muted-foreground">{empty}</p> : children}
  </section>;
}

function ChartTooltip({ active, payload, label, formatValue }: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string | number;
  formatValue?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
    {label !== undefined && <p className="mb-1 font-semibold">{label}</p>}
    {payload.map((item) => <p key={item.name} className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
      <span>{item.name}</span><strong className="ml-2 tabular-nums">{formatValue ? formatValue(Number(item.value ?? 0)) : new Intl.NumberFormat("es-CL").format(Number(item.value ?? 0))}</strong>
    </p>)}
  </div>;
}

function DistributionChart({ title, values, empty, formatLabel = (label: string) => label }: {
  title: string;
  values: { label: string; value: number }[];
  empty: string;
  formatLabel?: (label: string) => string;
}) {
  const chartData = values.map((item) => ({ ...item, displayLabel: formatLabel(item.label) }));
  return <ChartPanel title={title} empty={!values.length ? empty : undefined}>
    <div className="mt-3 h-72" role="img" aria-label={title}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart accessibilityLayer>
          <Pie data={chartData} dataKey="value" nameKey="displayLabel" innerRadius="55%" outerRadius="78%" paddingAngle={2} stroke="none">
            {values.map((item, index) => <Cell key={item.label} fill={chartColors[index % chartColors.length]} />)}
          </Pie>
          <Tooltip content={<ChartTooltip />} formatter={(value) => new Intl.NumberFormat("es-CL").format(Number(value ?? 0))} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </ChartPanel>;
}

function TrendChart({ title, researchValues, outputValues, researchLabel, outputLabel, empty }: {
  title: string;
  researchValues: { label: string; value: number }[];
  outputValues: { label: string; value: number }[];
  researchLabel: string;
  outputLabel: string;
  empty: string;
}) {
  const years = [...new Set([...researchValues, ...outputValues].map(({ label }) => label))].sort();
  const data = years.map((year) => ({
    year,
    research: researchValues.find((item) => item.label === year)?.value ?? 0,
    outputs: outputValues.find((item) => item.label === year)?.value ?? 0,
  }));
  return <ChartPanel title={title} empty={!data.length ? empty : undefined}>
    <div className="mt-3 h-72" role="img" aria-label={title}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} accessibilityLayer margin={{ top: 10, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
          <XAxis dataKey="year" tick={{ fill: chartTextColor, fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: chartTextColor, fontSize: 12 }} />
          <Tooltip content={<ChartTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="research" name={researchLabel} stroke={chartColors[0]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="outputs" name={outputLabel} stroke={chartColors[1]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </ChartPanel>;
}

function BudgetCharts({ rows, title, empty }: { rows: Row[]; title: string; empty: string }) {
  const trends = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const currency = typeof row.currency === "string" ? row.currency : "";
    const year = String(row.reportingYear ?? "");
    const amount = Number(row.totalAmount ?? 0);
    if (!currency || !year || !Number.isFinite(amount)) continue;
    const points = trends.get(currency) ?? new Map<string, number>();
    points.set(year, (points.get(year) ?? 0) + amount);
    trends.set(currency, points);
  }
  const entries = [...trends].map(([currency, points]) => {
    const data = [...points].map(([year, amount]) => ({ year, amount })).sort((a, b) => a.year.localeCompare(b.year));
    return { currency, data, total: data.reduce((sum, point) => sum + point.amount, 0) };
  });
  if (!entries.length) return <ChartPanel title={title} empty={empty} />;
  return <section className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
    <h2 className="text-base font-bold">{title}</h2>
    <div className="mt-4 grid gap-5 xl:grid-cols-2">
      {entries.map(({ currency, data, total }) => <div key={currency}>
        <div className="mb-1 flex items-baseline justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{currency}</p><strong className="text-sm tabular-nums">{currencyFormat(currency).format(total)}</strong></div>
        <div className="h-64" role="img" aria-label={`${title} · ${currency}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} accessibilityLayer margin={{ top: 10, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fill: chartTextColor, fontSize: 12 }} />
              <YAxis width={72} tick={{ fill: chartTextColor, fontSize: 11 }} tickFormatter={(value) => currencyFormat(currency).format(Number(value))} />
              <Tooltip content={<ChartTooltip formatValue={(value) => currencyFormat(currency).format(value)} />} />
              <Area type="monotone" dataKey="amount" name={currency} stroke={chartColors[0]} fill={chartColors[0]} fillOpacity={0.18} strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>)}
    </div>
  </section>;
}

function PaymentChart({ title, values, empty, formatLabel }: {
  title: string;
  values: { label: string; value: number }[];
  empty: string;
  formatLabel: (label: string) => string;
}) {
  const data = values.map(({ label, value }) => ({ component: formatLabel(label), amount: value }));
  return <ChartPanel title={title} empty={!data.length ? empty : undefined}>
    <div className="mt-3 h-72" role="img" aria-label={title}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" accessibilityLayer margin={{ top: 6, right: 18, bottom: 6, left: 12 }}>
          <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fill: chartTextColor, fontSize: 11 }} tickFormatter={(value) => currencyFormat("CLP").format(Number(value))} />
          <YAxis type="category" dataKey="component" width={100} tick={{ fill: chartTextColor, fontSize: 11 }} />
          <Tooltip content={<ChartTooltip formatValue={(value) => currencyFormat("CLP").format(value)} />} />
          <Bar dataKey="amount" name={title} fill={chartColors[1]} radius={[0, 5, 5, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </ChartPanel>;
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
    return {
      projectStatuses: aggregate(data.projects.rows, "status"),
      outputKinds: aggregate(data.researchOutputs.rows, "kind"),
      outputsByYear: aggregate(data.researchOutputs.rows, "reportingYear"),
      researchByYear: aggregate(data.research.rows.map((row) => ({ ...row, year: typeof row.startsOn === "string" ? row.startsOn.slice(0, 4) : "Sin fecha" })), "year"),
      hourlyByComponent: aggregate(data.hourlyContracts.rows, "component", "estimatedPaymentClp"),
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
        <DistributionChart title={t("projectStatuses")} values={charts.projectStatuses} empty={t("empty")} formatLabel={(label) => t(`statuses.${label}`)} />
        <BudgetCharts rows={data.projects.rows} title={t("budgets")} empty={t("empty")} />
        <DistributionChart title={t("outputKinds")} values={charts.outputKinds} empty={t("empty")} formatLabel={(label) => t(`kinds.${label}`)} />
        <TrendChart title={t("researchAndOutputsTrend")} researchValues={charts.researchByYear} outputValues={charts.outputsByYear} researchLabel={t("research")} outputLabel={t("outputs")} empty={t("empty")} />
        <PaymentChart title={t("hourlyByComponent")} values={charts.hourlyByComponent} empty={t("empty")} formatLabel={(label) => t(`components.${label}`)} />
      </div>
    </>}
  </section>;
}
