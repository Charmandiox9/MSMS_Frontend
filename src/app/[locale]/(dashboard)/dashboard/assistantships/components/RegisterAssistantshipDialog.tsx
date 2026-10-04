"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ASSIGNMENTS,
  REGISTER,
  UPDATE,
  type Assistantship,
  type Registration,
  type SemesterOption,
} from "../graphql";
import { assistantshipErrorKey } from "../errors";
import { buttonClass, Field, inputClass, primaryClass } from "./controls";
import ScheduleFields, { type ScheduleDraft } from "./ScheduleFields";
import type { AssistantshipBlockOption } from "../schema-types";

export default function RegisterAssistantshipDialog({
  semesters,
  blocks,
  initialRecord,
  initialSemesterId,
  onClose,
  onRegistered,
}: {
  semesters: SemesterOption[];
  blocks: AssistantshipBlockOption[];
  initialRecord?: Assistantship;
  initialSemesterId?: string;
  onClose: () => void;
  onRegistered: (semesterId: string) => void;
}) {
  const t = useTranslations("AssistantshipsPage");
  const dialog = useRef<HTMLDialogElement>(null);
  const savingRef = useRef(false);
  const [semesterId, setSemesterId] = useState(
    initialRecord?.semesterId ??
      initialSemesterId ??
      semesters.find((semester) => semester.isActive)?.id ??
      semesters[0]?.id ??
      "",
  );
  const [assignmentId, setAssignmentId] = useState(
    initialRecord?.teachingAssignmentId ?? "",
  );
  const effectiveBlocks = [
    ...blocks,
    ...(initialRecord?.schedules ?? []).flatMap((schedule, index) =>
      blocks.some(
        (block) =>
          block.startsAtMinute === schedule.startsAtMinute &&
          block.endsAtMinute === schedule.endsAtMinute,
      )
        ? []
        : [
            {
              code: `legacy-${index}`,
              startsAtMinute: schedule.startsAtMinute,
              endsAtMinute: schedule.endsAtMinute,
            },
          ],
    ),
  ];
  const [schedules, setSchedules] = useState<ScheduleDraft[]>(() =>
    (initialRecord?.schedules ?? []).map((schedule, index) => ({
      id: crypto.randomUUID(),
      weekday: String(schedule.weekday),
      location: schedule.location ?? "",
      block:
        effectiveBlocks.find(
          (block) =>
            block.startsAtMinute === schedule.startsAtMinute &&
            block.endsAtMinute === schedule.endsAtMinute,
        )?.code ?? `legacy-${index}`,
    })),
  );
  const semester = semesters.find((item) => item.id === semesterId);
  const assignments = useQuery(ASSIGNMENTS, {
    variables: { semesterId },
    skip: !semesterId,
    fetchPolicy: "network-only",
  });
  const [register, { loading: saving }] = useMutation(REGISTER);
  const [update, { loading: updating }] = useMutation(UPDATE);
  const busy = saving || updating;
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
      assistantshipNrc: text("assistantshipNrc"),
      approvedOn: text("approvedOn"),
      startsOn: text("startsOn"),
      endsOn: text("endsOn"),
      approvalConfirmed: form.get("approvalConfirmed") === "on",
      weeklyHours: text("weeklyHours")
        ? Number(text("weeklyHours"))
        : undefined,
      schedules: schedules.map((schedule) => {
        const block = effectiveBlocks.find(
          (item) => item.code === schedule.block,
        )!;
        return {
          weekday: Number(schedule.weekday),
          startsAtMinute: block.startsAtMinute,
          endsAtMinute: block.endsAtMinute,
          location: schedule.location.trim() || undefined,
        };
      }),
    };
    savingRef.current = true;
    try {
      const operation: Promise<unknown> = initialRecord
        ? update({ variables: { id: initialRecord.id, input } })
        : register({ variables: { input } });
      toast.promise(operation, {
        loading: t("form.saving"),
        success: t(initialRecord ? "form.updated" : "form.success"),
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
            {t(initialRecord ? "form.editTitle" : "form.title")}
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
          disabled={busy}
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
          <fieldset disabled={busy} className="space-y-6 p-5">
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
                  defaultValue={initialRecord?.assistantName}
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
                  defaultValue={initialRecord?.assistantEmail}
                  type="email"
                  className={inputClass}
                  autoComplete="email"
                  maxLength={254}
                  required
                />
              </Field>
              <Field label={t("form.assistantshipNrc")} htmlFor="register-code">
                <input
                  id="register-code"
                  name="assistantshipNrc"
                  defaultValue={initialRecord?.assistantshipNrc ?? ""}
                  required
                  className={inputClass}
                  maxLength={50}
                />
              </Field>
              <Field label={t("form.hours")} htmlFor="register-hours">
                <input
                  id="register-hours"
                  name="weeklyHours"
                  defaultValue={initialRecord?.weeklyHours ?? ""}
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
                  defaultValue={initialRecord?.approvedOn}
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
                  defaultValue={initialRecord?.startsOn ?? semester?.startsOn}
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
                  defaultValue={initialRecord?.endsOn ?? semester?.endsOn}
                  className={inputClass}
                  required
                />
              </Field>
            </div>
            <label className="flex items-start gap-3 rounded-2xl border border-secondary/20 bg-secondary/5 p-4 text-xs leading-relaxed text-foreground">
              <input
                name="approvalConfirmed"
                defaultChecked={Boolean(initialRecord)}
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 shrink-0 accent-secondary"
              />
              {t("form.confirmApproval")}
            </label>
            <ScheduleFields
              value={schedules}
              onChange={setSchedules}
              blocks={effectiveBlocks}
            />
          </fieldset>
          <div className="flex justify-end gap-3 border-t border-border p-5">
            <button
              type="button"
              className={buttonClass}
              disabled={busy}
              onClick={onClose}
            >
              {t("form.cancel")}
            </button>
            <button
              type="submit"
              className={primaryClass}
              disabled={
                busy ||
                !assignmentId ||
                assignments.loading ||
                Boolean(assignments.error)
              }
            >
              {busy && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {t(
                busy
                  ? "form.saving"
                  : initialRecord
                    ? "form.update"
                    : "form.save",
              )}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
