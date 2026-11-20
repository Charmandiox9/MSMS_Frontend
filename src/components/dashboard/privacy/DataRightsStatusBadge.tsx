'use client';

import { CheckCircle2, CircleDashed, Clock3, LockKeyhole, XCircle, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

type RequestStatus = 'RECEIVED' | 'VERIFYING' | 'IN_PROGRESS' | 'COMPLETED' | 'DENIED' | 'CLOSED';

const STATUS_ICONS: Record<RequestStatus, LucideIcon> = {
  RECEIVED: CircleDashed,
  VERIFYING: Clock3,
  IN_PROGRESS: Clock3,
  COMPLETED: CheckCircle2,
  DENIED: XCircle,
  CLOSED: LockKeyhole,
};

const STATUS_STYLES: Record<RequestStatus, string> = {
  RECEIVED: 'border-info/40 bg-info-surface text-info',
  VERIFYING: 'border-info/40 bg-info-surface text-info',
  IN_PROGRESS: 'border-warning/40 bg-warning-surface text-warning',
  COMPLETED: 'border-success/40 bg-success-surface text-success',
  DENIED: 'border-danger/40 bg-danger-surface text-danger',
  CLOSED: 'border-border bg-muted text-muted-foreground',
};

export default function DataRightsStatusBadge({ status }: { status: RequestStatus }) {
  const t = useTranslations('DataRightsRequestPage.statuses');
  const Icon = STATUS_ICONS[status];

  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{t(status)}</span>
    </span>
  );
}
