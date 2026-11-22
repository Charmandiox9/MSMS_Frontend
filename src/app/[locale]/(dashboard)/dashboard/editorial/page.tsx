import { getTranslations } from "next-intl/server";
import EditorialList from "./EditorialList";

export default async function EditorialPage() {
  const t = await getTranslations("Editorial");
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("admin.title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("admin.description")}</p>
      </header>
      <EditorialList />
    </div>
  );
}
