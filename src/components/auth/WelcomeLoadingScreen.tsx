"use client";

import { GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserRoleCode } from "@/types/auth";

export default function WelcomeLoadingScreen({
  phase,
  displayName,
  activeRole,
}: {
  phase: "checking" | "entering";
  displayName?: string;
  activeRole?: UserRoleCode | null;
}) {
  const t = useTranslations("SessionEntry");
  const tRoles = useTranslations("DashboardNav.roles");
  const greeting = displayName?.trim()
    ? t("welcomePersonalized", { name: displayName.trim() })
    : t("welcomeGeneric");

  return (
    <main className="institutional-theme flex min-h-dvh items-center justify-center bg-background px-5 py-10 text-foreground">
      <section
        role="status"
        aria-busy="true"
        aria-label={t(phase === "checking" ? "checkingTitle" : "preparing")}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-7 text-card-foreground shadow-sm sm:p-9"
      >
        <div className="flex items-center gap-4">
          <span className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-selection text-primary">
            <GraduationCap aria-hidden="true" className="size-7" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              MARSYS
            </p>
            <h1 className="mt-1 text-xl font-bold leading-tight text-foreground sm:text-2xl">
              {phase === "checking" ? t("checkingTitle") : greeting}
            </h1>
          </div>
        </div>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          {phase === "checking" ? t("checkingDescription") : t("preparing")}
        </p>
        {phase === "entering" && activeRole && (
          <p className="mt-3 rounded-xl bg-muted px-4 py-3 text-sm text-foreground">
            <span className="text-muted-foreground">{t("activeRole")}: </span>
            <span className="font-semibold">{tRoles(activeRole)}</span>
          </p>
        )}
        <div
          aria-hidden="true"
          className="welcome-loading-indicator mt-7 flex items-center gap-2"
        >
          <span className="welcome-loading-dot size-2 rounded-full bg-primary" />
          <span className="welcome-loading-dot size-2 rounded-full bg-primary" />
          <span className="welcome-loading-dot size-2 rounded-full bg-primary" />
        </div>
      </section>
    </main>
  );
}
