'use client';

import { ArrowLeft, Languages, Moon, Palette, Sun } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useMounted } from '@/hooks/useMounted';
import { useColorPalette } from '@/components/providers/ColorPaletteProvider';

export default function PublicPageToolbar({ backLabel }: { backLabel: string }) {
  const t = useTranslations('DashboardNav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, systemTheme } = useTheme();
  const { palette, setPalette } = useColorPalette();
  const mounted = useMounted();
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
  const nextLocale = locale === 'es' ? 'en' : 'es';

  return (
    <nav aria-label={t('publicControls')} className="mx-auto mb-8 flex w-full max-w-5xl items-center justify-between gap-3">
      <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {backLabel}
      </Link>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label={t('toggleTheme')} title={t('toggleTheme')} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-card-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          {mounted && isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
        </button>
        <label className="sr-only" htmlFor="public-color-palette">{t('colorPalette')}</label>
        <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-2 text-card-foreground focus-within:ring-2 focus-within:ring-primary">
          <Palette className="ml-1 h-4 w-4 text-accent" aria-hidden="true" />
          <span className="text-xs font-medium text-muted-foreground">{t('colorLabel')}</span>
          <select id="public-color-palette" value={palette} onChange={(event) => setPalette(event.target.value as typeof palette)} className="h-full max-w-28 cursor-pointer bg-transparent pr-1 text-xs font-medium focus:outline-none" aria-label={t('colorPalette')}>
            <option value="ocean">{t('palettes.ocean')}</option>
            <option value="marine">{t('palettes.marine')}</option>
            <option value="coral">{t('palettes.coral')}</option>
          </select>
        </span>
        <button type="button" onClick={() => router.replace(pathname, { locale: nextLocale })} aria-label={t('toggleLanguage')} title={t('toggleLanguage')} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-card-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <Languages className="h-4 w-4" aria-hidden="true" />
          {nextLocale.toUpperCase()}
        </button>
      </div>
    </nav>
  );
}
