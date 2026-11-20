"use client";

import {
  BarChart3,
  FileBarChart,
  FileText,
  FlaskConical,
  FolderKanban,
  GraduationCap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import QuickActionCard from "@/components/dashboard/widgets/QuickActionCard";
import WidgetCard from "@/components/dashboard/widgets/WidgetCard";
import RoleDashboardStats from "@/components/dashboard/RoleDashboardStats";
import SemesterBudgetAlerts from "@/components/dashboard/SemesterBudgetAlerts";
import AnalystBudgetOverview from "./AnalystBudgetOverview";

export default function AcademicProcessAnalystDashboard() {
  const t = useTranslations("DashboardViews.academicProcessAnalyst");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <SemesterBudgetAlerts variant="section" />
      <AnalystBudgetOverview />

      <RoleDashboardStats
        endpoint="/dashboard/academic-process-analyst"
        sectionLabels={{ general: t("metricsTitle") }}
        metrics={[
          {
            key: "projects",
            group: "general",
            href: "/dashboard/projects",
            title: t("stats.projects"),
            description: t("stats.projectsDesc"),
            icon: FolderKanban,
          },
          {
            key: "research",
            group: "general",
            href: "/dashboard/research",
            title: t("stats.research"),
            description: t("stats.researchDesc"),
            icon: FlaskConical,
          },
          {
            key: "researchOutputs",
            group: "general",
            href: "/dashboard/research-outputs",
            title: t("stats.outputs"),
            description: t("stats.outputsDesc"),
            icon: FileText,
          },
        ]}
      />

      <div className="grid gap-6">
        <WidgetCard title={t("actionsTitle")} subtitle={t("actionsSubtitle")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <QuickActionCard
              title={t("actions.reports")}
              description={t("actions.reportsDesc")}
              href="/dashboard/reports"
              icon={FileBarChart}
            />
            <QuickActionCard
              title={t("actions.charts")}
              description={t("actions.chartsDesc")}
              href="/dashboard/charts"
              icon={BarChart3}
            />
            <QuickActionCard
              title={t("actions.titulation")}
              description={t("actions.titulationDesc")}
              href="/dashboard/titulation"
              icon={GraduationCap}
            />
          </div>
        </WidgetCard>
      </div>
    </div>
  );
}
