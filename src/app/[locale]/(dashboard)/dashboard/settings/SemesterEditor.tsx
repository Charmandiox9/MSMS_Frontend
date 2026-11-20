"use client";

import { useId, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import FormModal from "@/components/ui/FormModal";
import { apiFetch } from "@/lib/api";

export type Semester = {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  isActive: boolean;
};

const fieldClass =
  "mt-1.5 block h-11 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export default function SemesterEditor({
  semester,
  onClose,
  onSaved,
}: {
  semester: Semester | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("SemesterSettingsPage");
  const id = useId();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get("name")).trim();
    const body = {
      name,
      startsOn: fields.get("startsOn"),
      endsOn: fields.get("endsOn"),
    };
    setSaving(true);
    setError(null);

    const operation = apiFetch<Semester>(
      semester
        ? `/academic/semesters/${semester.id}`
        : "/academic/semesters/activate",
      { method: semester ? "PATCH" : "POST", body: JSON.stringify(body) },
    );
    toast.promise(operation, {
      loading: t("saving"),
      success: t(semester ? "updated" : "success", { name }),
      error: t("errors.save"),
    });
    try {
      await operation;
      onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("errors.save"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormModal
      isOpen
      title={t(semester ? "edit" : "activationTitle")}
      description={semester ? undefined : t("activationHint")}
      onClose={() => {
        if (!saving) onClose();
      }}
      closeOnEscape={!saving}
      closeOnBackdropClick={!saving}
      closeLabel={t("close")}
      footer={
        <>
          <button
            type="button"
            data-modal-dismiss
            onClick={onClose}
            disabled={saving}
            className="min-h-11 rounded-lg border border-border px-4 text-sm font-semibold"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            form={id}
            disabled={saving}
            className="min-h-11 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {t(saving ? "saving" : semester ? "saveChanges" : "activate")}
          </button>
        </>
      }
    >
      <form
        id={id}
        method="post"
        onSubmit={(event) => void submit(event)}
        aria-busy={saving}
        className="grid min-w-0 gap-4 sm:grid-cols-2"
      >
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive sm:col-span-2"
          >
            {error}
          </p>
        )}
        <label className="min-w-0 text-sm font-semibold sm:col-span-2">
          {t("name")}
          <input
            name="name"
            required
            maxLength={100}
            defaultValue={semester?.name}
            disabled={saving}
            placeholder={t("namePlaceholder")}
            className={fieldClass}
          />
        </label>
        <label className="min-w-0 text-sm font-semibold">
          {t("startsOn")}
          <input
            name="startsOn"
            required
            type="date"
            defaultValue={semester?.startsOn.slice(0, 10)}
            disabled={saving}
            className={fieldClass}
          />
        </label>
        <label className="min-w-0 text-sm font-semibold">
          {t("endsOn")}
          <input
            name="endsOn"
            required
            type="date"
            defaultValue={semester?.endsOn.slice(0, 10)}
            disabled={saving}
            className={fieldClass}
          />
        </label>
      </form>
    </FormModal>
  );
}
