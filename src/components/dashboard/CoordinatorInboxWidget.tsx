'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ClipboardCheck } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { apiFetch } from '@/lib/api';

type InboxEntry = { id: string; studentEmail: string; subjectName: string; absenceDate: string; createdAt: string };

export default function CoordinatorInboxWidget() {
  const t = useTranslations('DashboardViews.teachingSupportCoordinator');
  const locale = useLocale();
  const [entries, setEntries] = useState<InboxEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void apiFetch<InboxEntry[]>('/justifications/inbox')
      .then((result) => { if (active) setEntries(result.slice(0, 3)); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  return <div className="space-y-3 text-xs" aria-live="polite">
    {error ? <p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-rose-700 dark:text-rose-300">{t('tasks.error')}</p>
      : entries === null ? <p className="rounded-xl bg-muted/40 p-3 text-muted-foreground">{t('tasks.loading')}</p>
        : entries.length === 0 ? <p className="rounded-xl bg-muted/40 p-3 text-muted-foreground">{t('tasks.empty')}</p>
          : entries.map((entry) => <article key={entry.id} className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="font-bold text-foreground">{entry.subjectName}</p>
            <p className="mt-1 text-muted-foreground">{entry.studentEmail}</p>
            <p className="mt-1 text-muted-foreground">{new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(entry.absenceDate))}</p>
          </article>)}
    <Link href="/dashboard/justifications" className="inline-flex items-center gap-2 font-semibold text-ocean-cyan hover:underline"><ClipboardCheck className="h-4 w-4"/>{t('tasks.openInbox')}</Link>
  </div>;
}
