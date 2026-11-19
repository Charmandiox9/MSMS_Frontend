"use client";

import { ChevronDown, X } from "lucide-react";
import { useId, useState, type Ref } from "react";
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
  "administration",
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
  const navigationId = useId();
  const [groupOverrides, setGroupOverrides] = useState<
    Record<string, { open: boolean; pathname: string }>
  >({});
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
          className={`flex min-h-11 items-center gap-3 rounded-md border-s-2 px-3 py-2 text-sm leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset md:min-h-9 ${
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
      className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4"
    >
      {sections.map((section) => (
        <section key={section.key} aria-label={t(`sections.${section.key}`)}>
          <p className="mb-2 px-3 text-xs font-medium text-muted-foreground">
            {t(`sections.${section.key}`)}
          </p>
          <ul className="space-y-1">
            {section.items.filter((item) => !item.group).map(renderItem)}
            {NAVIGATION_GROUPS.map((group) => {
              const groupItems = section.items.filter((item) => item.group === group);
              if (groupItems.length < 2) return groupItems.map(renderItem);

              const groupKey = `${section.key}-${group}`;
              const groupId = `${navigationId}-${groupKey}`;
              const isCurrent = groupItems.some((item) => item === currentItem);
              const override = groupOverrides[groupKey];
              const isOpen = override?.open === true || (
                isCurrent && override?.pathname !== pathname
              );

              return (
                <li key={groupKey}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={groupId}
                    onClick={() => setGroupOverrides((current) => ({
                      ...current,
                      [groupKey]: { open: !isOpen, pathname },
                    }))}
                    className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-start text-sm font-medium text-muted-foreground hover:bg-selection hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset md:min-h-9"
                  >
                    {t(`groups.${group}`)}
                    <ChevronDown
                      className={`size-4 shrink-0 ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  <ul
                    id={groupId}
                    hidden={!isOpen}
                    className="ms-2 space-y-1 border-s border-border ps-2"
                  >
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
