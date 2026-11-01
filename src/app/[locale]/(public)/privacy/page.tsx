import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type PrivacyPageProps = {
  params: Promise<{ locale: string }>;
};

function getPrivacyContactEmail() {
  const email = process.env.PRIVACY_CONTACT_EMAIL?.trim();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyNoticePage" });

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("PrivacyNoticePage");
  const controllerName = process.env.PRIVACY_CONTROLLER_NAME?.trim() || null;
  const contactEmail = getPrivacyContactEmail();
  const rights = ["access", "rectification", "suppression", "opposition", "portability", "blocking"] as const;
  const sections = ["dataCategories", "purposes", "lawfulBasis", "recipients", "retention", "security"] as const;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <article className="space-y-10">
        <header className="max-w-3xl space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("eyebrow")}</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t("title")}</h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">{t("intro")}</p>
          <p className="text-sm text-muted-foreground">
            {t("version", { date: t("reviewDate"), version: "0.1" })}
          </p>
        </header>

        <section aria-labelledby="privacy-status-heading" className="rounded-2xl border border-accent/40 bg-accent/10 p-5 sm:p-6">
          <h2 id="privacy-status-heading" className="text-base font-semibold text-foreground">{t("status.title")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("status.description")}</p>
        </section>

        <section aria-labelledby="controller-heading" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 id="controller-heading" className="text-lg font-semibold text-card-foreground">{t("controller.title")}</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("controller.nameLabel")}</dt>
              <dd className="mt-1 text-sm text-card-foreground">{controllerName ?? t("controller.pending")}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("controller.contactLabel")}</dt>
              <dd className="mt-1 text-sm text-card-foreground">
                {contactEmail ? (
                  <a className="text-primary underline underline-offset-4" href={`mailto:${contactEmail}`}>
                    {contactEmail}
                  </a>
                ) : t("controller.contactPending")}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{t("controller.representativePending")}</p>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <section key={section} aria-labelledby={`${section}-heading`} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <h2 id={`${section}-heading`} className="text-base font-semibold text-card-foreground">
                {t(`sections.${section}.title`)}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t(`sections.${section}.description`)}
              </p>
            </section>
          ))}
        </div>

        <section aria-labelledby="rights-heading" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 id="rights-heading" className="text-lg font-semibold text-card-foreground">{t("rights.title")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("rights.description")}</p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rights.map((right) => (
              <li key={right} className="rounded-xl bg-muted p-4">
                <h3 className="text-sm font-semibold text-foreground">{t(`rights.items.${right}.title`)}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t(`rights.items.${right}.description`)}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            {contactEmail ? t("rights.contactConfigured") : t("rights.contactPending")}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("rights.blockingNote")}</p>
        </section>

        <section aria-labelledby="cookies-heading" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 id="cookies-heading" className="text-base font-semibold text-card-foreground">{t("cookies.title")}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("cookies.description")}</p>
        </section>

        <nav aria-label={t("navigation.label")}>
          <Link className="text-sm font-medium text-primary underline underline-offset-4" href="/login">
            {t("navigation.login")}
          </Link>
        </nav>
      </article>
    </main>
  );
}
