import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SignOutTransition from "@/components/auth/SignOutTransition";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SignedOut");
  return {
    title: `${t("title")} | MARSYS`,
    robots: { index: false, follow: false },
  };
}

export default async function SignedOutPage() {
  const t = await getTranslations("SignedOut");
  const tAccount = await getTranslations("DashboardNav");

  return (
    <SignOutTransition
      title={t("title")}
      description={t("description")}
      errorMessage={tAccount("signOutError")}
      retryLabel={t("retry")}
    />
  );
}
