'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { LoaderCircle, Mail, Plus, ShieldCheck, Trash2, UserRoundPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

export type UserRole = { id: string; code: string; name: string; description?: string | null };

type PreloadedUser = {
  id: string;
  email: string;
  createdAt: string;
  roles: UserRole[];
};

type PreloadedUsersResponse = { items: PreloadedUser[] };

type PreloadedUsersPanelProps = { roles: UserRole[] };

function fetchPreloads() {
  return apiFetch<PreloadedUsersResponse>('/users/preloads');
}

export default function PreloadedUsersPanel({ roles }: PreloadedUsersPanelProps) {
  const t = useTranslations('UsersPage');
  const locale = useLocale();
  const [preloads, setPreloads] = useState<PreloadedUser[]>([]);
  const [email, setEmail] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const loadPreloads = useCallback(async () => {
    try {
      const result = await fetchPreloads();
      setPreloads(result.items);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('preloads.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let active = true;
    void fetchPreloads()
      .then((result) => {
        if (!active) return;
        setPreloads(result.items);
        setError('');
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : t('preloads.loadError'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [t]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialogOpen && !dialog.open) dialog.showModal();
    if (!dialogOpen && dialog.open) dialog.close();
  }, [dialogOpen]);

  const resetForm = () => {
    setEmail('');
    setSelectedRoleIds([]);
  };

  const submitPreload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedRoleIds.length === 0) return;

    setSaving(true);
    const request = apiFetch<PreloadedUser>('/users/preloads', {
      method: 'POST',
      body: JSON.stringify({ email, roleIds: selectedRoleIds }),
    });

    try {
      await toast.promise(request, {
        loading: t('preloads.notifications.creating'),
        success: t('preloads.notifications.created'),
        error: (cause) => cause instanceof Error ? cause.message : t('preloads.notifications.createError'),
      });
      setDialogOpen(false);
      resetForm();
      await loadPreloads();
    } catch {
      // Sonner presents the request error to the administrator.
    } finally {
      setSaving(false);
    }
  };

  const cancelPreload = async (preload: PreloadedUser) => {
    setCancellingId(preload.id);
    const request = apiFetch(`/users/preloads/${preload.id}`, { method: 'DELETE' });
    try {
      await toast.promise(request, {
        loading: t('preloads.notifications.cancelling'),
        success: t('preloads.notifications.cancelled'),
        error: (cause) => cause instanceof Error ? cause.message : t('preloads.notifications.cancelError'),
      });
      setPreloads((current) => current.filter((item) => item.id !== preload.id));
    } catch {
      // Sonner presents the request error to the administrator.
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="preloaded-users-heading">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="preloaded-users-heading" className="text-lg font-bold text-foreground">{t('preloads.title')}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('preloads.description')}</p>
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          disabled={roles.length === 0}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-ucn-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ucn-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {t('preloads.createButton')}
        </button>
      </header>

      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</p>}

      {loading ? (
        <p aria-live="polite" className="rounded-2xl bg-muted/40 px-4 py-5 text-sm text-muted-foreground">{t('preloads.loading')}</p>
      ) : error ? null : preloads.length === 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-5">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ocean-cyan" />
          <p className="text-sm text-muted-foreground">{t('preloads.empty')}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {preloads.map((preload) => (
            <li key={preload.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ocean-cyan/10 text-ocean-cyan"><Mail className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{preload.email}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t('preloads.pendingSince', { date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(preload.createdAt)) })}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {preload.roles.map((role) => <span key={role.id} className="inline-flex items-center gap-1 rounded-full bg-ocean-cyan/10 px-2.5 py-1 text-xs font-semibold text-ocean-deep dark:text-ocean-cyan"><ShieldCheck className="h-3 w-3" />{role.name}</span>)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void cancelPreload(preload)}
                disabled={cancellingId !== null}
                aria-label={t('preloads.cancelFor', { email: preload.email })}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-wait disabled:opacity-50 sm:self-center"
              >
                {cancellingId === preload.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}{t('preloads.cancel')}
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="preload-dialog-title"
        onCancel={(event) => { event.preventDefault(); setDialogOpen(false); }}
        onClose={() => setDialogOpen(false)}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-slate-950/60"
      >
        <form onSubmit={(event) => void submitPreload(event)} className="space-y-6 p-5 sm:p-7">
          <header className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ocean-cyan/10 text-ocean-cyan"><UserRoundPlus className="h-5 w-5" /></span>
              <div>
                <h3 id="preload-dialog-title" className="text-lg font-bold text-foreground">{t('preloads.dialogTitle')}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t('preloads.dialogDescription')}</p>
              </div>
            </div>
            <button type="button" onClick={() => setDialogOpen(false)} aria-label={t('preloads.close')} className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan">
              <X className="h-4 w-4" />
            </button>
          </header>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-foreground">{t('preloads.email')}</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('preloads.emailPlaceholder')}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ocean-cyan focus:ring-2 focus:ring-ocean-cyan/20"
            />
          </label>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">{t('preloads.roles')}</legend>
            <p className="text-xs text-muted-foreground">{t('preloads.rolesHelp')}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {roles.map((role) => {
                const checked = selectedRoleIds.includes(role.id);
                return (
                  <label key={role.id} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${checked ? 'border-ocean-cyan/50 bg-ocean-cyan/10 text-foreground' : 'border-border bg-background text-muted-foreground hover:bg-muted/50'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => setSelectedRoleIds((current) => event.target.checked ? [...current, role.id] : current.filter((id) => id !== role.id))}
                      className="h-4 w-4 accent-ocean-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan focus-visible:ring-offset-2"
                    />
                    <span className="min-w-0 truncate">{role.name}</span>
                  </label>
                );
              })}
            </div>
            {selectedRoleIds.length === 0 && <p className="text-xs text-amber-700 dark:text-amber-300">{t('preloads.roleRequired')}</p>}
          </fieldset>

          <footer className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setDialogOpen(false)} className="min-h-10 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan">{t('preloads.close')}</button>
            <button type="submit" disabled={saving || selectedRoleIds.length === 0} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-ucn-navy px-4 py-2 text-sm font-bold text-white transition hover:bg-ucn-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <Plus className="h-4 w-4" />{saving ? t('preloads.saving') : t('preloads.save')}
            </button>
          </footer>
        </form>
      </dialog>
    </section>
  );
}
