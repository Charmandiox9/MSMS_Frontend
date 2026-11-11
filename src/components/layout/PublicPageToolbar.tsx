'use client';

import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useMounted } from '@/hooks/useMounted';

export default function PublicPageToolbar({ backLabel }: { backLabel: string }) {
  const t = useTranslations('DashboardNav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, systemTheme } = useTheme();
  const mounted = useMounted();
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  return (
    <nav aria-label={t('publicControls')} className="mx-auto mb-8 flex w-full max-w-5xl items-center justify-between gap-3">
      <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {backLabel}
      </Link>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/80 text-slate-700 shadow-sm backdrop-blur-md transition-colors hover:border-ocean-cyan hover:text-ocean-cyan dark:border-white/10 dark:bg-slate-950/50 dark:text-white/80"
          aria-label={t('toggleTheme')}
          title={t('toggleTheme')}
        >
          {mounted && isDark ? <Sun className="h-5 w-5 text-amber-300" /> : <Moon className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => router.replace(pathname, { locale: locale === 'es' ? 'en' : 'es' })}
          className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/80 px-2 text-xs font-black uppercase text-slate-700 shadow-sm backdrop-blur-md transition-colors hover:border-ocean-cyan hover:text-ocean-cyan dark:border-white/10 dark:bg-slate-950/50 dark:text-white/80"
          aria-label={t('toggleLanguage')}
          title={t('toggleLanguage')}
        >
          {locale}
        </button>
      </div>
    </nav>
  );
}
