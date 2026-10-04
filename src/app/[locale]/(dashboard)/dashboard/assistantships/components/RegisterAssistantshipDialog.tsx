"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ASSIGNMENTS,
  REGISTER,
  type Registration,
  type SemesterOption,
} from "../graphql";
import { assistantshipErrorKey } from "../errors";
import { buttonClass, Field, inputClass, primaryClass } from "./controls";
import ScheduleFields, { type ScheduleDraft } from "./ScheduleFields";

const minutes = (time: string) => {
  const [hours, minute] = time.split(":").map(Number);
  return hours * 60 + minute;
};
export default function RegisterAssistantshipDialog({
  semesters,
  initialSemesterId,
  onClose,
  onRegistered,
}: {
  semesters: SemesterOption[];
  initialSemesterId?: string;
  onClose: () => void;
  onRegistered: (semesterId: string) => void;
}) {
  const t = useTranslations("AssistantshipsPage");
  const dialog = useRef<HTMLDialogElement>(null);
  const savingRef = useRef(false);
  const [semesterId, setSemesterId] = useState(
    initialSemesterId ??
      semesters.find((semester) => semester.isActive)?.id ??
      semesters[0]?.id ??
      "",
  );
  const [assignmentId, setAssignmentId] = useState("");
  const [schedules, setSchedules] = useState<ScheduleDraft[]>([]);
  const semester = semesters.find((item) => item.id === semesterId);
  const assignments = useQuery(ASSIGNMENTS, {
    variables: { semesterId },
    skip: !semesterId,
    fetchPolicy: "network-only",
  });
  const [register, { loading: saving }] = useMutation(REGISTER);
  useEffect(() => {
    const element = dialog.current;
    const focus = document.activeElement;
    if (element && !element.open) element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (focus instanceof HTMLElement && focus.isConnected) focus.focus();
    };
  }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (savingRef.current) return;
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim();
    const input: Registration = {
      teachingAssignmentId: assignmentId,
      assistantName: text("name"),
      assistantEmail: text("email"),
      studentCode: text("studentCode") || undefined,
      approvedOn: text("approvedOn"),
      startsOn: text("startsOn"),
      endsOn: text("endsOn"),
      approvalConfirmed: form.get("approvalConfirmed") === "on",
      weeklyHours: text("weeklyHours")
        ? Number(text("weeklyHours"))
        : undefined,
      schedules: schedules.map((schedule) => ({
        weekday: Number(schedule.weekday),
        startsAtMinute: minutes(schedule.startsAt),
        endsAtMinute: minutes(schedule.endsAt),
        location: schedule.location.trim() || undefined,
      })),
    };
    savingRef.current = true;
    try {
      const operation = register({ variables: { input } });
      toast.promise(operation, {
        loading: t("form.saving"),
        success: t("form.success"),
        error: (error: unknown) => t(`errors.${assistantshipErrorKey(error)}`),
      });
      await operation;
      onRegistered(semesterId);
    } catch {
      /* The toast shows the translated error; retain the form for correction. */
    } finally {
      savingRef.current = false;
    }
  };
  return (
    <dialog
      ref={dialog}
      aria-labelledby="assistantship-dialog-title"
      aria-describedby="assistantship-dialog-description"
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-0 text-foreground shadow-xl backdrop:bg-slate-950/65"
      onCancel={(event) => {
        event.preventDefault();
        if (!savingRef.current) onClose();
      }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div>
          <h2 id="assistantship-dialog-title" className="text-xl font-bold">
            {t("form.title")}
          </h2>
          <p
            id="assistantship-dialog-description"
            className="mt-1 text-xs text-muted-foreground"
          >
            {t("form.description")}
          </p>
        </div>
        <button
          type="button"
          className={`${buttonClass} shrink-0 px-3`}
          aria-label={t("form.close")}
          disabled={saving}
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {!semesters.length ? (
        <div className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">
            {t("form.noSemesters")}
          </p>
          <button type="button" className={buttonClass} onClick={onClose}>
            {t("form.close")}
          </button>
        </div>
      ) : (
        <form onSubmit={(event) => void submit(event)}>
          <fieldset disabled={saving} className="space-y-6 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("form.semester")} htmlFor="register-semester">
                <select
                  id="register-semester"
                  className={inputClass}
                  required
                  value={semesterId}
                  onChange={(event) => {
                    setSemesterId(event.target.value);
                    setAssignmentId("");
                  }}
                >
                  {semesters.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("form.course")} htmlFor="register-assignment">
                <select
                  id="register-assignment"
                  className={inputClass}
                  required
                  value={assignmentId}
                  disabled={assignments.loading || Boolean(assignments.error)}
                  onChange={(event) => setAssignmentId(event.target.value)}
                >
                  <option value="">
                    {t(assignments.loading ? "loading" : "form.selectCourse")}
                  </option>
                  {assignments.data?.assistantshipAssignments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.courseName} · {t("nrc", { nrc: item.nrc })} ·{" "}
                      {item.teacherName}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {assignments.error ? (
              <div
                role="alert"
                className="flex flex-wrap items-center gap-3 text-sm text-coral-red"
              >
                <p>{t("errors.load")}</p>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() =>
                    void assignments.refetch().catch(() => undefined)
                  }
                >
                  {t("retry")}
                </button>
              </div>
            ) : !assignments.loading &&
              !assignments.data?.assistantshipAssignments.length ? (
              <p
                role="status"
                className="rounded-xl bg-muted p-3 text-xs text-muted-foreground"
              >
                {t("form.noAssignments")}
              </p>
            ) : null}
            <fieldset className="grid gap-4 sm:grid-cols-2">
              <legend className="mb-3 text-sm font-bold">
                {t("form.student")}
              </legend>
              <Field label={t("form.name")} htmlFor="register-name">
                <input
                  id="register-name"
                  name="name"
                  className={inputClass}
                  autoComplete="name"
                  maxLength={150}
                  required
                />
              </Field>
              <Field label={t("form.email")} htmlFor="register-email">
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  className={inputClass}
                  autoComplete="email"
                  maxLength={254}
                  required
                />
              </Field>
              <Field label={t("form.studentCode")} htmlFor="register-code">
                <input
                  id="register-code"
                  name="studentCode"
                  className={inputClass}
                  maxLength={50}
                />
              </Field>
              <Field label={t("form.hours")} htmlFor="register-hours">
                <input
                  id="register-hours"
                  name="weeklyHours"
                  type="number"
                  min="0.01"
                  max="168"
                  step="0.01"
                  className={inputClass}
                />
              </Field>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("form.approvedOn")} htmlFor="register-approval">
                <input
                  id="register-approval"
                  name="approvedOn"
                  type="date"
                  className={inputClass}
                  required
                />
              </Field>
              <Field label={t("form.startsOn")} htmlFor="register-start">
                <input
                  key={`start-${semesterId}`}
                  id="register-start"
                  name="startsOn"
                  type="date"
                  min={semester?.startsOn}
                  max={semester?.endsOn}
                  defaultValue={semester?.startsOn}
                  className={inputClass}
                  required
                />
              </Field>
              <Field label={t("form.endsOn")} htmlFor="register-end">
                <input
                  key={`end-${semesterId}`}
                  id="register-end"
                  name="endsOn"
                  type="date"
                  min={semester?.startsOn}
                  max={semester?.endsOn}
                  defaultValue={semester?.endsOn}
                  className={inputClass}
                  required
                />
              </Field>
            </div>
            <label className="flex items-start gap-3 rounded-2xl border border-secondary/20 bg-secondary/5 p-4 text-xs leading-relaxed text-foreground">
              <input
                name="approvalConfirmed"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 shrink-0 accent-secondary"
              />
              {t("form.confirmApproval")}
            </label>
            <ScheduleFields value={schedules} onChange={setSchedules} />
          </fieldset>
          <div className="flex justify-end gap-3 border-t border-border p-5">
            <button
              type="button"
              className={buttonClass}
              disabled={saving}
              onClick={onClose}
            >
              {t("form.cancel")}
            </button>
            <button
              type="submit"
              className={primaryClass}
              disabled={
                saving ||
                !assignmentId ||
                assignments.loading ||
                Boolean(assignments.error)
              }
            >
              {saving && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {t(saving ? "form.saving" : "form.save")}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
