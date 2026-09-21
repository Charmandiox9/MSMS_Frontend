'use client';

import { ChevronRight, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';

interface BreadcrumbsProps {
  className?: string;
}

const ROUTE_NAME_MAP: Record<string, string> = {
  dashboard: 'dashboard',
  justifications: 'justifications',
  'academic-information': 'academicInformation',
  'academic-workload': 'academicWorkload',
  titulation: 'titulation',
  reports: 'reports',
  users: 'users',
  audit: 'audit',
  settings: 'settings',
};

export default function Breadcrumbs({ className = '' }: BreadcrumbsProps) {
  const t = useTranslations('DashboardNav');
  const pathname = usePathname();

  const segments = pathname.split('/').filter(Boolean);

  if (segments.length <= 1) {
    return null;
  }

  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    const mappedKey = ROUTE_NAME_MAP[segment] ?? segment;
    let label = segment;

    try {
      label = t(mappedKey as Parameters<typeof t>[0]);
    } catch {
      label = segment;
    }

    return {
      href,
      label,
      isLast: index === segments.length - 1,
    };
  });

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs font-medium ${className}`}>
      <ol className="flex items-center space-x-1.5 overflow-hidden">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan"
            aria-label={t('dashboard')}
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>
        {breadcrumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center space-x-1.5">
            <ChevronRight className="h-3 w-3 text-muted-foreground/60 shrink-0" aria-hidden="true" />
            {crumb.isLast ? (
              <span className="truncate font-semibold text-foreground" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="truncate text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
