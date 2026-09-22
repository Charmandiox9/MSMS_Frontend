'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Download, FileUp, HelpCircle, Loader2, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useActiveRole } from '@/context/ActiveRoleContext';
import { apiFetch } from '@/lib/api';

type ScheduleRow = {
  id: string;
  nrc: string;
  day: string;
  block: string;
  course: { code: string; name: string };
  semester: { name: string };
};

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
const blocks = ['A', 'B', 'C', 'C2', 'D', 'E', 'F', 'G', 'H'] as const;

export default function SubjectsPage() {
  const t = useTranslations('SubjectsPage');
  const { activeRole } = useActiveRole();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [search, setSearch] = useState('');
  const [selectedNrc, setSelectedNrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const downloadExample = () => {
    const content = 'nrc;asignatura;dia;bloque\n10001;Estructura de Datos;Lunes;A\n10001;Estructura de Datos;Miércoles;A\n10002;Biología Marina;Martes;C';
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'ejemplo-asignaturas.csv'; link.click(); URL.revokeObjectURL(url);
  };

  const loadSchedules = async () => {
    setLoading(true);
    try {
      setRows(await apiFetch<ScheduleRow[]>('/academic/courses'));
      setError(null);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t('errors.load');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeRole === 'SYSTEM_ADMIN' || activeRole === 'ACADEMIC_SECRETARY') void loadSchedules();
  }, [activeRole]);

  const subjects = useMemo(() => {
    const grouped = new Map<string, { nrc: string; name: string; entries: ScheduleRow[]; semester: string }>();
    for (const row of rows) {
      const current = grouped.get(row.nrc) ?? { nrc: row.nrc, name: row.course.name, entries: [], semester: row.semester.name };
      current.entries.push(row);
      grouped.set(row.nrc, current);
    }
    return [...grouped.values()].filter((subject) => `${subject.nrc} ${subject.name}`.toLowerCase().includes(search.toLowerCase().trim())).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, search]);

  const importCsv = async (file: File) => {
    setImporting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await apiFetch<{ importedRows: number }>('/academic/courses/import-csv', { method: 'POST', body: JSON.stringify({ csv: await file.text() }) });
      setMessage(t('importSuccess', { count: result.importedRows }));
      toast.success(t('importSuccess', { count: result.importedRows }));
      await loadSchedules();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t('errors.import');
      setError(message);
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  if (activeRole === null) return <div className="py-16 text-center text-sm text-muted-foreground">{t('loading')}</div>;
  if (activeRole !== 'SYSTEM_ADMIN' && activeRole !== 'ACADEMIC_SECRETARY') return <div className="py-16 text-center text-sm text-muted-foreground">{t('errors.access')}</div>;

  const selected = selectedNrc ? subjects.find((subject) => subject.nrc === selectedNrc) : null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{t('eyebrow')}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">{t('title')}</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t('subtitle')}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setShowHelp(true)} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-bold text-muted-foreground transition hover:border-primary/50 hover:text-primary" aria-label={t('help')} title={t('help')}><HelpCircle className="h-4 w-4" />?</button>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); event.target.value = ''; }} />
          <button type="button" disabled={importing} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">{importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}{t('import')}</button>
        </div>
      </header>
      {error && <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {message && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">{message}</div>}
      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-bold text-foreground">{t('format')}</p>{rows[0] && <p className="mt-1 text-xs text-muted-foreground">{t('semester')}: {rows[0].semester.name}</p>}</div><label className="relative block md:w-80"><span className="sr-only">{t('search')}</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('search')} className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary" /></label></div></section>
      {loading ? <div className="animate-pulse rounded-3xl bg-muted px-4 py-16 text-center text-sm text-muted-foreground">{t('loading')}</div> : subjects.length === 0 ? <div className="rounded-3xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">{rows.length === 0 ? t('empty') : t('noMatches')}</div> : <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{subjects.map((subject) => <article key={subject.nrc} className="group rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-primary">NRC {subject.nrc}</p><h2 className="mt-2 text-lg font-black text-foreground">{subject.name}</h2><p className="mt-2 text-xs text-muted-foreground">{subject.entries.length} {t('entries')}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CalendarDays className="h-5 w-5" /></div></div><div className="mt-5 flex flex-wrap gap-2">{subject.entries.map((entry) => <span key={entry.id} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">{entry.day} · {entry.block}</span>)}</div><button type="button" onClick={() => setSelectedNrc(subject.nrc)} className="mt-5 w-full rounded-2xl border border-primary/30 px-3 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{t('viewSchedule')}</button></article>)}</section>}
      {showHelp && <HelpDialog title={t('helpTitle')} description={t('helpDescription')} format={t('format')} downloadLabel={t('downloadExample')} onDownload={downloadExample} onClose={() => setShowHelp(false)} />}
      {selected && <ScheduleDialog subject={selected} t={t} onClose={() => setSelectedNrc(null)} />}
    </div>
  );
}

function HelpDialog({ title, description, format, downloadLabel, onDownload, onClose }: { title: string; description: string; format: string; downloadLabel: string; onDownload: () => void; onClose: () => void }) {
  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/65 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">CSV</p><h2 className="mt-2 text-xl font-black text-foreground">{title}</h2></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted" aria-label="Cerrar"><X className="h-5 w-5" /></button></div><p className="mt-4 text-sm text-muted-foreground">{description}</p><code className="mt-4 block rounded-2xl bg-muted p-4 text-xs text-foreground">{format}</code><button type="button" onClick={onDownload} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"><Download className="h-4 w-4" />{downloadLabel}</button></div></div>;
}

function ScheduleDialog({ subject, t, onClose }: { subject: { nrc: string; name: string; entries: ScheduleRow[]; semester: string }; t: (key: string) => string; onClose: () => void }) {
  const bySlot = new Map(subject.entries.map((entry) => [`${entry.day}|${entry.block}`, entry]));
  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/65 p-3 sm:p-6" role="dialog" aria-modal="true"><div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-border p-5 md:p-6"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">NRC {subject.nrc} · {subject.semester}</p><h2 className="mt-2 text-2xl font-black text-foreground">{subject.name}</h2><p className="mt-1 text-sm text-muted-foreground">{t('schedule')}</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label={t('close')}><X className="h-5 w-5" /></button></div><div className="overflow-auto p-4 md:p-6"><div className="min-w-[760px] overflow-hidden rounded-2xl border border-border"><div className="grid grid-cols-[150px_repeat(6,minmax(120px,1fr))] bg-primary/10 text-xs font-black text-foreground"><div className="p-3">{t('block')}</div>{days.map((day) => <div key={day} className="border-l border-border p-3 text-center">{t(`days.${day}`)}</div>)}</div>{blocks.map((block) => <div key={block} className="grid grid-cols-[150px_repeat(6,minmax(120px,1fr))] border-t border-border"><div className="bg-muted/40 p-3 text-xs font-bold text-muted-foreground">{t(`blocks.${block}`)}</div>{days.map((day) => { const entry = bySlot.get(`${day}|${block}`); return <div key={day} className={`min-h-16 border-l border-border p-2 ${entry ? 'bg-primary/10' : 'bg-background'}`}>{entry && <div className="rounded-xl border border-primary/30 bg-card p-2 shadow-sm"><p className="text-xs font-black text-primary">{entry.course.name}</p><p className="mt-1 text-[10px] text-muted-foreground">NRC {entry.nrc}</p></div>}</div>; })}</div>)}</div></div></div></div>;
}
