'use client';

import { Home, LogOut, Moon, Settings, Sun } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { logout, type ActiveSession } from '@/lib/auth';

type SpeedDialItem = {
  id: string;
  content: ReactNode;
};

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
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [open, setOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const initials = session?.email?.slice(0, 1).toUpperCase() ?? 'U';
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
  const nextLocale = locale === 'es' ? 'en' : 'es';

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  const closeMenu = () => {
    if (!open) return;

    void import('animejs').then((module) => {
      const anime = module.default ?? module;
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      if (reduceMotion) {
        setOpen(false);
        return;
      }

      anime({ targets: overlayRef.current, opacity: [1, 0], duration: 180, easing: 'easeInQuad' });
      anime({ targets: glowRef.current, opacity: [1, 0], scale: [1, 0.5], duration: 180, easing: 'easeInQuad' });
      anime({
        targets: itemRefs.current,
        translateX: 0,
        translateY: 0,
        opacity: [1, 0],
        scale: [1, 0.3],
        duration: 220,
        delay: anime.stagger(25, { direction: 'reverse' }),
        easing: 'easeInBack',
        complete: () => setOpen(false),
      });
    });
  };

  const openMenu = () => {
    if (!avatarRef.current) return;
    setTriggerRect(avatarRef.current.getBoundingClientRect());
    setOpen(true);
  };

  const toggleMenu = () => (open ? closeMenu() : openMenu());

  const items: SpeedDialItem[] = [
    {
      id: 'dashboard',
      content: <Link href="/dashboard" onClick={closeMenu} aria-label={t('openDashboard')} title={t('openDashboard')} className="flex h-10 w-10 items-center justify-center rounded-full border border-ocean-cyan/35 bg-ucn-navy text-primary-foreground shadow-lg transition-transform hover:scale-110 hover:bg-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan"><Home className="h-4 w-4" /></Link>,
    },
    {
      id: 'theme',
      content: <button type="button" onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label={t('toggleTheme')} title={t('toggleTheme')} className="flex h-10 w-10 items-center justify-center rounded-full border border-ocean-cyan/35 bg-ucn-navy text-ocean-cyan shadow-lg transition-transform hover:scale-110 hover:bg-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan">{mounted && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>,
    },
    {
      id: 'language',
      content: <button type="button" onClick={() => router.replace(pathname, { locale: nextLocale })} aria-label={`${locale.toUpperCase()} → ${nextLocale.toUpperCase()}`} title={`${locale.toUpperCase()} → ${nextLocale.toUpperCase()}`} className="flex h-10 w-10 items-center justify-center rounded-full border border-ocean-cyan/35 bg-ucn-navy text-[11px] font-black text-primary-foreground shadow-lg transition-transform hover:scale-110 hover:bg-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan">{locale.toUpperCase()}</button>,
    },
    {
      id: 'settings',
      content: <Link href="/dashboard/settings" onClick={closeMenu} aria-label={t('settings')} title={t('settings')} className="flex h-10 w-10 items-center justify-center rounded-full border border-ocean-cyan/35 bg-ocean-cyan/20 text-ocean-cyan shadow-lg shadow-ocean-cyan/15 transition-transform hover:scale-110 hover:bg-ocean-cyan/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan"><Settings className="h-4 w-4" /></Link>,
    },
    {
      id: 'logout',
      content: <button type="button" onClick={handleLogout} aria-label={t('logout')} title={t('logout')} className="flex h-10 w-10 items-center justify-center rounded-full border border-coral-red/70 bg-coral-red text-primary-foreground shadow-lg shadow-coral-red/30 transition-transform hover:scale-110 hover:bg-coral-red/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-red"><LogOut className="h-4 w-4" /></button>,
    },
  ];

  useEffect(() => {
    if (!open || !triggerRect) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKeyDown);

    void import('animejs').then((module) => {
      const anime = module.default ?? module;
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const radius = 88;
      const startAngle = -105;
      const endAngle = 15;
      const step = items.length > 1 ? (endAngle - startAngle) / (items.length - 1) : 0;

      if (reduceMotion) {
        itemRefs.current.forEach((element, index) => {
          if (!element) return;
          const angle = ((startAngle + step * index) * Math.PI) / 180;
          element.style.transform = `translateX(${Math.cos(angle) * radius}px) translateY(${Math.sin(angle) * radius}px)`;
          element.style.opacity = '1';
        });
        return;
      }

      anime({ targets: overlayRef.current, opacity: [0, 1], duration: 220, easing: 'easeOutQuad' });
      anime({ targets: glowRef.current, opacity: [0, 1], scale: [0.35, 1], duration: 260, easing: 'easeOutQuad' });
      itemRefs.current.forEach((element, index) => {
        if (!element) return;
        const angle = ((startAngle + step * index) * Math.PI) / 180;
        anime({
          targets: element,
          translateX: [0, Math.cos(angle) * radius],
          translateY: [0, Math.sin(angle) * radius],
          opacity: [0, 1],
          scale: [0.3, 1],
          duration: 500,
          delay: index * 60,
          easing: 'easeOutElastic(1, .6)',
        });
      });
      anime({ targets: triggerRef.current, scale: [1, 0.9, 1], duration: 360, easing: 'easeOutElastic(1, .6)' });
    });

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, triggerRect]);

  const avatar = (
    <div ref={avatarRef} className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-ocean-cyan to-primary text-sm font-black text-primary-foreground ring-2 ring-ocean-cyan/45">
      {session?.avatarUrl ? <img src={session.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : initials}
    </div>
  );

  return (
    <div className={`relative border-t border-primary-foreground/10 p-3 ${collapsed ? 'overflow-visible' : ''}`}>
      <button ref={triggerRef} type="button" onClick={toggleMenu} aria-expanded={open} aria-label={t('accountMenu')} className="mx-auto flex rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-ucn-navy">
        {avatar}
      </button>

      {mounted && open && triggerRect && createPortal(
        <div ref={overlayRef} className="fixed inset-0 z-[100] opacity-0" onClick={closeMenu}>
          <div className="absolute" style={{ left: triggerRect.left + triggerRect.width / 2, top: triggerRect.top + triggerRect.height / 2 }}>
            <div ref={glowRef} className="pointer-events-none absolute h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ucn-navy/65 opacity-0 shadow-[0_0_50px_rgba(0,199,229,0.18)] backdrop-blur-md" />
            <button type="button" onClick={(event) => { event.stopPropagation(); closeMenu(); }} aria-label={t('accountMenu')} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_18px_rgba(0,199,229,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-ocean-cyan to-primary text-sm font-black text-primary-foreground ring-2 ring-ocean-cyan/45">
                {session?.avatarUrl ? <img src={session.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : initials}
              </div>
            </button>
            {items.map((item, index) => (
              <div key={item.id} ref={(element) => { itemRefs.current[index] = element; }} className="absolute -translate-x-1/2 -translate-y-1/2 opacity-0">
                <div onClick={(event) => event.stopPropagation()}>{item.content}</div>
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
