"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, FileUp, Pencil, UsersRound } from "lucide-react";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { apiFetch } from "@/lib/api";
import { PageSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeletons";
import PaginationControls from "@/components/ui/PaginationControls";
import type { Student } from "@/types/students";
import type { PaginatedResponse } from "@/types/pagination";
import type { CurrentCourseCatalog } from "@/types/academic";
import StudentDialog from "./StudentDialog";
import ImportStudentsDialog from "./ImportStudentsDialog";

export default function StudentsPage({
  initialNrc = "",
}: {
  initialNrc?: string;
}) {
  const t = useTranslations("StudentsPage");
  const { activeRole } = useActiveRole();
  const canManage =
    activeRole === "SYSTEM_ADMIN" || activeRole === "ACADEMIC_SECRETARY";
  const [search, setSearch] = useState("");
  const [nrc, setNrc] = useState(initialNrc);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResponse<Student> | null>(null);
  const [catalog, setCatalog] = useState<CurrentCourseCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [editor, setEditor] = useState<Student | null | undefined>(undefined);
  const [importOpen, setImportOpen] = useState(false);
  const loadError = t("errors.load");
  const canRead = activeRole !== null;
  useEffect(() => {
    if (!canRead) return;
    let active = true;
    const query = new URLSearchParams({
      page: String(page),
      pageSize: "10",
      search: search.trim(),
    });
    if (nrc) query.set("nrc", nrc);
    Promise.all([
      apiFetch<PaginatedResponse<Student>>(`/academic/students?${query}`),
      apiFetch<CurrentCourseCatalog>("/academic/courses/current"),
    ])
      .then(([students, courses]) => {
        if (active) {
          setResult(students);
          setCatalog(courses);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : loadError);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [canRead, search, nrc, page, reload, loadError]);
  const refresh = () => {
    setEditor(undefined);
    setImportOpen(false);
    setPage(1);
    setLoading(true);
    setReload((value) => value + 1);
  };
  if (!activeRole) return <PageSkeleton label={t("loading")} />;
  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditor(null)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Plus className="h-4 w-4" />
              {t("create")}
            </button>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
            >
              <FileUp className="h-4 w-4" />
              {t("import")}
            </button>
          </div>
        )}
      </header>
      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        {catalog && (
          <p className="text-xs text-muted-foreground">
            {catalog.semester
              ? t("semester", { name: catalog.semester.name })
              : t("noSemesterList")}
          </p>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("search")}
            <input
              type="search"
              maxLength={100}
              value={search}
              onChange={(event) => {
                setLoading(true);
                setSearch(event.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            {t("filterCourse")}
            <select
              value={nrc}
              onChange={(event) => {
                setLoading(true);
                setNrc(event.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <option value="">{t("allStudents")}</option>
              {catalog?.courses.map((course) => (
                <option key={course.nrc} value={course.nrc}>
                  {course.nrc} · {course.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      {error ? (
        <div
          role="alert"
          className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setReload((value) => value + 1);
            }}
            className="ml-3 underline"
          >
            {t("retry")}
          </button>
        </div>
      ) : loading ? (
        <TableSkeleton columns={3} label={t("loading")} />
      ) : !result?.items.length ? (
        <p className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          {t(search || nrc ? "noMatches" : "empty")}
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {t("total", { count: result.total })}
          </p>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {result.items.map((student) => (
              <li
                key={student.id}
                className="grid gap-3 p-4 md:grid-cols-[minmax(180px,1fr)_minmax(220px,1.5fr)_auto] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UsersRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-foreground">
                      {student.name}
                    </h2>
                    <p className="break-all text-xs text-muted-foreground">
                      {student.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {student.enrollments.length ? (
                    student.enrollments.map((enrollment) => (
                      <span
                        key={enrollment.id}
                        className="rounded-lg bg-primary/5 px-2 py-1 text-xs text-primary"
                      >
                        {enrollment.nrc} · {enrollment.course.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t("noCourses")}
                    </span>
                  )}
                </div>
                {canManage && (
                  <button
                    type="button"
                    aria-label={t("editStudent", { name: student.name })}
                    onClick={() => setEditor(student)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-primary/30 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t("edit")}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <PaginationControls
            page={page}
            totalPages={Math.max(1, result.totalPages)}
            totalItems={result.total}
            onPageChange={(value) => {
              setLoading(true);
              setPage(value);
            }}
          />
        </>
      )}
      {editor !== undefined && canManage && (
        <StudentDialog
          student={editor}
          initialNrc={nrc}
          onClose={() => setEditor(undefined)}
          onSaved={refresh}
        />
      )}
      {importOpen && canManage && (
        <ImportStudentsDialog
          onClose={() => setImportOpen(false)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
