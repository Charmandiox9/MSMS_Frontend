"use client";

import { useEffect, useState } from "react";
import { BookOpen, Loader2, Plus, ShieldCheck, UserCheck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import { apiFetch } from "@/lib/api";
import type { Teacher } from "@/types/justifications";

interface CourseOption {
  nrc: string;
  course?: {
    code?: string;
    name: string;
  };
}

interface TeacherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (teacher: Teacher) => void;
  teacher?: Teacher | null;
}

export default function TeacherFormModal({
  isOpen,
  onClose,
  onSaved,
  teacher,
}: TeacherFormModalProps) {
  const t = useTranslations("TeachersPage");
  const isEditing = Boolean(teacher);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [joinedOn, setJoinedOn] = useState("");
  const [leftOn, setLeftOn] = useState("");
  const [academicDegree, setAcademicDegree] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [institution, setInstitution] = useState("");

  const [availableCourses, setAvailableCourses] = useState<CourseOption[]>([]);
  const [selectedNrcs, setSelectedNrcs] = useState<string[]>([]);
  const [manualNrc, setManualNrc] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    apiFetch<CourseOption[]>("/academic/courses")
      .then((data) => {
        if (active && Array.isArray(data)) {
          const seen = new Set<string>();
          const unique: CourseOption[] = [];
          for (const item of data) {
            if (item.nrc && !seen.has(item.nrc)) {
              seen.add(item.nrc);
              unique.push(item);
            }
          }
          setAvailableCourses(unique);
        }
      })
      .catch(() => {
        // Fallback silently if course catalog cannot be fetched
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (teacher) {
      setName(teacher.name || "");
      setEmail(teacher.email || "");
      setEmployeeCode(teacher.employeeCode || "");
      setJoinedOn(teacher.joinedOn ? teacher.joinedOn.slice(0, 10) : "");
      setLeftOn(teacher.leftOn ? teacher.leftOn.slice(0, 10) : "");
      setAcademicDegree(teacher.academicDegree || "");
      setProfessionalTitle(teacher.professionalTitle || "");
      setInstitution(teacher.institution || "");
      setSelectedNrcs(
        teacher.assignments?.map((a) => a.nrc).filter(Boolean) || [],
      );
    } else {
      setName("");
      setEmail("");
      setEmployeeCode("");
      setJoinedOn("");
      setLeftOn("");
      setAcademicDegree("");
      setProfessionalTitle("");
      setInstitution("");
      setSelectedNrcs([]);
    }
    setManualNrc("");
    setFormError(null);
  }, [teacher, isOpen]);

  const handleAddManualNrc = () => {
    const trimmed = manualNrc.trim();
    if (!trimmed) return;
    if (!selectedNrcs.includes(trimmed)) {
      setSelectedNrcs([...selectedNrcs, trimmed]);
    }
    setManualNrc("");
  };

  const handleSelectCourse = (nrc: string) => {
    if (!nrc) return;
    if (!selectedNrcs.includes(nrc)) {
      setSelectedNrcs([...selectedNrcs, nrc]);
    }
  };

  const handleRemoveNrc = (nrc: string) => {
    setSelectedNrcs(selectedNrcs.filter((item) => item !== nrc));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setFormError(t("form.nameLabel"));
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setFormError(t("form.emailLabel"));
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload: Record<string, unknown> = {
        name: trimmedName,
        email: trimmedEmail,
        employeeCode: employeeCode.trim() || undefined,
        joinedOn: joinedOn || undefined,
        academicDegree: academicDegree.trim() || undefined,
        professionalTitle: professionalTitle.trim() || undefined,
        institution: institution.trim() || undefined,
        nrcs: selectedNrcs,
      };
      if (isEditing) {
        payload.leftOn = leftOn || undefined;
      }

      let saved: Teacher;
      if (isEditing && teacher) {
        saved = await apiFetch<Teacher>(`/academic/teachers/${teacher.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success(t("notifications.updateSuccess", { name: saved.name }));
      } else {
        saved = await apiFetch<Teacher>("/academic/teachers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success(t("notifications.createSuccess", { name: saved.name }));
      }

      onSaved(saved);
      onClose();
    } catch (cause: unknown) {
      const message =
        cause instanceof Error ? cause.message : t("errors.save");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow={t("eyebrow")}
      title={isEditing ? t("form.editTitle") : t("form.createTitle")}
      description={
        isEditing ? t("form.editSubtitle") : t("form.createSubtitle")
      }
      closeLabel={t("form.cancel")}
      size="2xl"
      onSubmit={handleSubmit}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-cta-secondary"
          >
            {t("form.cancel")}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !email.trim()}
            className="btn-cta-primary"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserCheck className="h-4 w-4" />
            )}
            <span>
              {isSubmitting
                ? t("form.saving")
                : isEditing
                  ? t("form.submitEdit")
                  : t("form.submitCreate")}
            </span>
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {formError && (
          <div
            role="alert"
            className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive"
          >
            {formError}
          </div>
        )}

        {/* Sección 1: Datos Personales */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-black uppercase tracking-wider text-primary">
            {t("form.personalSection")}
          </legend>

          <FormField
            label={t("form.nameLabel")}
            htmlFor="teacher-form-name"
            required
          >
            <input
              id="teacher-form-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("form.namePlaceholder")}
              disabled={isSubmitting}
              className="form-control-input"
            />
          </FormField>

          <FormField
            label={t("form.emailLabel")}
            htmlFor="teacher-form-email"
            required
          >
            <input
              id="teacher-form-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("form.emailPlaceholder")}
              disabled={isSubmitting}
              className="form-control-input"
            />
          </FormField>

          <div
            className={`grid gap-4 ${isEditing ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
          >
            <FormField
              label={t("form.employeeCodeLabel")}
              htmlFor="teacher-form-code"
            >
              <input
                id="teacher-form-code"
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder={t("form.employeeCodePlaceholder")}
                disabled={isSubmitting}
                className="form-control-input"
              />
            </FormField>

            <FormField
              label={t("form.joinedOnLabel")}
              htmlFor="teacher-form-joined"
            >
              <input
                id="teacher-form-joined"
                type="date"
                value={joinedOn}
                onChange={(e) => setJoinedOn(e.target.value)}
                disabled={isSubmitting}
                className="form-control-input"
              />
            </FormField>

            {isEditing && (
              <FormField
                label={t("form.leftOnLabel")}
                htmlFor="teacher-form-left"
              >
                <input
                  id="teacher-form-left"
                  type="date"
                  value={leftOn}
                  onChange={(e) => setLeftOn(e.target.value)}
                  disabled={isSubmitting}
                  className="form-control-input"
                />
              </FormField>
            )}
          </div>
        </fieldset>

        <div className="h-px bg-border/60" />

        {/* Sección 2: Acreditación y Antecedentes Académicos */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-black uppercase tracking-wider text-secondary">
            {t("form.accreditationSection")}
          </legend>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              label={t("form.academicDegreeLabel")}
              htmlFor="teacher-form-degree"
            >
              <input
                id="teacher-form-degree"
                type="text"
                value={academicDegree}
                onChange={(e) => setAcademicDegree(e.target.value)}
                placeholder={t("form.academicDegreePlaceholder")}
                disabled={isSubmitting}
                className="form-control-input"
              />
            </FormField>

            <FormField
              label={t("form.professionalTitleLabel")}
              htmlFor="teacher-form-title"
            >
              <input
                id="teacher-form-title"
                type="text"
                value={professionalTitle}
                onChange={(e) => setProfessionalTitle(e.target.value)}
                placeholder={t("form.professionalTitlePlaceholder")}
                disabled={isSubmitting}
                className="form-control-input"
              />
            </FormField>

            <FormField
              label={t("form.institutionLabel")}
              htmlFor="teacher-form-institution"
            >
              <input
                id="teacher-form-institution"
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder={t("form.institutionPlaceholder")}
                disabled={isSubmitting}
                className="form-control-input"
              />
            </FormField>
          </div>
        </fieldset>

        <div className="h-px bg-border/60" />

        {/* Sección 3: Asignación de Asignaturas (Semestre Activo) */}
        <fieldset className="space-y-3.5">
          <div>
            <legend className="text-xs font-black uppercase tracking-wider text-primary">
              {t("form.coursesSection")}
            </legend>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("form.coursesSubtitle")}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Opción A: Selección desde catálogo */}
            <div className="flex flex-col justify-between gap-1.5 rounded-2xl border border-border/80 bg-muted/20 p-3 transition-colors hover:border-border">
              <div>
                <label
                  htmlFor="teacher-form-course-select"
                  className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {t("form.selectFromCatalogLabel")}
                </label>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {t("form.selectFromCatalogHint")}
                </p>
              </div>

              <select
                id="teacher-form-course-select"
                aria-label={t("form.selectCoursePlaceholder")}
                className="form-control-input mt-1.5 w-full cursor-pointer truncate"
                defaultValue=""
                disabled={availableCourses.length === 0}
                onChange={(e) => {
                  handleSelectCourse(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="" disabled>
                  {availableCourses.length === 0
                    ? t("form.noCatalogAvailable")
                    : t("form.selectCoursePlaceholder")}
                </option>
                {availableCourses.map((courseItem) => (
                  <option key={courseItem.nrc} value={courseItem.nrc}>
                    {courseItem.course?.name || "Asignatura"} · NRC {courseItem.nrc}
                  </option>
                ))}
              </select>
            </div>

            {/* Opción B: Ingreso directo por código NRC */}
            <div className="flex flex-col justify-between gap-1.5 rounded-2xl border border-border/80 bg-muted/20 p-3 transition-colors hover:border-border">
              <div>
                <label
                  htmlFor="teacher-form-manual-nrc"
                  className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {t("form.manualNrcLabel")}
                </label>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {t("form.manualNrcHint")}
                </p>
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                <input
                  id="teacher-form-manual-nrc"
                  type="text"
                  value={manualNrc}
                  onChange={(e) => setManualNrc(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddManualNrc();
                    }
                  }}
                  placeholder={t("form.manualNrcPlaceholder")}
                  className="form-control-input flex-1 min-w-0"
                />
                <button
                  type="button"
                  onClick={handleAddManualNrc}
                  disabled={!manualNrc.trim()}
                  className="btn-cta-primary shrink-0 text-xs px-3.5 min-h-10 disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t("form.addNrc")}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Chips de asignaturas vinculadas */}
          <div className="min-h-12 rounded-2xl border border-border/80 bg-muted/30 p-2.5">
            {selectedNrcs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-1 px-1">
                {t("form.noAssignedCourses")}
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {selectedNrcs.map((nrc) => {
                  const courseMatch = availableCourses.find((c) => c.nrc === nrc);
                  return (
                    <span
                      key={nrc}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                    >
                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {courseMatch?.course?.name ? `${courseMatch.course.name} · ` : ""}
                        NRC {nrc}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNrc(nrc)}
                        aria-label={`Eliminar NRC ${nrc}`}
                        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-primary hover:bg-primary/20 hover:text-coral-red transition cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </fieldset>

        <div className="h-px bg-border/60" />

        {/* Sección 4: Protección de Datos Ley 21.719 */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>{t("form.privacyBadge")}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {t("form.privacyNotice")}
          </p>
        </div>
      </div>
    </Modal>
  );
}
