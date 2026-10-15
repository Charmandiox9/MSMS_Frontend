"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BarChart3, BookOpen, FlaskConical, FolderKanban, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { createApiGraphqlClient } from '@/lib/graphql-client';
import { ACADEMIC_CHARTS, unpackReport } from '@/lib/academic-analytics';
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

function DistributionChart({ title, values, empty, formatLabel = (label: string) => label, selectedLabel, onSelect }: {
  title: string;
  values: { label: string; value: number }[];
  empty: string;
  formatLabel?: (label: string) => string;
  selectedLabel?: string;
  onSelect?: (label: string) => void;
}) {
  const chartData = values.map((item) => ({ ...item, displayLabel: formatLabel(item.label) }));
  return <ChartPanel title={title} empty={!values.length ? empty : undefined}>
    <div className="mt-3 h-72" role="img" aria-label={title}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart accessibilityLayer>
          <Pie data={chartData} dataKey="value" nameKey="displayLabel" innerRadius="55%" outerRadius="78%" paddingAngle={2} stroke="none">
            {values.map((item, index) => <Cell key={item.label} fill={chartColors[index % chartColors.length]} fillOpacity={selectedLabel && selectedLabel !== item.label ? 0.35 : 1} cursor={onSelect ? "pointer" : undefined} onClick={() => onSelect?.(item.label)} />)}
          </Pie>
          <Tooltip content={<ChartTooltip />} formatter={(value) => new Intl.NumberFormat("es-CL").format(Number(value ?? 0))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
    {onSelect && <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={title}>{chartData.map((item, index) => <button key={item.label} type="button" aria-pressed={selectedLabel === item.label} onClick={() => onSelect(item.label)} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${selectedLabel === item.label ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />{item.displayLabel} <strong>{item.value}</strong></button>)}</div>}
  </ChartPanel>;
}

function TrendChart({ title, researchValues, outputValues, researchLabel, outputLabel, empty, selectedYear, onYearSelect }: {
  title: string;
  researchValues: { label: string; value: number }[];
  outputValues: { label: string; value: number }[];
  researchLabel: string;
  outputLabel: string;
  empty: string;
  selectedYear?: string;
  onYearSelect?: (year: string) => void;
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
        <LineChart data={data} accessibilityLayer margin={{ top: 10, right: 16, bottom: 4, left: 0 }} onClick={(state) => { if (state?.activeLabel !== undefined) onYearSelect?.(String(state.activeLabel)); }}>
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
    {onYearSelect && <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={title}>{years.map((year) => <button key={year} type="button" aria-pressed={selectedYear === year} onClick={() => onYearSelect(year)} className={`rounded-full border px-3 py-1.5 text-xs ${selectedYear === year ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>{year}</button>)}</div>}
  </ChartPanel>;
}

const budgetFields = ["totalAmount", "vraContribution", "vridtContribution", "recoveryAmount", "facultyContribution", "depreciationAmount", "profitabilityAmount"] as const;
type FundingTranslationKey = `funding.${typeof budgetFields[number]}` | "funding.title" | "funding.fundingSource";

function BudgetCharts({ rows, title, empty, t, selectedYear, onYearSelect, selectedMonth, onMonthSelect, selectedFundingField, onFundingSelect, monthlyTitle, monthlyBasis, noMonthlyData, unassignedLabel, backToYears, locale }: { rows: Row[]; title: string; empty: string; t: (key: FundingTranslationKey) => string; selectedYear?: string; onYearSelect: (year: string) => void; selectedMonth?: string; onMonthSelect: (month: string) => void; selectedFundingField?: string; onFundingSelect: (field: string) => void; monthlyTitle: string; monthlyBasis: string; noMonthlyData: string; unassignedLabel: (count: number) => string; backToYears: string; locale: string }) {
  const visibleRows = rows.filter((row) =>
    (!selectedYear || String(row.reportingYear ?? "") === selectedYear) &&
    (!selectedMonth || (typeof row.startsOn === "string" && row.startsOn.startsWith(`${selectedYear}-`) && row.startsOn.slice(5, 7) === selectedMonth)),
  );
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
  if (!rows.length || !entries.length) return <ChartPanel title={title} empty={empty} />;
  const money = (value: Row[string], currency: string) => currencyFormat(currency).format(Number(value ?? 0));
  return <section className="space-y-4 rounded-2xl border border-border bg-card p-5 lg:col-span-2">
    <h2 className="text-base font-bold">{title}</h2>
    <div className="grid gap-5 xl:grid-cols-2">
      {entries.map(({ currency, data, total }) => {
        const yearRows = rows.filter((row) => row.currency === currency && (!selectedYear || String(row.reportingYear ?? "") === selectedYear));
        const allocation = budgetFields.map((field) => ({ label: t(`funding.${field}`), value: rows.filter((row) => row.currency === currency).reduce((sum, row) => sum + Number(row[field] ?? 0), 0) })).filter(({ value }) => value > 0);
        const monthlyTotals = new Map<string, number>();
        if (selectedYear) for (const row of yearRows) {
          const month = typeof row.startsOn === "string" && row.startsOn.startsWith(`${selectedYear}-`) ? row.startsOn.slice(5, 7) : null;
          if (month) monthlyTotals.set(month, (monthlyTotals.get(month) ?? 0) + Number(row.totalAmount ?? 0));
        }
        const monthlyData = [...monthlyTotals].sort(([left], [right]) => left.localeCompare(right)).map(([month, amount]) => ({ month, amount }));
        const unassignedCount = yearRows.filter((row) => typeof row.startsOn !== "string" || !row.startsOn.startsWith(`${selectedYear}-`)).length;
        return <div key={currency} className="min-w-0 rounded-xl border border-border/70 p-4">
          <div className="mb-1 flex items-baseline justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{currency}</p><strong className="text-sm tabular-nums">{currencyFormat(currency).format(selectedYear ? yearRows.reduce((sum, row) => sum + Number(row.totalAmount ?? 0), 0) : total)}</strong></div>
          {selectedYear ? <><div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">{monthlyTitle}</h3><button type="button" className="text-xs text-primary underline underline-offset-4" onClick={() => { onYearSelect(selectedYear); onMonthSelect(""); }}>{backToYears}</button></div><p className="mb-2 text-xs text-muted-foreground">{monthlyBasis}</p>{monthlyData.length ? <div className="h-56" role="img" aria-label={`${monthlyTitle} · ${currency}`}>
            <ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyData} accessibilityLayer margin={{ top: 8, right: 12, bottom: 4, left: 0 }} onClick={(state) => { if (state?.activeLabel !== undefined) onMonthSelect(String(state.activeLabel)); }}>
              <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" /><XAxis dataKey="month" tick={{ fill: chartTextColor, fontSize: 11 }} tickFormatter={(value) => new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(Number(selectedYear), Number(value) - 1, 1)))} /><YAxis width={72} tick={{ fill: chartTextColor, fontSize: 10 }} tickFormatter={(value) => currencyFormat(currency).format(Number(value))} /><Tooltip content={<ChartTooltip formatValue={(value) => currencyFormat(currency).format(value)} />} /><Bar dataKey="amount" name={currency} radius={[5, 5, 0, 0]}>{monthlyData.map((item) => <Cell key={item.month} fill={chartColors[0]} fillOpacity={selectedMonth && selectedMonth !== item.month ? 0.35 : 1} cursor="pointer" onClick={() => onMonthSelect(item.month)} />)}</Bar>
            </BarChart></ResponsiveContainer>
          </div> : <p className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">{noMonthlyData}</p>}{unassignedCount > 0 && <p className="mt-2 text-xs text-muted-foreground">{unassignedLabel(unassignedCount)}</p>}{monthlyData.length > 0 && <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={monthlyTitle}>{monthlyData.map(({ month }) => <button key={month} type="button" aria-pressed={selectedMonth === month} onClick={() => onMonthSelect(month)} className={`rounded-full border px-3 py-1.5 text-xs ${selectedMonth === month ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>{new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(Number(selectedYear), Number(month) - 1, 1)))}</button>)}</div>}</> : <div className="h-56" role="img" aria-label={`${title} · ${currency}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} accessibilityLayer margin={{ top: 10, right: 12, bottom: 4, left: 0 }} onClick={(state) => { if (state?.activeLabel !== undefined) onYearSelect(String(state.activeLabel)); }}>
                <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fill: chartTextColor, fontSize: 12 }} />
                <YAxis width={72} tick={{ fill: chartTextColor, fontSize: 11 }} tickFormatter={(value) => currencyFormat(currency).format(Number(value))} />
                <Tooltip content={<ChartTooltip formatValue={(value) => currencyFormat(currency).format(value)} />} />
                <Area type="monotone" dataKey="amount" name={currency} stroke={chartColors[0]} fill={chartColors[0]} fillOpacity={0.18} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>}
          {!selectedYear && <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label={`${title} · ${currency}`}>{data.map(({ year }) => <button key={year} type="button" aria-pressed={selectedYear === year} onClick={() => { onYearSelect(year); onMonthSelect(""); }} className={`rounded-full border px-3 py-1 text-xs ${selectedYear === year ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>{year}</button>)}</div>}
          <h3 className="mt-3 text-sm font-semibold">{t("funding.totalAmount")}</h3>
          {allocation.length ? <div className="mt-1 h-56" role="img" aria-label={`${t("funding.totalAmount")} · ${currency}`}>
            <ResponsiveContainer width="100%" height="100%"><BarChart data={allocation} layout="vertical" accessibilityLayer margin={{ top: 4, right: 12, bottom: 4, left: 8 }}>
              <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tick={{ fill: chartTextColor, fontSize: 10 }} tickFormatter={(value) => currencyFormat(currency).format(Number(value))} /><YAxis type="category" dataKey="label" width={112} tick={{ fill: chartTextColor, fontSize: 10 }} /><Tooltip content={<ChartTooltip formatValue={(value) => currencyFormat(currency).format(value)} />} /><Bar dataKey="value" name={currency} radius={[0, 5, 5, 0]}>{allocation.map((item, index) => { const field = budgetFields.find((candidate) => t(`funding.${candidate}`) === item.label); return <Cell key={item.label} fill={chartColors[(index + 1) % chartColors.length]} fillOpacity={selectedFundingField && selectedFundingField !== field ? 0.35 : 1} cursor="pointer" onClick={() => field && onFundingSelect(field)} />; })}</Bar>
            </BarChart></ResponsiveContainer>
          </div> : <p className="py-8 text-sm text-muted-foreground">{empty}</p>}
          {allocation.length > 0 && <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label={t("funding.totalAmount")}>{allocation.map((item) => { const field = budgetFields.find((candidate) => t(`funding.${candidate}`) === item.label); return field ? <button key={field} type="button" aria-pressed={selectedFundingField === field} onClick={() => onFundingSelect(field)} className={`rounded-full border px-3 py-1 text-xs ${selectedFundingField === field ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>{item.label} · {currencyFormat(currency).format(item.value)}</button> : null; })}</div>}
        </div>;
      })}
    </div>
    <div className="overflow-x-auto rounded-xl border border-border/70">
      <table className="min-w-[1050px] w-full text-left text-xs"><thead className="bg-muted/40 text-muted-foreground"><tr>{["title", "fundingSource", ...budgetFields].map((field) => <th key={field} className="px-3 py-2 font-semibold">{t(`funding.${field}` as FundingTranslationKey)}</th>)}</tr></thead>
        <tbody>{visibleRows.map((row, index) => <tr key={`${String(row.code ?? row.title)}-${index}`} className="border-t border-border/70"><td className="max-w-64 px-3 py-2 font-medium">{String(row.title ?? "—")}</td><td className="px-3 py-2">{String(row.fundingSource ?? "—")}</td>{budgetFields.map((field) => <td key={field} className="whitespace-nowrap px-3 py-2 tabular-nums">{money(row[field], String(row.currency ?? "CLP"))}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </section>;
}

function PaymentChart({ title, values, empty, formatLabel, selectedComponent, onSelect }: {
  title: string;
  values: { label: string; value: number }[];
  empty: string;
  formatLabel: (label: string) => string;
  selectedComponent?: string;
  onSelect: (component: string) => void;
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
          <Bar dataKey="amount" name={title} radius={[0, 5, 5, 0]}>{values.map((item, index) => <Cell key={item.label} fill={chartColors[(index + 1) % chartColors.length]} fillOpacity={selectedComponent && selectedComponent !== item.label ? 0.35 : 1} cursor="pointer" onClick={() => onSelect(item.label)} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={title}>{values.map(({ label, value }, index) => <button key={label} type="button" aria-pressed={selectedComponent === label} onClick={() => onSelect(label)} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${selectedComponent === label ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColors[(index + 1) % chartColors.length] }} />{formatLabel(label)} <strong>{currencyFormat("CLP").format(value)}</strong></button>)}</div>
  </ChartPanel>;
}

export default function AcademicCharts() {
  const t = useTranslations("ChartsPage");
  const locale = useLocale() === "es" ? "es-CL" : "en-US";
  const { activeRole } = useActiveRole();
  const [graphqlClient] = useState(createApiGraphqlClient);
  const allowed = activeRole === "SYSTEM_ADMIN" || activeRole === "ACADEMIC_SECRETARY" || activeRole === "ACADEMIC_PROCESS_ANALYST";
  const [year, setYear] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("");
  const [outputKindFilter, setOutputKindFilter] = useState("");
  const [fundingFieldFilter, setFundingFieldFilter] = useState("");
  const [hourlyComponentFilter, setHourlyComponentFilter] = useState("");
  const [budgetMonthFilter, setBudgetMonthFilter] = useState("");
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const selectYear = (value: string) => {
    if (!/^\d{4}$/.test(value) || Number(value) < 1900 || Number(value) > 2200) return;
    setYear((current) => current === value ? '' : value); setBudgetMonthFilter('');
  };

  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    void graphqlClient.query({ query: ACADEMIC_CHARTS, variables: { filters: {
      ...(year ? { reportingYear: Number(year) } : {}), ...(startsOn ? { startsOn } : {}),
      ...(endsOn ? { endsOn } : {}), ...(semesterId ? { semesterId } : {}),
    } }, fetchPolicy: 'no-cache', context: { fetchOptions: { signal: controller.signal } } }).then((result) => {
      if (controller.signal.aborted) return;
      if (!result.data) throw new Error('EMPTY_RESPONSE');
      const summary = result.data.academicCharts;
      setData({ projects: unpackReport(summary.projects),
        research: { columns: [], rows: summary.researchByYear.map(({ label, value }) => ({ year: label || t('unknownDate'), count: Number(value) })) },
        researchOutputs: { columns: [], rows: summary.outputs },
        hourlyContracts: { columns: [], rows: summary.hourlyByComponent.map(({ label, value, count }) => ({ component: label, estimatedPaymentClp: value, count })) },
      });
      setSemesters(summary.semesters);
    }).catch(() => {
      if (!controller.signal.aborted) { setData(null); setError(true); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [allowed, graphqlClient, year, startsOn, endsOn, semesterId, retry, t]);

  const visibleProjectRows = useMemo(() => (data?.projects.rows ?? []).filter((row) =>
    (!projectStatusFilter || row.status === projectStatusFilter) &&
    (!fundingFieldFilter || Number(row[fundingFieldFilter] ?? 0) > 0),
  ), [data, projectStatusFilter, fundingFieldFilter]);
  const visibleOutputRows = useMemo(() => (data?.researchOutputs.rows ?? []).filter((row) =>
    !outputKindFilter || row.kind === outputKindFilter,
  ), [data, outputKindFilter]);
  const visibleHourlyRows = useMemo(() => (data?.hourlyContracts.rows ?? []).filter((row) =>
    !hourlyComponentFilter || row.component === hourlyComponentFilter,
  ), [data, hourlyComponentFilter]);
  const charts = useMemo(() => {
    if (!data) return null;
    return {
      projectStatuses: aggregate(data.projects.rows, "status"),
      outputKinds: aggregate(data.researchOutputs.rows, "kind", 'count'),
      outputsByYear: aggregate(visibleOutputRows, "reportingYear", 'count'),
      researchByYear: aggregate(data.research.rows, 'year', 'count'),
      hourlyByComponent: aggregate(visibleHourlyRows, "component", "estimatedPaymentClp"),
    };
  }, [data, visibleOutputRows, visibleHourlyRows]);
  const hasChartFilters = Boolean(year || budgetMonthFilter || projectStatusFilter || outputKindFilter || fundingFieldFilter || hourlyComponentFilter);
  const activeBudgetMonth = budgetMonthFilter && year
    ? new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(Number(year), Number(budgetMonthFilter) - 1, 1)))
    : budgetMonthFilter;
  const metrics: { Icon: LucideIcon; label: string; value: number }[] = data ? [
    { Icon: FolderKanban, label: t("projects"), value: visibleProjectRows.length },
    { Icon: FlaskConical, label: t("research"), value: data.research.rows.reduce((sum, row) => sum + Number(row.count ?? 0), 0) },
    { Icon: BookOpen, label: t("outputs"), value: visibleOutputRows.reduce((sum, row) => sum + Number(row.count ?? 0), 0) },
    { Icon: Wallet, label: t("hourlyContracts"), value: visibleHourlyRows.reduce((sum, row) => sum + Number(row.count ?? 0), 0) },
  ] : [];

  if (!activeRole) return <PageSkeleton label={t("loading")} />;
  if (!allowed) return <p role="alert" className="py-12 text-muted-foreground">{t("access")}</p>;
  return <section className="space-y-6">
    <header><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{t("eyebrow")}</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-black"><BarChart3 className="h-7 w-7 text-primary" />{t("title")}</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t("subtitle")}</p></header>
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-2 text-xs font-semibold text-muted-foreground">{t("year")}<input className={filterClass} type="number" min={1900} max={2200} value={year} onChange={(event) => setYear(event.target.value)} /></label>
      <label className="grid gap-2 text-xs font-semibold text-muted-foreground">{t("semester")}<select className={filterClass} value={semesterId} onChange={(event) => setSemesterId(event.target.value)}><option value="">{t("allSemesters")}</option>{semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}</select></label>
      <label className="grid gap-2 text-xs font-semibold text-muted-foreground">{t("budgetFrom")}<input className={filterClass} type="date" max={endsOn || undefined} value={startsOn} onChange={(event) => setStartsOn(event.target.value)} /></label>
      <label className="grid gap-2 text-xs font-semibold text-muted-foreground">{t("budgetTo")}<input className={filterClass} type="date" min={startsOn || undefined} value={endsOn} onChange={(event) => setEndsOn(event.target.value)} /></label>
    </div>
    {hasChartFilters && <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm" role="status"><span className="font-semibold">{t("activeChartFilters")}</span>{year && <span className="rounded-full bg-background px-3 py-1">{t("year")}: {year}</span>}{budgetMonthFilter && <span className="rounded-full bg-background px-3 py-1">{t("month")}: {activeBudgetMonth}</span>}{projectStatusFilter && <span className="rounded-full bg-background px-3 py-1">{t("statuses." + projectStatusFilter)} </span>}{outputKindFilter && <span className="rounded-full bg-background px-3 py-1">{t("kinds." + outputKindFilter)}</span>}{fundingFieldFilter && <span className="rounded-full bg-background px-3 py-1">{t(`funding.${fundingFieldFilter}` as FundingTranslationKey)}</span>}{hourlyComponentFilter && <span className="rounded-full bg-background px-3 py-1">{t(`components.${hourlyComponentFilter}`)}</span>}<button type="button" className="ml-auto text-primary underline underline-offset-4" onClick={() => { setYear(""); setBudgetMonthFilter(""); setProjectStatusFilter(""); setOutputKindFilter(""); setFundingFieldFilter(""); setHourlyComponentFilter(""); }}>{t("clearChartFilters")}</button></div>}
    {error ? <div role="alert" className="rounded-2xl border border-destructive/30 p-5 text-destructive">{t("error")} <button type="button" className="ml-2 underline" onClick={() => setRetry((value) => value + 1)}>{t("retry")}</button></div> : loading || !data || !charts ? <div role="status" className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">{t("loading")}</div> : <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ Icon, label, value }) => <article key={label} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-3 text-sm text-muted-foreground"><Icon className="h-5 w-5 text-primary" />{label}</div><p className="mt-4 text-3xl font-black tabular-nums">{new Intl.NumberFormat("es-CL").format(value)}</p></article>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionChart title={t("projectStatuses")} values={charts.projectStatuses} empty={t("empty")} formatLabel={(label) => t(`statuses.${label}`)} selectedLabel={projectStatusFilter} onSelect={(label) => setProjectStatusFilter((current) => current === label ? "" : label)} />
        <BudgetCharts rows={visibleProjectRows} title={t("budgets")} empty={t("empty")} t={(key) => t(key)} selectedYear={year} onYearSelect={selectYear} selectedMonth={budgetMonthFilter} onMonthSelect={(month) => setBudgetMonthFilter((current) => current === month ? "" : month)} selectedFundingField={fundingFieldFilter} onFundingSelect={(field) => setFundingFieldFilter((current) => current === field ? "" : field)} monthlyTitle={t("monthlyBudgetBreakdown", { year })} monthlyBasis={t("monthlyBudgetBasis")} noMonthlyData={t("noMonthlyBudgetData")} unassignedLabel={(count) => t("unassignedBudgetDates", { count })} backToYears={t("backToYears")} locale={locale} />
        <DistributionChart title={t("outputKinds")} values={charts.outputKinds} empty={t("empty")} formatLabel={(label) => t(`kinds.${label}`)} selectedLabel={outputKindFilter} onSelect={(label) => setOutputKindFilter((current) => current === label ? "" : label)} />
        <TrendChart title={t("researchAndOutputsTrend")} researchValues={charts.researchByYear} outputValues={charts.outputsByYear} researchLabel={t("research")} outputLabel={t("outputs")} empty={t("empty")} selectedYear={year} onYearSelect={selectYear} />
        <PaymentChart title={t("hourlyByComponent")} values={charts.hourlyByComponent} empty={t("empty")} formatLabel={(label) => t(`components.${label}`)} selectedComponent={hourlyComponentFilter} onSelect={(label) => setHourlyComponentFilter((current) => current === label ? "" : label)} />
      </div>
    </>}
  </section>;
}
