"use client";
import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { SkeletonStatus } from "@/components/ui/LoadingSkeletons";
import {
  ASSIGNMENTS,
  REGISTER,
  UPDATE,
  type Assistantship,
  type Registration,
  type SemesterOption,
} from "../graphql";
import { assistantshipErrorKey } from "../errors";
import { buttonClass, Field, inputClass } from "./controls";
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

  if (!semesters.length) {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        size="2xl"
        title={t(initialRecord ? "form.editTitle" : "form.title")}
        description={t("form.description")}
        closeLabel={t("form.close")}
        footer={
          <button type="button" className="btn-cta-secondary" onClick={onClose}>
            {t("form.close")}
          </button>
        }
      >
        <p className="text-sm text-muted-foreground">{t("form.noSemesters")}</p>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={() => {
        if (!savingRef.current && !busy) onClose();
      }}
      size="2xl"
      title={t(initialRecord ? "form.editTitle" : "form.title")}
      description={t("form.description")}
      closeLabel={t("form.close")}
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <button
            type="button"
            className="btn-cta-secondary"
            disabled={busy}
            onClick={onClose}
          >
            {t("form.cancel")}
          </button>
          <button
            type="submit"
            form="assistantship-form"
            className="btn-cta-primary"
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
      }
    >
      <form
        id="assistantship-form"
        onSubmit={(event) => void submit(event)}
        className={`space-y-6 ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
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
            {assignments.loading ? (
              <SkeletonStatus label={t("loading")}>
                <Skeleton className="h-11 w-full rounded-xl" />
              </SkeletonStatus>
            ) : (
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
            )}
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-coral-red/30 bg-coral-red/10 px-3 py-1.5 text-xs font-bold text-coral-red hover:bg-coral-red/20 transition-all cursor-pointer"
              onClick={() => void assignments.refetch().catch(() => undefined)}
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

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">
            {t("form.student")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        </div>

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

        <label className="flex items-start gap-3 rounded-2xl border border-secondary/30 bg-secondary/10 p-4 text-xs font-medium leading-relaxed text-foreground transition-all hover:border-secondary/50">
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
      </form>
    </Modal>
  );
}
