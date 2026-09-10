'use client';

import {
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { DASHBOARD_SECTIONS, getFilteredNavigation } from '@/config/navigation';
import DashboardUserDial from '@/components/dashboard/DashboardUserDial';
import type { ActiveSession } from '@/types/auth';

interface DashboardSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  activeRole?: string | null;
  session: ActiveSession | null;
}

export default function DashboardSidebar({
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileOpenChange,
  activeRole,
  session,
}: DashboardSidebarProps) {
  const t = useTranslations('DashboardNav');
  const pathname = usePathname();

  const sections = getFilteredNavigation(DASHBOARD_SECTIONS, activeRole);

  const renderNavigation = (isCollapsed: boolean, closeMobile?: () => void) => (
    <nav aria-label="Sidebar Navigation" className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
      {sections.map((section) => (
        <section key={section.key} aria-label={t(`sections.${section.key}`)}>
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
                  aria-current={isActive ? 'page' : undefined}
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

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-ucn-navy/70 backdrop-blur-sm"
            onClick={() => onMobileOpenChange(false)}
            aria-label={t('closeMenu')}
          />
          <aside className="relative flex h-full w-[290px] max-w-[85vw] flex-col bg-ucn-navy py-5 text-primary-foreground shadow-2xl ring-1 ring-primary-foreground/10">
            <div className="flex items-center justify-between px-5">
              <Link
                href="/dashboard"
                onClick={() => onMobileOpenChange(false)}
                className="flex items-center gap-2 font-black tracking-tight"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ocean-cyan/15 text-ocean-cyan">
                  <BarChart3 className="h-5 w-5" />
                </span>
                MARSYS
              </Link>
              <button
                type="button"
                onClick={() => onMobileOpenChange(false)}
                className="rounded-xl p-2 text-primary-foreground/80 hover:bg-primary-foreground/10"
                aria-label={t('closeMenu')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNavigation(false, () => onMobileOpenChange(false))}
            <DashboardUserDial session={session} collapsed={false} />
          </aside>
        </div>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-primary-foreground/10 bg-ucn-navy py-5 text-primary-foreground transition-[width] duration-300 md:flex ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        <div className={`flex items-center px-5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 font-black tracking-tight">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ocean-cyan/15 text-ocean-cyan">
                <BarChart3 className="h-5 w-5" />
              </span>
              MARSYS
            </Link>
          )}
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            className="rounded-xl p-2 text-primary-foreground/65 hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan"
            aria-label={collapsed ? t('expand') : t('collapse')}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>
        {renderNavigation(collapsed)}
        <DashboardUserDial session={session} collapsed={collapsed} />
      </aside>
    </>
  );
}
