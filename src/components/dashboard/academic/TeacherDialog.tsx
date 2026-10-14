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
import TeacherProfileFields, {
  type TeacherAcademicProfile,
} from "./TeacherProfileFields";
import HourlyContractsEditor from "./HourlyContractsEditor";
import type { HourlyContractInput } from "@/types/hourly-payments";

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
  const pay = useTranslations("HourlyPayments");
  const [profile, setProfile] = useState<TeacherAcademicProfile>({
    rut: teacher?.rut ?? "",
    academicUnit: teacher?.academicUnit ?? "",
    academicDegree: teacher?.academicDegree ?? "",
    certification: teacher?.certification ?? "",
    professionalTitle: teacher?.professionalTitle ?? "",
    institution: teacher?.institution ?? "",
    joinedOn: teacher?.joinedOn?.slice(0, 10) ?? "",
    leftOn: teacher?.leftOn?.slice(0, 10) ?? "",
  });
  const [hourlyEnabled, setHourlyEnabled] = useState(false);
  const [hourlyReady, setHourlyReady] = useState(false);
  const [hourlyContracts, setHourlyContracts] = useState<HourlyContractInput[]>(
    [],
  );
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
    if (
      saving ||
      !catalog ||
      (hourlyEnabled && (!hourlyReady || !profile.rut.trim()))
    )
      return;
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
          rut: profile.rut.trim() || null,
          academicUnit: profile.academicUnit.trim() || null,
          academicDegree: profile.academicDegree || null,
          certification: profile.certification || null,
          professionalTitle: profile.professionalTitle.trim() || null,
          institution: profile.institution.trim() || null,
          joinedOn: profile.joinedOn || null,
          leftOn: profile.leftOn || null,
          ...(hourlyEnabled ? { hourlyContracts } : {}),
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
            disabled={
              saving ||
              !catalog ||
              (hourlyEnabled && (!hourlyReady || !profile.rut.trim()))
            }
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
          <TeacherProfileFields
            value={profile}
            onChange={setProfile}
            fieldClass={fieldClass}
          />
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
        {catalog?.semester && (
          <>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={hourlyEnabled}
                disabled={saving}
                onChange={(event) => {
                  setHourlyEnabled(event.target.checked);
                  setHourlyReady(false);
                }}
                className="h-4 w-4 accent-primary"
              />
              {pay("manageContracts")}
            </label>
            {hourlyEnabled && (
              <>
                {!profile.rut.trim() && (
                  <p className="text-sm text-destructive">
                    {pay("rutRequired")}
                  </p>
                )}
                <HourlyContractsEditor
                  semesterId={catalog.semester.id}
                  teacherId={teacher?.id}
                  courses={catalog.courses.filter((course) =>
                    selected.includes(course.nrc),
                  )}
                  value={hourlyContracts}
                  onChange={setHourlyContracts}
                  onReady={setHourlyReady}
                  disabled={saving}
                />
              </>
            )}
          </>
        )}
      </form>
    </Modal>
  );
}
