"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useMounted } from "@/hooks/useMounted";

const DISMISSED_KEY = "marsys_essential_storage_notice_dismissed";

function hasDismissedNotice() {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export default function EssentialStorageNotice() {
  const t = useTranslations("Privacy");
  const mounted = useMounted();
  const [dismissed, setDismissed] = useState(false);

  if (!mounted || dismissed || hasDismissedNotice()) {
    return null;
  }

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      setDismissed(true);
      return;
    }
    setDismissed(true);
  };

  return (
    <aside
      aria-label={t("notice_label")}
      className="fixed inset-x-0 bottom-0 z-[9998] border-t border-border bg-card px-5 py-4 text-card-foreground shadow-lg sm:px-8"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {t("storage_notice")} {" "}
          <Link className="font-medium text-primary underline underline-offset-4" href="/privacy">
            {t("privacy_policy")}
          </Link>
          .
        </p>
        <button
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onClick={dismiss}
          type="button"
        >
          {t("dismiss_notice")}
        </button>
      </div>
    </aside>
  );
}
