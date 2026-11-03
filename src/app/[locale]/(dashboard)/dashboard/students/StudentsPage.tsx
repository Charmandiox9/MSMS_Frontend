"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Eye, Plus, Pencil, UsersRound } from "lucide-react";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { apiFetch } from "@/lib/api";
import { PageSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeletons";
import PaginationControls from "@/components/ui/PaginationControls";
import type { Student } from "@/types/students";
import type { PaginatedResponse } from "@/types/pagination";
import type { CurrentCourseCatalog } from "@/types/academic";
import StudentDialog from "./StudentDialog";
import ImportStudentsDialog from "./ImportStudentsDialog";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import AcademicDetailsDialog from "@/components/dashboard/academic/AcademicDetailsDialog";
import AcademicImportButton from "@/components/dashboard/academic/AcademicImportButton";
import {
  academicPrimaryActionClass,
  academicSecondaryActionClass,
} from "@/components/dashboard/academic/academicActionStyles";

const studentListGridColumns =
  "md:grid-cols-[minmax(220px,1.4fr)_minmax(200px,1.1fr)_minmax(280px,1.4fr)]";

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
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [viewingCoursesStudent, setViewingCoursesStudent] =
    useState<Student | null>(null);
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
      <DashboardPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          canManage ? (
            <>
              <button
                type="button"
                onClick={() => setEditor(null)}
                className={academicPrimaryActionClass}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("create")}
              </button>
              <AcademicImportButton
                label={t("import")}
                onClick={() => setImportOpen(true)}
              />
            </>
          ) : null
        }
      />
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
        <p className="text-xs leading-5 text-muted-foreground">
          {t("searchHelp")}
        </p>
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
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className={`hidden ${studentListGridColumns} gap-3 border-b border-border bg-muted/40 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:grid`}>
            <span>{t("studentColumn")}</span>
            <span>{t("coursesColumn")}</span>
            <span className="text-right">{t("actions")}</span>
          </div>
          <ul className="divide-y divide-border">
            {result.items.map((student) => (
              <li
                key={student.id}
                className={`grid gap-3 p-4 ${studentListGridColumns} md:items-center`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UsersRound className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground md:hidden">
                      {t("studentColumn")}
                    </span>
                    <h2 className="text-sm font-semibold text-foreground">
                      {student.name}
                    </h2>
                    <p className="break-all text-xs text-muted-foreground">
                      {student.email}
                    </p>
                  </div>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground md:hidden">
                    {t("coursesColumn")}
                  </span>
                  {student.enrollments.length ? (
                    <button
                      type="button"
                      aria-label={t("viewCoursesFor", { name: student.name })}
                      onClick={() => setViewingCoursesStudent(student)}
                      className={academicSecondaryActionClass}
                    >
                      <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("viewCourses", { count: student.enrollments.length })}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t("noCourses")}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                  <span className="mb-1 w-full text-[10px] font-bold uppercase tracking-wide text-muted-foreground md:hidden">
                    {t("actions")}
                  </span>
                  <button
                    type="button"
                    aria-label={t("viewStudent", { name: student.name })}
                    onClick={() => setViewingStudent(student)}
                    className={academicSecondaryActionClass}
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("viewDetails")}
                  </button>
                  {canManage && (
                    <button
                      type="button"
                      aria-label={t("editStudent", { name: student.name })}
                      onClick={() => setEditor(student)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-primary/30 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("edit")}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <PaginationControls
            page={page}
            totalPages={Math.max(1, result.totalPages)}
            totalItems={result.total}
            summary={t("pagination", {
              page,
              totalPages: Math.max(1, result.totalPages),
              total: result.total,
            })}
            variant="tableFooter"
            showSinglePage
            onPageChange={(value) => {
              setLoading(true);
              setPage(value);
            }}
          />
        </section>
      )}
      {editor !== undefined && canManage && (
        <StudentDialog
          student={editor}
          initialNrc={nrc}
          onClose={() => setEditor(undefined)}
          onSaved={refresh}
        />
      )}
      {viewingStudent && (
        <AcademicDetailsDialog
          title={t("detailsTitle")}
          description={t("detailsDescription")}
          closeLabel={t("close")}
          onClose={() => setViewingStudent(null)}
          fields={[
            { label: t("name"), value: viewingStudent.name },
            { label: t("email"), value: viewingStudent.email },
            {
              label: t("courses"),
              value: viewingStudent.enrollments.length ? (
                <ul className="space-y-2">
                  {viewingStudent.enrollments.map((enrollment) => (
                    <li key={enrollment.id}>
                      {enrollment.nrc} · {enrollment.course.name} · {enrollment.semester.name}
                    </li>
                  ))}
                </ul>
              ) : (
                t("noCourses")
              ),
            },
          ]}
        />
      )}
      {viewingCoursesStudent && (
        <AcademicDetailsDialog
          title={t("coursesDialogTitle", { name: viewingCoursesStudent.name })}
          description={t("coursesDialogDescription")}
          closeLabel={t("close")}
          onClose={() => setViewingCoursesStudent(null)}
          fields={[
            {
              label: t("coursesColumn"),
              value: (
                <ul className="space-y-2">
                  {viewingCoursesStudent.enrollments.map((enrollment) => (
                    <li key={enrollment.id}>
                      {enrollment.nrc} · {enrollment.course.name} · {enrollment.semester.name}
                    </li>
                  ))}
                </ul>
              ),
            },
          ]}
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
