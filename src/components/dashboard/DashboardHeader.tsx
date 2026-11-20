"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Ref } from "react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import type { UserRoleCode } from "@/types/auth";

interface DashboardHeaderProps {
  activeRole: UserRoleCode | null;
  mobileOpen: boolean;
  mobileDialogId: string;
  menuTriggerRef: Ref<HTMLButtonElement>;
  onMenuOpen: () => void;
}

export default function DashboardHeader({
  activeRole,
  mobileOpen,
  mobileDialogId,
  menuTriggerRef,
  onMenuOpen,
}: DashboardHeaderProps) {
  const t = useTranslations("DashboardNav");

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-2 border-b border-border bg-card px-4 py-1 md:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <button
          ref={menuTriggerRef}
          type="button"
          onClick={onMenuOpen}
          aria-label={t("openMenu")}
          aria-haspopup="dialog"
          aria-expanded={mobileOpen}
          aria-controls={mobileDialogId}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-control text-foreground hover:bg-selection focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus md:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <Breadcrumbs className="min-w-0 [&_li]:min-w-0 [&_ol]:flex-wrap [&_ol]:gap-y-1" />
      </div>
      {activeRole && (
        <p className="max-w-36 shrink-0 wrap-break-word text-end text-sm leading-snug text-muted-foreground sm:max-w-52 md:hidden">
          {t(`roles.${activeRole}`)}
        </p>
      )}
    </header>
  );
}
