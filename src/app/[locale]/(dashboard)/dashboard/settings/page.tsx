"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { apiFetch } from "@/lib/api";
import { CardsSkeleton, PageSkeleton } from "@/components/ui/LoadingSkeletons";
import SemesterEditor, { type Semester } from "./SemesterEditor";
import SemesterBudgetDialog from "./SemesterBudgetDialog";
import SemesterBudgetSummary from "./SemesterBudgetSummary";

const secondaryButton =
  "min-h-11 rounded-lg border border-border px-3 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export default function SettingsPage() {
  const t = useTranslations("SemesterSettingsPage");
  const format = useFormatter();
  const { activeRole } = useActiveRole();
  const canManageSemesters =
    activeRole === "SYSTEM_ADMIN" || activeRole === "ACADEMIC_SECRETARY";
  const canManageBudget =
    canManageSemesters || activeRole === "ACADEMIC_PROCESS_ANALYST";
  const [semesters, setSemesters] = useState<Semester[] | "error" | null>(null);
  const [reload, setReload] = useState(0);
  const [budgetRevision, setBudgetRevision] = useState(0);
  const [editor, setEditor] = useState<{ semester: Semester | null } | null>(
    null,
  );
  const [budgetSemester, setBudgetSemester] = useState<Semester | null>(null);

  useEffect(() => {
    if (!canManageBudget) return;
    let current = true;
    apiFetch<Semester[]>("/academic/semesters")
      .then((data) => {
        if (current) setSemesters(data);
      })
      .catch(() => {
        if (current) setSemesters("error");
      });
    return () => {
      current = false;
    };
  }, [canManageBudget, reload]);

  if (activeRole === null) return <PageSkeleton />;
  if (!canManageBudget)
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        {t("errors.access")}
      </p>
    );

  const active = Array.isArray(semesters)
    ? semesters.find((semester) => semester.isActive)
    : undefined;
  const history = Array.isArray(semesters)
    ? semesters.filter((semester) => !semester.isActive)
    : [];
  const date = (value: string) =>
    format.dateTime(new Date(value), { dateStyle: "medium", timeZone: "UTC" });
  const period = ({ startsOn, endsOn }: Semester) =>
    t("period", { start: date(startsOn), end: date(endsOn) });
  const refresh = () => {
    setReload((key) => key + 1);
  };

  return (
    <div className="max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {canManageSemesters && (
          <button
            type="button"
            disabled={semesters === null}
            onClick={() => setEditor({ semester: null })}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50"
          >
            <Plus aria-hidden="true" className="size-4" />
            {t("activate")}
          </button>
        )}
      </header>

      {semesters === null && <CardsSkeleton count={2} />}
      {semesters === "error" && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-x-3 rounded-xl border border-destructive/30 px-4 py-2 text-sm text-destructive"
        >
          {t("errors.load")}
          <button
            type="button"
            onClick={() => {
              setSemesters(null);
              refresh();
            }}
            className="min-h-11 font-semibold underline"
          >
            {t("retry")}
          </button>
        </div>
      )}
      {Array.isArray(semesters) && (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <section
            aria-labelledby="active-semester-title"
            className="min-w-0 rounded-2xl border border-border bg-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
              <div className="min-w-0">
                <h2
                  id="active-semester-title"
                  className="text-sm font-semibold text-muted-foreground"
                >
                  {t("activeTitle")}
                </h2>
                {active ? (
                  <>
                    <p className="mt-1 wrap-anywhere text-2xl font-bold tracking-tight text-foreground">
                      {active.name}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays
                        aria-hidden="true"
                        className="size-4 shrink-0"
                      />
                      {period(active)}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-foreground">
                    {t("noActive")}
                  </p>
                )}
              </div>
              {active && canManageSemesters && (
                <button
                  type="button"
                  onClick={() => setEditor({ semester: active })}
                  className={secondaryButton}
                >
                  {t("edit")}
                </button>
              )}
            </div>
            {active && (
              <SemesterBudgetSummary
                key={active.id}
                semesterId={active.id}
                revision={budgetRevision}
                onConfigure={() => setBudgetSemester(active)}
              />
            )}
          </section>

          <section
            aria-labelledby="semester-history-title"
            className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card"
          >
            <h2
              id="semester-history-title"
              className="px-4 pt-4 text-base font-bold text-foreground sm:px-5"
            >
              {t("history")}
            </h2>
            {history.length ? (
              <ul className="mt-2 divide-y divide-border">
                {history.map((semester) => (
                  <li
                    key={semester.id}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5 sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="wrap-anywhere text-sm font-semibold text-foreground">
                        {semester.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {period(semester)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBudgetSemester(semester)}
                      aria-label={t("configureHistoryBudget", {
                        name: semester.name,
                      })}
                      className={secondaryButton}
                    >
                      {t("historyBudget")}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 pb-4 pt-2 text-sm text-muted-foreground sm:px-5">
                {t(active ? "emptyHistory" : "empty")}
              </p>
            )}
          </section>
        </div>
      )}

      {canManageSemesters && editor && (
        <SemesterEditor
          semester={editor.semester}
          onClose={() => setEditor(null)}
          onSaved={refresh}
        />
      )}
      {budgetSemester && (
        <SemesterBudgetDialog
          semesterId={budgetSemester.id}
          semesterName={budgetSemester.name}
          onClose={() => setBudgetSemester(null)}
          onSaved={() => {
            if (budgetSemester.id === active?.id)
              setBudgetRevision((revision) => revision + 1);
          }}
        />
      )}
    </div>
  );
}
