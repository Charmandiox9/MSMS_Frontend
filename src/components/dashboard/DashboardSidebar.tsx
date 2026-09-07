'use client';

import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { getActiveSession, logout, type ActiveSession } from '@/lib/auth';

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

const roleLabel = (role: string | undefined, t: ReturnType<typeof useTranslations>) =>
  role ? t(`roles.${role}`) : t('sessionActive');

export default function DashboardSidebar({
  collapsed,
  onCollapsedChange,
}: {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}) {
  const t = useTranslations('DashboardNav');
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState<ActiveSession | null>(null);

  useEffect(() => {
    void getActiveSession().then(setSession);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  const renderNavigation = (isCollapsed: boolean, closeMobile?: () => void) => (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
      {sections.map((section) => (
        <section key={section.key}>
          {!isCollapsed && (
            <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100/45">
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
                      ? 'bg-cyan-400/15 text-white shadow-inner ring-1 ring-cyan-300/20'
                      : 'text-cyan-50/65 hover:bg-white/8 hover:text-white'
                  } ${isCollapsed ? 'justify-center' : 'gap-3'}`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-cyan-300' : 'group-hover:text-cyan-200'}`} />
                  {!isCollapsed && <span className="truncate">{t(item.key)}</span>}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );

  const account = (
    <div className="border-t border-white/10 p-3">
      <div className={`flex items-center rounded-2xl bg-white/5 p-2.5 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-sm font-black text-cyan-200">
          {session?.email?.slice(0, 1).toUpperCase() ?? 'U'}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">{session?.email ?? t('sessionActive')}</p>
            <p className="truncate text-[11px] text-cyan-100/55">{roleLabel(session?.roles[0], t)}</p>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleLogout}
        title={collapsed ? t('logout') : undefined}
        className={`mt-2 flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-bold text-rose-200 transition-colors hover:bg-rose-400/10 hover:text-rose-100 ${collapsed ? 'justify-center' : 'gap-3'}`}
      >
        <LogOut className="h-5 w-5" />
        {!collapsed && t('logout')}
      </button>
    </div>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#031423]/95 px-5 text-white backdrop-blur-xl md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-300"><BarChart3 className="h-5 w-5" /></span>
          <span className="font-black tracking-tight">MARSYS</span>
        </Link>
        <button type="button" onClick={() => setMobileOpen(true)} className="rounded-xl p-2 text-cyan-100 hover:bg-white/10" aria-label={t('openMenu')}>
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label={t('closeMenu')} />
          <aside className="relative flex h-full w-[290px] max-w-[85vw] flex-col bg-[#031423] py-5 text-white shadow-2xl ring-1 ring-white/10">
            <div className="flex items-center justify-between px-5">
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 font-black tracking-tight">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300"><BarChart3 className="h-5 w-5" /></span>
                MARSYS
              </Link>
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-xl p-2 text-cyan-100 hover:bg-white/10" aria-label={t('closeMenu')}><X className="h-5 w-5" /></button>
            </div>
            {renderNavigation(false, () => setMobileOpen(false))}
            {account}
          </aside>
        </div>
      )}

      <aside className={`fixed bottom-4 left-4 top-4 z-40 hidden flex-col rounded-[2rem] border border-white/10 bg-[#031423]/95 py-5 text-white shadow-[0_22px_55px_rgba(2,12,27,0.35)] backdrop-blur-xl transition-[width] duration-300 md:flex ${collapsed ? 'w-20' : 'w-72'}`}>
        <div className={`flex items-center px-5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && <Link href="/dashboard" className="flex items-center gap-2 font-black tracking-tight"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300"><BarChart3 className="h-5 w-5" /></span>MARSYS</Link>}
          <button type="button" onClick={() => onCollapsedChange(!collapsed)} className="rounded-xl p-2 text-cyan-100/65 hover:bg-white/10 hover:text-white" aria-label={collapsed ? t('expand') : t('collapse')}>
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
        {renderNavigation(collapsed)}
        {account}
      </aside>
    </>
  );
}
