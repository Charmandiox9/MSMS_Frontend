"use client";

import {
  ClipboardCheck,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  UserCheck,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import QuickActionCard from "@/components/dashboard/widgets/QuickActionCard";
import WidgetCard from "@/components/dashboard/widgets/WidgetCard";
import { Link } from "@/i18n/routing";
import RoleDashboardStats from "@/components/dashboard/RoleDashboardStats";

export default function SystemAdminDashboard() {
  const t = useTranslations("DashboardViews.systemAdmin");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <RoleDashboardStats
        endpoint="/dashboard/system-admin"
        metrics={[
          {
            key: "assistantships",
            title: t("stats.assistantships"),
            description: t("stats.assistantshipsDesc"),
            icon: Users,
          },
          {
            key: "assistants",
            title: t("stats.assistants"),
            description: t("stats.assistantsDesc"),
            icon: Users,
          },
          {
            key: "users",
            title: t("stats.users"),
            description: t("stats.usersDesc"),
            icon: Users,
          },
          {
            key: "roles",
            title: t("stats.roles"),
            description: t("stats.rolesDesc"),
            icon: Shield,
          },
          {
            key: "activeUsers",
            title: t("stats.activeUsers"),
            description: t("stats.activeUsersDesc"),
            icon: ShieldCheck,
          },
          {
            key: "pendingJustifications",
            title: t("stats.pending"),
            description: t("stats.pendingDesc"),
            icon: ClipboardCheck,
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WidgetCard title={t("actionsTitle")} subtitle={t("actionsSubtitle")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <QuickActionCard
                title={t("actions.manageUsers")}
                description={t("actions.manageUsersDesc")}
                href="/dashboard/users"
                icon={UserCheck}
              />
              <QuickActionCard
                title={t("actions.systemSettings")}
                description={t("actions.systemSettingsDesc")}
                href="/dashboard/settings"
                icon={Sliders}
              />
            </div>
          </WidgetCard>
        </div>

        <div>
          <div className="relative overflow-hidden rounded-2xl border border-ocean-cyan/35 dark:border-cyan-500/35 bg-gradient-to-br from-ocean-cyan/15 via-card to-card dark:from-ocean-cyan/25 dark:via-[#0c182c] dark:to-card p-6 shadow-sm dark:shadow-[0_4px_25px_rgba(2,132,199,0.15)]">
            {/* Resplandor ambiental de esquina para mantener el efecto en ambos temas */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-cyan-400/15 blur-2xl dark:bg-cyan-400/25"
            />
            <div className="relative z-10 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ocean-cyan/20 text-ocean-cyan dark:bg-cyan-500/20 dark:text-cyan-300">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t("law21719.title")}
                </h3>
                <span className="inline-block rounded-full bg-ocean-cyan/10 px-2 py-0.5 text-[10px] font-bold text-ocean-cyan dark:bg-cyan-500/15 dark:text-cyan-300">
                  {t("law21719.status")}
                </span>
              </div>
            </div>
            <p className="relative z-10 mt-4 text-xs leading-relaxed text-muted-foreground">
              {t("law21719.statusDesc")}
            </p>
            <div className="relative z-10 mt-5 border-t border-border/60 pt-4">
              <Link
                href="/privacy"
                className="inline-flex items-center text-xs font-semibold text-ocean-cyan dark:text-cyan-400 dark:hover:text-cyan-300 hover:underline"
              >
                {t("law21719.viewPolicy")} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
