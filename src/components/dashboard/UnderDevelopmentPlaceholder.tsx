'use client';

import { ArrowLeft, Clock, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import DashboardPageHeader from './DashboardPageHeader';

export interface UnderDevelopmentPlaceholderProps {
  moduleTitle: string;
  eyebrow?: string;
  subtitle?: string;
  icon?: LucideIcon;
}

export default function UnderDevelopmentPlaceholder({
  moduleTitle,
  eyebrow,
  subtitle,
  icon: Icon = Clock,
}: UnderDevelopmentPlaceholderProps) {
  const t = useTranslations('UnderDevelopment');

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow={eyebrow ?? t('badge')}
        title={moduleTitle}
        subtitle={subtitle ?? t('description')}
      />

      <section className="rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner ring-1 ring-primary/20">
          <Icon className="h-8 w-8" />
        </div>

        <div className="mt-6 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ocean-cyan/30 bg-ocean-cyan/10 px-3 py-1 text-xs font-bold text-ocean-deep dark:text-ocean-cyan">
            <Clock className="h-3.5 w-3.5" />
            {t('badge')}
          </span>
        </div>

        <h2 className="mt-4 text-2xl font-black text-foreground">
          {t('title')}
        </h2>

        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground leading-relaxed">
          {t('description')}
        </p>

        <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-border bg-muted/30 p-4 text-left sm:text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Ley N° 21.719 & DevSecOps</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            {t('privacyNotice')}
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('backToDashboard')}</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
