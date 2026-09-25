'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileUp, HelpCircle, Loader2, Mail, Search, UserRound, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import { useActiveRole } from '@/context/ActiveRoleContext';
import { apiFetch } from '@/lib/api';
import type { Teacher } from '@/types/justifications';

const PAGE_SIZE = 10;

export default function TeachersPage() {
  const t = useTranslations('TeachersPage');
  const { activeRole } = useActiveRole();
  const inputRef = useRef<HTMLInputElement>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
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
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleTeachers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    <section className="rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div>{teachers[0]?.assignments[0] && <p className="text-xs text-muted-foreground">{t('semester')}: {teachers[0].assignments[0].semester.name}</p>}</div><label className="relative block md:w-80"><span className="sr-only">{t('search')}</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t('search')} className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary" /></label></div></section>
    {loading ? <div className="animate-pulse rounded-3xl bg-muted px-4 py-16 text-center text-sm text-muted-foreground">{t('loading')}</div> : filtered.length === 0 ? <div className="rounded-3xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">{teachers.length === 0 ? t('empty') : t('noMatches')}</div> : <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="hidden grid-cols-[minmax(200px,1.2fr)_minmax(200px,1fr)_minmax(240px,1.4fr)] gap-4 border-b border-border bg-muted/40 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:grid"><span>{t('teacherColumn')}</span><span>{t('emailColumn')}</span><span>{t('nrcs')}</span></div>
      <ul className="divide-y divide-border">{visibleTeachers.map((teacher) => <li key={teacher.id} className="grid gap-2.5 px-4 py-3 md:grid-cols-[minmax(200px,1.2fr)_minmax(200px,1fr)_minmax(240px,1.4fr)] md:items-center md:gap-4 md:px-5">
        <div className="flex min-w-0 items-center gap-2.5"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound className="h-4 w-4" /></div><span className="truncate text-sm font-semibold text-foreground">{teacher.name}</span></div>
        <p className="flex min-w-0 items-center gap-1.5 pl-11 text-xs text-muted-foreground md:pl-0"><span className="md:hidden">{t('emailColumn')}:</span><Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{teacher.email}</span></p>
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 pl-11 md:pl-0"><span className="text-[10px] font-bold uppercase text-muted-foreground md:hidden">{t('nrcs')}:</span>{teacher.assignments.length > 0 ? teacher.assignments.map((assignment) => <span key={assignment.id} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">{assignment.nrc}</span>) : <span className="text-xs text-muted-foreground">—</span>}</div>
      </li>)}</ul>
      <footer className="flex flex-col gap-3 border-t border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">{t('pagination', { page, totalPages, total: filtered.length })}</p><div className="flex items-center gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label={t('previous')} className="rounded-xl border border-border p-2 text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><span className="min-w-8 text-center text-sm font-semibold tabular-nums text-foreground">{page}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} aria-label={t('next')} className="rounded-xl border border-border p-2 text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></footer>
    </section>}
    {showHelp && <HelpDialog title={t('helpTitle')} description={t('helpDescription')} format={t('format')} downloadLabel={t('downloadExample')} onDownload={downloadExample} onClose={() => setShowHelp(false)} />}
  </div>;
}

function HelpDialog({
  title,
  description,
  format,
  downloadLabel,
  onDownload,
  onClose,
}: {
  title: string;
  description: string;
  format: string;
  downloadLabel: string;
  onDownload: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      eyebrow="CSV"
      title={title}
      closeLabel="Cerrar"
      size="lg"
      footer={
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          {downloadLabel}
        </button>
      }
    >
      <p className="text-sm text-muted-foreground">{description}</p>
      <code className="mt-4 block rounded-2xl bg-muted p-4 text-xs font-mono text-foreground">
        {format}
      </code>
    </Modal>
  );
}
