import StudentsPage from "./StudentsPage";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { linkClass } from "@/features/editorial/presentation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ nrc?: string }>;
}) {
  const [{ nrc }, t] = await Promise.all([searchParams, getTranslations("Editorial")]);
  return <div className="space-y-4">
    <div className="flex justify-end"><Link className={linkClass} href="/dashboard/updates?tab=guides&topic=STUDENTS">{t("contextual")}</Link></div>
    <StudentsPage initialNrc={nrc} />
  </div>;
}
