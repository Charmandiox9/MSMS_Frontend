"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, CheckCircle2, Circle, Clock3, Plus, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { apiFetch } from "@/lib/api";
import { PageSkeleton } from "@/components/ui/LoadingSkeletons";
import Modal from "@/components/ui/Modal";
import type { CourseOption, StudentProgress } from "@/types/careers";

interface SemesterOption { id: string; name: string }

export default function StudentProgressPage({ studentId }: { studentId: string }) {
  const t = useTranslations("StudentProgressPage");
  const { activeRole } = useActiveRole();
  const canManage = activeRole === "SYSTEM_ADMIN" || activeRole === "ACADEMIC_SECRETARY";
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [outcome, setOutcome] = useState<"PASSED" | "FAILED">("PASSED");
  const [nrc, setNrc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<StudentProgress>(`/academic/students/${studentId}/progress`),
      apiFetch<SemesterOption[]>("/academic/semesters"),
      canManage
        ? apiFetch<CourseOption[]>("/academic/careers/course-options")
        : Promise.resolve([] as CourseOption[]),
    ])
      .then(([value, terms, options]) => {
        if (!active) return;
        setProgress(value);
        setSemesters(terms);
        setCourseOptions(options);
        setSemesterId((current) => current || terms.find((term) => term.name)?.id || "");
        setError(null);
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : t("errors.load")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [studentId, reload, t, canManage]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!courseId || !semesterId || saving) return;
    setSaving(true);
    const operation = apiFetch(`/academic/students/${studentId}/attempts`, {
      method: "POST",
      body: JSON.stringify({ courseId, semesterId, outcome, nrc: nrc.trim() || undefined }),
    });
    toast.promise(operation, { loading: t("saving"), success: t("saved"), error: (cause: unknown) => cause instanceof Error ? cause.message : t("errors.save") });
    try {
      await operation;
      setEditorOpen(false);
      setCourseId("");
      setNrc("");
      setLoading(true);
      setReload((value) => value + 1);
    } catch {
      // The toast communicates the API failure.
    } finally {
      setSaving(false);
    }
  };

  if (loading || !activeRole) return <PageSkeleton label={t("loading")} />;
  if (error || !progress) return <div role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error ?? t("errors.load")}<button type="button" onClick={() => { setLoading(true); setReload((value) => value + 1); }} className="ml-3 underline">{t("retry")}</button></div>;

  const courseIds = new Set(progress.courses.map((course) => course.courseId));
  const otherAttempts = progress.attempts.filter((attempt) => !courseIds.has(attempt.courseId));
  const version = progress.student.curriculumVersion;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/students" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-4 w-4" />{t("back")}</Link>
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-widest text-primary">{t("eyebrow")}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">{progress.student.name}</h1><p className="mt-1 text-sm text-muted-foreground">{progress.student.email}</p>{version && <p className="mt-2 text-sm font-semibold text-foreground">{version.career.name} · {t("cohort", { year: version.cohortYear })}</p>}</div>
        {canManage && version && <button type="button" onClick={() => setEditorOpen(true)} className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 sm:self-auto"><Plus className="h-4 w-4" />{t("recordAttempt")}</button>}
      </header>
      {!version ? <p className="rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">{t("noCurriculum")}</p> : (
        <>
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-bold text-foreground">{t("overallProgress")}</p><p className="mt-1 text-xs text-muted-foreground">{t("passedSummary", { passed: progress.summary.passedCourses, total: progress.summary.totalCourses, enrolled: progress.summary.enrolledCourses })}</p></div><strong className="text-3xl font-black text-primary">{progress.summary.progressPercent}%</strong></div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress.summary.progressPercent}%` }} /></div>
          </section>
          {progress.courses.length === 0 ? <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t("emptyCurriculum")}</p> : (
            <div className="space-y-5">
              {Array.from(new Set(progress.courses.map((course) => course.termNumber))).sort((a, b) => a - b).map((term) => <section key={term} className="space-y-3"><h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{t("term", { term })}</h2><ul className="space-y-2">{progress.courses.filter((course) => course.termNumber === term).map((course) => <li key={course.id} className="rounded-xl border border-border bg-card p-4"><div className="flex items-start gap-3">{course.currentEnrollment ? <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" /> : course.outcome === "PASSED" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> : course.outcome === "FAILED" ? <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />}<div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-foreground">{course.course.code ? `${course.course.code} · ` : ""}{course.course.name}</h3><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${course.currentEnrollment ? "bg-sky-500/10 text-sky-600" : course.outcome === "PASSED" ? "bg-emerald-500/10 text-emerald-600" : course.outcome === "FAILED" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{course.currentEnrollment ? t("enrolledCurrent", { semester: course.currentEnrollment.semester.name }) : t(`outcomes.${course.outcome}`)}</span></div>{course.attempts.length > 0 && <ul className="mt-3 space-y-1 border-l border-border pl-3">{course.attempts.map((attempt) => <li key={attempt.id} className="text-xs text-muted-foreground">{t("attempt", { number: attempt.attemptNumber })} · {attempt.semester.name}{attempt.nrc ? ` · ${t("nrc", { nrc: attempt.nrc })}` : ""} · {t(`outcomes.${attempt.outcome}`)}</li>)}</ul>}</div></div></li>)}</ul></section>)}
            </div>
          )}
          {otherAttempts.length > 0 && <section className="space-y-3"><h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{t("otherAttempts")}</h2><ul className="space-y-2">{otherAttempts.map((attempt) => <li key={attempt.id} className="rounded-xl border border-border bg-card p-4 text-sm"><span className="font-bold text-foreground">{attempt.course.code ? `${attempt.course.code} · ` : ""}{attempt.course.name}</span><span className="ml-2 text-xs text-muted-foreground">{t("attempt", { number: attempt.attemptNumber })} · {attempt.semester.name} · {t(`outcomes.${attempt.outcome}`)}</span></li>)}</ul></section>}
        </>
      )}
      {editorOpen && version && <Modal isOpen title={t("recordTitle")} description={t("recordDescription")} size="lg" closeLabel={t("close")} onClose={() => { if (!saving) setEditorOpen(false); }} closeOnEscape={!saving} closeOnBackdropClick={!saving} footer={<><button type="button" disabled={saving} onClick={() => setEditorOpen(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-bold">{t("cancel")}</button><button form="course-attempt" type="submit" disabled={saving || !courseId || !semesterId} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{t("save")}</button></>}>
        <form id="course-attempt" onSubmit={(event) => void submit(event)} className="space-y-4">
          <label className="block text-sm font-semibold">{t("course")}<select required value={courseId} onChange={(event) => setCourseId(event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">{<option value="">{t("selectCourse")}</option>}{courseOptions.map((course) => <option key={course.id} value={course.id}>{course.code ? `${course.code} · ` : ""}{course.name}</option>)}</select></label>
          <label className="block text-sm font-semibold">{t("semesterSelect")}<select required value={semesterId} onChange={(event) => setSemesterId(event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"><option value="">{t("selectSemester")}</option>{semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}</select></label>
          <label className="block text-sm font-semibold">{t("result")}<select value={outcome} onChange={(event) => setOutcome(event.target.value as "PASSED" | "FAILED")} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"><option value="PASSED">{t("outcomes.PASSED")}</option><option value="FAILED">{t("outcomes.FAILED")}</option></select></label>
          <label className="block text-sm font-semibold">{t("nrcOptional")}<input maxLength={50} value={nrc} onChange={(event) => setNrc(event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" /></label>
        </form>
      </Modal>}
    </div>
  );
}
