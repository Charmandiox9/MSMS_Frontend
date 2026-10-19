"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, BookOpen, GraduationCap, Upload } from "lucide-react";
import { toast } from "sonner";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { apiFetch } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import { PageSkeleton } from "@/components/ui/LoadingSkeletons";
import type { Career, CourseOption } from "@/types/careers";
import { parseCurriculumCsv, type ImportedCurriculumCourse } from "./curriculum-csv";
import { useAcademicImportJob, type AcademicImportJob } from "./use-academic-import-job";

type EditorMode = "create" | "edit" | "version" | "version-edit";
type SelectedCourse = { courseId: string; termNumber: number };

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

function CareerEditor({
  mode,
  career,
  version,
  courseOptions,
  onClose,
  onSaved,
}: {
  mode: EditorMode;
  career: Career | null;
  version: Career["curriculumVersions"][number] | null;
  courseOptions: CourseOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("CareersPage");
  const [code, setCode] = useState(career?.code ?? "");
  const [name, setName] = useState(career?.name ?? "");
  const [cohortYear, setCohortYear] = useState(String(version?.cohortYear ?? new Date().getFullYear()));
  const [courseId, setCourseId] = useState("");
  const [termNumber, setTermNumber] = useState("1");
  const [courses, setCourses] = useState<SelectedCourse[]>(() => version?.courses.map(({ courseId, termNumber }) => ({ courseId, termNumber })) ?? []);
  const [curriculumSource, setCurriculumSource] = useState<"manual" | "csv">("manual");
  const [csvCourses, setCsvCourses] = useState<ImportedCurriculumCourse[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [job, setJob] = useState<AcademicImportJob<{ careerId: string; careerName: string; cohortYear: number; imported: number }> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useAcademicImportJob(
    job?.id ?? null,
    setJob,
    (result) => {
      toast.success(t("createdCsv", { name: result.careerName, year: result.cohortYear, count: result.imported }));
      onSaved();
    },
    (cause) => {
      setSaving(false);
      toast.error(cause || t("errors.import"));
    },
  );

  const readCsv = async (file: File | undefined) => {
    setCsvFileName(file?.name ?? "");
    setCsvCourses([]);
    setError(null);
    if (!file) return;
    try {
      const parsed = parseCurriculumCsv(await file.text());
      if (parsed.length === 0) throw new Error(t("importEmptyFile"));
      setCsvCourses(parsed);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t("errors.import"));
    }
  };

  const addCourse = () => {
    const selectedTerm = Number(termNumber);
    if (!courseId || selectedTerm < 1 || selectedTerm > 20) return;
    setCourses((current) => [
      ...current,
      { courseId, termNumber: selectedTerm },
    ]);
    setCourseId("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setJob(null);
    const body = mode === "edit"
      ? { code: code.trim(), name: name.trim() }
      : mode === "version-edit"
        ? { courses }
        : mode === "create" && curriculumSource === "csv"
          ? { cohortYear: Number(cohortYear), curriculumCourses: csvCourses }
          : { cohortYear: Number(cohortYear), courses };
    const url = mode === "create"
      ? "/academic/careers"
      : mode === "edit"
        ? `/academic/careers/${career!.id}`
        : mode === "version-edit"
          ? `/academic/careers/${career!.id}/curricula/${version!.id}`
          : `/academic/careers/${career!.id}/curricula`;
    if (mode === "create" && curriculumSource === "csv") {
      let queued = false;
      const operation = apiFetch<Pick<AcademicImportJob<unknown>, "id" | "status">>("/academic/imports/careers/commit", {
        method: "POST",
        body: JSON.stringify({ code: code.trim(), name: name.trim(), cohortYear: Number(cohortYear), courses: csvCourses }),
      });
      toast.promise(operation, {
        loading: t("queueSubmitting"),
        success: t("queued"),
        error: (cause: unknown) => cause instanceof Error ? cause.message : t("errors.import"),
      });
      try {
        const queuedJob = await operation;
        setJob(queuedJob);
        queued = true;
      } catch {
        // El toast ya comunica el error al enviar el trabajo.
      } finally {
        if (!queued) setSaving(false);
      }
      return;
    }

    const operation = apiFetch(url, {
      method: mode === "edit" || mode === "version-edit" ? "PATCH" : "POST",
      body: JSON.stringify(mode === "create" ? { ...body, code: code.trim(), name: name.trim() } : body),
    });
    toast.promise(operation, {
      loading: t("saving"),
      success: t(mode === "version" ? "versionCreated" : mode === "version-edit" ? "versionUpdated" : mode === "edit" ? "updated" : "created"),
      error: (cause: unknown) => cause instanceof Error ? cause.message : t("errors.save"),
    });
    try {
      await operation;
      onSaved();
    } catch {
      // El toast ya comunica el error de guardado.
    } finally {
      setSaving(false);
    }
  };

  const title = mode === "create" ? t("createTitle") : mode === "edit" ? t("editTitle") : mode === "version-edit" ? t("editVersionTitle", { year: version?.cohortYear ?? "" }) : t("versionTitle", { name: career?.name ?? "" });

  return (
    <Modal
      isOpen
      title={title}
      description={t("formDescription")}
      size="2xl"
      closeLabel={t("close")}
      onClose={() => { if (!saving) onClose(); }}
      closeOnEscape={!saving}
      closeOnBackdropClick={!saving}
      footer={
        <>
          <button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-bold disabled:opacity-50">{t("cancel")}</button>
          <button type="submit" form="career-editor" disabled={saving || (mode !== "edit" && (mode === "create" && curriculumSource === "csv" ? csvCourses.length === 0 : courses.length === 0))} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{t(saving ? job?.status === "PROCESSING" ? "processing" : job?.status === "QUEUED" ? "queued" : "saving" : "save")}</button>
        </>
      }
    >
      <form id="career-editor" onSubmit={(event) => void submit(event)} className="space-y-5">
        {(mode === "create" || mode === "edit") && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">{t("code")}<input required maxLength={30} value={code} onChange={(event) => setCode(event.target.value)} className={inputClass} /></label>
            <label className="text-sm font-semibold">{t("name")}<input required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></label>
          </div>
        )}
        {mode !== "edit" && (
          <>
            {mode !== "version-edit" && <label className="block text-sm font-semibold">{t("cohortYear")}<input required type="number" min={1900} max={2200} value={cohortYear} onChange={(event) => setCohortYear(event.target.value)} className={inputClass} /></label>}
            <fieldset className="space-y-3 rounded-xl border border-border p-4">
              <legend className="px-1 text-sm font-bold">{t("curriculumCourses")}</legend>
              {mode === "create" && <div className="flex flex-wrap gap-2" role="group" aria-label={t("curriculumSource")}>
                <button type="button" aria-pressed={curriculumSource === "manual"} onClick={() => { setCurriculumSource("manual"); setError(null); }} className={`rounded-lg border px-3 py-2 text-xs font-bold ${curriculumSource === "manual" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{t("manualEntry")}</button>
                <button type="button" aria-pressed={curriculumSource === "csv"} onClick={() => { setCurriculumSource("csv"); setError(null); }} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold ${curriculumSource === "csv" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}><Upload className="h-3.5 w-3.5" />{t("importCsvOption")}</button>
              </div>}
              {mode === "create" && curriculumSource === "csv" ? <div className="space-y-3">
                <label className="block text-sm font-semibold">{t("csvFile")}<input type="file" accept=".csv,text/csv" onChange={(event) => void readCsv(event.target.files?.[0])} className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-bold`} /></label>
                {csvFileName && csvCourses.length > 0 && <section className="space-y-2 rounded-xl border border-border bg-background/60 p-3" aria-live="polite"><p className="text-sm font-bold">{t("importPreview", { file: csvFileName, count: csvCourses.length })}</p><ul className="grid gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">{csvCourses.slice(0, 8).map((item, index) => <li key={`${item.courseName}-${item.termNumber}-${index}`}>{item.courseName} · {t("termBadge", { term: item.termNumber })}</li>)}</ul>{csvCourses.length > 8 && <p className="text-xs text-muted-foreground">{t("importMore", { count: csvCourses.length - 8 })}</p>}</section>}
              </div> : <>
                <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                  <select value={courseId} onChange={(event) => setCourseId(event.target.value)} className={inputClass}>
                    <option value="">{t("selectCourse")}</option>
                    {courseOptions.map((course) => <option key={course.id} value={course.id}>{course.code ? `${course.code} · ` : ""}{course.name}</option>)}
                  </select>
                  <label className="text-xs font-semibold text-muted-foreground">{t("termNumber")}<input type="number" min={1} max={20} value={termNumber} onChange={(event) => setTermNumber(event.target.value)} className={inputClass} /></label>
                  <button type="button" onClick={addCourse} disabled={!courseId} className="mt-5 inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-border px-3 text-sm font-bold disabled:opacity-50"><Plus className="h-4 w-4" />{t("addCourse")}</button>
                </div>
                {courses.length === 0 ? <p className="text-xs text-muted-foreground">{t("noCourses")}</p> : (
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {courses.map((selected, index) => {
                      const course = courseOptions.find((item) => item.id === selected.courseId);
                      return <li key={`${selected.courseId}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm"><span><span className="font-semibold">{course?.code ? `${course.code} · ` : ""}{course?.name}</span><span className="ml-2 text-xs text-muted-foreground">{t("termBadge", { term: selected.termNumber })}</span></span><button type="button" onClick={() => setCourses((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-xs font-semibold text-destructive">{t("remove")}</button></li>;
                    })}
                  </ul>
                )}
                {courseOptions.length === 0 && <p className="text-xs text-muted-foreground">{t("courseCatalogEmpty")}</p>}
              </>}
              {job?.status === "QUEUED" && <p role="status" className="text-xs text-muted-foreground">{t("jobQueued")}</p>}
              {job?.status === "PROCESSING" && <p role="status" className="text-xs text-muted-foreground">{t("jobProcessing")}</p>}
              {job?.status === "FAILED" && <p role="status" className="text-xs text-destructive">{t("jobFailedHint")}</p>}
            </fieldset>
          </>
        )}
        {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      </form>
    </Modal>
  );
}

function CurriculumImportDialog({
  career,
  onClose,
  onSaved,
}: {
  career: Career;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("CareersPage");
  const [cohortYear, setCohortYear] = useState(String(new Date().getFullYear()));
  const [courses, setCourses] = useState<ImportedCurriculumCourse[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState<AcademicImportJob<{ careerId: string; cohortYear: number; imported: number }> | null>(null);

  useAcademicImportJob(
    job?.id ?? null,
    setJob,
    (result) => {
      toast.success(t("imported", { count: result.imported, year: result.cohortYear }));
      onSaved();
    },
    (cause) => {
      setSaving(false);
      toast.error(cause || t("errors.import"));
    },
  );

  const readFile = async (file: File | undefined) => {
    setFileName(file?.name ?? "");
    setCourses([]);
    setError(null);
    if (!file) return;
    try {
      const parsed = parseCurriculumCsv(await file.text());
      if (parsed.length === 0) throw new Error(t("importEmptyFile"));
      setCourses(parsed);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t("errors.import"));
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || courses.length === 0) return;
    setSaving(true);
    setError(null);
    setJob(null);
    let queued = false;
    const operation = apiFetch<Pick<AcademicImportJob<unknown>, "id" | "status">>(`/academic/imports/careers/${career.id}/curricula/commit`, {
      method: "POST",
      body: JSON.stringify({ cohortYear: Number(cohortYear), courses }),
    });
    toast.promise(operation, {
      loading: t("queueSubmitting"),
      success: t("queued"),
      error: (cause: unknown) => cause instanceof Error ? cause.message : t("errors.import"),
    });
    try {
      setJob(await operation);
      queued = true;
    } catch {
      // El toast ya comunica el error al enviar el trabajo.
    } finally {
      if (!queued) setSaving(false);
    }
  };

  const preview = courses.slice(0, 8);

  return (
    <Modal
      isOpen
      title={t("importTitle", { name: career.name })}
      description={t("importDescription")}
      size="2xl"
      closeLabel={t("close")}
      onClose={() => { if (!saving) onClose(); }}
      closeOnEscape={!saving}
      closeOnBackdropClick={!saving}
      footer={<><button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-bold disabled:opacity-50">{t("cancel")}</button><button type="submit" form="curriculum-import" disabled={saving || courses.length === 0} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{t(saving ? job?.status === "PROCESSING" ? "processing" : job?.status === "QUEUED" ? "queued" : "importing" : "import")}</button></>}
    >
      <form id="curriculum-import" onSubmit={(event) => void submit(event)} className="space-y-5">
        <label className="block text-sm font-semibold">{t("cohortYear")}<input required type="number" min={1900} max={2200} value={cohortYear} onChange={(event) => setCohortYear(event.target.value)} className={inputClass} /></label>
        <label className="block text-sm font-semibold">{t("csvFile")}<input required type="file" accept=".csv,text/csv" onChange={(event) => void readFile(event.target.files?.[0])} className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-bold`} /></label>
        {fileName && courses.length > 0 && <section className="space-y-2 rounded-xl border border-border bg-background/60 p-4" aria-live="polite"><p className="text-sm font-bold">{t("importPreview", { file: fileName, count: courses.length })}</p><ul className="grid gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">{preview.map((course, index) => <li key={`${course.courseName}-${course.termNumber}-${index}`}>{course.courseName} · {t("termBadge", { term: course.termNumber })}</li>)}</ul>{courses.length > preview.length && <p className="text-xs text-muted-foreground">{t("importMore", { count: courses.length - preview.length })}</p>}</section>}
        {job?.status === "QUEUED" && <p role="status" className="text-xs text-muted-foreground">{t("jobQueued")}</p>}
        {job?.status === "PROCESSING" && <p role="status" className="text-xs text-muted-foreground">{t("jobProcessing")}</p>}
        {job?.status === "FAILED" && <p role="status" className="text-xs text-destructive">{t("jobFailedHint")}</p>}
        {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      </form>
    </Modal>
  );
}

export default function CareersPage() {
  const t = useTranslations("CareersPage");
  const { activeRole } = useActiveRole();
  const canManage = activeRole === "SYSTEM_ADMIN" || activeRole === "ACADEMIC_SECRETARY";
  const [careers, setCareers] = useState<Career[]>([]);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<{
    mode: EditorMode;
    career: Career | null;
    version?: Career["curriculumVersions"][number];
  } | null>(null);
  const [reload, setReload] = useState(0);
  const [importCareer, setImportCareer] = useState<Career | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<Career[]>("/academic/careers"),
      canManage
        ? apiFetch<CourseOption[]>("/academic/careers/course-options")
        : Promise.resolve([] as CourseOption[]),
    ])
      .then(([items, courses]) => {
        if (!active) return;
        setCareers(items);
        setCourseOptions(courses);
        setError(null);
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : t("errors.load")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [canManage, reload, t]);

  const refresh = () => { setEditor(null); setLoading(true); setReload((value) => value + 1); };
  const toggleStatus = async (career: Career) => {
    const operation = apiFetch(`/academic/careers/${career.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !career.isActive }) });
    toast.promise(operation, { loading: t("saving"), success: t(career.isActive ? "deactivated" : "activated"), error: (cause: unknown) => cause instanceof Error ? cause.message : t("errors.save") });
    try { await operation; refresh(); } catch { /* toast reports the failure */ }
  };

  if (!activeRole || loading) return <PageSkeleton label={t("loading")} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-widest text-primary">{t("eyebrow")}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">{t("title")}</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t("subtitle")}</p></div>
        {canManage && <button type="button" onClick={() => setEditor({ mode: "create", career: null })} className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 sm:self-auto"><Plus className="h-4 w-4" />{t("create")}</button>}
      </header>
      {error ? <div role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}<button type="button" onClick={() => { setLoading(true); setReload((value) => value + 1); }} className="ml-3 underline">{t("retry")}</button></div> : !careers.length ? <p className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">{t("empty")}</p> : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {careers.map((career) => <li key={career.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /><h2 className="text-lg font-bold text-foreground">{career.name}</h2><span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{career.code}</span></div><p className="mt-1 text-xs text-muted-foreground">{t(career.isActive ? "active" : "inactive")}</p></div>
              {canManage && <div className="flex gap-2"><button type="button" onClick={() => setEditor({ mode: "edit", career })} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted" aria-label={t("editCareer", { name: career.name })}><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void toggleStatus(career)} className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted">{t(career.isActive ? "deactivate" : "activate")}</button></div>}
            </div>
            <div className="mt-4 space-y-4">
              {career.curriculumVersions.map((version) => <section key={version.id} className="rounded-xl border border-border/70 bg-background/60 p-3">
                <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-bold text-foreground">{t("cohort", { year: version.cohortYear })}</h3><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{t("courseCount", { count: version.courses.length })}</span><span className="text-xs text-muted-foreground">{t("assignedStudents", { count: version._count.students })}</span>{canManage && version._count.students === 0 && <button type="button" onClick={() => setEditor({ mode: "version-edit", career, version })} className="rounded-md border border-border px-2 py-1 text-[11px] font-bold text-muted-foreground hover:bg-muted">{t("editCurriculum")}</button>}</div></div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {Array.from(new Set(version.courses.map((course) => course.termNumber))).sort((a, b) => a - b).map((term) => <div key={term}><h4 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-primary">{t("term", { term })}</h4><ul className="space-y-1">{version.courses.filter((course) => course.termNumber === term).map((course) => <li key={course.id} className="flex items-start gap-2 text-xs text-muted-foreground"><BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" />{course.course.code ? `${course.course.code} · ` : ""}{course.course.name}</li>)}</ul></div>)}
                </div>
              </section>)}
            </div>
            {canManage && <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setEditor({ mode: "version", career })} className="rounded-lg border border-primary/30 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5">{t("addVersion")}</button><button type="button" onClick={() => setImportCareer(career)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"><Upload className="h-3.5 w-3.5" />{t("import")}</button></div>}
          </li>)}
        </ul>
      )}
      {editor && <CareerEditor key={`${editor.mode}-${editor.career?.id ?? "new"}-${editor.version?.id ?? ""}`} mode={editor.mode} career={editor.career} version={editor.version ?? null} courseOptions={courseOptions} onClose={() => setEditor(null)} onSaved={refresh} />}
      {importCareer && <CurriculumImportDialog career={importCareer} onClose={() => setImportCareer(null)} onSaved={() => { setImportCareer(null); setLoading(true); setReload((value) => value + 1); }} />}
    </div>
  );
}
