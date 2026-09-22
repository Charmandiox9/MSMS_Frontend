'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarDays, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useActiveRole } from '@/context/ActiveRoleContext';
import { apiFetch } from '@/lib/api';

type Semester = { id: string; name: string; startsOn: string; endsOn: string; isActive: boolean };

export default function SettingsPage() {
  const t = useTranslations('SemesterSettingsPage');
  const { activeRole } = useActiveRole();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [name, setName] = useState('');
  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSemesters = async () => {
    setLoading(true);
    try { setSemesters(await apiFetch<Semester[]>('/academic/semesters')); setError(null); }
    catch (cause) { const message = cause instanceof Error ? cause.message : t('errors.load'); setError(message); toast.error(message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (activeRole === 'SYSTEM_ADMIN' || activeRole === 'ACADEMIC_SECRETARY') void loadSemesters(); }, [activeRole]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(null); setMessage(null);
    try {
      await apiFetch<Semester>('/academic/semesters/activate', { method: 'POST', body: JSON.stringify({ name, startsOn, endsOn }) });
      setMessage(t('success', { name }));
      toast.success(t('success', { name }));
      await loadSemesters();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t('errors.save');
      setError(message);
      toast.error(message);
    }
    finally { setSaving(false); }
  };

  if (activeRole === null) return <div className="py-16 text-center text-sm text-muted-foreground">{t('saving')}</div>;
  if (activeRole !== 'SYSTEM_ADMIN' && activeRole !== 'ACADEMIC_SECRETARY') return <div className="py-16 text-center text-sm text-muted-foreground">{t('errors.access')}</div>;

  return <div className="max-w-5xl space-y-8">
    <header><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{t('eyebrow')}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">{t('title')}</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t('subtitle')}</p></header>
    {error && <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
    {message && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">{message}</div>}
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6"><form onSubmit={submit} className="grid gap-4 md:grid-cols-2"><label className="md:col-span-2"><span className="text-sm font-bold text-foreground">{t('name')}</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder={t('namePlaceholder')} className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary" /></label><label><span className="text-sm font-bold text-foreground">{t('startsOn')}</span><input required type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary" /></label><label><span className="text-sm font-bold text-foreground">{t('endsOn')}</span><input required type="date" value={endsOn} onChange={(event) => setEndsOn(event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary" /></label><div className="md:col-span-2"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{saving ? t('saving') : t('activate')}</button></div></form></section>
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6"><div className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-primary" /><h2 className="text-lg font-black text-foreground">{t('history')}</h2></div>{loading ? <div className="mt-5 animate-pulse rounded-2xl bg-muted px-4 py-10 text-center text-sm text-muted-foreground">{t('saving')}</div> : semesters.length === 0 ? <p className="mt-5 text-sm text-muted-foreground">{t('empty')}</p> : <div className="mt-5 grid gap-3 md:grid-cols-2">{semesters.map((semester) => <div key={semester.id} className={`rounded-2xl border p-4 ${semester.isActive ? 'border-primary/40 bg-primary/5' : 'border-border'}`}><div className="flex items-center justify-between gap-3"><p className="font-bold text-foreground">{semester.name}</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${semester.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{semester.isActive ? t('active') : t('inactive')}</span></div><p className="mt-2 text-xs text-muted-foreground">{semester.startsOn.slice(0, 10)} — {semester.endsOn.slice(0, 10)}</p></div>)}</div>}</section>
  </div>;
}
