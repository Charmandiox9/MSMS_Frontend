'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, FileUp, GraduationCap, Loader2, Users, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useActiveRole } from '@/context/ActiveRoleContext';
import { apiFetch } from '@/lib/api';
import type { Teacher } from '@/types/justifications';

export default function JustificationsManagementPage() {
  const t = useTranslations('JustificationsManagementPage');
  const { activeRole } = useActiveRole();
  const inputRef = useRef<HTMLInputElement>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selected, setSelected] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTeachers = async () => {
    setLoading(true);
    try { setTeachers(await apiFetch<Teacher[]>('/academic/teachers')); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t('errors.load')); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (activeRole === 'SYSTEM_ADMIN' || activeRole === 'ACADEMIC_SECRETARY') void loadTeachers(); }, [activeRole]);

  const importCsv = async (file: File) => {
    setImporting(true); setError(null); setMessage(null);
    try {
      const csv = await file.text();
      const result = await apiFetch<{ importedRows: number }>('/academic/teachers/import-csv', { method: 'POST', body: JSON.stringify({ csv }) });
      setMessage(t('import.success', { count: result.importedRows }));
      await loadTeachers();
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('errors.import')); }
    finally { setImporting(false); }
  };

  if (activeRole === null) return <div className="py-16 text-center text-sm text-muted-foreground">{t('loading')}</div>;
  if (activeRole !== 'SYSTEM_ADMIN' && activeRole !== 'ACADEMIC_SECRETARY') return <div className="py-16 text-center text-sm text-muted-foreground">{t('errors.access')}</div>;

  return <div className="space-y-8"><header><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{t('eyebrow')}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">{t('title')}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t('subtitle')}</p></header>
    {error && <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
    {message && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">{message}</div>}
    <section className="grid gap-4 md:grid-cols-3"><Metric icon={Users} label={t('stats.teachers')} value={teachers.length} /><Metric icon={BookOpen} label={t('stats.assignments')} value={teachers.reduce((total, teacher) => total + teacher.assignments.length, 0)} /><Metric icon={GraduationCap} label={t('stats.activeSemester')} value={teachers.some((teacher) => teacher.assignments.length > 0) ? t('stats.available') : t('stats.pending')} /></section>
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-lg font-black text-foreground">{t('teachers.title')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('teachers.subtitle')}</p></div><div><input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); event.target.value = ''; }} /><button type="button" disabled={importing} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">{importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}{t('teachers.import')}</button></div></div><p className="mt-3 text-xs text-muted-foreground">{t('teachers.format')}</p>{loading ? <div className="mt-6 animate-pulse rounded-2xl bg-muted px-4 py-12 text-center text-sm text-muted-foreground">{t('loading')}</div> : teachers.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">{t('teachers.empty')}</div> : <div className="mt-6 grid gap-3 md:grid-cols-2">{teachers.map((teacher) => <button key={teacher.id} type="button" onClick={() => setSelected(teacher)} className="rounded-2xl border border-border p-4 text-left transition hover:border-primary/50 hover:bg-primary/5"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-foreground">{teacher.name}</p><p className="mt-1 text-xs text-muted-foreground">{teacher.email}</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{teacher.assignments.length}</span></div><p className="mt-3 text-xs text-muted-foreground">{t('teachers.courses')}</p></button>)}</div>}</section>
    {selected && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{t('detail.eyebrow')}</p><h2 className="mt-2 text-2xl font-black text-foreground">{selected.name}</h2><p className="mt-1 text-sm text-muted-foreground">{selected.email}</p></div><button type="button" onClick={() => setSelected(null)} className="text-sm font-bold text-muted-foreground hover:text-foreground">{t('detail.close')}</button></div><div className="mt-6 space-y-3">{selected.assignments.map((assignment) => <div key={assignment.id} className="rounded-2xl border border-border p-4"><p className="font-bold text-foreground">{assignment.course.name}</p><p className="mt-1 text-xs text-muted-foreground">{assignment.course.code}{assignment.parallel ? ` · ${t('detail.parallel')} ${assignment.parallel}` : ''} · {assignment.semester.name}</p></div>)}{selected.assignments.length === 0 && <p className="text-sm text-muted-foreground">{t('detail.empty')}</p>}</div></div></div>}
  </div>;
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number | string }) { return <div className="rounded-3xl border border-border bg-card p-5"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-black text-foreground">{value}</p></div>; }
