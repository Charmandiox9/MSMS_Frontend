"use client";

import { Clock, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import RoleDashboardStats from "@/components/dashboard/RoleDashboardStats";

export default function PrivacyOfficerDashboard() {
  const t = useTranslations("DashboardViews.privacyOfficer");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <RoleDashboardStats
        endpoint="/dashboard/privacy-officer"
        sectionLabels={{ attention: t("metricsTitle") }}
        metrics={[
          {
            key: "pendingRequests",
            group: "attention",
            title: t("pending"),
            description: t("pendingDesc"),
            href: "/dashboard/privacy-requests",
            icon: ShieldCheck,
          },
          {
            key: "overdueRequests",
            group: "attention",
            title: t("overdue"),
            description: t("overdueDesc"),
            href: "/dashboard/privacy-requests",
            icon: Clock,
          },
        ]}
      />
    </div>
  );
}
