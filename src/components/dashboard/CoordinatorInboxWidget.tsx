"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CircleAlert, ClipboardCheck } from "lucide-react";
import { Link } from "@/i18n/routing";
import { apiFetch } from "@/lib/api";
import { CardsSkeleton } from "@/components/ui/LoadingSkeletons";
import type { JustificationInboxEntry } from "@/types/justifications";
import { useDashboardStartup } from "@/context/DashboardStartupContext";

type InboxEntry = JustificationInboxEntry;

export default function CoordinatorInboxWidget() {
  const t = useTranslations("DashboardViews.teachingSupportCoordinator");
  const locale = useLocale();
  const { completeTask } = useDashboardStartup();
  const [entries, setEntries] = useState<InboxEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void apiFetch<InboxEntry[]>("/justifications/inbox")
      .then((result) => {
        if (active) setEntries(result.slice(0, 3));
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) completeTask("coordinator-inbox");
      });
    return () => {
      active = false;
    };
  }, [completeTask]);

  return (
    <div className="space-y-3 text-sm" aria-live="polite">
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-surface p-3 text-foreground"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
          {t("tasks.error")}
        </p>
      ) : entries === null ? (
        <CardsSkeleton count={3} label={t("tasks.loading")} />
      ) : entries.length === 0 ? (
        <p className="rounded-xl bg-muted/40 p-3 text-muted-foreground">
          {t("tasks.empty")}
        </p>
      ) : (
        entries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-xl border border-warning/40 bg-warning-surface p-3"
          >
            <p className="font-bold text-foreground">{entry.subjectName}</p>
            {entry.student && (
              <p className="mt-1 font-semibold text-foreground">{entry.student.name}</p>
            )}
            <p className="mt-1 text-muted-foreground">{entry.studentEmail}</p>
            <p className="mt-1 text-muted-foreground">
              {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                new Date(entry.absenceDate),
              )}
            </p>
          </article>
        ))
      )}
      <Link
        href="/dashboard/justifications"
        className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
      >
        <ClipboardCheck className="h-4 w-4" />
        {t("tasks.openInbox")}
      </Link>
    </div>
  );
}
