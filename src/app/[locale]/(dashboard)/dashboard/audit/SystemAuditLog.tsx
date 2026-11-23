'use client';

import { useEffect, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import PaginationControls from '@/components/ui/PaginationControls';
import { useActiveRole } from '@/context/ActiveRoleContext';
import { apiFetch } from '@/lib/api';
import type { PaginatedResponse } from '@/types/pagination';

const actions = [
  'PRELOAD_CREATED',
  'PRELOAD_CANCELLED',
  'ROLE_ASSIGNED',
  'ROLE_REVOKED',
  'ACCOUNT_ACTIVATED',
  'ACCOUNT_DEACTIVATED',
  'ACCOUNT_DELETED',
] as const;
type Action = (typeof actions)[number];
type Account = { id: string; name: string | null };
type AuditEvent = {
  id: string;
  createdAt: string;
  action: Action;
  actor: Account;
  target: Account & { kind: 'account' | 'preload' };
  roleCodes: string[];
};
type AuditResult = PaginatedResponse<AuditEvent>;

export default function SystemAuditLog() {
  const { activeRole } = useActiveRole();
  const t = useTranslations('SystemAudit');

  if (activeRole === null) return <p role="status">{t('loading')}</p>;
  if (activeRole !== 'SYSTEM_ADMIN') return <p>{t('forbidden')}</p>;
  return <AuditEvents />;
}

function AuditEvents() {
  const t = useTranslations('SystemAudit');
  const roleLabels = useTranslations('DashboardNav.roles');
  const format = useFormatter();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<AuditResult | 'error' | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ page: String(page) });
    if (action) query.set('action', action);
    apiFetch<AuditResult>(`/system-audit?${query}`, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setResult(data); })
      .catch(() => { if (!controller.signal.aborted) setResult('error'); });
    return () => controller.abort();
  }, [action, page, retry]);

  function changePage(nextPage: number) {
    setResult(null);
    setPage(nextPage);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border p-4 sm:p-5">
        <h2 className="text-lg font-bold text-foreground">{t('activity')}</h2>
        <label className="grid w-full gap-1.5 text-sm font-semibold sm:w-64">
          {t('filterAction')}
          <select
            className="h-10 min-w-0 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              changePage(1);
            }}
          >
            <option value="">{t('allActions')}</option>
            {actions.map((code) => <option key={code} value={code}>{t(`actions.${code}`)}</option>)}
          </select>
        </label>
      </div>
      {result === null ? (
        <p role="status" className="p-6 text-sm text-muted-foreground">{t('loading')}</p>
      ) : result === 'error' ? (
        <div className="space-y-3 p-6">
          <p role="alert" className="text-sm text-destructive">{t('error')}</p>
          <button
            type="button"
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold"
            onClick={() => {
              setResult(null);
              setRetry((attempt) => attempt + 1);
            }}
          >
            {t('retry')}
          </button>
        </div>
      ) : (
        <>
          {result.items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t(action ? 'noMatches' : 'empty')}</p>
          ) : (
            <div className="overflow-x-auto" role="region" aria-label={t('activity')} tabIndex={0}>
              <table className="w-full min-w-[42rem] text-left text-sm">
                <caption className="sr-only">{t('activity')}</caption>
                <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                  <tr>
                    {(['date', 'action', 'actor', 'target'] as const).map((column) => (
                      <th key={column} scope="col" className="px-4 py-3 font-semibold sm:px-5">{t(`columns.${column}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.items.map((event) => (
                    <tr key={event.id}>
                      <td className="whitespace-nowrap px-4 py-3 align-top text-muted-foreground sm:px-5">
                        <time dateTime={event.createdAt}>
                          {format.dateTime(new Date(event.createdAt), { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Santiago' })}
                        </time>
                      </td>
                      <td className="px-4 py-3 align-top sm:px-5">
                        <p className="font-semibold text-foreground">{t(`actions.${event.action}`)}</p>
                        {event.roleCodes.length > 0 && (
                          <p className="mt-1 break-words text-xs text-muted-foreground">
                            {format.list(event.roleCodes.map((code) =>
                              roleLabels.has(code) ? roleLabels(code) : code,
                            ))}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top sm:px-5">
                        <AccountReference account={event.actor} fallback={t('unknownAccount')} />
                      </td>
                      <td className="px-4 py-3 align-top sm:px-5">
                        <AccountReference account={event.target} fallback={t(event.target.kind === 'preload' ? 'preload' : 'unknownAccount')} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <PaginationControls page={result.page} totalPages={result.totalPages} totalItems={result.total} onPageChange={changePage} variant="tableFooter" />
        </>
      )}
    </section>
  );
}

function AccountReference({ account, fallback }: { account: Account; fallback: string }) {
  return (
    <>
      <p className="font-medium text-foreground">{account.name ?? fallback}</p>
      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{account.id}</p>
    </>
  );
}
