"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { FormSkeleton } from "@/components/ui/LoadingSkeletons";
import AcademicSelectionList from "@/components/dashboard/academic/AcademicSelectionList";
import { apiFetch } from "@/lib/api";
import { fetchAllTeachers } from "@/lib/teachers";
import type {
  CurrentCourseCatalog,
  AcademicTeacherOption,
} from "@/types/academic";

export default function CourseTeachersDialog({
  nrc,
  name,
  onClose,
  onSaved,
}: {
  nrc: string;
  name: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("AcademicManagement");
  const [data, setData] = useState<{
    catalog: CurrentCourseCatalog;
    teachers: AcademicTeacherOption[];
  } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const loadError = t("loadError");
  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<CurrentCourseCatalog>("/academic/courses/current"),
      fetchAllTeachers(),
    ])
      .then(([catalog, teachers]) => {
        if (!active) return;
        const course = catalog.courses.find((item) => item.nrc === nrc);
        if (!course) {
          setError(loadError);
          return;
        }
        setData({ catalog, teachers });
        setSelected(course.teachers.map(({ id }) => id));
        setError(null);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : loadError);
      });
    return () => {
      active = false;
    };
  }, [nrc, loadError, retry]);
  const save = async () => {
    if (saving || !data?.catalog.semester) return;
    setSaving(true);
    setError(null);
    const operation = apiFetch(
      `/academic/courses/${encodeURIComponent(nrc)}/teachers`,
      {
        method: "PUT",
        body: JSON.stringify({
          semesterId: data.catalog.semester.id,
          teacherIds: selected,
        }),
      },
    );
    toast.promise(operation, {
      loading: t("saving"),
      success: t("linksSaved"),
      error: (cause: unknown) =>
        cause instanceof Error ? cause.message : t("saveError"),
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
  return (
    <Modal
      isOpen
      title={t("manageTeachers")}
      description={`${name} · ${t("nrc")} ${nrc}`}
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
            type="button"
            disabled={saving || !data?.catalog.semester}
            onClick={() => void save()}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {t(saving ? "saving" : "saveLinks")}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
            {!data && (
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
        {!data ? (
          !error && <FormSkeleton label={t("loading")} />
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {data.catalog.semester &&
                t("semester", { name: data.catalog.semester.name })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("teacherSelectionHint")}
            </p>
            <AcademicSelectionList
              selected={selected}
              onChange={setSelected}
              disabled={saving}
              items={data.teachers.map((teacher) => ({
                id: teacher.id,
                title: teacher.name,
                description: teacher.email,
              }))}
            />
          </>
        )}
      </div>
    </Modal>
  );
}
