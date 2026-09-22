'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Clock3, Expand, FileText, Inbox, Mail, UserRound, X, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useActiveRole } from '@/context/ActiveRoleContext';
import { apiFetch } from '@/lib/api';
import type { Justification, JustificationInboxEntry, JustificationReasonCategory, JustificationStatus } from '@/types/justifications';

const statusOrder: JustificationStatus[] = ['PENDING', 'ACCEPTED', 'REJECTED'];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(value));
}

export default function JustificationsPage() {
  const t = useTranslations('JustificationsPage');
  const { activeRole } = useActiveRole();
  const [inbox, setInbox] = useState<JustificationInboxEntry[]>([]);
  const [history, setHistory] = useState<Justification[]>([]);
  const [filter, setFilter] = useState<'ALL' | JustificationStatus>('ALL');
  const [selected, setSelected] = useState<Justification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reasonCategory, setReasonCategory] = useState<JustificationReasonCategory | ''>('');
  const [expandedPanel, setExpandedPanel] = useState<'incoming' | 'history' | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [incoming, processed] = await Promise.all([
        apiFetch<JustificationInboxEntry[]>('/justifications/inbox'),
        apiFetch<Justification[]>('/justifications'),
      ]);
      setInbox(incoming);
      setHistory(processed);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t('errors.load');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (activeRole === 'TEACHING_SUPPORT_COORDINATOR') void load(); }, [activeRole]);

  const filteredHistory = useMemo(
    () => filter === 'ALL' ? history : history.filter((item) => item.status === filter),
    [filter, history],
  );

  const incomingContent = loading ? <LoadingState /> : inbox.length === 0 ? <EmptyState icon={Inbox} text={t('incoming.empty')} /> : (
    <div className="space-y-3">{inbox.map((entry) => <button key={entry.id} type="button" onClick={() => void openIncoming(entry)} className="w-full rounded-2xl border border-border bg-background p-4 text-left transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <div className="flex items-start justify-between gap-4"><div><p className="font-bold text-foreground">{entry.subjectName}{entry.nrc ? ` · NRC ${entry.nrc}` : ''}</p><p className="mt-1 text-xs text-muted-foreground">{entry.studentEmail} · {formatDate(entry.absenceDate)}</p></div><span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">{t('statuses.unread')}</span></div>
      <p className="mt-3 text-xs text-muted-foreground">{t('incoming.openHint')}</p>
    </button>)}</div>
  );

  const historyContent = <>
    <div className="mb-4 flex shrink-0 flex-wrap gap-2">{['ALL', ...statusOrder].map((value) => <button key={value} type="button" onClick={() => setFilter(value as 'ALL' | JustificationStatus)} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{value === 'ALL' ? t('filters.all') : t(`statuses.${value.toLowerCase()}`)}</button>)}</div>
    {loading ? <LoadingState /> : filteredHistory.length === 0 ? <EmptyState icon={FileText} text={t('history.empty')} /> : <div className="space-y-3">{filteredHistory.map((item) => <button key={item.id} type="button" onClick={() => { setSelected(item); setReasonCategory(item.reasonCategory ?? ''); setActionError(null); }} className="w-full rounded-2xl border border-border p-4 text-left transition hover:border-primary/50 hover:bg-primary/5"><div className="flex items-start justify-between gap-4"><div><p className="font-bold text-foreground">{item.subjectName}{item.nrc ? ` · NRC ${item.nrc}` : ''}</p><p className="mt-1 text-xs text-muted-foreground">{item.studentEmail} · {formatDate(item.absenceDate)}</p></div><StatusBadge status={item.status} t={t} /></div></button>)}</div>}
  </>;

  const openIncoming = async (entry: JustificationInboxEntry) => {
    setActionError(null);
    try {
      const justification = await apiFetch<Justification>(`/justifications/inbox/${entry.id}/open`, { method: 'POST' });
      setInbox((items) => items.filter((item) => item.id !== entry.id));
      setHistory((items) => [justification, ...items.filter((item) => item.id !== justification.id)]);
      setRejectReason('');
      setReasonCategory(justification.reasonCategory ?? '');
      setSelected(justification);
      toast.info(t('notifications.entered'));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t('errors.open');
      setActionError(message);
      toast.error(message);
    }
  };

  const decide = async (status: Exclude<JustificationStatus, 'PENDING'>, category: JustificationReasonCategory) => {
    if (!selected) return;
    setActionError(null);
    try {
      const updated = await apiFetch<Justification>(`/justifications/${selected.id}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason: status === 'REJECTED' ? rejectReason : undefined, reasonCategory: category }),
      });
      setHistory((items) => items.map((item) => item.id === updated.id ? updated : item));
      setSelected(updated);
      setRejectReason('');
      setReasonCategory(updated.reasonCategory ?? '');
      toast.success(status === 'ACCEPTED' ? t('notifications.accepted') : t('notifications.rejected'));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t('errors.decision');
      setActionError(message);
      toast.error(message);
    }
  };

  const openEvidence = async (id: string) => {
    try {
      const result = await apiFetch<{ downloadUrl: string }>(`/justifications/${id}/evidence-url`);
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t('errors.evidence');
      setActionError(message);
      toast.error(message);
    }
  };

  if (activeRole === null) return <div className="py-16 text-center text-sm text-muted-foreground">{t('loading')}</div>;
  if (activeRole !== 'TEACHING_SUPPORT_COORDINATOR') return <div className="py-16 text-center text-sm text-muted-foreground">{t('errors.access')}</div>;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{t('eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      {error && <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{error}</div>}
      {actionError && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">{actionError}</div>}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={Inbox} label={t('stats.incoming')} value={inbox.length} tone="cyan" />
        <SummaryCard icon={Clock3} label={t('stats.pending')} value={history.filter((item) => item.status === 'PENDING').length} tone="amber" />
        <SummaryCard icon={Check} label={t('stats.resolved')} value={history.filter((item) => item.status !== 'PENDING').length} tone="green" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title={t('incoming.title')} subtitle={t('incoming.subtitle')} expandLabel={t('expand')} onExpand={() => setExpandedPanel('incoming')}>{incomingContent}</Panel>

        <Panel title={t('history.title')} subtitle={t('history.subtitle')} expandLabel={t('expand')} onExpand={() => setExpandedPanel('history')}>{historyContent}</Panel>
      </section>

      {expandedPanel && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6" role="dialog" aria-modal="true"><div className="w-full max-w-5xl"><Panel title={expandedPanel === 'incoming' ? t('incoming.title') : t('history.title')} subtitle={expandedPanel === 'incoming' ? t('incoming.subtitle') : t('history.subtitle')} expanded closeLabel={t('detail.close')} onClose={() => setExpandedPanel(null)}>{expandedPanel === 'incoming' ? incomingContent : historyContent}</Panel></div></div>}

      {selected && <DetailDialog item={selected} t={t} rejectReason={rejectReason} setRejectReason={setRejectReason} reasonCategory={reasonCategory} setReasonCategory={setReasonCategory} onClose={() => setSelected(null)} onDecision={decide} onEvidence={() => void openEvidence(selected.id)} />}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone: 'cyan' | 'amber' | 'green' }) {
  return <div className="rounded-3xl border border-border bg-card p-5"><div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${tone === 'cyan' ? 'bg-primary/10 text-primary' : tone === 'amber' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}><Icon className="h-5 w-5" /></div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-black text-foreground">{value}</p></div>;
}

function Panel({ title, subtitle, children, expanded = false, expandLabel, closeLabel, onExpand, onClose }: { title: string; subtitle: string; children: React.ReactNode; expanded?: boolean; expandLabel?: string; closeLabel?: string; onExpand?: () => void; onClose?: () => void }) {
  return <section className={`flex min-h-0 flex-col rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6 ${expanded ? 'h-[min(82vh,52rem)]' : 'h-[34rem]'}`}><div className="mb-5 flex shrink-0 items-start justify-between gap-4"><div><h2 className="text-lg font-black text-foreground">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div>{onExpand && <button type="button" onClick={onExpand} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={expandLabel}><Expand className="h-4 w-4" /></button>}{onClose && <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={closeLabel}><X className="h-4 w-4" /></button>}</div><div className="min-h-0 flex-1 overflow-y-auto pr-1">{children}</div></section>;
}
function LoadingState() { return <div className="animate-pulse rounded-2xl bg-muted px-4 py-10 text-center text-sm text-muted-foreground">Cargando…</div>; }
function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) { return <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground"><Icon className="mb-3 h-6 w-6" />{text}</div>; }
function StatusBadge({ status, t }: { status: JustificationStatus; t: (key: string) => string }) { return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${status === 'PENDING' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-destructive/10 text-destructive'}`}>{t(`statuses.${status.toLowerCase()}`)}</span>; }
function DetailDialog({ item, t, rejectReason, setRejectReason, reasonCategory, setReasonCategory, onClose, onDecision, onEvidence }: { item: Justification; t: (key: string) => string; rejectReason: string; setRejectReason: (value: string) => void; reasonCategory: JustificationReasonCategory | ''; setReasonCategory: (value: JustificationReasonCategory | '') => void; onClose: () => void; onDecision: (status: Exclude<JustificationStatus, 'PENDING'>, category: JustificationReasonCategory) => Promise<void>; onEvidence: () => void }) {
  const canDecide = reasonCategory !== '';
  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{t('detail.eyebrow')}</p><div className="mt-2 flex flex-wrap items-center gap-3"><h2 className="text-2xl font-black text-foreground">{item.subjectName}</h2>{item.status !== 'PENDING' && <StatusBadge status={item.status} t={t} />}</div></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted" aria-label={t('detail.close')}><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Info label={t('detail.student')} value={item.studentEmail} /><Info label={t('detail.date')} value={formatDate(item.absenceDate)} /><Info label={t('detail.course')} value={item.subjectCode ?? item.subjectName} /><Info label={t('detail.nrc')} value={item.nrc ?? t('detail.notAvailable')} /></div>{item.teachers && <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-primary" /><p className="text-xs font-bold uppercase tracking-wide text-primary">{t('detail.teacher')}</p></div>{item.teachers.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">{t('detail.noTeacher')}</p> : <div className="mt-3 space-y-2">{item.teachers.map((teacher) => <div key={teacher.email} className="rounded-xl bg-background/70 p-3"><p className="text-sm font-bold text-foreground">{teacher.name}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5" />{teacher.email}</p></div>)}</div>}</div>}{item.reason && <div className="mt-5 rounded-2xl bg-muted p-4"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t('detail.reason')}</p><p className="mt-2 text-sm text-foreground">{item.reason}</p></div>}<button type="button" onClick={onEvidence} className="mt-5 flex items-center gap-2 text-sm font-bold text-primary hover:underline"><FileText className="h-4 w-4" />{t('detail.evidence')}</button>{item.status === 'PENDING' && <div className="mt-6 border-t border-border pt-5"><label className="text-sm font-bold text-foreground" htmlFor="reason-category">{t('detail.reasonCategory')}</label><select id="reason-category" value={reasonCategory} onChange={(event) => setReasonCategory(event.target.value as JustificationReasonCategory | '')} className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"><option value="">{t('detail.reasonCategoryPlaceholder')}</option><option value="MEDICAL">{t('reasonCategories.MEDICAL')}</option><option value="FAMILY_DEATH">{t('reasonCategories.FAMILY_DEATH')}</option><option value="PERSONAL">{t('reasonCategories.PERSONAL')}</option><option value="ACADEMIC">{t('reasonCategories.ACADEMIC')}</option><option value="OTHER">{t('reasonCategories.OTHER')}</option></select><label className="mt-4 block text-sm font-bold text-foreground" htmlFor="rejection-reason">{t('detail.rejectionReason')}</label><textarea id="rejection-reason" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} className="mt-2 min-h-20 w-full rounded-2xl border border-border bg-background p-3 text-sm outline-none focus:border-primary" placeholder={t('detail.rejectionPlaceholder')} /><div className="mt-4 flex flex-wrap justify-end gap-3"><button type="button" disabled={!canDecide} onClick={() => void onDecision('REJECTED', reasonCategory as JustificationReasonCategory)} className="rounded-2xl bg-destructive px-4 py-2.5 text-sm font-bold text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-50">{t('detail.reject')}</button><button type="button" disabled={!canDecide} onClick={() => void onDecision('ACCEPTED', reasonCategory as JustificationReasonCategory)} className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{t('detail.accept')}</button></div></div>}</div></div>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold text-foreground">{value}</p></div>; }
