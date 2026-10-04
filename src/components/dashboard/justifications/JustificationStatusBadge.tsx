'use client';

import { CheckCircle2, Clock3, Inbox, XCircle, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { JustificationStatus } from '@/types/justifications';

export type ExtendedStatus = JustificationStatus | 'UNREAD';

interface JustificationStatusBadgeProps {
  status: ExtendedStatus;
  size?: 'sm' | 'md';
  className?: string;
}

const STATUS_ICONS: Record<ExtendedStatus, LucideIcon> = {
  UNREAD: Inbox,
  PENDING: Clock3,
  ACCEPTED: CheckCircle2,
  REJECTED: XCircle,
};

const STATUS_STYLES: Record<ExtendedStatus, string> = {
  UNREAD: 'border-ocean-cyan/35 bg-ocean-cyan/10 text-ocean-cyan',
  PENDING: 'border-accent/40 bg-accent/10 text-accent',
  ACCEPTED: 'border-secondary/40 bg-secondary/10 text-secondary',
  REJECTED: 'border-coral-red/40 bg-coral-red/10 text-coral-red',
};

export default function JustificationStatusBadge({
  status,
  size = 'md',
  className = '',
}: JustificationStatusBadgeProps) {
  const t = useTranslations('JustificationsPage.statuses');
  const Icon = STATUS_ICONS[status] ?? Clock3;
  const label = t(status.toLowerCase() as Parameters<typeof t>[0]);

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-bold uppercase tracking-wider ${STATUS_STYLES[status]} ${sizeClasses} ${className}`}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3 shrink-0' : 'h-3.5 w-3.5 shrink-0'} />
      <span>{label}</span>
    </span>
  );
}
