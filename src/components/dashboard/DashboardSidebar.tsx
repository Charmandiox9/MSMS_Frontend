'use client';

import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { getActiveSession, type ActiveSession } from '@/lib/auth';
import DashboardUserDial from '@/components/dashboard/DashboardUserDial';

type NavigationKey =
  | 'dashboard'
  | 'justifications'
  | 'academicInformation'
  | 'academicWorkload'
  | 'titulation'
  | 'reports'
  | 'users'
  | 'settings';

type NavigationItem = {
  key: NavigationKey;
  href: string;
  icon: LucideIcon;
};

type NavigationSection = {
  key: string;
  items: NavigationItem[];
};

const sections: NavigationSection[] = [
  { key: 'main', items: [{ key: 'dashboard', href: '/dashboard', icon: LayoutDashboard }] },
  {
    key: 'academic',
    items: [
      { key: 'justifications', href: '/dashboard/justifications', icon: ClipboardCheck },
      { key: 'academicInformation', href: '/dashboard/academic-information', icon: BookOpenCheck },
      { key: 'academicWorkload', href: '/dashboard/academic-workload', icon: CalendarDays },
      { key: 'titulation', href: '/dashboard/titulation', icon: GraduationCap },
    ],
  },
  { key: 'analysis', items: [{ key: 'reports', href: '/dashboard/reports', icon: FileBarChart }] },
  {
    key: 'system',
    items: [
      { key: 'users', href: '/dashboard/users', icon: Users },
      { key: 'settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

export default function DashboardSidebar({
  collapsed,
  onCollapsedChange,
}: {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}) {
  const t = useTranslations('DashboardNav');
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState<ActiveSession | null>(null);

  useEffect(() => {
    void getActiveSession().then(setSession);
  }, []);

  const renderNavigation = (isCollapsed: boolean, closeMobile?: () => void) => (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
      {sections.map((section) => (
        <section key={section.key}>
          {!isCollapsed && (
            <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-primary-foreground/45">
              {t(`sections.${section.key}`)}
            </p>
          )}
          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={closeMobile}
                  title={isCollapsed ? t(item.key) : undefined}
                  className={`group flex items-center rounded-2xl px-3 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-ocean-cyan/20 text-primary-foreground shadow-inner ring-1 ring-ocean-cyan/30'
                      : 'text-primary-foreground/65 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                  } ${isCollapsed ? 'justify-center' : 'gap-3'}`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-ocean-cyan' : 'group-hover:text-ocean-cyan'}`} />
                  {!isCollapsed && <span className="truncate">{t(item.key)}</span>}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );

  const account = (isCollapsed: boolean) => <DashboardUserDial session={session} collapsed={isCollapsed} />;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-primary-foreground/10 bg-ucn-navy/95 px-5 text-primary-foreground backdrop-blur-xl md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ocean-cyan/15 text-ocean-cyan"><BarChart3 className="h-5 w-5" /></span>
          <span className="font-black tracking-tight">MARSYS</span>
        </Link>
        <button type="button" onClick={() => setMobileOpen(true)} className="rounded-xl p-2 text-primary-foreground/80 hover:bg-primary-foreground/10" aria-label={t('openMenu')}>
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-ucn-navy/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label={t('closeMenu')} />
          <aside className="relative flex h-full w-[290px] max-w-[85vw] flex-col bg-ucn-navy py-5 text-primary-foreground shadow-2xl ring-1 ring-primary-foreground/10">
            <div className="flex items-center justify-between px-5">
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 font-black tracking-tight">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ocean-cyan/15 text-ocean-cyan"><BarChart3 className="h-5 w-5" /></span>
                MARSYS
              </Link>
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-xl p-2 text-primary-foreground/80 hover:bg-primary-foreground/10" aria-label={t('closeMenu')}><X className="h-5 w-5" /></button>
            </div>
            {renderNavigation(false, () => setMobileOpen(false))}
            {account(false)}
          </aside>
        </div>
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-primary-foreground/10 bg-ucn-navy py-5 text-primary-foreground transition-[width] duration-300 md:flex ${collapsed ? 'w-20' : 'w-72'}`}>
        <div className={`flex items-center px-5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && <Link href="/dashboard" className="flex items-center gap-2 font-black tracking-tight"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ocean-cyan/15 text-ocean-cyan"><BarChart3 className="h-5 w-5" /></span>MARSYS</Link>}
          <button type="button" onClick={() => onCollapsedChange(!collapsed)} className="rounded-xl p-2 text-primary-foreground/65 hover:bg-primary-foreground/10 hover:text-primary-foreground" aria-label={collapsed ? t('expand') : t('collapse')}>
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>
        {renderNavigation(collapsed)}
        {account(collapsed)}
      </aside>
    </>
  );
}
