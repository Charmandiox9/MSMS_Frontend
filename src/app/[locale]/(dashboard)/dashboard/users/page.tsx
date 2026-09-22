'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Users, ChevronLeft, ChevronRight, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import PreloadedUsersPanel, { type UserRole } from '@/components/dashboard/users/PreloadedUsersPanel';

type Role = UserRole;
type User = { id: string; name: string; email: string; avatarUrl: string | null; isActive: boolean; roles: Role[] };
type UserPage = { items: User[]; roles: Role[]; total: number; page: number; pageSize: number; totalPages: number };

export default function UsersPage() {
  const t = useTranslations('UsersPage');
  const [data, setData] = useState<UserPage | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [roleChoices, setRoleChoices] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const query = new URLSearchParams({ page: String(page), pageSize: '10', search, role: roleFilter });
      const result = await apiFetch<UserPage>(`/users?${query.toString()}`);
      setData(result);
      setRoleChoices((current) => Object.fromEntries(result.items.map((user) => [user.id, current[user.id] ?? result.roles[0]?.id ?? ''])));
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('errors.load')); }
    finally { setLoading(false); }
  }, [page, search, roleFilter, t]);

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 250); return () => window.clearTimeout(timer); }, [load]);

  const mutateRole = async (user: User, role: Role, assign: boolean) => {
    const key = `${user.id}:${role.id}`; setBusy(key);
    try {
      const request = assign
        ? apiFetch(`/users/${user.id}/roles`, { method: 'POST', body: JSON.stringify({ roleId: role.id }) })
        : apiFetch(`/users/${user.id}/roles/${role.id}`, { method: 'DELETE' });
      await toast.promise(request, {
        loading: t(assign ? 'notifications.assigning' : 'notifications.revoking'),
        success: t(assign ? 'notifications.assigned' : 'notifications.revoked', { role: role.name, user: user.name }),
        error: (cause) => cause instanceof Error ? cause.message : t('errors.update'),
      });
      await load();
    } catch {
      // Sonner presents the request error to the administrator.
    }
    finally { setBusy(null); }
  };

  return (
    <section className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-ocean-cyan">{t('eyebrow')}</p><h1 className="text-3xl font-black tracking-tight text-foreground">{t('title')}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t('subtitle')}</p></div>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground"><Users className="h-4 w-4 text-ocean-cyan"/><span>{t('count', { count: data?.total ?? 0 })}</span></div>
      </header>

      <div className="grid gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
        <label className="relative block"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t('search')} aria-label={t('search')} className="w-full rounded-2xl border border-border bg-background py-3 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-ocean-cyan focus:ring-2 focus:ring-ocean-cyan/20"/></label>
        <select value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }} aria-label={t('filterRole')} className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-ocean-cyan focus:ring-2 focus:ring-ocean-cyan/20"><option value="">{t('allRoles')}</option>{data?.roles.map((role) => <option key={role.id} value={role.code}>{role.name}</option>)}</select>
      </div>

      <PreloadedUsersPanel roles={data?.roles ?? []} />
      {error && <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</div>}

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {loading ? <div className="space-y-4 p-6" aria-live="polite"><p className="text-sm text-muted-foreground">{t('loading')}</p>{[0,1,2].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-muted"/>)}</div>
          : !data?.items.length ? <div className="px-6 py-16 text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ocean-cyan/10 text-ocean-cyan"><Users className="h-6 w-6"/></div><h2 className="font-bold text-foreground">{t('emptyTitle')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('emptyDescription')}</p></div>
          : <>
            <div className="hidden grid-cols-[minmax(220px,1.5fr)_minmax(200px,1fr)_minmax(260px,1.4fr)] gap-4 border-b border-border bg-muted/40 px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:grid"><span>{t('userColumn')}</span><span>{t('rolesColumn')}</span><span>{t('actionsColumn')}</span></div>
            <ul className="divide-y divide-border">{data.items.map((user) => <li key={user.id} className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(220px,1.5fr)_minmax(200px,1fr)_minmax(260px,1.4fr)] md:items-center md:px-6">
              <div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ocean-cyan/10 text-ocean-cyan">{user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover"/> : <UserRound className="h-5 w-5"/>}</div><div className="min-w-0"><p className="truncate font-semibold text-foreground">{user.name}</p><p className="truncate text-sm text-muted-foreground">{user.email}</p><span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${user.isActive ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>{t(user.isActive ? 'active' : 'inactive')}</span></div></div>
              <div className="flex flex-wrap gap-1.5">{user.roles.length ? user.roles.map((role) => <span key={role.id} className="inline-flex items-center gap-1 rounded-full bg-ocean-cyan/10 px-2.5 py-1 text-xs font-semibold text-ocean-deep dark:text-ocean-cyan"><ShieldCheck className="h-3 w-3"/>{role.name}</span>) : <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">{t('noRoles')}</span>}</div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"><div className="flex min-w-0 flex-1 gap-2"><select aria-label={t('chooseRole', { user: user.name })} value={roleChoices[user.id] ?? ''} onChange={(event) => setRoleChoices((choices) => ({ ...choices, [user.id]: event.target.value }))} className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground">{data.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><button type="button" disabled={!roleChoices[user.id] || user.roles.some((role) => role.id === roleChoices[user.id]) || busy !== null} onClick={() => { const role = data.roles.find((item) => item.id === roleChoices[user.id]); if (role) void mutateRole(user, role, true); }} className="rounded-xl bg-ucn-navy px-3 py-2 text-xs font-bold text-white transition hover:bg-ucn-navy/90 disabled:cursor-not-allowed disabled:opacity-40">{t('assign')}</button></div>
                <div className="flex flex-wrap gap-1">{user.roles.map((role) => <button key={role.id} type="button" disabled={busy !== null} onClick={() => void mutateRole(user, role, false)} title={t('revokeRole', { role: role.name })} className="rounded-xl border border-border px-2.5 py-2 text-xs font-semibold text-muted-foreground transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-700 disabled:opacity-50">{t('revoke')} {role.name}</button>)}</div></div>
            </li>)}</ul>
            <footer className="flex flex-col gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">{t('pagination', { page: data.page, totalPages: Math.max(1, data.totalPages), total: data.total })}</p><div className="flex items-center gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label={t('previous')} className="rounded-xl border border-border p-2 text-foreground hover:bg-muted disabled:opacity-40"><ChevronLeft className="h-4 w-4"/></button><span className="min-w-8 text-center text-sm font-semibold text-foreground">{data.page}</span><button type="button" disabled={page >= data.totalPages} onClick={() => setPage((current) => current + 1)} aria-label={t('next')} className="rounded-xl border border-border p-2 text-foreground hover:bg-muted disabled:opacity-40"><ChevronRight className="h-4 w-4"/></button></div></footer>
          </>}
      </div>
    </section>
  );
}
