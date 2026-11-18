"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type Ref,
} from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import FormModal from "@/components/ui/FormModal";
import TitulationStudentPicker from "./TitulationStudentPicker";
import {
  academicPrimaryActionClass,
  academicSecondaryActionClass,
} from "@/components/dashboard/academic/academicActionStyles";
import { apiFetch } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { isValidChileanRut } from "@/lib/chilean-rut";
import type { CareerOption } from "@/types/careers";
import type {
  TitulationDocumentStatus,
  TitulationFormValues,
  TitulationProcess,
  TitulationStage,
  TitulationOutcome,
} from "./titulation-types";

interface TitulationProcessFormProps {
  process?: TitulationProcess | null;
  onClose: () => void;
  onSaved: (process: TitulationProcess) => void;
}

const STEPS = ["identity", "committee", "documents"] as const;
const STAGES: readonly TitulationStage[] = [
  "UNCLASSIFIED",
  "INTAKE",
  "REVIEW",
  "DEFENSE",
  "CLOSED",
];
const DOCUMENT_STATUSES: readonly TitulationDocumentStatus[] = [
  "UNVERIFIED",
  "PENDING",
  "RECEIVED",
  "PREPARED",
];
const PHONE_PATTERN = /^\+?[0-9().\s-]{8,24}$/;

const EMPTY_VALUES: TitulationFormValues = {
  studentId: null,
  studentName: "",
  studentRut: "",
  studentEmail: "",
  studentPhone: "",
  thesisTopic: "",
  degree: "",
  careerId: "",
  guideName: "",
  coGuideName: "",
  reviewerOneName: "",
  reviewerTwoName: "",
  defenseDate: "",
  stage: "INTAKE",
  outcome: "IN_PROGRESS",
  defenseAnnexesStatus: "PENDING",
  thesisSummaryStatus: "PENDING",
  libraryFormStatus: "PENDING",
  actaStatus: "PENDING",
  evaluationsStatus: "PENDING",
};

function initialValues(
  process?: TitulationProcess | null,
): TitulationFormValues {
  if (!process) return EMPTY_VALUES;
  return {
    studentId: process.studentId,
    studentName: process.studentName,
    studentRut: process.studentRut ?? "",
    studentEmail: process.studentEmail ?? "",
    studentPhone: process.studentPhone ?? "",
    thesisTopic: process.thesisTopic ?? "",
    degree: process.degree ?? "",
    careerId: process.careerId ?? "",
    guideName: process.guideName ?? "",
    coGuideName: process.coGuideName ?? "",
    reviewerOneName: process.reviewerOneName ?? "",
    reviewerTwoName: process.reviewerTwoName ?? "",
    defenseDate: process.defenseDate?.slice(0, 10) ?? "",
    stage: process.stage,
    outcome: process.outcome,
    defenseAnnexesStatus: process.defenseAnnexesStatus,
    thesisSummaryStatus: process.thesisSummaryStatus,
    libraryFormStatus: process.libraryFormStatus,
    actaStatus: process.actaStatus,
    evaluationsStatus: process.evaluationsStatus,
  };
}

function TextField({
  id,
  label,
  value,
  onChange,
  required = false,
  type = "text",
  autoComplete = "off",
  maxLength,
  pattern,
  inputMode,
  help,
  error,
  optionalLabel,
  onBlur,
  inputRef,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "email" | "tel" | "date";
  autoComplete?: string;
  maxLength?: number;
  pattern?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal";
  help?: string;
  error?: string | null;
  optionalLabel: string;
  onBlur?: (input: HTMLInputElement) => void;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-foreground"
      >
        {label}{" "}
        {required ? (
          <span aria-hidden="true" className="text-danger">
            *
          </span>
        ) : (
          <span className="font-normal text-muted-foreground">
            ({optionalLabel})
          </span>
        )}
      </label>
      <input
        id={id}
        name={id}
        ref={inputRef}
        type={type}
        autoComplete={autoComplete}
        maxLength={maxLength}
        pattern={pattern}
        inputMode={inputMode}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => onBlur?.(event.currentTarget)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-base font-normal text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      />
      {help && (
        <p
          id={helpId}
          className="mt-1.5 text-sm font-normal leading-relaxed text-muted-foreground"
        >
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  maxLength,
  help,
  optionalLabel,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  help: string;
  optionalLabel: string;
}) {
  const helpId = `${id}-help`;

  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-foreground"
      >
        {label}{" "}
        <span className="font-normal text-muted-foreground">
          ({optionalLabel})
        </span>
      </label>
      <textarea
        id={id}
        name={id}
        rows={4}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={helpId}
        className="mt-1.5 min-h-28 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-base font-normal leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      />
      <p
        id={helpId}
        className="mt-1.5 text-sm font-normal leading-relaxed text-muted-foreground"
      >
        {help}
      </p>
    </div>
  );
}

function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  translate,
  onChange,
  optionalLabel,
}: {
  id: string;
  label: string;
  value: T;
  options: readonly T[];
  translate: (value: T) => string;
  onChange: (value: T) => void;
  optionalLabel?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="block min-w-0 text-sm font-semibold text-foreground"
    >
      {label}{" "}
      {optionalLabel && (
        <span className="font-normal text-muted-foreground">
          ({optionalLabel})
        </span>
      )}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-base font-normal text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {translate(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function TitulationProcessForm({
  process,
  onClose,
  onSaved,
}: TitulationProcessFormProps) {
  const t = useTranslations("TitulationPage");
  const formRef = useRef<HTMLFormElement>(null);
  const rutInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const stepCountRef = useRef<HTMLParagraphElement>(null);
  const saveIntentRef = useRef(false);
  const [step, setStep] = useState(0);
  const previousStepRef = useRef(step);
  const [values, setValues] = useState(() => initialValues(process));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<"save" | "identityConflict" | null>(null);
  const [rutError, setRutError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [careerOptions, setCareerOptions] = useState<CareerOption[]>([]);
  const [careerLoadState, setCareerLoadState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [careerRetryKey, setCareerRetryKey] = useState(0);
  const isEditing = Boolean(process);

  useEffect(() => {
    if (previousStepRef.current !== step) stepCountRef.current?.focus();
    previousStepRef.current = step;
  }, [step]);

  useEffect(() => {
    let isCurrent = true;

    void apiFetch<CareerOption[]>("/academic/careers/options")
      .then((options) => {
        if (!isCurrent) return;
        setCareerOptions(options);
        setCareerLoadState("ready");
      })
      .catch(() => {
        if (isCurrent) setCareerLoadState("error");
      });

    return () => {
      isCurrent = false;
    };
  }, [careerRetryKey]);

  const currentCareer =
    process?.careerId &&
    !careerOptions.some(
      (career) => career.id === process.careerId && career.isActive,
    )
      ? {
          id: process.careerId,
          code: null,
          name: process.careerName,
          isActive: false,
          curriculumVersions: [],
        }
      : null;
  const availableCareers = [
    ...careerOptions.filter((career) => career.isActive),
    ...(currentCareer ? [currentCareer] : []),
  ].sort((left, right) => left.name.localeCompare(right.name));

  const updateField = <Key extends keyof TitulationFormValues>(
    field: Key,
    value: TitulationFormValues[Key],
  ) => setValues((current) => ({ ...current, [field]: value }));

  const validateRutInput = (input = rutInputRef.current) => {
    if (!input) return true;
    const valid = !input.value.trim() || isValidChileanRut(input.value);
    const message = valid ? "" : t("form.rutInvalid");
    input.setCustomValidity(message);
    setRutError(valid ? null : message);
    return valid;
  };

  const validatePhoneInput = (input = phoneInputRef.current) => {
    if (!input) return true;
    const value = input.value.trim();
    const valid = !value || PHONE_PATTERN.test(value);
    const message = valid ? "" : t("form.phoneInvalid");
    input.setCustomValidity(message);
    setPhoneError(valid ? null : message);
    return valid;
  };

  const continueStep = () => {
    if (step === 0) {
      const rutIsValid = validateRutInput();
      const phoneIsValid = validatePhoneInput();
      if (!rutIsValid || !phoneIsValid) {
        formRef.current?.reportValidity();
        return;
      }
    }
    if (!formRef.current?.reportValidity()) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    if (step === 0) {
      onClose();
      return;
    }
    setStep((current) => current - 1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!saveIntentRef.current) return;
    saveIntentRef.current = false;
    if (saving) return;

    const rutIsValid = validateRutInput();
    const phoneIsValid = validatePhoneInput();
    if (!rutIsValid || !phoneIsValid) {
      formRef.current?.reportValidity();
      return;
    }
    if (!formRef.current?.reportValidity()) return;
    setSaving(true);
    setSaveError(null);

    const payload = {
      ...(!process && values.studentId ? { studentId: values.studentId } : {}),
      studentName: values.studentName,
      studentRut: values.studentRut.trim() || null,
      studentEmail: values.studentEmail.trim() || null,
      studentPhone: values.studentPhone.trim() || null,
      thesisTopic: values.thesisTopic.trim() || null,
      degree: values.degree.trim() || null,
      careerId: values.careerId,
      guideName: values.guideName.trim() || null,
      coGuideName: values.coGuideName.trim() || null,
      reviewerOneName: values.reviewerOneName.trim() || null,
      reviewerTwoName: values.reviewerTwoName.trim() || null,
      defenseDate: values.defenseDate || null,
      ...(process
        ? {
            stage: values.stage,
            outcome: values.outcome,
            defenseAnnexesStatus: values.defenseAnnexesStatus,
            thesisSummaryStatus: values.thesisSummaryStatus,
            libraryFormStatus: values.libraryFormStatus,
            actaStatus: values.actaStatus,
            evaluationsStatus: values.evaluationsStatus,
          }
        : {}),
    };

    try {
      const saved = await apiFetch<TitulationProcess>(
        process
          ? `/academic/titulations/${encodeURIComponent(process.id)}`
          : "/academic/titulations",
        {
          method: process ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      onSaved(saved);
    } catch (cause: unknown) {
      setSaveError(cause instanceof ApiError && cause.status === 409 ? "identityConflict" : "save");
    } finally {
      setSaving(false);
    }
  };

  const handleExplicitSave = (event: MouseEvent<HTMLButtonElement>) => {
    if (event.detail > 1 || saving) return;

    const rutIsValid = validateRutInput();
    const phoneIsValid = validatePhoneInput();
    if (!rutIsValid || !phoneIsValid || !formRef.current?.reportValidity())
      return;

    saveIntentRef.current = true;
    formRef.current.requestSubmit();
  };

  const renderCurrentStep = () => {
    if (step === 0) {
      return (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("form.requirementsHelp")}
          </p>
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="sr-only">{t("wizard.steps.identity")}</legend>
            <TextField
              id="titulation-student-name"
              label={t("form.studentName")}
              value={values.studentName}
              onChange={(value) => updateField("studentName", value)}
              required
              optionalLabel={t("form.optional")}
              autoComplete="name"
              maxLength={180}
              help={t("form.studentNameHelp")}
            />
            <TextField
              id="titulation-student-rut"
              label={t("form.studentRut")}
              value={values.studentRut}
              onChange={(value) => {
                rutInputRef.current?.setCustomValidity("");
                setRutError(null);
                updateField("studentRut", value);
              }}
              optionalLabel={t("form.optional")}
              maxLength={12}
              help={t("form.rutHelp")}
              error={rutError}
              inputRef={rutInputRef}
              onBlur={validateRutInput}
            />
            <TextField
              id="titulation-student-email"
              label={t("form.studentEmail")}
              value={values.studentEmail}
              onChange={(value) => updateField("studentEmail", value)}
              type="email"
              autoComplete="email"
              maxLength={254}
              optionalLabel={t("form.optional")}
              help={t("form.emailHelp")}
            />
            <TextField
              id="titulation-student-phone"
              label={t("form.studentPhone")}
              value={values.studentPhone}
              onChange={(value) => {
                phoneInputRef.current?.setCustomValidity("");
                setPhoneError(null);
                updateField("studentPhone", value);
              }}
              type="tel"
              autoComplete="tel"
              maxLength={24}
              pattern={PHONE_PATTERN.source}
              inputMode="tel"
              optionalLabel={t("form.optional")}
              help={t("form.phoneHelp")}
              error={phoneError}
              inputRef={phoneInputRef}
              onBlur={validatePhoneInput}
            />
            <div className="min-w-0">
              <label
                htmlFor="titulation-career"
                className="block text-sm font-semibold text-foreground"
              >
                {t("form.career")}{" "}
                <span aria-hidden="true" className="text-danger">
                  *
                </span>
              </label>
              <select
                id="titulation-career"
                required
                value={values.careerId}
                disabled={
                  careerLoadState !== "ready" || availableCareers.length === 0
                }
                aria-describedby="titulation-career-help"
                onChange={(event) => {
                  updateField("careerId", event.target.value);
                }}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-base font-normal text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <option value="">{t("form.careerPlaceholder")}</option>
                {availableCareers.map((career) => (
                  <option key={career.id} value={career.id}>
                    {career.name}
                  </option>
                ))}
              </select>
              <p
                id="titulation-career-help"
                className="mt-1.5 text-sm leading-relaxed text-muted-foreground"
              >
                {t("form.careerHelp")}
              </p>
              {careerLoadState === "loading" && (
                <p
                  id="titulation-career-status"
                  role="status"
                  className="mt-1.5 text-sm text-muted-foreground"
                >
                  {t("form.careersLoading")}
                </p>
              )}
              {careerLoadState === "error" && (
                <div
                  id="titulation-career-status"
                  role="alert"
                  className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-danger"
                >
                  <span>{t("form.careersError")}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCareerLoadState("loading");
                      setCareerRetryKey((current) => current + 1);
                    }}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("retry")}
                  </button>
                </div>
              )}
              {careerLoadState === "ready" && availableCareers.length === 0 && (
                <p
                  id="titulation-career-status"
                  role="status"
                  className="mt-1.5 text-sm text-muted-foreground"
                >
                  {t("form.careersEmpty")}
                </p>
              )}
            </div>
            <TextField
              id="titulation-degree"
              label={t("form.degree")}
              value={values.degree}
              onChange={(value) => updateField("degree", value)}
              maxLength={160}
              optionalLabel={t("form.optional")}
              help={t("form.degreeHelp")}
            />
          </fieldset>
        </div>
      );
    }

    if (step === 1) {
      return (
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="sr-only">{t("wizard.steps.committee")}</legend>
          <div className="sm:col-span-2">
            <TextAreaField
              id="titulation-thesis-topic"
              label={t("form.thesisTopic")}
              value={values.thesisTopic}
              onChange={(value) => updateField("thesisTopic", value)}
              maxLength={2000}
              optionalLabel={t("form.optional")}
              help={t("form.thesisTopicHelp")}
            />
          </div>
          <TextField
            id="titulation-guide"
            label={t("form.guide")}
            value={values.guideName}
            onChange={(value) => updateField("guideName", value)}
            maxLength={180}
            optionalLabel={t("form.optional")}
            help={t("form.academicMemberHelp")}
          />
          <TextField
            id="titulation-co-guide"
            label={t("form.coGuide")}
            value={values.coGuideName}
            onChange={(value) => updateField("coGuideName", value)}
            maxLength={180}
            optionalLabel={t("form.optional")}
            help={t("form.academicMemberHelp")}
          />
          <TextField
            id="titulation-reviewer-one"
            label={t("form.reviewerOne")}
            value={values.reviewerOneName}
            onChange={(value) => updateField("reviewerOneName", value)}
            maxLength={180}
            optionalLabel={t("form.optional")}
            help={t("form.academicMemberHelp")}
          />
          <TextField
            id="titulation-reviewer-two"
            label={t("form.reviewerTwo")}
            value={values.reviewerTwoName}
            onChange={(value) => updateField("reviewerTwoName", value)}
            maxLength={180}
            optionalLabel={t("form.optional")}
            help={t("form.academicMemberHelp")}
          />
          <TextField
            id="titulation-defense-date"
            label={t("form.defenseDate")}
            value={values.defenseDate}
            onChange={(value) => updateField("defenseDate", value)}
            type="date"
            optionalLabel={t("form.optional")}
            help={t("form.defenseDateHelp")}
          />
        </fieldset>
      );
    }

    if (!isEditing) {
      return (
        <section
          className="space-y-4"
          aria-labelledby="titulation-pending-documents"
        >
          <div>
            <h3
              id="titulation-pending-documents"
              className="text-base font-semibold text-foreground"
            >
              {t("wizard.documentsTitle")}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t("wizard.documentsHelp")}
            </p>
          </div>
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {(["defenseAnnexes", "thesisSummary", "libraryForm"] as const).map(
              (document) => (
                <li
                  key={document}
                  className="flex min-h-12 items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="text-sm text-foreground">
                    {t(`documents.${document}`)}
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {t("documentStatus.PENDING")}
                  </span>
                </li>
              ),
            )}
          </ul>
        </section>
      );
    }

    return (
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-foreground">
          {t("wizard.documentsTitle")}
        </legend>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("wizard.documentsHelp")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="titulation-stage-edit"
            label={t("form.stage")}
            value={values.stage}
            options={STAGES}
            translate={(stage) => t(`statuses.${stage}`)}
            onChange={(value) => updateField("stage", value)}
          />
          <SelectField<TitulationOutcome>
            id="titulation-outcome-edit"
            label={t("workflow.outcome")}
            value={values.outcome}
            options={[
              "UNCONFIRMED",
              "IN_PROGRESS",
              "GRADUATED",
              "NOT_GRADUATED",
            ]}
            translate={(outcome) => t(`outcomes.${outcome}`)}
            onChange={(value) => updateField("outcome", value)}
          />
          {(
            [
              ["defenseAnnexesStatus", "defenseAnnexes"],
              ["thesisSummaryStatus", "thesisSummary"],
              ["libraryFormStatus", "libraryForm"],
              ["actaStatus", "acta"],
              ["evaluationsStatus", "evaluations"],
            ] as const
          ).map(([field, document]) => (
            <SelectField
              key={field}
              id={`titulation-${field}`}
              label={t(`documents.${document}`)}
              value={values[field]}
              options={DOCUMENT_STATUSES}
              translate={(status) => t(`documentStatus.${status}`)}
              onChange={(value) => updateField(field, value)}
            />
          ))}
        </div>
      </fieldset>
    );
  };

  const footer = (
    <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
      <button
        type="button"
        onClick={handleBack}
        className={academicSecondaryActionClass}
        disabled={saving}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        {step === 0 ? t("wizard.cancel") : t("wizard.back")}
      </button>
      {step < STEPS.length - 1 ? (
        <button
          type="button"
          onClick={continueStep}
          className={academicPrimaryActionClass}
          disabled={
            step === 0 &&
            (!values.careerId ||
              (careerLoadState !== "ready" && !process?.careerId))
          }
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          {t("wizard.continue")}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleExplicitSave}
          className={academicPrimaryActionClass}
          disabled={
            saving ||
            !values.careerId ||
            (careerLoadState !== "ready" && !process?.careerId)
          }
        >
          {saving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4" aria-hidden="true" />
          )}
          {saving
            ? t("wizard.saving")
            : isEditing
              ? t("wizard.saveChanges")
              : t("wizard.create")}
        </button>
      )}
    </div>
  );

  return (
    <FormModal
      isOpen
      onClose={onClose}
      title={isEditing ? t("wizard.editTitle") : t("wizard.title")}
      eyebrow={t("wizard.eyebrow")}
      description={t("wizard.description")}
      closeLabel={t("close")}
      size="2xl"
      footer={footer}
    >
      <form
        id="titulation-process-form"
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <nav aria-label={t("wizard.progressLabel")}>
          <ol className="grid grid-cols-3 gap-2">
            {STEPS.map((stepKey, index) => {
              const isCurrent = index === step;
              const isComplete = index < step;

              return (
                <li
                  key={stepKey}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex min-h-11 items-center gap-2 rounded-xl px-2 py-2 text-sm ${
                    isCurrent
                      ? "bg-primary/10 font-semibold text-primary"
                      : isComplete
                        ? "bg-muted/60 text-foreground"
                        : "bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-card text-xs font-semibold ring-1 ring-border">
                    {index + 1}
                  </span>
                  <span className="min-w-0 truncate">
                    {t(`wizard.steps.${stepKey}`)}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        <p
          ref={stepCountRef}
          tabIndex={-1}
          aria-live="polite"
          className="text-sm font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {t("wizard.stepCount", { current: step + 1, total: STEPS.length })}
        </p>

        {saveError && (
          <p
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {t(`errors.${saveError}`)}
          </p>
        )}

        {step === 0 && !process && (
          <TitulationStudentPicker
            selectedName={values.studentId ? values.studentName : null}
            onSelect={(student) => {
              setValues((current) => ({
                ...current,
                studentId: student?.id ?? null,
                studentName: student?.name ?? "",
                studentRut: student?.rut ?? "",
                studentEmail: student?.email ?? "",
                careerId:
                  student?.careerId &&
                  availableCareers.some(
                    (career) => career.id === student.careerId,
                  )
                    ? student.careerId
                    : current.careerId,
              }));
            }}
          />
        )}
        {renderCurrentStep()}
      </form>
    </FormModal>
  );
}
