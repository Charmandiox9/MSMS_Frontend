'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Hash,
  Loader2,
  Mail,
  User,
  UserRound,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import JustificationStatusBadge from './JustificationStatusBadge';
import type {
  Justification,
  JustificationReasonCategory,
  JustificationStatus,
} from '@/types/justifications';

interface JustificationDetailModalProps {
  item: Justification | null;
  isOpen: boolean;
  onClose: () => void;
  onEvidence: (id: string) => Promise<void>;
  mode?: 'view' | 'decision';
  onDecision?: (
    status: Exclude<JustificationStatus, 'PENDING'>,
    category: JustificationReasonCategory,
    rejectionReason?: string,
  ) => Promise<void>;
  isProcessing?: boolean;
}

const REASON_CATEGORIES: JustificationReasonCategory[] = [
  'MEDICAL',
  'FAMILY_DEATH',
  'PERSONAL',
  'ACADEMIC',
  'OTHER',
];

const BLOCK_SCHEDULE_TIMES: Record<string, string> = {
  A: '08:10 - 09:40',
  B: '09:55 - 11:25',
  C: '11:40 - 13:10',
  C2: '13:10 - 14:30',
  D: '14:30 - 16:00',
  E: '16:15 - 17:45',
  F: '18:00 - 19:30',
  G: '19:45 - 21:15',
  H: '21:30 - 23:00',
};

function formatDateWithWeekday(value: string): string {
  try {
    const [y, m, d] = value.slice(0, 10).split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const formatted = new Intl.DateTimeFormat('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return value;
  }
}

function formatScheduleBlocks(blocks: string[] | null | undefined, emptyLabel: string): string {
  if (!blocks || blocks.length === 0) return emptyLabel;
  return blocks
    .map((b) => {
      const time = BLOCK_SCHEDULE_TIMES[b];
      return time ? `Bloque ${b} (${time})` : `Bloque ${b}`;
    })
    .join(', ');
}

export default function JustificationDetailModal({
  item,
  isOpen,
  onClose,
  onEvidence,
  mode = 'view',
  onDecision,
  isProcessing = false,
}: JustificationDetailModalProps) {
  const t = useTranslations('JustificationsPage');
  const [reasonCategory, setReasonCategory] = useState<JustificationReasonCategory | ''>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [openingEvidence, setOpeningEvidence] = useState(false);

  useEffect(() => {
    if (item) {
      setReasonCategory(item.reasonCategory ?? '');
      setRejectionReason(item.rejectionReason ?? '');
    }
  }, [item]);

  if (!isOpen || !item) {
    return null;
  }

  const handleOpenEvidence = async () => {
    setOpeningEvidence(true);
    try {
      await onEvidence(item.id);
    } finally {
      setOpeningEvidence(false);
    }
  };

  const handleDecision = async (status: Exclude<JustificationStatus, 'PENDING'>) => {
    if (!onDecision || !reasonCategory) {
      return;
    }
    await onDecision(status, reasonCategory, rejectionReason.trim() || undefined);
  };

  const isPending = item.status === 'PENDING';
  const canDecide = Boolean(reasonCategory) && !isProcessing;

  const modalTitle = (
    <div className="flex flex-wrap items-center gap-3">
      <span>{item.subjectName}</span>
      <JustificationStatusBadge status={item.status} size="sm" />
    </div>
  );

  const headerActions = (
    <button
      type="button"
      onClick={handleOpenEvidence}
      disabled={openingEvidence}
      className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:border-primary/50 hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
      title={t('detail.evidence')}
    >
      {openingEvidence ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ExternalLink className="h-3.5 w-3.5" />
      )}
      <span>{t('detail.evidence')}</span>
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      eyebrow={t('detail.eyebrow')}
      title={modalTitle}
      headerActions={headerActions}
      closeLabel={t('detail.close')}
    >
      <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2">
            <DetailItem
              icon={User}
              label={t('detail.student')}
              value={item.studentEmail}
            />
            <DetailItem
              icon={Calendar}
              label={t('detail.date')}
              value={formatDateWithWeekday(item.absenceDate)}
            />
            <DetailItem
              icon={FileText}
              label={t('detail.course')}
              value={item.subjectName}
            />
            <DetailItem
              icon={Hash}
              label={t('detail.nrc')}
              value={item.nrc ?? t('detail.notAvailable')}
            />
            <DetailItem
              icon={Clock}
              label={t('detail.scheduleBlock')}
              value={formatScheduleBlocks(item.blocks, t('detail.scheduleBlockEmpty'))}
            />
            <DetailItem
              icon={FileText}
              label={t('detail.evidence')}
              value={item.evidenceKey ? t('detail.evidenceAttached') : t('detail.notAvailable')}
            />
          </section>

          {item.teachers && item.teachers.length > 0 && (
            <section className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
                <UserRound className="h-4 w-4" />
                <span>{t('detail.teacher')}</span>
              </div>
              <div className="mt-3 space-y-2">
                {item.teachers.map((teacher) => (
                  <div
                    key={teacher.email}
                    className="flex flex-col rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between gap-1"
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {teacher.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {teacher.email}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {item.reason && (
            <section className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t('detail.reason')}
              </p>
              <p className="mt-2 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {item.reason}
              </p>
            </section>
          )}

          {item.reasonCategory && (
            <section className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t('detail.reasonCategory')}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {t(`reasonCategories.${item.reasonCategory}` as Parameters<typeof t>[0])}
              </p>
              {item.rejectionReason && (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-coral-red">
                    {t('detail.rejectionReason')}
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {item.rejectionReason}
                  </p>
                </div>
              )}
            </section>
          )}

          {mode === 'decision' && isPending && (
            <section className="rounded-2xl border border-border bg-muted/50 p-5 space-y-4">
              <div>
                <label
                  htmlFor="decision-reason-category"
                  className="block text-sm font-bold text-foreground"
                >
                  {t('detail.reasonCategory')}
                </label>
                <select
                  id="decision-reason-category"
                  value={reasonCategory}
                  onChange={(event) =>
                    setReasonCategory(event.target.value as JustificationReasonCategory | '')
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">{t('detail.reasonCategoryPlaceholder')}</option>
                  {REASON_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {t(`reasonCategories.${category}` as Parameters<typeof t>[0])}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="decision-rejection-reason"
                  className="block text-sm font-bold text-foreground"
                >
                  {t('detail.rejectionReason')}
                </label>
                <textarea
                  id="decision-rejection-reason"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder={t('detail.rejectionPlaceholder')}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={!canDecide || !rejectionReason.trim()}
                  onClick={() => handleDecision('REJECTED')}
                  className="inline-flex items-center gap-2 rounded-xl bg-coral-red px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{t('detail.reject')}</span>
                </button>
                <button
                  type="button"
                  disabled={!canDecide}
                  onClick={() => handleDecision('ACCEPTED')}
                  className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-secondary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{t('detail.accept')}</span>
                </button>
              </div>
            </section>
          )}
        </div>
    </Modal>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-foreground break-words">
        {value}
      </p>
    </div>
  );
}
