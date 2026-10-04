"use client";
import { useTranslations } from "next-intl";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { DASHBOARD_SECTIONS, getFilteredNavigation } from "@/config/navigation";
import { Link } from "@/i18n/routing";

export default function AcademicQuickLinks() {
  const t = useTranslations("DashboardNav");
  const { activeRole } = useActiveRole();
  const links = getFilteredNavigation(DASHBOARD_SECTIONS, activeRole)
    .flatMap((section) => section.items)
    .filter((item) =>
      ["assistantships", "subjects", "teachers", "reports"].includes(item.key),
    );
  return (
    <nav
      aria-label={t("academicInformation")}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {links.map(({ key, href, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-bold text-foreground transition hover:border-primary/40 hover:bg-primary/5"
        >
          <Icon className="h-5 w-5 text-primary" />
          {t(key)}
        </Link>
      ))}
    </nav>
  );
}
