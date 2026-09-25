'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  FileUp,
  HelpCircle,
  Loader2,
  Search,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import { useActiveRole } from '@/context/ActiveRoleContext';
import { apiFetch } from '@/lib/api';

type Instructor = { id: string; name: string; email: string };
type TeacherResponse = {
  assignments: { nrc: string; teacherId: string; teacher?: Instructor }[];
} & Instructor;
type ScheduleRow = {
  id: string;
  nrc: string;
  day: string;
  block: string;
  course: { code: string; name: string };
  semester: { name: string };
  teachers: Instructor[];
};
type Subject = { nrc: string; name: string; entries: ScheduleRow[]; semester: string; teachers: Instructor[] };

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
const blocks = ['A', 'B', 'C', 'C2', 'D', 'E', 'F', 'G', 'H'] as const;
const PAGE_SIZE = 10;

export default function SubjectsPage() {
  const t = useTranslations('SubjectsPage');
  const { activeRole } = useActiveRole();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [page, setPage] = useState(1);
  const [selectedNrc, setSelectedNrc] = useState<string | null>(null);
  const [allScheduleOpen, setAllScheduleOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const downloadExample = () => {
    const content = 'nrc;asignatura;dia;bloque\n10001;Estructura de Datos;Lunes;A\n10001;Estructura de Datos;Miércoles;A\n10002;Biología Marina;Martes;C';
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ejemplo-asignaturas.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const [schedules, teachers] = await Promise.all([
        apiFetch<Omit<ScheduleRow, 'teachers'>[]>('/academic/courses'),
        apiFetch<TeacherResponse[]>('/academic/teachers'),
      ]);
      const instructorsByNrc = new Map<string, Instructor[]>();
      for (const teacher of teachers) {
        for (const assignment of teacher.assignments) {
          const instructors = instructorsByNrc.get(assignment.nrc) ?? [];
          if (!instructors.some((instructor) => instructor.id === teacher.id)) {
            instructors.push({ id: teacher.id, name: teacher.name, email: teacher.email });
          }
          instructorsByNrc.set(assignment.nrc, instructors);
        }
      }
      setRows(schedules.map((schedule) => ({
        ...schedule,
        teachers: instructorsByNrc.get(schedule.nrc) ?? [],
      })));
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

  const allSubjects = useMemo(() => {
    const grouped = new Map<string, Subject>();
    for (const row of rows) {
      const current = grouped.get(row.nrc) ?? {
        nrc: row.nrc,
        name: row.course.name,
        entries: [],
        semester: row.semester.name,
        teachers: row.teachers,
      };
      current.entries.push(row);
      grouped.set(row.nrc, current);
    }
    return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const subjects = useMemo(() => allSubjects.filter((subject) => {
    const matchesSearch = `${subject.nrc} ${subject.name}`.toLowerCase().includes(search.toLowerCase().trim());
    const matchesDay = !selectedDay || subject.entries.some((entry) => entry.day === selectedDay);
    return matchesSearch && matchesDay;
  }), [allSubjects, search, selectedDay]);

  const totalPages = Math.max(1, Math.ceil(subjects.length / PAGE_SIZE));
  const visibleSubjects = subjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const importCsv = async (file: File) => {
    setImporting(true);
    setError(null);
    try {
      const result = await apiFetch<{ importedRows: number }>('/academic/courses/import-csv', {
        method: 'POST',
        body: JSON.stringify({ csv: await file.text() }),
      });
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

  const selected = selectedNrc ? allSubjects.find((subject) => subject.nrc === selectedNrc) : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{t('eyebrow')}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">{t('title')}</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t('subtitle')}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setShowHelp(true)} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-bold text-muted-foreground transition hover:border-primary/50 hover:text-primary" aria-label={t('help')} title={t('help')}><HelpCircle className="h-4 w-4" />?</button>
          <button type="button" onClick={() => setAllScheduleOpen(true)} disabled={rows.length === 0} className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-card px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"><CalendarDays className="h-4 w-4" />{t('viewAllSchedule')}</button>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); event.target.value = ''; }} />
          <button type="button" disabled={importing} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">{importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}{t('import')}</button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

      <section className="rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            {rows[0] && (
              <p className="text-xs font-medium text-muted-foreground">
                {t('semester')}: <span className="font-semibold text-foreground">{rows[0].semester.name}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block w-full sm:w-64 md:w-80">
              <span className="sr-only">{t('search')}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder={t('search')}
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block w-full sm:w-48">
              <span className="sr-only">{t('filterDay')}</span>
              <select
                value={selectedDay}
                onChange={(event) => { setSelectedDay(event.target.value); setPage(1); }}
                aria-label={t('filterDay')}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{t('allDays')}</option>
                {days.map((day) => <option key={day} value={day}>{t(`days.${day}`)}</option>)}
              </select>
            </label>
          </div>
        </div>
      </section>

      {loading ? <div className="animate-pulse rounded-3xl bg-muted px-4 py-16 text-center text-sm text-muted-foreground">{t('loading')}</div>
        : subjects.length === 0 ? <div className="rounded-3xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">{rows.length === 0 ? t('empty') : t('noMatches')}</div>
          : <>
            <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="hidden grid-cols-[minmax(180px,1.1fr)_minmax(160px,1fr)_minmax(240px,1.5fr)_auto] gap-4 border-b border-border bg-muted/40 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:grid"><span>{t('subjectColumn')}</span><span>{t('teacherColumn')}</span><span>{t('scheduleColumn')}</span><span className="sr-only">{t('viewSchedule')}</span></div>
              <ul className="divide-y divide-border">{visibleSubjects.map((subject) => {
                const visibleEntries = selectedDay ? subject.entries.filter((entry) => entry.day === selectedDay) : subject.entries;
                return <li key={subject.nrc} className="grid gap-2.5 px-4 py-3 md:grid-cols-[minmax(180px,1.1fr)_minmax(160px,1fr)_minmax(240px,1.5fr)_auto] md:items-center md:gap-4 md:px-5">
                  <div className="flex min-w-0 items-center gap-2.5"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="h-4 w-4" /></div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-primary">{t('nrcLabel')} {subject.nrc}</p><h2 className="truncate text-sm font-semibold text-foreground">{subject.name}</h2></div></div>
                  <div className="flex min-w-0 items-start gap-1.5 pl-11 text-xs text-muted-foreground md:pl-0"><UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0"/><div>{subject.teachers.length > 0 ? subject.teachers.map((teacher) => <p key={teacher.id} className="truncate">{teacher.name}</p>) : <p>{t('noTeacher')}</p>}</div></div>
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5 pl-11 md:pl-0"><span className="text-[10px] font-bold uppercase text-muted-foreground md:hidden">{t('scheduleColumn')}:</span>{visibleEntries.map((entry) => <span key={entry.id} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">{t(`days.${entry.day}`)} · {t(`blocks.${entry.block}`).split(' · ')[0]}</span>)}</div>
                  <button type="button" onClick={() => setSelectedNrc(subject.nrc)} className="min-h-10 rounded-xl border border-primary/30 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{t('viewSchedule')}</button>
                </li>;
              })}</ul>
            </section>
            <footer className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">{t('pagination', { page, totalPages, total: subjects.length })}</p>
              <div className="flex items-center gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label={t('previous')} className="rounded-xl border border-border p-2 text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><span className="min-w-8 text-center text-sm font-semibold tabular-nums text-foreground">{page}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} aria-label={t('next')} className="rounded-xl border border-border p-2 text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div>
            </footer>
          </>}

      {showHelp && <HelpDialog title={t('helpTitle')} description={t('helpDescription')} format={t('format')} downloadLabel={t('downloadExample')} closeLabel={t('close')} onDownload={downloadExample} onClose={() => setShowHelp(false)} />}
      {selected && <ScheduleDialog subject={selected} t={t} onClose={() => setSelectedNrc(null)} />}
      {allScheduleOpen && <AllSchedulesDialog entries={rows} t={t} onClose={() => setAllScheduleOpen(false)} />}
    </div>
  );
}

function HelpDialog({
  title,
  description,
  format,
  downloadLabel,
  closeLabel,
  onDownload,
  onClose,
}: {
  title: string;
  description: string;
  format: string;
  downloadLabel: string;
  closeLabel: string;
  onDownload: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      eyebrow="CSV"
      title={title}
      closeLabel={closeLabel}
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

function ScheduleDialog({
  subject,
  t,
  onClose,
}: {
  subject: Subject;
  t: (key: string) => string;
  onClose: () => void;
}) {
  return (
    <ScheduleModal
      title={`NRC ${subject.nrc} · ${subject.semester}`}
      subtitle={subject.name}
      teachers={subject.teachers}
      entries={subject.entries}
      t={t}
      onClose={onClose}
    />
  );
}

function AllSchedulesDialog({
  entries,
  t,
  onClose,
}: {
  entries: ScheduleRow[];
  t: (key: string) => string;
  onClose: () => void;
}) {
  return (
    <ScheduleModal
      title={t('allScheduleTitle')}
      subtitle={t('allScheduleDescription')}
      teachers={[]}
      entries={entries}
      t={t}
      onClose={onClose}
    />
  );
}

function ScheduleModal({
  title,
  subtitle,
  teachers,
  entries,
  t,
  onClose,
}: {
  title: string;
  subtitle: string;
  teachers: Instructor[];
  entries: ScheduleRow[];
  t: (key: string) => string;
  onClose: () => void;
}) {
  const bySlot = new Map<string, ScheduleRow[]>();
  for (const entry of entries) {
    const key = `${entry.day}|${entry.block}`;
    bySlot.set(key, [...(bySlot.get(key) ?? []), entry]);
  }

  const headerTitle = (
    <div>
      <span>{subtitle}</span>
      {teachers.length > 0 && (
        <p className="mt-1 flex items-center gap-1.5 text-sm font-normal text-muted-foreground">
          <UsersRound className="h-4 w-4" />
          {teachers.map((teacher) => teacher.name).join(', ')}
        </p>
      )}
      {teachers.length === 0 && entries.length === 0 && (
        <p className="mt-1 text-sm font-normal text-muted-foreground">
          {t('noScheduleEntries')}
        </p>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      eyebrow={title}
      title={headerTitle}
      closeLabel={t('close')}
      size="6xl"
    >
      <div className="overflow-auto">
        <div className="min-w-[900px] overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-[150px_repeat(6,minmax(125px,1fr))] bg-primary/10 text-xs font-black text-foreground">
            <div className="p-3">{t('block')}</div>
            {days.map((day) => (
              <div key={day} className="border-l border-border p-3 text-center">
                {t(`days.${day}`)}
              </div>
            ))}
          </div>
          {blocks.map((block) => (
            <div
              key={block}
              className="grid grid-cols-[150px_repeat(6,minmax(125px,1fr))] border-t border-border"
            >
              <div className="bg-muted/40 p-3 text-xs font-bold text-muted-foreground">
                {t(`blocks.${block}`)}
              </div>
              {days.map((day) => {
                const slotEntries = bySlot.get(`${day}|${block}`) ?? [];
                return (
                  <div
                    key={day}
                    className={`min-h-16 space-y-1 border-l border-border p-1.5 ${
                      slotEntries.length > 0 ? 'bg-primary/10' : 'bg-background'
                    }`}
                  >
                    {slotEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-lg border border-primary/30 bg-card p-2 shadow-sm"
                      >
                        <p className="text-xs font-black text-primary">{entry.course.name}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">NRC {entry.nrc}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {entry.teachers.length
                            ? entry.teachers.map((teacher) => teacher.name).join(', ')
                            : t('noTeacher')}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
