"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileUp,
  HelpCircle,
  Loader2,
  Mail,
  Search,
  UserRound,
  Plus,
  Pencil,
  Power,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { PageSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeletons";
import { apiFetch } from "@/lib/api";
import type { Teacher } from "@/types/justifications";
import type { PaginatedResponse } from "@/types/pagination";
import TeacherDialog from "@/components/dashboard/academic/TeacherDialog";
import HourlyPayRatesDialog from "@/components/dashboard/academic/HourlyPayRatesDialog";

const PAGE_SIZE = 10;
type TeacherStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function TeachersPage() {
  const t = useTranslations("TeachersPage");
  const pay = useTranslations("HourlyPayments");
  const [showPayRates, setShowPayRates] = useState(false);
  const { activeRole } = useActiveRole();
  const inputRef = useRef<HTMLInputElement>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TeacherStatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<
    Teacher | null | undefined
  >(undefined);
  const [teacherToToggle, setTeacherToToggle] = useState<Teacher | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);

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

  const [reloadKey, setReloadKey] = useState(0);
  const canManage =
    activeRole === "SYSTEM_ADMIN" ||
    activeRole === "ACADEMIC_SECRETARY" ||
    activeRole === "ACADEMIC_PROCESS_ANALYST";
  const canRead = canManage;
  const loadErrorMessage = t("errors.load");

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
      setPage(1);
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
        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <button
              type="button"
              onClick={() => setShowPayRates(true)}
              className="rounded-2xl border border-primary/30 px-4 py-2.5 text-sm font-bold text-primary"
            >
              {pay("ratesTitle")}
            </button>
          )}
          {canManage && (
            <button
              type="button"
              onClick={() => setEditingTeacher(null)}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Plus className="h-4 w-4" />
              {t("create")}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-bold text-muted-foreground transition hover:border-primary/50 hover:text-primary"
            aria-label={t("help")}
            title={t("help")}
          >
            <HelpCircle className="h-4 w-4" />?
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
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-60"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="h-4 w-4" />
              )}
              {t("import")}
            </button>
          )}
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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            {teachers[0]?.assignments[0] && (
              <p className="text-xs text-muted-foreground">
                {t("semester")}: {teachers[0].assignments[0].semester.name}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="text-xs font-semibold text-muted-foreground">
              {t("statusFilter")}
              <select
                value={statusFilter}
                onChange={(event) => {
                  setLoading(true);
                  setStatusFilter(event.target.value as TeacherStatusFilter);
                  setPage(1);
                }}
                className="mt-1 block h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="ALL">{t("allStatuses")}</option>
                <option value="ACTIVE">{t("active")}</option>
                <option value="INACTIVE">{t("inactive")}</option>
              </select>
            </label>
            <label className="relative block md:w-80">
              <span className="sr-only">{t("search")}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setLoading(true);
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder={t("search")}
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
          </div>
        </div>
      </section>
      {loading ? (
        <TableSkeleton columns={3} label={t("loading")} />
      ) : teachers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
          {search.trim() ? t("noMatches") : t("empty")}
        </div>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="hidden grid-cols-[minmax(200px,1.2fr)_minmax(200px,1fr)_minmax(240px,1.4fr)] gap-4 border-b border-border bg-muted/40 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:grid">
            <span>{t("teacherColumn")}</span>
            <span>{t("emailColumn")}</span>
            <span>{t("nrcs")}</span>
          </div>
          <ul className="divide-y divide-border">
            {teachers.map((teacher) => (
              <li
                key={teacher.id}
                className="grid gap-2.5 px-4 py-3 md:grid-cols-[minmax(200px,1.2fr)_minmax(200px,1fr)_minmax(240px,1.4fr)] md:items-center md:gap-4 md:px-5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <span className="truncate text-sm font-semibold text-foreground">
                    {teacher.name}
                  </span>
                </div>
                <p className="flex min-w-0 items-center gap-1.5 pl-11 text-xs text-muted-foreground md:pl-0">
                  <span className="md:hidden">{t("emailColumn")}:</span>
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate">{teacher.email}</span>
                    {teacher.rut && (
                      <span className="block text-xs">
                        {pay("rut")}: {teacher.rut}
                      </span>
                    )}
                    {teacher.academicDegree && (
                      <span className="block text-xs">
                        {pay(`degrees.${teacher.academicDegree}`)}
                        {teacher.certification
                          ? ` · ${pay(`certifications.${teacher.certification}`)}`
                          : ""}
                      </span>
                    )}
                    {teacher.academicUnit && (
                      <span className="block text-xs">
                        {teacher.academicUnit}
                      </span>
                    )}
                    {teacher.professionalTitle && (
                      <span className="block text-xs">
                        {teacher.professionalTitle}
                      </span>
                    )}
                    {teacher.institution && (
                      <span className="block text-xs">
                        {teacher.institution}
                      </span>
                    )}
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${teacher.isActive === false ? "bg-muted text-muted-foreground" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}
                    >
                      {t(teacher.isActive === false ? "inactive" : "active")}
                    </span>
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
                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditingTeacher(teacher)}
                        aria-label={t("editTeacher", { name: teacher.name })}
                        className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary/30 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Pencil className="h-3.5 w-3.5" />
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
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Power className="h-3.5 w-3.5" />
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
          <footer className="flex flex-col gap-3 border-t border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {t("pagination", { page, totalPages, total })}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  setPage((current) => current - 1);
                }}
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
                onClick={() => {
                  setLoading(true);
                  setPage((current) => current + 1);
                }}
                aria-label={t("next")}
                className="rounded-xl border border-border p-2 text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
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
      {showPayRates && canManage && (
        <HourlyPayRatesDialog onClose={() => setShowPayRates(false)} />
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
                className="btn-cta-secondary"
              >
                {t("cancelStatus")}
              </button>
              <button
                type="button"
                disabled={changingStatus}
                onClick={() => void toggleTeacherStatus()}
                className="btn-cta-primary"
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
