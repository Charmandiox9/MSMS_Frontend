'use client';

import { Home, LogOut, Moon, Settings, Sun } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { logout, type ActiveSession } from '@/lib/auth';

export default function DashboardUserDial({
  session,
  collapsed,
}: {
  session: ActiveSession | null;
  collapsed: boolean;
}) {
  const t = useTranslations('DashboardNav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const initials = session?.email?.slice(0, 1).toUpperCase() ?? 'U';
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
  const nextLocale = locale === 'es' ? 'en' : 'es';
  const actionVisibility = open
    ? 'pointer-events-auto scale-100 opacity-100'
    : 'pointer-events-none scale-50 opacity-0';

  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  const avatar = (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-ocean-cyan to-primary text-sm font-black text-primary-foreground ring-2 ring-ocean-cyan/45">
      {session?.avatarUrl ? (
        <img src={session.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials
      )}
    </div>
  );

  return (
    <div className={`relative border-t border-primary-foreground/10 p-3 ${collapsed ? 'overflow-visible' : ''}`}>
      <div className={`relative mx-auto w-11 transition-[height] duration-300 ${open ? 'h-40' : 'h-11'}`}>
        <Link href="/dashboard" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} aria-hidden={!open} aria-label={t('openDashboard')} title={t('openDashboard')} className={`absolute -left-10 top-0 flex h-10 w-10 origin-bottom-right items-center justify-center rounded-full border border-ocean-cyan/35 bg-primary/25 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 ease-out motion-reduce:transition-none hover:scale-110 hover:bg-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan ${actionVisibility} ${open ? 'translate-x-0 translate-y-0' : 'translate-x-10 translate-y-28'}`}>
          <Home className="h-4 w-4" />
        </Link>
        <button type="button" onClick={() => setTheme(isDark ? 'light' : 'dark')} tabIndex={open ? 0 : -1} aria-hidden={!open} aria-label={t('toggleTheme')} title={t('toggleTheme')} className={`absolute -left-1 top-3 flex h-10 w-10 origin-bottom items-center justify-center rounded-full border border-ocean-cyan/35 bg-primary/25 text-ocean-cyan shadow-lg shadow-primary/20 transition-all delay-75 duration-300 ease-out motion-reduce:transition-none hover:scale-110 hover:bg-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan ${actionVisibility} ${open ? 'translate-x-0 translate-y-0' : 'translate-x-1 translate-y-24'}`}>
          {mounted && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button type="button" onClick={() => router.replace(pathname, { locale: nextLocale })} tabIndex={open ? 0 : -1} aria-hidden={!open} aria-label={`${locale.toUpperCase()} → ${nextLocale.toUpperCase()}`} title={`${locale.toUpperCase()} → ${nextLocale.toUpperCase()}`} className={`absolute left-9 top-7 flex h-10 w-10 origin-bottom-left items-center justify-center rounded-full border border-ocean-cyan/35 bg-primary/25 text-[11px] font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all delay-100 duration-300 ease-out motion-reduce:transition-none hover:scale-110 hover:bg-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan ${actionVisibility} ${open ? 'translate-x-0 translate-y-0' : '-translate-x-9 translate-y-20'}`}>
          {locale.toUpperCase()}
        </button>
        <Link href="/dashboard/settings" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} aria-hidden={!open} aria-label={t('settings')} title={t('settings')} className={`absolute left-[4.75rem] top-16 flex h-10 w-10 origin-bottom-left items-center justify-center rounded-full border border-ocean-cyan/35 bg-ocean-cyan/20 text-ocean-cyan shadow-lg shadow-ocean-cyan/15 transition-all delay-150 duration-300 ease-out motion-reduce:transition-none hover:scale-110 hover:bg-ocean-cyan/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan ${actionVisibility} ${open ? 'translate-x-0 translate-y-0' : '-translate-x-[4.75rem] translate-y-12'}`}>
          <Settings className="h-4 w-4" />
        </Link>
        <button type="button" onClick={handleLogout} tabIndex={open ? 0 : -1} aria-hidden={!open} aria-label={t('logout')} title={t('logout')} className={`absolute left-[7.25rem] top-[6.7rem] flex h-10 w-10 origin-bottom-left items-center justify-center rounded-full border border-coral-red/70 bg-coral-red text-primary-foreground shadow-lg shadow-coral-red/30 transition-all delay-200 duration-300 ease-out motion-reduce:transition-none hover:scale-110 hover:bg-coral-red/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-red ${actionVisibility} ${open ? 'translate-x-0 translate-y-0' : '-translate-x-[7.25rem] translate-y-2'}`}>
          <LogOut className="h-4 w-4" />
        </button>

        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={t('accountMenu')} className="absolute bottom-0 left-0 rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-ucn-navy">
          {avatar}
        </button>
      </div>
    </div>
  );
}
