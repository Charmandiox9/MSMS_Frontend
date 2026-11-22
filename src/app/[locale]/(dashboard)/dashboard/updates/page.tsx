import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { editorialTopics } from "@/features/editorial/presentation";
import UpdatesList from "./UpdatesList";

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[]; topic?: string | string[] }>;
}) {
  const [params, t] = await Promise.all([
    searchParams,
    getTranslations("Editorial"),
  ]);
  const kind = params.tab === "guides" ? "GUIDE" : "NEWS";
  const topic = editorialTopics.find((value) => value === params.topic);
  const tabClass =
    "rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-card px-5 py-6 shadow-sm sm:px-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {t("description")}
        </p>
      </header>
      <nav
        aria-label={t("title")}
        className="flex w-fit flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1"
      >
        <Link
          href="/dashboard/updates"
          aria-current={kind === "NEWS" ? "page" : undefined}
          className={`${tabClass} ${kind === "NEWS" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
        >
          {t("news")}
        </Link>
        <Link
          href="/dashboard/updates?tab=guides"
          aria-current={kind === "GUIDE" ? "page" : undefined}
          className={`${tabClass} ${kind === "GUIDE" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
        >
          {t("guides")}
        </Link>
      </nav>
      <UpdatesList
        key={`${kind}:${topic ?? ""}`}
        kind={kind}
        initialTopic={topic}
      />
    </div>
  );
}
