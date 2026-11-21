"use client";

import EmailInput from "@/components/ui/EmailInput";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import FormModal from "@/components/ui/FormModal";
import { FormSkeleton } from "@/components/ui/LoadingSkeletons";
import AcademicSelectionList from "@/components/dashboard/academic/AcademicSelectionList";
import { apiFetch } from "@/lib/api";
import type { Student } from "@/types/students";
import type { CurrentCourseCatalog } from "@/types/academic";
import { curriculumCohortYears, type CareerOption } from "@/types/careers";

const fieldClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

const rutDigits = (value: string) =>
  value.replace(/[.\s-]/g, "").replace(/[^0-9kK]/g, "").toUpperCase().slice(0, 9);
const formatRut = (value: string) => {
  const digits = rutDigits(value);
  if (digits.length < 2) return digits;
  const body = digits.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${body}-${digits.slice(-1)}`;
};

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
  const [name, setName] = useState(student?.givenNames ?? student?.name ?? "");
  const [email, setEmail] = useState(student?.email ?? "");
  const [rut, setRut] = useState(rutDigits(student?.rut ?? ""));
  const [personalEmail, setPersonalEmail] = useState(
    student?.personalEmail ?? "",
  );
  const [admission, setAdmission] = useState(
    student?.admission?.toString() ?? "",
  );
  const [paternalSurname, setPaternalSurname] = useState(
    student?.paternalSurname ?? "",
  );
  const [maternalSurname, setMaternalSurname] = useState(
    student?.maternalSurname ?? "",
  );
  const [birthDate, setBirthDate] = useState(
    student?.birthDate?.slice(0, 10) ?? "",
  );
  const [catalog, setCatalog] = useState<CurrentCourseCatalog | null>(null);
  const [careers, setCareers] = useState<CareerOption[]>([]);
  const [curriculumVersionId, setCurriculumVersionId] = useState("");
  const [careerId, setCareerId] = useState(student?.careerId ?? "");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const loadError = t("errors.load");
  const selectedCareer = careers.find((career) => career.id === careerId);
  const admissionCohort = /^\d{4}(10|20)$/.test(admission)
    ? Number(admission.slice(0, 4))
    : null;
  const availableCurricula = (selectedCareer?.curriculumVersions ?? []).filter(
    (version) =>
      admissionCohort === null || curriculumCohortYears(version).includes(admissionCohort),
  );
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
          setName(latest.givenNames ?? latest.name);
          setEmail(latest.email ?? "");
          setRut(rutDigits(latest.rut ?? ""));
          setPersonalEmail(latest.personalEmail ?? "");
          setAdmission(latest.admission?.toString() ?? "");
          setPaternalSurname(latest.paternalSurname ?? "");
          setMaternalSurname(latest.maternalSurname ?? "");
          setBirthDate(latest.birthDate?.slice(0, 10) ?? "");
          setCurriculumVersionId(latest.careerCurriculumVersionId ?? "");
          setCareerId(latest.careerId ?? latest.career?.id ?? "");
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
          name: [name.trim(), paternalSurname.trim(), maternalSurname.trim()]
            .filter(Boolean)
            .join(" "),
          givenNames: name.trim(),
          email: email.trim() || null,
          rut: rut.trim() || null,
          personalEmail: personalEmail.trim() || null,
          admission: admission || null,
          paternalSurname: paternalSurname.trim() || null,
          maternalSurname: maternalSurname.trim() || null,
          birthDate: birthDate || null,
          careerCurriculumVersionId: curriculumVersionId || null,
          careerId: careerId || null,
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
    <FormModal
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
            data-modal-dismiss
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
            {t("givenNames")}
            <input
              required
              maxLength={200}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-semibold">
            {t("paternalSurname")}
            <input
              maxLength={100}
              value={paternalSurname}
              onChange={(event) => setPaternalSurname(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-semibold">
            {t("maternalSurname")}
            <input
              maxLength={100}
              value={maternalSurname}
              onChange={(event) => setMaternalSurname(event.target.value)}
              className={fieldClass}
            />
          </label>
          <div className="text-sm font-semibold">
            <label htmlFor="student-email">{t("email")}</label>
            <EmailInput
              id="student-email"
              aria-describedby="student-email-help"
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
            />
            <span id="student-email-help" className="mt-1 block text-sm font-normal text-muted-foreground">{t("emailOptionalHelp")}</span>
          </div>
          <label className="text-sm font-semibold">
            {t("personalEmail")}
            <EmailInput
              maxLength={254}
              value={personalEmail}
              onChange={(event) => setPersonalEmail(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-semibold">
            {t("rut")}
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              maxLength={12}
              value={formatRut(rut)}
              onChange={(event) => setRut(rutDigits(event.target.value))}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-semibold">
            {t("admission")}
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4}(10|20)"
              maxLength={6}
              aria-describedby="student-admission-hint"
              value={admission}
              onChange={(event) => {
                const value = event.target.value.replace(/\D/g, "").slice(0, 6);
                setAdmission(value);
                const cohortYear = /^\d{4}(10|20)$/.test(value)
                  ? Number(value.slice(0, 4))
                  : null;
                if (careerId && cohortYear !== null) {
                  const version = careers
                    .find((career) => career.id === careerId)
                    ?.curriculumVersions.find(
                      (item) => curriculumCohortYears(item).includes(cohortYear),
                    );
                  setCurriculumVersionId(version?.id ?? "");
                }
              }}
              className={fieldClass}
            />
            <span id="student-admission-hint" className="mt-1 block text-xs font-normal text-muted-foreground">
              {t("admissionHint")}
            </span>
          </label>
          <label className="text-sm font-semibold">
            {t("birthDate")}
            <input
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            {t("career")}
            <select
              aria-label={t("career")}
              value={careerId}
              onChange={(event) => {
                const nextCareerId = event.target.value;
                setCareerId(nextCareerId);
                const cohortYear = /^\d{4}(10|20)$/.test(admission)
                  ? Number(admission.slice(0, 4))
                  : null;
                const version =
                  cohortYear === null
                    ? undefined
                    : careers
                        .find((career) => career.id === nextCareerId)
                        ?.curriculumVersions.find(
                          (item) => curriculumCohortYears(item).includes(cohortYear),
                        );
                setCurriculumVersionId(version?.id ?? "");
              }}
              className={fieldClass}
            >
              <option value="">{t("noCareer")}</option>
              {careers.map((career) => (
                <option key={career.id} value={career.id}>
                  {career.code ? `${career.code} · ` : ""}
                  {career.name}
                </option>
              ))}
            </select>
            <span className="mt-3 block">{t("curriculum")}</span>
            <select
              aria-label={t("curriculum")}
              value={curriculumVersionId}
              onChange={(event) => {
                const versionId = event.target.value;
                setCurriculumVersionId(versionId);
                const matchingCareer = careers.find((career) =>
                  career.curriculumVersions.some(
                    (version) => version.id === versionId,
                  ),
                );
                if (matchingCareer) setCareerId(matchingCareer.id);
              }}
              className={fieldClass}
            >
              <option value="">{t("noCurriculum")}</option>
              {availableCurricula.map((version) => (
                <option
                  key={version.id}
                  value={version.id}
                  disabled={
                    !selectedCareer?.isActive &&
                    version.id !== curriculumVersionId
                  }
                >
                  {admissionCohort !== null && admissionCohort !== version.cohortYear
                    ? t("curriculumPlanYear", { year: version.cohortYear })
                    : t("cohortYear", { year: version.cohortYear })}
                </option>
              ))}
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
                  searchHelp={t("selectionSearchHelp")}
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
    </FormModal>
  );
}
