'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Users, ChevronLeft, ChevronRight, ShieldCheck, UserRound, UserPlus, UserMinus, Power, Trash2 } from 'lucide-react';
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
  const [accountBusy, setAccountBusy] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ page: String(page), pageSize: '10', search, role: roleFilter });
      const result = await apiFetch<UserPage>(`/users?${query.toString()}`, { cache: 'no-store' });
      setData(result);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('errors.load')); }
    finally { if (showLoading) setLoading(false); }
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
      let pageWillChange = false;
      if (!assign && roleFilter === role.code && data) {
        const lastPage = Math.max(1, Math.ceil((data.total - 1) / data.pageSize));
        if (page > lastPage) { setPage(lastPage); pageWillChange = true; }
      }
      setData((current) => {
        if (!current) return current;
        const items = current.items.map((item) => {
          if (item.id !== user.id) return item;
          const roles = assign
            ? [...item.roles, role]
            : item.roles.filter((itemRole) => itemRole.id !== role.id);
          return { ...item, roles };
        });
        const changedUser = items.find((item) => item.id === user.id);
        const shouldRemoveFromRoleFilter = roleFilter && changedUser &&
          !changedUser.roles.some((itemRole) => itemRole.code === roleFilter);
        const visibleItems = shouldRemoveFromRoleFilter
          ? items.filter((item) => item.id !== user.id)
          : items;
        const total = shouldRemoveFromRoleFilter ? Math.max(0, current.total - 1) : current.total;
        return {
          ...current,
          items: visibleItems,
          total,
          totalPages: Math.max(1, Math.ceil(total / current.pageSize)),
        };
      });
      // Actualiza filtros y datos derivados en segundo plano; no reemplaza la tabla por el loader.
      if (!pageWillChange) await load(false);
    } catch {
      // Sonner presents the request error to the administrator.
    }
    finally { setBusy(null); }
  };

  const setUserActive = async (user: User) => {
    const isActive = !user.isActive;
    setAccountBusy(user.id);
    try {
      await toast.promise(apiFetch(`/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }), {
        loading: t(isActive ? 'notifications.activating' : 'notifications.deactivating'),
        success: t(isActive ? 'notifications.activated' : 'notifications.deactivated', { user: user.name }),
        error: (cause) => cause instanceof Error ? cause.message : t('errors.updateStatus'),
      });
      setData((current) => current && ({
        ...current,
        items: current.items.map((item) => item.id === user.id ? { ...item, isActive } : item),
      }));
      await load(false);
    } catch {
      // Sonner presenta el error de la operación.
    } finally {
      setAccountBusy(null);
    }
  };

  const permanentlyDeleteUser = async () => {
    if (!deleteTarget) return;
    const user = deleteTarget;
    setAccountBusy(user.id);
    try {
      await toast.promise(apiFetch(`/users/${user.id}`, { method: 'DELETE' }), {
        loading: t('notifications.deleting'),
        success: t('notifications.deleted', { user: user.name }),
        error: (cause) => cause instanceof Error ? cause.message : t('errors.delete'),
      });
      if (data) {
        const total = Math.max(0, data.total - 1);
        const totalPages = Math.max(1, Math.ceil(total / data.pageSize));
        const pageWillChange = page > totalPages;
        if (pageWillChange) setPage(totalPages);
        setData((current) => current && ({
          ...current,
          items: current.items.filter((item) => item.id !== user.id),
          total,
          totalPages,
        }));
        setDeleteTarget(null);
        if (!pageWillChange) await load(false);
      } else {
        setDeleteTarget(null);
        await load(false);
      }
    } catch {
      // Sonner presenta el error; si existe historial, el backend conserva la cuenta para trazabilidad.
    } finally {
      setAccountBusy(null);
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-ocean-cyan">{t('eyebrow')}</p><h1 className="text-3xl font-black tracking-tight text-foreground">{t('title')}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t('subtitle')}</p></div>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground"><Users className="h-4 w-4 text-ocean-cyan"/><span>{t('count', { count: data?.total ?? 0 })}</span></div>
      </header>

      <div className="grid gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
        <label className="relative block"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t('search')} aria-label={t('search')} className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-ocean-cyan focus:ring-2 focus:ring-ocean-cyan/20"/></label>
        <select value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }} aria-label={t('filterRole')} className="h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:border-ocean-cyan focus:ring-2 focus:ring-ocean-cyan/20"><option value="">{t('allRoles')}</option>{data?.roles.map((role) => <option key={role.id} value={role.code}>{role.name}</option>)}</select>
      </div>

      <PreloadedUsersPanel roles={data?.roles ?? []} />
      {error && <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</div>}

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {loading ? <div className="space-y-4 p-6" aria-live="polite"><p className="text-sm text-muted-foreground">{t('loading')}</p>{[0,1,2].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-muted"/>)}</div>
          : !data?.items.length ? <div className="px-6 py-16 text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ocean-cyan/10 text-ocean-cyan"><Users className="h-6 w-6"/></div><h2 className="font-bold text-foreground">{t('emptyTitle')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('emptyDescription')}</p></div>
          : <>
            <div className="hidden grid-cols-[minmax(200px,1.2fr)_minmax(180px,1fr)_minmax(240px,1.2fr)] gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:grid"><span>{t('userColumn')}</span><span>{t('rolesColumn')}</span><span>{t('actionsColumn')}</span></div>
            <ul className="divide-y divide-border">{data.items.map((user) => <li key={user.id} className="grid gap-x-3 gap-y-2.5 px-3 py-3 md:grid-cols-[minmax(200px,1.2fr)_minmax(180px,1fr)_minmax(240px,1.2fr)] md:items-center md:px-4">
              <div className="flex min-w-0 items-center gap-2.5"><div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ocean-cyan/10 text-ocean-cyan">{user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover"/> : <UserRound className="h-4 w-4"/>}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{user.name}</p><p className="truncate text-xs text-muted-foreground">{user.email}</p><div className="mt-1 flex items-center gap-1.5"><span className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold ${user.isActive ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>{t(user.isActive ? 'active' : 'inactive')}</span><button type="button" disabled={accountBusy !== null || busy !== null} onClick={() => void setUserActive(user)} aria-label={t(user.isActive ? 'deactivateUser' : 'activateUser', { user: user.name })} title={t(user.isActive ? 'deactivateUser' : 'activateUser', { user: user.name })} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan disabled:opacity-50"><Power className="h-4 w-4"/></button><button type="button" disabled={accountBusy !== null || busy !== null} onClick={() => setDeleteTarget(user)} aria-label={t('deleteUser', { user: user.name })} title={t('deleteUser', { user: user.name })} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-500/30 text-rose-600 transition hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"><Trash2 className="h-4 w-4"/></button></div></div></div>
              <div className="flex flex-wrap gap-1">{user.roles.length ? user.roles.map((role) => <span key={role.id} className="inline-flex items-center gap-1 rounded-full bg-ocean-cyan/10 px-2 py-0.5 text-[11px] font-semibold text-ocean-deep dark:text-ocean-cyan"><ShieldCheck className="h-3 w-3"/>{role.name}</span>) : <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">{t('noRoles')}</span>}</div>
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">{data.roles.map((role) => {
                const hasRole = user.roles.some((assignedRole) => assignedRole.id === role.id);
                const label = t(hasRole ? 'revokeRole' : 'assignRole', { role: role.name, user: user.name });
                return <button key={role.id} type="button" disabled={busy !== null || accountBusy !== null} onClick={() => void mutateRole(user, role, !hasRole)} aria-label={label} title={label} className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${hasRole ? 'border-border text-muted-foreground hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-700 focus-visible:ring-rose-500' : 'border-ocean-cyan/30 text-ocean-cyan hover:bg-ocean-cyan/10 focus-visible:ring-ocean-cyan'}`}>{hasRole ? <UserMinus className="h-4 w-4"/> : <UserPlus className="h-4 w-4"/>}</button>;
              })}</div>
            </li>)}</ul>
            <footer className="flex flex-col gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">{t('pagination', { page: data.page, totalPages: Math.max(1, data.totalPages), total: data.total })}</p><div className="flex items-center gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label={t('previous')} className="rounded-xl border border-border p-2 text-foreground hover:bg-muted disabled:opacity-40"><ChevronLeft className="h-4 w-4"/></button><span className="min-w-8 text-center text-sm font-semibold text-foreground">{data.page}</span><button type="button" disabled={page >= data.totalPages} onClick={() => setPage((current) => current + 1)} aria-label={t('next')} className="rounded-xl border border-border p-2 text-foreground hover:bg-muted disabled:opacity-40"><ChevronRight className="h-4 w-4"/></button></div></footer>
          </>}
      </div>
      {deleteTarget && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-user-title"><div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600"><Trash2 className="h-5 w-5"/></div><h2 id="delete-user-title" className="mt-4 text-lg font-black text-foreground">{t('deleteDialog.title')}</h2><p className="mt-2 text-sm text-muted-foreground">{t('deleteDialog.description', { user: deleteTarget.name })}</p><div className="mt-6 flex justify-end gap-2"><button type="button" disabled={accountBusy !== null} onClick={() => setDeleteTarget(null)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50">{t('deleteDialog.cancel')}</button><button type="button" disabled={accountBusy !== null} onClick={() => void permanentlyDeleteUser()} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50">{accountBusy === deleteTarget.id ? t('deleteDialog.deleting') : t('deleteDialog.confirm')}</button></div></div></div>}
    </section>
  );
}
