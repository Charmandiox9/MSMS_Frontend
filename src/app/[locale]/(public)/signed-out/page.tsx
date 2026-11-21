import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SignedOut");
  return {
    title: `${t("title")} | MARSYS`,
    robots: { index: false, follow: false },
  };
}

export default async function SignedOutPage() {
  const t = await getTranslations("SignedOut");

  return (
    <main className="institutional-theme flex min-h-dvh items-center justify-center bg-background px-4 py-12 text-foreground">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-7 text-center text-card-foreground shadow-sm sm:p-9">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-success/30 bg-success-surface text-success">
          <CheckCircle2 aria-hidden="true" className="size-7" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          MARSYS · UCN
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {t("description")}
        </p>
        <div className="mt-7 grid gap-3">
          <Link
            href="/login"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {t("returnToLogin")}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <Link
            href="/"
            className="flex min-h-11 items-center justify-center rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {t("returnToHome")}
          </Link>
        </div>
      </section>
    </main>
  );
}
