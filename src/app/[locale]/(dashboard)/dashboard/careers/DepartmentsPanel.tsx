"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageSkeleton } from "@/components/ui/LoadingSkeletons";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { apiFetch } from "@/lib/api";
import DepartmentDialog, {
  type Department,
  type DepartmentAction,
} from "./DepartmentDialog";

export default function DepartmentsPanel() {
  const t = useTranslations("Departments");
  const { activeRole } = useActiveRole();
  const canManage =
    activeRole === "SYSTEM_ADMIN" || activeRole === "ACADEMIC_SECRETARY";
  const [result, setResult] = useState<Department[] | "error" | null>(null);
  const [version, setVersion] = useState(0);
  const [action, setAction] = useState<DepartmentAction | null>(null);

  useEffect(() => {
    let current = true;
    apiFetch<Department[]>("/academic/departments")
      .then((departments) => {
        if (current) setResult(departments);
      })
      .catch(() => {
        if (current) setResult("error");
      });
    return () => {
      current = false;
    };
  }, [version]);

  const reload = () => setVersion((previous) => previous + 1);

  return (
    <section className="space-y-4" aria-labelledby="departments-heading">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="departments-heading"
            className="text-xl font-bold text-foreground"
          >
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setAction({ type: "create" })}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            {t("create")}
          </button>
        )}
      </header>
      {result === null && <PageSkeleton label={t("loading")} />}
      {result === "error" && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive"
        >
          {t("loadError")}{" "}
          <button
            type="button"
            className="min-h-12 underline"
            onClick={() => {
              setResult(null);
              reload();
            }}
          >
            {t("retry")}
          </button>
        </div>
      )}
      {Array.isArray(result) &&
        (result.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {result.map((department) => (
              <li
                key={department.id}
                className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 p-4 sm:p-5"
              >
                <div className="min-w-0 flex-1 basis-56 wrap-anywhere">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h3 className="font-bold text-foreground">
                      {department.name}
                    </h3>
                    {department.code && (
                      <span className="text-xs font-semibold text-muted-foreground">
                        {department.code}
                      </span>
                    )}
                  </div>
                  {department.description && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {department.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("careerCount", { count: department._count.careers })}
                    {" · "}
                    {t("projectCount", { count: department._count.projects })}
                    {" · "}
                    {t("outputCount", { count: department._count.outputs })}
                  </p>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="min-h-12 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted"
                      onClick={() => setAction({ type: "edit", department })}
                      aria-label={t("editTitle", { name: department.name })}
                    >
                      {t("edit")}
                    </button>
                    <button
                      type="button"
                      className="min-h-12 rounded-lg border border-destructive/30 px-3 text-sm font-semibold text-destructive hover:bg-destructive/10"
                      onClick={() => setAction({ type: "delete", department })}
                      aria-label={t("deleteTitle", { name: department.name })}
                    >
                      {t("delete")}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ))}
      {action && (
        <DepartmentDialog
          action={action}
          onClose={() => setAction(null)}
          onSaved={() => {
            setAction(null);
            reload();
          }}
        />
      )}
    </section>
  );
}
