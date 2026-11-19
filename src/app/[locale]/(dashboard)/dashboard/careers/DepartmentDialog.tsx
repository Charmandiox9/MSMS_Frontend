"use client";

import { useId, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import FormModal from "@/components/ui/FormModal";
import Modal from "@/components/ui/Modal";
import { apiFetch } from "@/lib/api";
import { ApiError } from "@/lib/api-error";

export type Department = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  updatedAt: string;
  _count: { careers: number; projects: number; outputs: number };
};

export type DepartmentAction =
  { type: "create" } | { type: "edit" | "delete"; department: Department };

const inputClass =
  "mt-1 min-h-12 w-full rounded-xl border border-border bg-background px-3 py-2 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export default function DepartmentDialog({
  action,
  onClose,
  onSaved,
}: {
  action: DepartmentAction;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("Departments");
  const id = useId();
  const [saving, setSaving] = useState(false);
  const department = action.type === "create" ? null : action.department;
  const deleting = action.type === "delete";
  const Dialog = deleting ? Modal : FormModal;
  const title = department
    ? t(deleting ? "deleteTitle" : "editTitle", { name: department.name })
    : t("create");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const fields = new FormData(event.currentTarget);
    const version = department ? { updatedAt: department.updatedAt } : {};
    const body = deleting
      ? version
      : {
          ...version,
          name: fields.get("name"),
          code: fields.get("code"),
          description: fields.get("description"),
        };
    const operation = apiFetch(
      department
        ? `/academic/departments/${department.id}`
        : "/academic/departments",
      {
        method: deleting ? "DELETE" : department ? "PUT" : "POST",
        body: JSON.stringify(body),
      },
    );
    toast.promise(operation, {
      loading: t(deleting ? "deleting" : "saving"),
      success: t(deleting ? "deleted" : department ? "updated" : "created"),
      error: (error: unknown) => {
        if (error instanceof ApiError && error.status === 409)
          return t(deleting ? "deleteConflict" : "saveConflict");
        return t(deleting ? "deleteError" : "saveError");
      },
    });
    try {
      await operation;
      onSaved();
    } catch {
      // The toast reports the failure while the form keeps its values.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      isOpen
      title={title}
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
            data-modal-dismiss
            disabled={saving}
            onClick={onClose}
            className="min-h-12 rounded-xl border border-border px-4 text-sm font-semibold"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            form={id}
            disabled={saving}
            className={`min-h-12 rounded-xl px-4 text-sm font-semibold disabled:opacity-50 ${deleting ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}
          >
            {t(
              deleting
                ? saving
                  ? "deleting"
                  : "delete"
                : saving
                  ? "saving"
                  : "save",
            )}
          </button>
        </>
      }
    >
      <form
        id={id}
        method="post"
        aria-label={title}
        onSubmit={(event) => void submit(event)}
        className="space-y-4"
      >
        {deleting ? (
          <p className="text-sm text-muted-foreground">
            {t("deleteDescription")}
          </p>
        ) : (
          <>
            <div>
              <label
                htmlFor={`${id}-name`}
                className="block text-sm font-semibold"
              >
                {t("name")}
              </label>
              <input
                id={`${id}-name`}
                name="name"
                required
                pattern={String.raw`.*\S.*`}
                maxLength={160}
                defaultValue={department?.name}
                disabled={saving}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor={`${id}-code`}
                className="block text-sm font-semibold"
              >
                {t("code")}
              </label>
              <input
                id={`${id}-code`}
                name="code"
                maxLength={30}
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                defaultValue={department?.code ?? ""}
                disabled={saving}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor={`${id}-description`}
                className="block text-sm font-semibold"
              >
                {t("description")}
              </label>
              <textarea
                id={`${id}-description`}
                name="description"
                rows={3}
                maxLength={500}
                defaultValue={department?.description ?? ""}
                disabled={saving}
                className={inputClass}
              />
            </div>
          </>
        )}
      </form>
    </Dialog>
  );
}
