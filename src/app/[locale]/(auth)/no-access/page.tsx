'use client';

import { ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function NoAccessPage() {
  const t = useTranslations('NoAccess');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-coral-red/30 bg-coral-red/10 text-coral-red">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          {t('title')}
        </h1>

        <p className="mb-4 text-sm font-semibold text-muted-foreground">
          {t('subtitle')}
        </p>

        <p className="mb-8 text-xs leading-relaxed text-muted-foreground/80">
          {t('description')}
        </p>

        <div className="space-y-3">
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan"
          >
            {t('backToLogin')}
          </Link>

          <p className="text-[11px] font-medium text-muted-foreground/70">
            {t('contact')}
          </p>
        </div>
      </div>
    </div>
  );
}
