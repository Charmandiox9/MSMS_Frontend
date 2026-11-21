"use client";

import { CheckCircle2, GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserRoleCode } from "@/types/auth";

export default function WelcomeLoadingScreen({
  phase,
  displayName,
  activeRole,
  exiting = false,
}: {
  phase: "checking" | "preparing";
  displayName?: string;
  activeRole?: UserRoleCode | null;
  exiting?: boolean;
}) {
  const t = useTranslations("SessionEntry");
  const tRoles = useTranslations("DashboardNav.roles");
  const isPreparing = phase === "preparing";
  const normalizedDisplayName = displayName?.replace(/\s+/gu, " ").trim() ?? "";
  const isPersonalized = isPreparing && normalizedDisplayName.length > 0;

  let features: string[] = [];
  if (isPreparing) {
    switch (activeRole) {
      case "SYSTEM_ADMIN":
        features = [
          t("features.systemAdmin.accounts"),
          t("features.systemAdmin.permissions"),
          t("features.systemAdmin.audit"),
        ];
        break;
      case "ACADEMIC_SECRETARY":
        features = [
          t("features.academicSecretary.academicInfo"),
          t("features.academicSecretary.teachers"),
          t("features.academicSecretary.records"),
        ];
        break;
      case "ACADEMIC_PROCESS_ANALYST":
        features = [
          t("features.academicProcessAnalyst.budget"),
          t("features.academicProcessAnalyst.projects"),
          t("features.academicProcessAnalyst.reports"),
        ];
        break;
      case "TEACHING_SUPPORT_COORDINATOR":
        features = [
          t("features.teachingSupportCoordinator.inbox"),
          t("features.teachingSupportCoordinator.assistantships"),
          t("features.teachingSupportCoordinator.schedules"),
        ];
        break;
      case "PRIVACY_OFFICER":
        features = [
          t("features.privacyOfficer.requests"),
          t("features.privacyOfficer.followUp"),
          t("features.privacyOfficer.audit"),
        ];
        break;
      default:
        features = [
          t("features.default.modules"),
          t("features.default.requests"),
          t("features.default.updates"),
        ];
    }
  }

  return (
    <main
      className="welcome-screen-overlay institutional-theme flex min-h-dvh items-center justify-center overflow-y-auto px-4 py-8 text-foreground sm:px-6"
      data-exiting={exiting ? "true" : "false"}
    >
      <section
        aria-busy="true"
        aria-label={t(isPreparing ? "preparing" : "checkingTitle")}
        className={`welcome-screen-card w-full max-w-5xl rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-lg sm:p-9 lg:p-12 ${isPreparing ? "" : "max-w-md"}`}
      >
        <header className="flex items-start gap-4 sm:gap-5">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-selection text-primary sm:size-16">
            <GraduationCap aria-hidden="true" className="size-7 sm:size-8" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t("welcomeBrand")}
            </p>
            <h1 className={`mt-2 ${isPersonalized ? "max-w-xl" : ""} text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl`}>
              {isPersonalized ? (
                <>
                  <span className="block text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
                    {t("welcomePersonalized")}
                  </span>{" "}
                  <span dir="auto" className="mt-1 block break-words text-balance text-foreground">
                    {normalizedDisplayName}
                  </span>
                </>
              ) : isPreparing ? (
                t("welcomeGeneric")
              ) : (
                t("checkingTitle")
              )}
            </h1>
            {isPreparing && activeRole && (
              <p className="mt-3 inline-flex min-h-10 flex-wrap items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm">
                <span className="text-muted-foreground">{t("activeRole")}:</span>
                <span className="font-semibold text-foreground">
                  {tRoles(activeRole)}
                </span>
              </p>
            )}
          </div>
        </header>

        {isPreparing ? (
          <>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground">
              {t("welcomeDescription")}
            </p>
            <section aria-labelledby="welcome-features-title" className="mt-8">
              <h2 id="welcome-features-title" className="text-lg font-semibold">
                {t("welcomeFeaturesTitle")}
              </h2>
              <ul className="mt-4 grid gap-3 md:grid-cols-3">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="flex min-h-20 items-start gap-3 rounded-2xl border border-border bg-background p-4 text-sm leading-relaxed"
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 text-primary"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </section>
            <p
              aria-live="polite"
              role="status"
              className="mt-8 flex items-center gap-3 border-t border-border pt-5 text-sm text-muted-foreground"
            >
              <span
                aria-hidden="true"
                className="welcome-loading-indicator relative flex size-4 shrink-0 items-center justify-center"
              >
                <span className="welcome-loading-dot size-2 rounded-full bg-primary" />
              </span>
              <span>{t("preparingDescription")}</span>
            </p>
          </>
        ) : (
          <p
            aria-live="polite"
            role="status"
            className="mt-5 text-base leading-relaxed text-muted-foreground"
          >
            {t("checkingDescription")}
          </p>
        )}

        {!isPreparing && (
          <div
            aria-hidden="true"
            className="welcome-loading-indicator mt-7 flex items-center gap-2"
          >
            <span className="welcome-loading-dot size-2 rounded-full bg-primary" />
            <span className="welcome-loading-dot size-2 rounded-full bg-primary" />
            <span className="welcome-loading-dot size-2 rounded-full bg-primary" />
          </div>
        )}
      </section>
    </main>
  );
}
