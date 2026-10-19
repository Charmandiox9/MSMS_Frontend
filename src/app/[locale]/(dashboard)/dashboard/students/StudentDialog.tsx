"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { FormSkeleton } from "@/components/ui/LoadingSkeletons";
import AcademicSelectionList from "@/components/dashboard/academic/AcademicSelectionList";
import { apiFetch } from "@/lib/api";
import type { Student } from "@/types/students";
import type { CurrentCourseCatalog } from "@/types/academic";
import type { CareerOption } from "@/types/careers";

const fieldClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export default function StudentDialog({
  student,
  initialNrc,
  onClose,
  onSaved,
}: {
  student: Student | null;
  initialNrc?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("StudentsPage");
  const [name, setName] = useState(student?.name ?? "");
  const [email, setEmail] = useState(student?.email ?? "");
  const [catalog, setCatalog] = useState<CurrentCourseCatalog | null>(null);
  const [careers, setCareers] = useState<CareerOption[]>([]);
  const [curriculumVersionId, setCurriculumVersionId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const loadError = t("errors.load");
  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<CurrentCourseCatalog>("/academic/courses/current"),
      apiFetch<CareerOption[]>("/academic/careers/options"),
      student
        ? apiFetch<Student>(`/academic/students/${student.id}`)
        : Promise.resolve(null),
    ])
      .then(([value, careerOptions, latest]) => {
        if (!active) return;
        setCatalog(value);
        setCareers(careerOptions);
        setSelected(
          latest
            ? latest.enrollments.map(({ nrc }) => nrc)
            : value.courses.some(({ nrc }) => nrc === initialNrc)
              ? [initialNrc!]
              : [],
        );
        if (latest) {
          setName(latest.name);
          setEmail(latest.email);
          setCurriculumVersionId(latest.careerCurriculumVersionId ?? "");
        }
        setError(null);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : loadError);
      });
    return () => {
      active = false;
    };
  }, [student, initialNrc, loadError, retry]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || !catalog) return;
    setSaving(true);
    setError(null);
    const operation = apiFetch<Student>(
      student ? `/academic/students/${student.id}` : "/academic/students",
      {
        method: student ? "PATCH" : "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          careerCurriculumVersionId: curriculumVersionId || null,
          ...(catalog.semester
            ? { semesterId: catalog.semester.id, nrcs: selected }
            : {}),
        }),
      },
    );
    toast.promise(operation, {
      loading: t("saving"),
      success: t(student ? "updated" : "created"),
      error: (cause: unknown) =>
        cause instanceof Error ? cause.message : t("errors.save"),
    });
    try {
      await operation;
      onSaved();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t("errors.save"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      isOpen
      title={t(student ? "editTitle" : "createTitle")}
      description={t("formDescription")}
      size="2xl"
      closeLabel={t("close")}
      onClose={() => {
        if (!saving) onClose();
      }}
      closeOnEscape={!saving}
      closeOnBackdropClick={!saving}
      footer={
        <>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            form="student-editor"
            disabled={saving || !catalog}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {t(saving ? "saving" : "save")}
          </button>
        </>
      }
    >
      <form
        id="student-editor"
        onSubmit={(event) => void submit(event)}
        className="space-y-5"
      >
        <fieldset disabled={saving || !catalog} className="grid gap-4">
          <label className="text-sm font-semibold">
            {t("name")}
            <input
              required
              maxLength={200}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-semibold">
            {t("email")}
            <input
              required
              type="email"
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            {t("career")}
            <select value={curriculumVersionId} onChange={(event) => setCurriculumVersionId(event.target.value)} className={fieldClass}>
              <option value="">{t("noCareer")}</option>
              {careers.flatMap((career) => career.curriculumVersions.map((version) => (
                <option key={version.id} value={version.id} disabled={!career.isActive && version.id !== curriculumVersionId}>{career.name} · {t("cohortYear", { year: version.cohortYear })}</option>
              )))}
            </select>
          </label>
        </fieldset>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
            {!catalog && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setRetry((value) => value + 1);
                }}
                className="ml-3 underline"
              >
                {t("retry")}
              </button>
            )}
          </p>
        )}
        {!catalog ? (
          !error && <FormSkeleton label={t("loading")} />
        ) : (
          <fieldset disabled={saving} className="space-y-3">
            <legend className="text-sm font-bold">{t("courses")}</legend>
            <p className="text-xs text-muted-foreground">
              {catalog.semester
                ? t("semester", { name: catalog.semester.name })
                : t("noSemesterProfile")}
            </p>
            {catalog.semester && (
              <>
                <p className="text-xs text-muted-foreground">
                  {t("selectionHint")}
                </p>
                <AcademicSelectionList
                  selected={selected}
                  onChange={setSelected}
                  disabled={saving}
                  items={catalog.courses.map((course) => ({
                    id: course.nrc,
                    title: course.name,
                    description: `${t("nrc")} ${course.nrc}`,
                  }))}
                />
              </>
            )}
          </fieldset>
        )}
      </form>
    </Modal>
  );
}
