"use client";

import { useTranslations } from "next-intl";
import AcademicQuickLinks from "@/components/dashboard/AcademicQuickLinks";

export default function AcademicInformationPage() {
  const t = useTranslations("DashboardNav");

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-black text-foreground">
        {t("academicInformation")}
      </h1>
      <AcademicQuickLinks />
    </section>
  );
}
