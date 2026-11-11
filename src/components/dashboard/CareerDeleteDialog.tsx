"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { apiFetch } from "@/lib/api";
import type { Career } from "@/types/careers";

export default function CareerDeleteDialog({
  career,
  onClose,
  onDeleted,
}: {
  career: Career;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslations("CareersPage");
  const [saving, setSaving] = useState(false);
  const remove = async () => {
    if (saving) return;
    setSaving(true);
    const operation = apiFetch(`/academic/careers/${career.id}`, {
      method: "DELETE",
      body: JSON.stringify({ updatedAt: career.updatedAt }),
    });
    toast.promise(operation, {
      loading: t("deleting"),
      success: t("deleted"),
      error: (cause: unknown) =>
        cause instanceof Error ? cause.message : t("errors.delete"),
    });
    try {
      await operation;
      onDeleted();
      onClose();
    } catch {
      /* Toast communicates the failure; keep the dialog open to retry. */
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      isOpen
      title={t("deleteTitle", { name: career.name })}
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
            className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void remove()}
            className="min-h-11 rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground focus-visible:ring-2 focus-visible:ring-destructive"
          >
            {t(saving ? "deleting" : "delete")}
          </button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{t("deleteDescription")}</p>
    </Modal>
  );
}
