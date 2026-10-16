"use client";

import { AlertTriangle, Check, Loader2, PowerOff } from "lucide-react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/Modal";
import type { Teacher } from "@/types/justifications";

interface TeacherDeactivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (teacher: Teacher) => Promise<void>;
  teacher: Teacher | null;
  isProcessing?: boolean;
}

export default function TeacherDeactivateModal({
  isOpen,
  onClose,
  onConfirm,
  teacher,
  isProcessing = false,
}: TeacherDeactivateModalProps) {
  const t = useTranslations("TeachersPage");

  if (!isOpen || !teacher) return null;

  const isDeactivating = teacher.isActive !== false;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow={t("eyebrow")}
      title={
        isDeactivating
          ? t("deactivateModal.deactivateTitle")
          : t("deactivateModal.activateTitle")
      }
      closeLabel={t("deactivateModal.cancel")}
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="btn-cta-secondary"
          >
            {t("deactivateModal.cancel")}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(teacher)}
            disabled={isProcessing}
            className={isDeactivating ? "btn-cta-danger" : "btn-cta-success"}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isDeactivating ? (
              <PowerOff className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span>
              {isDeactivating
                ? t("deactivateModal.confirmDeactivate")
                : t("deactivateModal.confirmActivate")}
            </span>
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-foreground leading-relaxed">
          {isDeactivating
            ? t("deactivateModal.deactivateDescription", { name: teacher.name })
            : t("deactivateModal.activateDescription", { name: teacher.name })}
        </p>

        {isDeactivating && teacher.assignments && teacher.assignments.length > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{t("nrcs")} ({teacher.assignments.length})</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {teacher.assignments.map((assignment) => (
                <span
                  key={assignment.id}
                  className="rounded-lg bg-amber-500/20 px-2 py-0.5 font-bold text-amber-900 dark:text-amber-100"
                >
                  {assignment.nrc} · {assignment.course.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
