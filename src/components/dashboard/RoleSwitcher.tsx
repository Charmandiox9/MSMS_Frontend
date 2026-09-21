'use client';

import {
  Check,
  ChevronDown,
  ShieldCheck,
  BookOpenCheck,
  FileBarChart,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useActiveRole } from '@/context/ActiveRoleContext';
import RoleBadge from '@/components/dashboard/RoleBadge';
import type { UserRoleCode } from '@/types/auth';

const ROLE_ICONS: Record<UserRoleCode, LucideIcon> = {
  SYSTEM_ADMIN: ShieldCheck,
  ACADEMIC_SECRETARY: BookOpenCheck,
  ACADEMIC_PROCESS_ANALYST: FileBarChart,
  TEACHING_SUPPORT_COORDINATOR: CalendarDays,
};

export default function RoleSwitcher() {
  const t = useTranslations('DashboardNav');
  const tRoles = useTranslations('DashboardNav.roles');
  const { activeRole, roles, hasMultipleRoles, setActiveRole } = useActiveRole();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!activeRole) {
    return null;
  }

  if (!hasMultipleRoles) {
    return <RoleBadge role={activeRole} />;
  }

  const ActiveIcon = ROLE_ICONS[activeRole] ?? ShieldCheck;

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('switchRole')}
        className="flex items-center gap-2 rounded-full border border-ocean-cyan/35 bg-ocean-cyan/10 px-3.5 py-1.5 text-xs font-semibold text-ocean-cyan transition-all hover:bg-ocean-cyan/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan focus-visible:ring-offset-1"
      >
        <ActiveIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate max-w-[170px]">{tRoles(activeRole as Parameters<typeof tRoles>[0])}</span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('switchRole')}
          className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-2xl border border-border bg-card p-1.5 shadow-xl ring-1 ring-black/5 backdrop-blur-lg focus:outline-none"
        >
          <div className="px-3 py-2 border-b border-border/60 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            {t('switchRoleTitle')}
          </div>
          <div className="py-1 space-y-0.5">
            {roles.map((role) => {
              const Icon = ROLE_ICONS[role] ?? ShieldCheck;
              const isSelected = role === activeRole;
              return (
                <button
                  key={role}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setActiveRole(role);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-ocean-cyan/15 text-ocean-cyan font-bold'
                      : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="h-4 w-4 shrink-0 text-ocean-cyan" />
                    <span className="truncate">{tRoles(role as Parameters<typeof tRoles>[0])}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-ocean-cyan ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
