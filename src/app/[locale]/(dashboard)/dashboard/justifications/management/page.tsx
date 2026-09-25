'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  RotateCcw,
  Search,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useActiveRole } from '@/context/ActiveRoleContext';
import { apiFetch } from '@/lib/api';
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import JustificationStatusBadge from '@/components/dashboard/justifications/JustificationStatusBadge';
import JustificationDetailModal from '@/components/dashboard/justifications/JustificationDetailModal';
import PaginationControls from '@/components/ui/PaginationControls';
import type {
  Justification,
  JustificationReasonCategory,
  JustificationStatus,
} from '@/types/justifications';

type StatusFilter = 'ALL' | JustificationStatus;
type ReasonFilter = 'ALL' | JustificationReasonCategory;

const STATUS_VALUES: StatusFilter[] = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'];
const REASON_VALUES: ReasonFilter[] = [
  'ALL',
  'MEDICAL',
  'FAMILY_DEATH',
  'PERSONAL',
  'ACADEMIC',
  'OTHER',
];
const PAGE_SIZE = 10;

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return value;
  }
}

function getMonthKey(value: string): string {
  try {
    return new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(new Date(value));
  } catch {
    return value;
  }
}

function getWeekKey(value: string): string {
  try {
    const date = new Date(value);
    const day = date.getDay() || 7;
    date.setDate(date.getDate() - day + 1);
    return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short' }).format(date);
  } catch {
    return value;
  }
}

function countBy(
  items: Justification[],
  getKey: (item: Justification) => string,
): [string, number][] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
}

export default function JustificationsManagementPage() {
  const t = useTranslations('JustificationsManagementPage');
  const tDetail = useTranslations('JustificationsPage.detail');
  const { activeRole } = useActiveRole();

  const [justifications, setJustifications] = useState<Justification[]>([]);
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [reason, setReason] = useState<ReasonFilter>('ALL');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedJustification, setSelectedJustification] = useState<Justification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJustifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Justification[]>('/justifications');
      setJustifications(data);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t('errors.history');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeRole === 'SYSTEM_ADMIN' || activeRole === 'ACADEMIC_SECRETARY') {
      void loadJustifications();
    }
  }, [activeRole]);

  const filtered = useMemo(() => {
    return justifications.filter((item) => {
      const itemDate = new Date(item.absenceDate).getTime();
      const matchesStatus = status === 'ALL' || item.status === status;
      const matchesReason = reason === 'ALL' || item.reasonCategory === reason;
      const matchesSearch =
        !search ||
        `${item.studentEmail} ${item.subjectName} ${item.subjectCode ?? ''} ${item.nrc ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase().trim());
      const matchesFrom = !from || itemDate >= new Date(`${from}T00:00:00`).getTime();
      const matchesTo = !to || itemDate <= new Date(`${to}T23:59:59`).getTime();

      return matchesStatus && matchesReason && matchesSearch && matchesFrom && matchesTo;
    });
  }, [from, justifications, reason, search, status, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const monthCounts = useMemo(
    () => countBy(filtered, (item) => getMonthKey(item.absenceDate)),
    [filtered],
  );
  const weekCounts = useMemo(
    () => countBy(filtered, (item) => getWeekKey(item.absenceDate)),
    [filtered],
  );
  const reasonCounts = useMemo(
    () => countBy(filtered, (item) => item.reasonCategory ?? 'OTHER'),
    [filtered],
  );

  const openEvidence = async (id: string) => {
    try {
      const result = await apiFetch<{ downloadUrl: string }>(`/justifications/${id}/evidence-url`);
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : tDetail('evidence');
      toast.error(message);
    }
  };

  const handleResetFilters = () => {
    setStatus('ALL');
    setReason('ALL');
    setSearch('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const hasActiveFilters =
    status !== 'ALL' || reason !== 'ALL' || Boolean(search) || Boolean(from) || Boolean(to);

  if (activeRole === null) {
    return (
      <div className="py-20 text-center text-sm font-medium text-muted-foreground">
        {t('loading')}
      </div>
    );
  }

  if (activeRole !== 'SYSTEM_ADMIN' && activeRole !== 'ACADEMIC_SECRETARY') {
    return (
      <div className="py-20 text-center text-sm font-medium text-muted-foreground">
        {t('errors.access')}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        eyebrow={t('eyebrow')}
        title={t('history.title')}
        subtitle={t('history.subtitle')}
      />

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={BarChart3}
          label={t('historyStats.total')}
          value={filtered.length}
        />
        <MetricCard
          icon={Clock3}
          label={t('historyStats.pending')}
          value={filtered.filter((item) => item.status === 'PENDING').length}
          tone="accent"
        />
        <MetricCard
          icon={CheckCircle2}
          label={t('historyStats.accepted')}
          value={filtered.filter((item) => item.status === 'ACCEPTED').length}
          tone="secondary"
        />
        <MetricCard
          icon={XCircle}
          label={t('historyStats.rejected')}
          value={filtered.filter((item) => item.status === 'REJECTED').length}
          tone="destructive"
        />
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              type="search"
              placeholder={t('history.search')}
              className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </div>

          <select
            aria-label={t('history.allStatuses')}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as StatusFilter);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
          >
            {STATUS_VALUES.map((value) => (
              <option key={value} value={value}>
                {value === 'ALL'
                  ? t('history.allStatuses')
                  : t(`statuses.${value.toLowerCase()}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>

          <select
            aria-label={t('history.allReasons')}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value as ReasonFilter);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
          >
            {REASON_VALUES.map((value) => (
              <option key={value} value={value}>
                {value === 'ALL'
                  ? t('history.allReasons')
                  : t(`reasonCategories.${value}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              aria-label={t('history.from')}
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
              type="date"
              className="h-10 min-w-0 w-full rounded-xl border border-border bg-background px-2 text-xs text-foreground outline-none transition focus:border-primary"
            />
            <input
              aria-label={t('history.to')}
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
              type="date"
              className="h-10 min-w-0 w-full rounded-xl border border-border bg-background px-2 text-xs text-foreground outline-none transition focus:border-primary"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t('history.clearFilters')}</span>
            </button>
          </div>
        )}
      </section>

      {loading ? (
        <div className="animate-pulse rounded-3xl bg-muted px-4 py-16 text-center text-sm font-medium text-muted-foreground">
          {t('loading')}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
          {t('history.empty')}
        </div>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-3">
            <AnalyticsList
              title={t('history.topMonths')}
              items={monthCounts}
              icon={CalendarDays}
            />
            <AnalyticsList
              title={t('history.topWeeks')}
              items={weekCounts}
              icon={CalendarDays}
            />
            <AnalyticsList
              title={t('history.topReasons')}
              items={reasonCounts.map(([key, count]) => [
                key === 'OTHER'
                  ? t('reasonCategories.OTHER')
                  : t(`reasonCategories.${key}` as Parameters<typeof t>[0]),
                count,
              ])}
              icon={BarChart3}
            />
          </section>

          <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4">{t('history.period')}</th>
                    <th className="px-5 py-4">{t('history.subject')}</th>
                    <th className="px-5 py-4">{t('detail.nrc')}</th>
                    <th className="px-5 py-4">{t('detail.student')}</th>
                    <th className="px-5 py-4">{t('history.allReasons')}</th>
                    <th className="px-5 py-4">{t('history.allStatuses')}</th>
                    <th className="px-5 py-4 text-right">{t('history.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedJustification(item)}
                      className="cursor-pointer transition hover:bg-muted/40"
                    >
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatDate(item.absenceDate)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {item.subjectName}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {item.nrc ?? '—'}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {item.studentEmail}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {item.reasonCategory
                          ? t(`reasonCategories.${item.reasonCategory}` as Parameters<typeof t>[0])
                          : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <JustificationStatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:underline">
                          <Eye className="h-3.5 w-3.5" />
                          <span>{t('history.view')}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-border p-4">
              <PaginationControls
                page={page}
                totalPages={totalPages}
                totalItems={filtered.length}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          </section>
        </>
      )}

      <JustificationDetailModal
        item={selectedJustification}
        isOpen={Boolean(selectedJustification)}
        onClose={() => setSelectedJustification(null)}
        onEvidence={openEvidence}
        mode="view"
      />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone?: 'default' | 'accent' | 'secondary' | 'destructive';
}) {
  const toneClasses = {
    default: 'bg-primary/10 text-primary',
    accent: 'bg-accent/15 text-accent',
    secondary: 'bg-secondary/15 text-secondary',
    destructive: 'bg-coral-red/15 text-coral-red',
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

function AnalyticsList({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: [string, number][];
  icon: LucideIcon;
}) {
  const t = useTranslations('JustificationsManagementPage.history');
  const max = items[0]?.[1] ?? 1;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="font-bold text-foreground">{title}</h2>
      </div>

      <div className="mt-4 space-y-3.5">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noData')}</p>
        ) : (
          items.map(([label, value]) => (
            <div key={label}>
              <div className="flex justify-between gap-3 text-xs">
                <span className="truncate text-muted-foreground">{label}</span>
                <span className="font-bold text-foreground">{value}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.max(8, (value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
