'use client';

import {
  BookOpenCheck,
  CalendarDays,
  FileBarChart,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { UserRoleCode } from '@/types/auth';

interface RoleBadgeProps {
  role: UserRoleCode | null;
  className?: string;
  size?: 'sm' | 'md';
}

const ROLE_ICONS: Record<UserRoleCode, LucideIcon> = {
  SYSTEM_ADMIN: ShieldCheck,
  ACADEMIC_SECRETARY: BookOpenCheck,
  ACADEMIC_PROCESS_ANALYST: FileBarChart,
  TEACHING_SUPPORT_COORDINATOR: CalendarDays,
};

export default function RoleBadge({
  role,
  className = '',
  size = 'md',
}: RoleBadgeProps) {
  const t = useTranslations('DashboardNav.roles');

  if (!role) {
    return null;
  }

  const Icon = ROLE_ICONS[role] ?? ShieldCheck;
  const label = t(role as Parameters<typeof t>[0]);

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-0.5 text-[11px] gap-1.5'
      : 'px-3 py-1.5 text-xs gap-2';

  return (
    <div
      className={`inline-flex items-center rounded-full border border-ocean-cyan/35 bg-ocean-cyan/10 font-semibold text-ocean-cyan ${sizeClasses} ${className}`}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3 shrink-0' : 'h-3.5 w-3.5 shrink-0'} />
      <span className="truncate max-w-[200px]">{label}</span>
    </div>
  );
}
