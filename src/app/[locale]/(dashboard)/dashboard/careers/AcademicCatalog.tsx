"use client";

import { useState } from "react";
import { Building2, GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";
import CareersPage from "@/components/dashboard/CareersPage";
import DepartmentsPanel from "./DepartmentsPanel";

const sections = [
  { id: "careers", Icon: GraduationCap },
  { id: "departments", Icon: Building2 },
] as const;

export default function AcademicCatalog() {
  const t = useTranslations("CareersPage");
  const [section, setSection] =
    useState<(typeof sections)[number]["id"]>("careers");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black tracking-tight text-foreground">
        {t("title")}
      </h1>
      <div
        role="group"
        aria-label={t("title")}
        className="flex flex-wrap gap-x-3 border-b border-border"
      >
        {sections.map(({ id, Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={section === id}
            onClick={() => setSection(id)}
            className="inline-flex min-h-12 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary aria-pressed:border-primary aria-pressed:text-primary"
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {t(id)}
          </button>
        ))}
      </div>
      {section === "careers" ? <CareersPage /> : <DepartmentsPanel />}
    </div>
  );
}
