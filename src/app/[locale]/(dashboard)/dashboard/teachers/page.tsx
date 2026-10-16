"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileUp,
  HelpCircle,
  Loader2,
  Mail,
  Pencil,
  Power,
  PowerOff,
  Search,
  UserPlus,
  UserRound,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import TeacherFormModal from "@/components/dashboard/teachers/TeacherFormModal";
import TeacherDeactivateModal from "@/components/dashboard/teachers/TeacherDeactivateModal";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { PageSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeletons";
import { apiFetch } from "@/lib/api";
import type { Teacher } from "@/types/justifications";

const PAGE_SIZE = 10;
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function TeachersPage() {
  const t = useTranslations("TeachersPage");
  const { activeRole } = useActiveRole();
  const inputRef = useRef<HTMLInputElement>(null);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const downloadExample = () => {
    const content =
      "nombre;correo;nrc1;nrc2\nJuan Pérez;juan.perez@ucn.cl;10001;10002\nAna Soto;ana.soto@ucn.cl;10003;";
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "ejemplo-profesores.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportRosterCsv = () => {
    if (teachers.length === 0) return;
    const headers = [
      "Nombre",
      "Correo Institucional",
      "Código Empleado",
      "Estado",
      "Grado Académico",
      "Título Profesional",
      "Institución de Egreso",
      "Fecha Incorporación",
      "Fecha Desvinculación",
      "Asignaturas y NRCs",
    ];
    const targetTeachers = filtered.length > 0 ? filtered : teachers;
    const rows = targetTeachers.map((teacherItem) => [
      `"${(teacherItem.name || "").replace(/"/g, '""')}"`,
      `"${(teacherItem.email || "").replace(/"/g, '""')}"`,
      `"${(teacherItem.employeeCode || "").replace(/"/g, '""')}"`,
      teacherItem.isActive === false ? "Inactivo" : "Activo",
      `"${(teacherItem.academicDegree || "").replace(/"/g, '""')}"`,
      `"${(teacherItem.professionalTitle || "").replace(/"/g, '""')}"`,
      `"${(teacherItem.institution || "").replace(/"/g, '""')}"`,
      teacherItem.joinedOn ? teacherItem.joinedOn.split("T")[0] : "",
      teacherItem.leftOn ? teacherItem.leftOn.split("T")[0] : "",
      `"${(teacherItem.assignments || [])
        .map((a) => `${a.course?.name || "Asignatura"} (NRC ${a.nrc})`)
        .join("; ")
        .replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "\uFEFF" +
      [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    link.download = `padron_docentes_fcm_${dateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportSuccess"));
  };

  const [reloadKey, setReloadKey] = useState(0);
  const canManage =
    activeRole === "SYSTEM_ADMIN" || activeRole === "ACADEMIC_SECRETARY";
  const canRead = canManage || activeRole === "ACADEMIC_PROCESS_ANALYST";
  const loadErrorMessage = t("errors.load");

  useEffect(() => {
    if (!canRead) return;
    let active = true;
    apiFetch<Teacher[] | { items: Teacher[] }>("/academic/teachers?pageSize=100")
      .then((data) => {
        if (active) {
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.items)
              ? data.items
              : [];
          setTeachers(list);
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
  }, [canRead, loadErrorMessage, reloadKey]);

  const filtered = useMemo(() => {
    const list = Array.isArray(teachers) ? teachers : [];
    return list.filter((teacher) => {
      if (statusFilter === "ACTIVE" && teacher.isActive === false) return false;
      if (statusFilter === "INACTIVE" && teacher.isActive !== false) return false;

      const term = search.toLowerCase().trim();
      if (!term) return true;

      return `${teacher.name} ${teacher.email} ${teacher.employeeCode ?? ""} ${(teacher.assignments ?? [])
        .map((assignment) => assignment.nrc)
        .join(" ")}`
        .toLowerCase()
        .includes(term);
    });
  }, [search, statusFilter, teachers]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleTeachers = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const importRoster = async (file: File) => {
    setImporting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await apiFetch<{
        importedTeachers: number;
        importedAssignments: number;
      }>("/academic/teachers/import-roster", {
        method: "POST",
        body: JSON.stringify({ csv: await file.text() }),
      });
      setMessage(
        t("importSuccess", {
          teachers: result.importedTeachers,
          assignments: result.importedAssignments,
        }),
      );
      toast.success(
        t("importSuccess", {
          teachers: result.importedTeachers,
          assignments: result.importedAssignments,
        }),
      );
      setLoading(true);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : t("errors.import");
      setError(message);
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  const handleTeacherSaved = (saved: Teacher) => {
    setTeachers((current) => {
      const exists = current.some((item) => item.id === saved.id);
      if (exists) {
        return current.map((item) => (item.id === saved.id ? saved : item));
      }
      return [saved, ...current];
    });
  };

  const handleToggleStatus = async (teacherToToggle: Teacher) => {
    setIsTogglingStatus(true);
    const newStatus = teacherToToggle.isActive === false;
    try {
      const updated = await apiFetch<Teacher>(
        `/academic/teachers/${teacherToToggle.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive: newStatus }),
        },
      );
      setTeachers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(
        t("notifications.statusSuccess", { name: updated.name }),
      );
      setShowDeactivateModal(false);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : t("errors.status");
      toast.error(message);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  if (activeRole === null) return <PageSkeleton label={t("loading")} />;
  if (!canRead)
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        {t("errors.access")}
      </div>
    );

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setSelectedTeacher(null);
                setShowFormModal(true);
              }}
              className="btn-cta-primary"
            >
              <UserPlus className="h-4 w-4" />
              {t("newTeacher")}
            </button>
          )}

          <button
            type="button"
            onClick={exportRosterCsv}
            disabled={teachers.length === 0}
            className="btn-cta-secondary"
            title={t("exportRoster")}
          >
            <Download className="h-4 w-4" />
            {t("exportRoster")}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importRoster(file);
              event.target.value = "";
            }}
          />
          {canManage && (
            <button
              type="button"
              disabled={importing}
              onClick={() => inputRef.current?.click()}
              className="btn-cta-secondary"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="h-4 w-4" />
              )}
              {t("import")}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="btn-cta-secondary px-3"
            aria-label={t("help")}
            title={t("help")}
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </header>

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

      <section className="rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
              {t("status")}:
            </span>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ALL");
                setPage(1);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === "ALL"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t("filterAll")}
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ACTIVE");
                setPage(1);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === "ACTIVE"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t("filterActive")}
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("INACTIVE");
                setPage(1);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === "INACTIVE"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t("filterInactive")}
            </button>
          </div>

          <label className="relative block md:w-80">
            <span className="sr-only">{t("search")}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("search")}
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
        </div>
      </section>

      {loading ? (
        <TableSkeleton columns={4} label={t("loading")} />
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
          {teachers.length === 0 ? t("empty") : t("noMatches")}
        </div>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="hidden grid-cols-[minmax(180px,1fr)_minmax(160px,0.9fr)_minmax(240px,1.5fr)_minmax(90px,0.5fr)_minmax(160px,1fr)] gap-4 border-b border-border bg-muted/40 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:grid">
            <span>{t("teacherColumn")}</span>
            <span>{t("emailColumn")}</span>
            <span>{t("nrcs")}</span>
            <span>{t("status")}</span>
            {canManage && <span className="text-right">{t("actions")}</span>}
          </div>
          <ul className="divide-y divide-border">
            {visibleTeachers.map((teacher) => {
              const isActive = teacher.isActive !== false;
              return (
                <li
                  key={teacher.id}
                  className="grid gap-2.5 px-4 py-3.5 md:grid-cols-[minmax(180px,1fr)_minmax(160px,0.9fr)_minmax(240px,1.5fr)_minmax(90px,0.5fr)_minmax(160px,1fr)] md:items-center md:gap-4 md:px-5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <UserRound className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {teacher.name}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                        {teacher.employeeCode && (
                          <span className="font-bold uppercase tracking-wider">
                            {teacher.employeeCode}
                          </span>
                        )}
                        {teacher.joinedOn && (
                          <>
                            {teacher.employeeCode && <span>•</span>}
                            <span>
                              {t("joinedDate", {
                                date: teacher.joinedOn.split("T")[0],
                              })}
                            </span>
                          </>
                        )}
                      </div>
                      {(teacher.academicDegree || teacher.professionalTitle || teacher.institution) && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                          {teacher.academicDegree && (
                            <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 font-bold text-primary">
                              {teacher.academicDegree}
                            </span>
                          )}
                          {teacher.professionalTitle && (
                            <span className="inline-flex items-center rounded-md border border-secondary/25 bg-secondary/10 px-1.5 py-0.5 font-medium text-secondary">
                              {teacher.professionalTitle}
                            </span>
                          )}
                          {teacher.institution && (
                            <span
                              className="max-w-[200px] truncate text-[10px] text-muted-foreground"
                              title={teacher.institution}
                            >
                              ({teacher.institution})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="flex min-w-0 items-center gap-1.5 pl-11 text-xs text-muted-foreground md:pl-0">
                    <span className="md:hidden">{t("emailColumn")}:</span>
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{teacher.email}</span>
                  </p>

                  <div className="flex min-w-0 flex-col gap-1 pl-11 md:pl-0">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground md:hidden">
                      {t("nrcs")}:
                    </span>
                    {teacher.assignments && teacher.assignments.length > 0 ? (
                      teacher.assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="inline-flex max-w-fit items-center gap-1.5 rounded-lg border border-border/80 bg-muted/60 px-2 py-0.5 text-xs text-foreground transition hover:border-primary/40 hover:bg-muted"
                          title={`${assignment.course?.name || t("unnamedCourse")} (NRC ${assignment.nrc})`}
                        >
                          <BookOpen className="h-3 w-3 shrink-0 text-primary" />
                          <span className="truncate font-semibold max-w-[160px] lg:max-w-[220px]">
                            {assignment.course?.name || t("unnamedCourse")}
                          </span>
                          <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.2 text-[10px] font-extrabold text-primary">
                            NRC {assignment.nrc}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>

                  <div className="pl-11 md:pl-0">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-secondary/20 bg-secondary/10 px-2.5 py-1 text-[11px] font-bold text-secondary">
                        <CheckCircle2 className="h-3 w-3" />
                        {t("statusActive")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-coral-red/20 bg-coral-red/10 px-2.5 py-1 text-[11px] font-bold text-coral-red">
                        <XCircle className="h-3 w-3" />
                        {t("statusInactive")}
                      </span>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex items-center justify-end gap-2 pl-11 md:pl-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setShowFormModal(true);
                        }}
                        aria-label={t("editTeacher")}
                        title={t("editTeacher")}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>{t("editTeacher")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setShowDeactivateModal(true);
                        }}
                        aria-label={
                          isActive
                            ? t("deactivateTeacher")
                            : t("activateTeacher")
                        }
                        title={
                          isActive
                            ? t("deactivateTeacher")
                            : t("activateTeacher")
                        }
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                          isActive
                            ? "border-coral-red/30 bg-coral-red/10 text-coral-red hover:bg-coral-red/20"
                            : "border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/20"
                        }`}
                      >
                        {isActive ? (
                          <>
                            <PowerOff className="h-3.5 w-3.5" />
                            <span>{t("deactivateTeacher")}</span>
                          </>
                        ) : (
                          <>
                            <Power className="h-3.5 w-3.5" />
                            <span>{t("activateTeacher")}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <footer className="flex flex-col gap-3 border-t border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {t("pagination", { page, totalPages, total: filtered.length })}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                aria-label={t("previous")}
                className="rounded-xl border border-border p-2 text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-foreground">
                {page}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                aria-label={t("next")}
                className="rounded-xl border border-border p-2 text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </section>
      )}

      {showFormModal && (
        <TeacherFormModal
          isOpen={showFormModal}
          teacher={selectedTeacher}
          onClose={() => setShowFormModal(false)}
          onSaved={handleTeacherSaved}
        />
      )}

      {showDeactivateModal && (
        <TeacherDeactivateModal
          isOpen={showDeactivateModal}
          teacher={selectedTeacher}
          isProcessing={isTogglingStatus}
          onClose={() => setShowDeactivateModal(false)}
          onConfirm={handleToggleStatus}
        />
      )}

      {showHelp && (
        <HelpDialog
          title={t("helpTitle")}
          description={t("helpDescription")}
          format={t("format")}
          downloadLabel={t("downloadExample")}
          onDownload={downloadExample}
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  );
}

function HelpDialog({
  title,
  description,
  format,
  downloadLabel,
  onDownload,
  onClose,
}: {
  title: string;
  description: string;
  format: string;
  downloadLabel: string;
  onDownload: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      eyebrow="CSV"
      title={title}
      closeLabel="Cerrar"
      size="lg"
      footer={
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          {downloadLabel}
        </button>
      }
    >
      <p className="text-sm text-muted-foreground">{description}</p>
      <code className="mt-4 block rounded-2xl bg-muted p-4 text-xs font-mono text-foreground">
        {format}
      </code>
    </Modal>
  );
}
