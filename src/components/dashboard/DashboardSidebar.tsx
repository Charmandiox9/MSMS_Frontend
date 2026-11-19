"use client";

import { X } from "lucide-react";
import type { Ref } from "react";
import { useTranslations } from "next-intl";
import DashboardAccountMenu from "@/components/dashboard/DashboardAccountMenu";
import {
  DASHBOARD_SECTIONS,
  getFilteredNavigation,
  type NavigationItem,
} from "@/config/navigation";
import { Link, usePathname } from "@/i18n/routing";
import type { ActiveSession, UserRoleCode } from "@/types/auth";

const NAVIGATION_GROUPS = [
  "studentSupport",
  "academicInformation",
  "research",
] as const;

interface DashboardSidebarProps {
  activeRole: UserRoleCode | null;
  session: ActiveSession | null;
  mobileOpen: boolean;
  mobileDialogId: string;
  mobileDialogRef: Ref<HTMLDialogElement>;
  onMobileCloseRequest: () => void;
  onMobileClosed: () => void;
}

interface DashboardNavigationProps {
  activeRole: UserRoleCode | null;
  onNavigate?: () => void;
}

function DashboardNavigation({ activeRole, onNavigate }: DashboardNavigationProps) {
  const t = useTranslations("DashboardNav");
  const pathname = usePathname();
  const sections = getFilteredNavigation(DASHBOARD_SECTIONS, activeRole);
  const items = sections.flatMap((section) => section.items);
  const currentItem = items
    .filter(({ href }) => pathname === href || (
      href !== "/dashboard" && pathname.startsWith(`${href}/`)
    ))
    .sort((first, second) => second.href.length - first.href.length)[0];

  const renderItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const isCurrent = item === currentItem;

    return (
      <li key={item.key}>
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={isCurrent ? (pathname === item.href ? "page" : "location") : undefined}
          className={`flex min-h-11 items-center gap-3 rounded-md border-s-2 px-3 py-1.5 text-sm leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset md:min-h-8 ${
            isCurrent
              ? "border-primary bg-selection font-semibold text-primary"
              : "border-transparent text-foreground hover:bg-selection"
          }`}
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 wrap-break-word">{t(item.key)}</span>
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label={t("sidebarNavigation")}
      data-lenis-prevent
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3"
    >
      {sections.map((section) => (
        <section key={section.key} aria-label={t(`sections.${section.key}`)} className="border-t border-border/75 py-3 first:border-t-0 first:pt-1">
          <p className="mb-1.5 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {t(`sections.${section.key}`)}
          </p>
          <ul>
            {section.items.filter((item) => !item.group).map(renderItem)}
            {NAVIGATION_GROUPS.map((group) => {
              const groupItems = section.items.filter((item) => item.group === group);
              if (groupItems.length === 0) return null;

              return (
                <li key={group} className="mt-3 first:mt-0">
                  <p className="mb-0.5 px-3 text-xs font-medium text-muted-foreground">
                    {t(`groups.${group}`)}
                  </p>
                  <ul aria-label={t(`groups.${group}`)}>
                    {groupItems.map(renderItem)}
                  </ul>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}

function DashboardBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/dashboard"
      onClick={onNavigate}
      className="inline-flex min-h-11 min-w-0 items-center gap-3 rounded-md font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-sm text-primary-foreground"
      >
        M
      </span>
      MARSYS
    </Link>
  );
}

export default function DashboardSidebar({
  activeRole,
  session,
  mobileOpen,
  mobileDialogId,
  mobileDialogRef,
  onMobileCloseRequest,
  onMobileClosed,
}: DashboardSidebarProps) {
  const t = useTranslations("DashboardNav");

  return (
    <>
      <aside className="sticky top-0 z-40 hidden h-dvh w-64 shrink-0 flex-col self-start border-e border-border bg-muted md:flex xl:w-72">
        <div className="shrink-0 border-b border-border px-5 py-3">
          <DashboardBrand />
        </div>
        <DashboardNavigation activeRole={activeRole} />
        <div className="relative shrink-0 border-t border-border bg-muted">
          <DashboardAccountMenu session={session} />
        </div>
      </aside>

      <dialog
        id={mobileDialogId}
        ref={mobileDialogRef}
        aria-label={t("sidebarNavigation")}
        onClose={onMobileClosed}
        onClick={(event) => {
          if (event.target === event.currentTarget) onMobileCloseRequest();
        }}
        data-lenis-prevent
        className="fixed inset-y-0 start-0 end-auto m-0 h-dvh max-h-none w-72 max-w-full overflow-visible border-e border-border bg-muted p-0 text-foreground backdrop:bg-foreground/35 md:hidden"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
            <button
              type="button"
              onClick={onMobileCloseRequest}
              aria-label={t("closeMenu")}
              className="order-1 grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-selection hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <DashboardBrand onNavigate={onMobileCloseRequest} />
          </div>
          <DashboardNavigation activeRole={activeRole} onNavigate={onMobileCloseRequest} />
          <div className="relative shrink-0 border-t border-border bg-muted">
            {mobileOpen && (
              <DashboardAccountMenu session={session} onNavigate={onMobileCloseRequest} />
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
