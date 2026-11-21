'use client';

import { Moon, Sun } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from '@/i18n/routing';
import { useMounted } from '@/hooks/useMounted';

export default function LoginPreferences({
  variant = 'login',
}: {
  variant?: 'login' | 'institutional';
}) {
  const t = useTranslations('Login');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, systemTheme } = useTheme();
  const mounted = useMounted();

  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
  const buttonClassName = variant === 'institutional'
    ? 'flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-control bg-card text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus'
    : 'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/80 text-slate-700 shadow-sm backdrop-blur-md transition-colors hover:border-ocean-cyan hover:text-ocean-cyan dark:border-white/10 dark:bg-slate-950/50 dark:text-white/80';
  const languageClassName = variant === 'institutional'
    ? 'flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-control bg-card px-2 text-sm font-bold uppercase text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus'
    : 'flex h-10 min-w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/80 px-2 text-xs font-black uppercase text-slate-700 shadow-sm backdrop-blur-md transition-colors hover:border-ocean-cyan hover:text-ocean-cyan dark:border-white/10 dark:bg-slate-950/50 dark:text-white/80';

  return (
    <div className="absolute top-5 right-5 z-30 flex items-center gap-2">
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={buttonClassName}
        aria-label={t('toggleTheme')}
      >
        {mounted && isDark ? <Sun className={`h-5 w-5 ${variant === 'institutional' ? 'text-primary' : 'text-amber-300'}`} /> : <Moon className="h-5 w-5" />}
      </button>
      <button
        type="button"
        onClick={() => router.replace(pathname, { locale: locale === 'es' ? 'en' : 'es' })}
        className={languageClassName}
        aria-label={t('toggleLanguage')}
      >
        {locale}
      </button>
    </div>
  );
}
