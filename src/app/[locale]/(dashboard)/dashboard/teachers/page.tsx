'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileUp, HelpCircle, Loader2, Mail, Search, UserRound, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useActiveRole } from '@/context/ActiveRoleContext';
import { apiFetch } from '@/lib/api';
import type { Teacher } from '@/types/justifications';

export default function TeachersPage() {
  const t = useTranslations('TeachersPage');
  const { activeRole } = useActiveRole();
  const inputRef = useRef<HTMLInputElement>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const downloadExample = () => {
    const content = 'nombre;correo;nrc1;nrc2\nJuan Pérez;juan.perez@ucn.cl;10001;10002\nAna Soto;ana.soto@ucn.cl;10003;';
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'ejemplo-profesores.csv'; link.click(); URL.revokeObjectURL(url);
  };

  const loadTeachers = async () => {
    setLoading(true);
    try { setTeachers(await apiFetch<Teacher[]>('/academic/teachers')); setError(null); }
    catch (cause) { const message = cause instanceof Error ? cause.message : t('errors.load'); setError(message); toast.error(message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (activeRole === 'SYSTEM_ADMIN' || activeRole === 'ACADEMIC_SECRETARY') void loadTeachers(); }, [activeRole]);

  const filtered = useMemo(() => teachers.filter((teacher) => `${teacher.name} ${teacher.email} ${teacher.assignments.map((assignment) => assignment.nrc).join(' ')}`.toLowerCase().includes(search.toLowerCase().trim())), [search, teachers]);

  const importRoster = async (file: File) => {
    setImporting(true); setError(null); setMessage(null);
    try {
      const result = await apiFetch<{ importedTeachers: number; importedAssignments: number }>('/academic/teachers/import-roster', { method: 'POST', body: JSON.stringify({ csv: await file.text() }) });
      setMessage(t('importSuccess', { teachers: result.importedTeachers, assignments: result.importedAssignments }));
      toast.success(t('importSuccess', { teachers: result.importedTeachers, assignments: result.importedAssignments }));
      await loadTeachers();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t('errors.import');
      setError(message);
      toast.error(message);
    }
    finally { setImporting(false); }
  };

  if (activeRole === null) return <div className="py-16 text-center text-sm text-muted-foreground">{t('loading')}</div>;
  if (activeRole !== 'SYSTEM_ADMIN' && activeRole !== 'ACADEMIC_SECRETARY') return <div className="py-16 text-center text-sm text-muted-foreground">{t('errors.access')}</div>;

  return <div className="space-y-8">
    <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{t('eyebrow')}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">{t('title')}</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t('subtitle')}</p></div><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => setShowHelp(true)} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-bold text-muted-foreground transition hover:border-primary/50 hover:text-primary" aria-label={t('help')} title={t('help')}><HelpCircle className="h-4 w-4" />?</button><input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importRoster(file); event.target.value = ''; }} /><button type="button" disabled={importing} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">{importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}{t('import')}</button></div></header>
    {error && <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
    {message && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">{message}</div>}
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div>{teachers[0]?.assignments[0] && <p className="text-xs text-muted-foreground">{t('semester')}: {teachers[0].assignments[0].semester.name}</p>}</div><label className="relative block md:w-80"><span className="sr-only">{t('search')}</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('search')} className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary" /></label></div></section>
    {loading ? <div className="animate-pulse rounded-3xl bg-muted px-4 py-16 text-center text-sm text-muted-foreground">{t('loading')}</div> : filtered.length === 0 ? <div className="rounded-3xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">{teachers.length === 0 ? t('empty') : t('noMatches')}</div> : <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((teacher) => <article key={teacher.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm"><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></div><div className="min-w-0"><h2 className="truncate text-lg font-black text-foreground">{teacher.name}</h2><p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5 shrink-0" />{teacher.email}</p></div></div><div className="mt-5"><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{t('nrcs')}</p><div className="mt-2 flex flex-wrap gap-2">{teacher.assignments.map((assignment) => <span key={assignment.id} className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">{assignment.nrc}</span>)}</div></div></article>)}</section>}
    {showHelp && <HelpDialog title={t('helpTitle')} description={t('helpDescription')} format={t('format')} downloadLabel={t('downloadExample')} onDownload={downloadExample} onClose={() => setShowHelp(false)} />}
  </div>;
}

function HelpDialog({ title, description, format, downloadLabel, onDownload, onClose }: { title: string; description: string; format: string; downloadLabel: string; onDownload: () => void; onClose: () => void }) {
  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/65 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">CSV</p><h2 className="mt-2 text-xl font-black text-foreground">{title}</h2></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted" aria-label="Cerrar"><X className="h-5 w-5" /></button></div><p className="mt-4 text-sm text-muted-foreground">{description}</p><code className="mt-4 block rounded-2xl bg-muted p-4 text-xs text-foreground">{format}</code><button type="button" onClick={onDownload} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"><Download className="h-4 w-4" />{downloadLabel}</button></div></div>;
}
