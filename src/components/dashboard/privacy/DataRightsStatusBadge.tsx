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
  RECEIVED: 'border-ocean-cyan/35 bg-ocean-cyan/10 text-ocean-cyan',
  VERIFYING: 'border-accent/40 bg-accent/10 text-accent',
  IN_PROGRESS: 'border-primary/30 bg-primary/10 text-primary',
  COMPLETED: 'border-secondary/40 bg-secondary/10 text-secondary',
  DENIED: 'border-coral-red/40 bg-coral-red/10 text-coral-red',
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
