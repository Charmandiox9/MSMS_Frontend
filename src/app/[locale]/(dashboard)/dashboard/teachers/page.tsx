"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  Mail,
  UserRound,
  Plus,
  Pencil,
  Power,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { PageSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeletons";
import PaginationControls from "@/components/ui/PaginationControls";
import { apiFetch } from "@/lib/api";
import type { Teacher } from "@/types/justifications";
import type { PaginatedResponse } from "@/types/pagination";
import type { CurrentCourseCatalog } from "@/types/academic";
import TeacherDialog from "@/components/dashboard/academic/TeacherDialog";
import HourlyPayRatesDialog from "@/components/dashboard/academic/HourlyPayRatesDialog";
import AcademicExcelImport from "@/components/dashboard/repository/AcademicExcelImport";
import AcademicImportButton from "@/components/dashboard/academic/AcademicImportButton";
import {
  academicPrimaryActionClass,
  academicSecondaryActionClass,
} from "@/components/dashboard/academic/academicActionStyles";
import AcademicCsvImportDialog from "@/components/dashboard/academic/AcademicCsvImportDialog";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import AcademicDetailsDialog from "@/components/dashboard/academic/AcademicDetailsDialog";
import { createCsv } from "@/lib/csv";

const PAGE_SIZE = 10;
type TeacherStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function TeachersPage() {
  const t = useTranslations("TeachersPage");
  const pay = useTranslations("HourlyPayments");
  const profileLabels = useTranslations("AcademicManagement");
  const format = useFormatter();
  const [showPayRates, setShowPayRates] = useState(false);
  const { activeRole } = useActiveRole();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [activeSemesterName, setActiveSemesterName] = useState<string | null>(null);
  const [semesterLoading, setSemesterLoading] = useState(true);
  const [semesterLoadFailed, setSemesterLoadFailed] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TeacherStatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<
    Teacher | null | undefined
  >(undefined);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);
  const [teacherToToggle, setTeacherToToggle] = useState<Teacher | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);

  const teacherTemplate = createCsv(
    ["nombre", "correo", "nrc1", "nrc2"],
    [
      {
        nombre: "Nombre Apellido",
        correo: "docente@example.com",
        nrc1: "NRC_EXISTENTE_1",
        nrc2: "NRC_EXISTENTE_2",
      },
      {
        nombre: "Otro Docente",
        correo: "docente2@example.com",
        nrc1: "NRC_EXISTENTE_3",
        nrc2: "",
      },
    ],
  );

  const [reloadKey, setReloadKey] = useState(0);
  const canManage =
    activeRole === "SYSTEM_ADMIN" ||
    activeRole === "ACADEMIC_SECRETARY" ||
    activeRole === "ACADEMIC_PROCESS_ANALYST";
  const canRead = canManage;
  const loadErrorMessage = t("errors.load");

  useEffect(() => {
    if (!canRead) return;
    let active = true;
    apiFetch<CurrentCourseCatalog>("/academic/courses/current")
      .then((catalog) => {
        if (active) {
          setActiveSemesterName(catalog.semester?.name ?? null);
          setSemesterLoadFailed(false);
        }
      })
      .catch(() => {
        if (active) {
          setActiveSemesterName(null);
          setSemesterLoadFailed(true);
        }
      })
      .finally(() => {
        if (active) setSemesterLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeRole, canRead]);

  // Carga al entrar y cada vez que `reloadKey` cambia (tras importar el padrón).
  useEffect(() => {
    if (!canRead) return;
    let active = true;
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      search: search.trim(),
    });
    if (statusFilter !== "ALL")
      query.set("isActive", String(statusFilter === "ACTIVE"));
    apiFetch<PaginatedResponse<Teacher>>(`/academic/teachers?${query}`)
      .then((data) => {
        if (active) {
          setTeachers(data.items);
          setTotal(data.total);
          setTotalPages(Math.max(1, data.totalPages));
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const message =
          cause instanceof Error ? cause.message : loadErrorMessage;
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [canRead, loadErrorMessage, reloadKey, page, search, statusFilter]);

  const toggleTeacherStatus = async () => {
    if (!teacherToToggle || changingStatus) return;
    const teacher = teacherToToggle;
    const isActive = teacher.isActive === false;
    setChangingStatus(true);
    const operation = apiFetch<Teacher>(
      `/academic/teachers/${teacher.id}/status`,
      { method: "PATCH", body: JSON.stringify({ isActive }) },
    );
    toast.promise(operation, {
      loading: t("statusSaving"),
      success: t(isActive ? "statusActivated" : "statusDeactivated", {
        name: teacher.name,
      }),
      error: (cause: unknown) =>
        cause instanceof Error ? cause.message : t("errors.status"),
    });
    try {
      await operation;
      setTeacherToToggle(null);
      setLoading(true);
      setReloadKey((key) => key + 1);
    } catch {
      // toast.promise presents the translated result and leaves the dialog open.
    } finally {
      setChangingStatus(false);
    }
  };

  const importRoster = (csv: string) =>
    apiFetch<{
      importedTeachers: number;
      importedAssignments: number;
    }>("/academic/teachers/import-roster", {
      method: "POST",
      body: JSON.stringify({ csv }),
    });

  if (activeRole === null) return <PageSkeleton label={t("loading")} />;
  if (!canRead)
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        {t("errors.access")}
      </div>
    );

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <>
            {canManage && (
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className={academicPrimaryActionClass}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("create")}
              </button>
            )}
            {canManage && (
              <AcademicImportButton
                label={t("import")}
                onClick={() => setCsvImportOpen(true)}
              />
            )}
            {canManage && (
              <AcademicExcelImport
                kind="hourly"
                sourceFileName="Planilla pagos PH 202620.xlsx"
                onImported={() => {
                  setLoading(true);
                  setPage(1);
                  setReloadKey((key) => key + 1);
                }}
              />
            )}
            {canManage && (
              <button
                type="button"
                onClick={() => setShowPayRates(true)}
                className={academicSecondaryActionClass}
              >
                {pay("ratesTitle")}
              </button>
            )}
          </>
        }
      />
      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
          {message}
        </div>
      )}
      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        {activeSemesterName ? (
          <p className="text-xs text-muted-foreground">
            {t("semester", { name: activeSemesterName })}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t(
              semesterLoading
                ? "semesterLoading"
                : semesterLoadFailed
                  ? "semesterLoadError"
                  : "noActiveSemester",
            )}
          </p>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("searchLabel")}
            <input
              type="search"
              maxLength={100}
              value={search}
              onChange={(event) => {
                setLoading(true);
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("search")}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            {t("statusFilter")}
            <select
              value={statusFilter}
              onChange={(event) => {
                setLoading(true);
                setStatusFilter(event.target.value as TeacherStatusFilter);
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <option value="ALL">{t("allStatuses")}</option>
              <option value="ACTIVE">{t("active")}</option>
              <option value="INACTIVE">{t("inactive")}</option>
            </select>
          </label>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          {t("searchHelp")}
        </p>
      </section>
      {loading ? (
        <TableSkeleton columns={3} label={t("loading")} />
      ) : teachers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
          {search.trim() ? t("noMatches") : t("empty")}
        </div>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="hidden grid-cols-[minmax(200px,1.2fr)_minmax(200px,1fr)_minmax(240px,1.4fr)] gap-4 border-b border-border bg-muted/40 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:grid xl:grid-cols-[minmax(160px,1fr)_minmax(200px,1.3fr)_minmax(140px,0.8fr)_minmax(280px,1.5fr)]">
            <span>{t("teacherColumn")}</span>
            <span>{t("emailColumn")}</span>
            <span>{t("nrcs")}</span>
            <span className="hidden text-right xl:block">{t("actions")}</span>
          </div>
          <ul className="divide-y divide-border">
            {teachers.map((teacher) => (
              <li
                key={teacher.id}
                className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(200px,1.2fr)_minmax(200px,1fr)_minmax(240px,1.4fr)] md:items-center md:gap-4 md:px-5 xl:grid-cols-[minmax(160px,1fr)_minmax(200px,1.3fr)_minmax(140px,0.8fr)_minmax(280px,1.5fr)]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {teacher.name}
                    </span>
                    {teacher.academicDegree && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {pay(`degrees.${teacher.academicDegree}`)}
                        {teacher.certification
                          ? ` · ${pay(`certifications.${teacher.certification}`)}`
                          : ""}
                      </span>
                    )}
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${teacher.isActive === false ? "bg-muted text-muted-foreground" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}
                    >
                      {t(teacher.isActive === false ? "inactive" : "active")}
                    </span>
                  </span>
                </div>
                <p className="flex min-w-0 items-center gap-1.5 pl-11 text-xs text-muted-foreground md:pl-0">
                  <span className="md:hidden">{t("emailColumn")}:</span>
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate">{teacher.email}</span>
                  </span>
                </p>
                <div className="flex min-w-0 flex-wrap items-center gap-1.5 pl-11 md:pl-0">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground md:hidden">
                    {t("nrcs")}:
                  </span>
                  {teacher.assignments.length > 0 ? (
                    teacher.assignments.map((assignment) => (
                      <span
                        key={assignment.id}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary"
                      >
                        {assignment.nrc}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 pl-11 md:pl-0 xl:flex-nowrap xl:justify-end">
                  <button
                    type="button"
                    onClick={() => setViewingTeacher(teacher)}
                    aria-label={t("viewTeacher", { name: teacher.name })}
                    className={academicSecondaryActionClass}
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("viewDetails")}
                  </button>
                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditingTeacher(teacher)}
                        aria-label={t("editTeacher", { name: teacher.name })}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/30 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("editAndCourses")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTeacherToToggle(teacher)}
                        aria-label={t(
                          teacher.isActive === false
                            ? "activateTeacher"
                            : "deactivateTeacher",
                          { name: teacher.name },
                        )}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Power className="h-3.5 w-3.5" aria-hidden="true" />
                        {t(
                          teacher.isActive === false
                            ? "activate"
                            : "deactivate",
                        )}
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={total}
            summary={t("pagination", { page, totalPages, total })}
            variant="tableFooter"
            showSinglePage
            onPageChange={(value) => {
              setLoading(true);
              setPage(value);
            }}
          />
        </section>
      )}
      {editingTeacher !== undefined && canManage && (
        <TeacherDialog
          teacher={editingTeacher}
          onClose={() => setEditingTeacher(undefined)}
          onSaved={() => {
            setEditingTeacher(undefined);
            setPage(1);
            setLoading(true);
            setReloadKey((key) => key + 1);
          }}
        />
      )}
      {viewingTeacher && (
        <AcademicDetailsDialog
          title={t("detailsTitle")}
          description={t("detailsDescription")}
          closeLabel={profileLabels("close")}
          onClose={() => setViewingTeacher(null)}
          fields={[
            { label: profileLabels("name"), value: viewingTeacher.name },
            { label: profileLabels("email"), value: viewingTeacher.email },
            {
              label: t("employeeCode"),
              value: viewingTeacher.employeeCode,
            },
            {
              label: pay("academicUnit"),
              value: viewingTeacher.academicUnit,
            },
            {
              label: pay("degree"),
              value: viewingTeacher.academicDegree
                ? pay(`degrees.${viewingTeacher.academicDegree}`)
                : null,
            },
            {
              label: pay("certification"),
              value: viewingTeacher.certification
                ? pay(`certifications.${viewingTeacher.certification}`)
                : null,
            },
            {
              label: pay("professionalTitle"),
              value: viewingTeacher.professionalTitle,
            },
            {
              label: pay("institution"),
              value: viewingTeacher.institution,
            },
            {
              label: pay("joinedOn"),
              value: viewingTeacher.joinedOn
                ? format.dateTime(new Date(`${viewingTeacher.joinedOn.slice(0, 10)}T00:00:00Z`), {
                    dateStyle: "medium",
                    timeZone: "UTC",
                  })
                : null,
            },
            {
              label: pay("leftOn"),
              value: viewingTeacher.leftOn
                ? format.dateTime(new Date(`${viewingTeacher.leftOn.slice(0, 10)}T00:00:00Z`), {
                    dateStyle: "medium",
                    timeZone: "UTC",
                  })
                : null,
            },
            {
              label: t("statusFilter"),
              value: t(viewingTeacher.isActive === false ? "inactive" : "active"),
            },
            {
              label: t("nrcs"),
              value: viewingTeacher.assignments.length ? (
                <ul className="space-y-2">
                  {viewingTeacher.assignments.map((assignment) => (
                    <li key={assignment.id}>
                      {assignment.nrc} · {assignment.course.name} · {assignment.semester.name}
                    </li>
                  ))}
                </ul>
              ) : (
                t("noAssignments")
              ),
            },
          ]}
        />
      )}
      {showPayRates && canManage && (
        <HourlyPayRatesDialog onClose={() => setShowPayRates(false)} />
      )}
      {csvImportOpen && canManage && (
        <AcademicCsvImportDialog
          title={t("helpTitle")}
          description={t("helpDescription")}
          format={t("format")}
          template={{
            fileName: "ejemplo-profesores.csv",
            content: teacherTemplate,
          }}
          fileLabel={t("file")}
          templateLabel={t("template")}
          downloadLabel={t("downloadExample")}
          cancelLabel={t("cancelStatus")}
          submitLabel={t("import")}
          submittingLabel={t("importing")}
          closeLabel={t("cancelStatus")}
          fileSizeError={t("errors.fileSize")}
          fileTypeError={t("errors.fileType")}
          importError={t("errors.import")}
          maxFileSizeBytes={2_000_000}
          onClose={() => setCsvImportOpen(false)}
          onImport={importRoster}
          onImported={(result) => {
            const success = t("importSuccess", {
              teachers: result.importedTeachers,
              assignments: result.importedAssignments,
            });
            setMessage(success);
            toast.success(success);
            setCsvImportOpen(false);
            setLoading(true);
            setPage(1);
            setReloadKey((key) => key + 1);
          }}
        />
      )}
      {teacherToToggle && (
        <Modal
          isOpen
          onClose={() => {
            if (!changingStatus) setTeacherToToggle(null);
          }}
          title={t(
            teacherToToggle.isActive === false
              ? "activateTitle"
              : "deactivateTitle",
          )}
          description={t(
            teacherToToggle.isActive === false
              ? "activateDescription"
              : "deactivateDescription",
            { name: teacherToToggle.name },
          )}
          closeLabel={t("cancelStatus")}
          footer={
            <>
              <button
                type="button"
                disabled={changingStatus}
                onClick={() => setTeacherToToggle(null)}
                className={academicSecondaryActionClass}
              >
                {t("cancelStatus")}
              </button>
              <button
                type="button"
                disabled={changingStatus}
                onClick={() => void toggleTeacherStatus()}
                className={academicPrimaryActionClass}
              >
                {t(
                  teacherToToggle.isActive === false
                    ? "activate"
                    : "deactivate",
                )}
              </button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">
            {t("statusPreservesLinks")}
          </p>
        </Modal>
      )}
    </div>
  );
}
