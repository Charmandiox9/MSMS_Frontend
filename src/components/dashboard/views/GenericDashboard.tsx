'use client';

import { LayoutDashboard } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function GenericDashboard() {
  const t = useTranslations('Dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-ocean-cyan/30 bg-ocean-cyan/10 text-ocean-cyan">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-foreground">{t('welcome')}</h2>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">{t('welcomeDesc')}</p>
      </div>
    </div>
  );
}
