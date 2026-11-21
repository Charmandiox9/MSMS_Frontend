"use client";

import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { hasActiveSession, logout } from '@/lib/auth';
import { useMounted } from '@/hooks/useMounted';
import { toast } from 'sonner';

export default function Navbar() {
  const t = useTranslations('Navigation');
  const { theme, setTheme, systemTheme } = useTheme();
  const mounted = useMounted();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const tAccount = useTranslations('DashboardNav');

  useEffect(() => {
    void hasActiveSession().then(setIsLoggedIn);
  }, []);

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await logout();
      setIsLoggedIn(false);
      router.replace('/signed-out');
      router.refresh();
    } catch {
      toast.error(tAccount('signOutError'));
    } finally {
      setIsSigningOut(false);
    }
  };

  const toggleTheme = () => {
    const currentTheme = theme === 'system' ? systemTheme : theme;
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    const nextLocale = locale === 'es' ? 'en' : 'es';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <nav className="relative z-50 flex items-center justify-between border-b border-border bg-card px-3 py-3 text-foreground shadow-sm sm:px-6 sm:py-4">
      <div className="flex flex-1 items-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight sm:text-2xl">MARSYS</span>
        </Link>
      </div>

      <div className="hidden flex-1 justify-center gap-2 md:flex">
        <Link href="/about" aria-current={pathname === '/about' ? "page" : undefined} className={`relative flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${pathname === '/about' ? 'text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
          {t('about')}
          {pathname === '/about' && (
            <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden="true"></span>
          )}
        </Link>
        <Link href="/fcm" aria-current={pathname === '/fcm' ? "page" : undefined} className={`relative flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${pathname === '/fcm' ? 'text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
          {t('fcm')}
          {pathname === '/fcm' && (
            <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden="true"></span>
          )}
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
        <button
          onClick={toggleTheme}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          aria-label={t('toggleTheme')}
          title={t('toggleTheme')}
        >
          {mounted && (theme === 'dark' || (theme === 'system' && systemTheme === 'dark')) 
            ? <Sun className="size-5 text-primary" aria-hidden="true" />
            : <Moon className="size-5" aria-hidden="true" />}
        </button>

        <button
          onClick={toggleLanguage}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card px-2 text-sm font-bold uppercase text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          aria-label={t('toggleLanguage')}
          title={t('toggleLanguage')}
        >
          {locale}
        </button>

        {isLoggedIn ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/dashboard" className="flex min-h-11 items-center rounded-xl border border-border bg-muted px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-selection focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:px-4 sm:text-sm">
              {t('dashboard')}
            </Link>
            <button onClick={handleLogout} disabled={isSigningOut} aria-busy={isSigningOut} className="flex min-h-11 items-center rounded-xl bg-danger-surface px-2.5 text-xs font-semibold text-danger transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-wait disabled:opacity-70 sm:px-4 sm:text-sm">
              {t('logout')}
            </button>
          </div>
        ) : (
          <Link href="/login" className="flex min-h-11 items-center justify-center rounded-xl bg-primary px-2.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:px-4 sm:text-sm">
            {t('login')}
          </Link>
        )}
      </div>
    </nav>
  );
}

