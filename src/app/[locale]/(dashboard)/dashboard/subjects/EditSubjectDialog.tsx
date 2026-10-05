"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { FormSkeleton } from "@/components/ui/LoadingSkeletons";
import { apiFetch } from "@/lib/api";

type Schedule = { day: string; block: string; location?: string | null };
type Options = {
  days: string[];
  blocks: { code: string; startsAtMinute: number; endsAtMinute: number }[];
};
export type EditableSubject = {
  nrc: string;
  name: string;
  entries: (Schedule & { kind?: string; course: { code: string | null } })[];
};
const fieldClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30";
const time = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

export default function EditSubjectDialog({
  subject,
  onClose,
  onSaved,
}: {
  subject: EditableSubject;
  onClose: () => void;
  onSaved: (nrc: string) => void;
}) {
  const t = useTranslations("SubjectsPage");
  const [name, setName] = useState(subject.name);
  const [code, setCode] = useState(subject.entries[0].course.code ?? "");
  const [nrc, setNrc] = useState(subject.nrc);
  const [schedules, setSchedules] = useState<Schedule[]>(
    subject.entries
      .filter((entry) => entry.kind !== "ASSISTANTSHIP")
      .map(({ day, block, location }) => ({ day, block, location })),
  );
  const [options, setOptions] = useState<Options | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const loadError = t("errors.load");
  useEffect(() => {
    let active = true;
    apiFetch<Options>("/academic/courses/options")
      .then((value) => {
        if (active) {
          setOptions(value);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : loadError);
      });
    return () => {
      active = false;
    };
  }, [loadError, retry]);
  const update = (index: number, value: Partial<Schedule>) =>
    setSchedules((current) =>
      current.map((schedule, position) =>
        position === index ? { ...schedule, ...value } : schedule,
      ),
    );
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || !options) return;
    if (
      new Set(schedules.map((schedule) => `${schedule.day}|${schedule.block}`))
        .size !== schedules.length
    ) {
      setError(t("editForm.duplicate"));
      return;
    }
    setSaving(true);
    setError(null);
    const operation = apiFetch<{ nrc: string }>(
      `/academic/courses/${encodeURIComponent(subject.nrc)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || null,
          nrc: nrc.trim(),
          schedules: schedules.map((schedule) => ({
            ...schedule,
            location: schedule.location?.trim() || null,
          })),
        }),
      },
    );
    toast.promise(operation, {
      loading: t("editForm.saving"),
      success: t("editForm.saved"),
      error: (cause: unknown) =>
        cause instanceof Error ? cause.message : t("editForm.error"),
    });
    try {
      const result = await operation;
      onSaved(result.nrc);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t("editForm.error"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      isOpen
      onClose={() => {
        if (!saving) onClose();
      }}
      title={t("editForm.title")}
      description={t("editForm.description")}
      closeLabel={t("close")}
      size="4xl"
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
            {t("editForm.cancel")}
          </button>
          <button
            type="submit"
            form="edit-subject"
            disabled={saving || !options || !schedules.length}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {t(saving ? "editForm.saving" : "editForm.save")}
          </button>
        </>
      }
    >
      <form
        id="edit-subject"
        onSubmit={(event) => void submit(event)}
        className="space-y-5"
      >
        <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold sm:col-span-2">
            {t("editForm.name")}
            <input
              required
              maxLength={200}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-semibold">
            {t("editForm.code")}
            <input
              maxLength={50}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-semibold">
            {t("nrcLabel")}
            <input
              required
              maxLength={50}
              value={nrc}
              onChange={(event) => setNrc(event.target.value)}
              className={fieldClass}
            />
          </label>
        </fieldset>
        <p className="text-xs text-muted-foreground">
          {t("editForm.catalogHint")}
        </p>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
            {!options && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setRetry((value) => value + 1);
                }}
                className="ml-3 underline"
              >
                {t("editForm.retry")}
              </button>
            )}
          </p>
        )}
        {!options ? (
          !error && <FormSkeleton label={t("loading")} />
        ) : (
          <fieldset disabled={saving} className="space-y-3">
            <legend className="mb-3 text-sm font-bold">
              {t("scheduleColumn")}
            </legend>
            {schedules.map((schedule, index) => (
              <div
                key={index}
                className="grid items-end gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-[1fr_1.5fr_1fr_auto]"
              >
                <label className="text-xs font-semibold">
                  {t("editForm.day")}
                  <select
                    value={schedule.day}
                    onChange={(event) =>
                      update(index, { day: event.target.value })
                    }
                    className={fieldClass}
                  >
                    {options.days.map((day) => (
                      <option key={day} value={day}>
                        {t(`days.${day}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold">
                  {t("block")}
                  <select
                    value={schedule.block}
                    onChange={(event) =>
                      update(index, { block: event.target.value })
                    }
                    className={fieldClass}
                  >
                    {options.blocks.map((block) => (
                      <option key={block.code} value={block.code}>
                        {block.code} · {time(block.startsAtMinute)}–
                        {time(block.endsAtMinute)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold">
                  {t("room")}
                  <input
                    maxLength={200}
                    value={schedule.location ?? ""}
                    onChange={(event) =>
                      update(index, { location: event.target.value })
                    }
                    className={fieldClass}
                  />
                </label>
                <button
                  type="button"
                  disabled={schedules.length <= 1}
                  aria-label={t("editForm.remove", { index: index + 1 })}
                  onClick={() =>
                    setSchedules((current) =>
                      current.filter((_, position) => position !== index),
                    )
                  }
                  className="rounded-xl border border-border px-3 py-2 text-sm text-destructive disabled:opacity-40"
                >
                  {t("editForm.removeShort")}
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={
                schedules.length >= options.days.length * options.blocks.length
              }
              onClick={() => {
                const free = options.days
                  .flatMap((day) =>
                    options.blocks.map(({ code: block }) => ({
                      day,
                      block,
                      location: "",
                    })),
                  )
                  .find(
                    (slot) =>
                      !schedules.some(
                        (schedule) =>
                          schedule.day === slot.day &&
                          schedule.block === slot.block,
                      ),
                  );
                if (free) setSchedules((current) => [...current, free]);
              }}
              className="rounded-xl border border-primary/30 px-4 py-2 text-sm font-bold text-primary disabled:opacity-40"
            >
              {t("editForm.add")}
            </button>
          </fieldset>
        )}
      </form>
    </Modal>
  );
}
