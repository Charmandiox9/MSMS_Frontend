'use client';

import { type ReactNode } from 'react';

export interface DashboardPageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  badge?: ReactNode;
}

export default function DashboardPageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  badge,
}: DashboardPageHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight text-foreground truncate">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}
