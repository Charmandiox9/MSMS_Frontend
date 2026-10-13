"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { FormSkeleton } from "@/components/ui/LoadingSkeletons";
import { apiFetch } from "@/lib/api";
import type { Teacher } from "@/types/justifications";
import type { CurrentCourseCatalog } from "@/types/academic";
import AcademicSelectionList from "./AcademicSelectionList";

const fieldClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export default function TeacherDialog({
  teacher,
  onClose,
  onSaved,
}: {
  teacher: Teacher | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("AcademicManagement");
  const [name, setName] = useState(teacher?.name ?? "");
  const [email, setEmail] = useState(teacher?.email ?? "");
  const [employeeCode, setEmployeeCode] = useState(teacher?.employeeCode ?? "");
  const [catalog, setCatalog] = useState<CurrentCourseCatalog | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const teacherId = teacher?.id;
  const loadError = t("loadError");
  useEffect(() => {
    let active = true;
    apiFetch<CurrentCourseCatalog>("/academic/courses/current")
      .then((data) => {
        if (!active) return;
        setCatalog(data);
        setSelected(
          data.courses
            .filter((course) =>
              course.teachers.some(({ id }) => id === teacherId),
            )
            .map(({ nrc }) => nrc),
        );
        setError(null);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : loadError);
      });
    return () => {
      active = false;
    };
  }, [teacherId, loadError, retry]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || !catalog) return;
    setSaving(true);
    setError(null);
    const operation = apiFetch<Teacher>(
      teacher ? `/academic/teachers/${teacher.id}` : "/academic/teachers",
      {
        method: teacher ? "PATCH" : "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          employeeCode: employeeCode.trim() || null,
          ...(catalog.semester
            ? { semesterId: catalog.semester.id, nrcs: selected }
            : {}),
        }),
      },
    );
    toast.promise(operation, {
      loading: t("saving"),
      success: t(teacher ? "teacherUpdated" : "teacherCreated"),
      error: (cause: unknown) =>
        cause instanceof Error ? cause.message : t("saveError"),
    });
    try {
      await operation;
      onSaved();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      isOpen
      title={t(teacher ? "editTeacher" : "createTeacher")}
      description={t("teacherDescription")}
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
            form="teacher-editor"
            disabled={saving || !catalog}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {t(saving ? "saving" : "saveTeacher")}
          </button>
        </>
      }
    >
      <form
        id="teacher-editor"
        onSubmit={(event) => void submit(event)}
        className="space-y-6"
      >
        <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold sm:col-span-2">
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
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-semibold">
            {t("employeeCode")}
            <input
              maxLength={50}
              value={employeeCode}
              onChange={(event) => setEmployeeCode(event.target.value)}
              className={fieldClass}
            />
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
            <legend className="text-sm font-bold">{t("linkedCourses")}</legend>
            <p className="text-xs text-muted-foreground">
              {catalog.semester
                ? t("semester", { name: catalog.semester.name })
                : t("noSemester")}
            </p>
            {catalog.semester && (
              <>
                <p className="text-xs text-muted-foreground">
                  {t("courseSelectionHint")}
                </p>
                <AcademicSelectionList
                  selected={selected}
                  onChange={setSelected}
                  disabled={saving}
                  items={catalog.courses.map((course) => ({
                    id: course.nrc,
                    title: course.name,
                    description: `${t("nrc")} ${course.nrc}${course.code ? ` · ${course.code}` : ""}`,
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
