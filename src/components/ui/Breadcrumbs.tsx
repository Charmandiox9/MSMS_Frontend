'use client';

import { useContext } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { DASHBOARD_SECTIONS, isRouteAllowed } from '@/config/navigation';
import { ActiveRoleContext } from '@/context/ActiveRoleContext';

interface BreadcrumbsProps {
  className?: string;
}

const ROUTE_NAME_MAP: Record<string, string> = {
  dashboard: 'dashboard',
  updates: 'updates',
  editorial: 'editorial',
  news: 'editorialNews',
  guides: 'editorialGuides',
  justifications: 'justifications',
  management: 'justificationsManagement',
  subjects: 'subjects',
  teachers: 'teachers',
  projects: 'projects',
  research: 'research',
  'research-outputs': 'researchOutputs',
  students: 'students',
  careers: 'careers',
  progress: 'studentProgress',
  profile: 'profile',
  'academic-information': 'academicInformation',
  'assistantship-history': 'assistantships',
  assistantships: 'assistantships',
  titulation: 'titulation',
  reports: 'reports',
  charts: 'charts',
  users: 'users',
  audit: 'audit',
  'privacy-requests': 'privacyRequests',
  settings: 'settings',
};

const RESOURCE_ID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export default function Breadcrumbs({ className = '' }: BreadcrumbsProps) {
  const t = useTranslations('DashboardNav');
  const pathname = usePathname();
  const context = useContext(ActiveRoleContext);
  const activeRole = context?.activeRole ?? null;

  const rawSegments = pathname.split('/').filter(Boolean);

  if (rawSegments.length <= 1) {
    return (
      <nav aria-label={t('breadcrumb')} className={`flex items-center text-xs font-medium ${className}`}>
        <ol className="flex items-center space-x-1.5 overflow-hidden">
          <li className="flex items-center space-x-1.5">
            <Home className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span className="font-semibold text-foreground" aria-current="page">
              {t('dashboard')}
            </span>
          </li>
        </ol>
      </nav>
    );
  }

  const subSegments = rawSegments[0] === 'dashboard' ? rawSegments.slice(1) : rawSegments;

  const allCrumbs = subSegments.flatMap((segment, index) => {
    if (RESOURCE_ID_PATTERN.test(segment)) return [];
    const href = `/dashboard/${subSegments.slice(0, index + 1).join('/')}`;
    const mappedKey = ROUTE_NAME_MAP[segment];
    const label = mappedKey && t.has(mappedKey) ? t(mappedKey) : segment;

    return [
      {
        segment,
        href,
        label,
        isLast: index === subSegments.length - 1,
      },
    ];
  });

  const visibleCrumbs = allCrumbs.filter((crumb) => {
    if (crumb.isLast) return true;
    if (!activeRole) return true;
    return isRouteAllowed(crumb.href, DASHBOARD_SECTIONS, activeRole);
  });

  return (
    <nav aria-label={t('breadcrumb')} className={`flex items-center text-xs font-medium ${className}`}>
      <ol className="flex items-center space-x-1.5 overflow-hidden">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            aria-label={t('dashboard')}
            title={t('dashboard')}
          >
            <Home className="h-3.5 w-3.5 shrink-0" />
          </Link>
        </li>
        {visibleCrumbs.map((crumb, idx) => {
          const isCurrentPage = idx === visibleCrumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center space-x-1.5">
              <ChevronRight className="h-3 w-3 text-muted-foreground/60 shrink-0" aria-hidden="true" />
              {isCurrentPage ? (
                <span className="truncate font-semibold text-foreground" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
