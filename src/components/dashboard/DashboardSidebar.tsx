'use client';

import {
  BarChart3,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { useState } from 'react';
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
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const sections = getFilteredNavigation(DASHBOARD_SECTIONS, activeRole);

  const renderNavigation = (isCollapsed: boolean, closeMobile?: () => void) => (
    <nav
      aria-label="Sidebar Navigation"
      data-lenis-prevent
      className="flex-1 space-y-5 overflow-y-auto px-3 py-5"
    >
      {sections.map((section) => (
        <section key={section.key} aria-label={t(`sections.${section.key}`)}>
          {!isCollapsed && (
            <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-primary-foreground/45">
              {t(`sections.${section.key}`)}
            </p>
          )}
          <div className="space-y-1">
            {(() => {
              const groupOrder = ['studentSupport', 'academicInformation', 'research', 'administration'] as const;
              const groupedItems = groupOrder.map((group) => ({
                group,
                items: section.items.filter((item) => item.group === group),
              })).filter(({ items }) => items.length > 0);
              const ungroupedItems = section.items.filter((item) => !item.group);
              const renderItem = (item: (typeof section.items)[number]) => {
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
              };

              return <>
                {ungroupedItems.map(renderItem)}
                {groupedItems.map(({ group, items }) => {
                  if (items.length === 1) return renderItem(items[0]);
                  const groupKey = `${section.key}.${group}`;
                  const active = items.some((item) => pathname === item.href);
                  const isOpen = openGroups.includes(groupKey) || active;
                  return <div key={groupKey}>
                    {!isCollapsed && <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenGroups((current) => current.includes(groupKey)
                        ? current.filter((key) => key !== groupKey)
                        : [...current, groupKey])}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold text-primary-foreground/55 transition-colors hover:bg-primary-foreground/5 hover:text-primary-foreground/80"
                    >
                      <span>{t(`groups.${group}`)}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>}
                    {(isCollapsed || isOpen) && <div className={`${isCollapsed ? '' : 'ml-2 space-y-1 border-l border-primary-foreground/10 pl-2'}`}>
                      {items.map(renderItem)}
                    </div>}
                  </div>;
                })}
              </>;
            })()}
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
          <aside
            data-lenis-prevent
            className="relative flex h-full w-[290px] max-w-[85vw] flex-col bg-ucn-navy py-5 text-primary-foreground shadow-2xl ring-1 ring-primary-foreground/10"
          >
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
        data-lenis-prevent
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
