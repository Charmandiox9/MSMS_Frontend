'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import StatCard from '@/components/dashboard/widgets/StatCard';

type Metric = { key: string; title: string; description: string; icon: LucideIcon };

export default function RoleDashboardStats({ endpoint, metrics }: { endpoint: string; metrics: Metric[] }) {
  const t = useTranslations('Dashboard');
  const [values, setValues] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void apiFetch<Record<string, number>>(endpoint)
      .then((result) => { if (active) setValues(result); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint]);

  return <>
    {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{t('metricsError')}</p>}
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-busy={loading}>
      {metrics.map(({ key, ...metric }) => <StatCard key={key} {...metric} value={loading ? '…' : values?.[key] ?? '—'} />)}
    </div>
  </>;
}
