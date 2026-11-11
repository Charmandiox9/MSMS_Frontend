import type { ReactNode } from "react";
import Modal from "@/components/ui/Modal";
import { academicSecondaryActionClass } from "./academicActionStyles";

export interface AcademicDetailField {
  label: string;
  value: ReactNode;
}

export default function AcademicDetailsDialog({
  title,
  description,
  closeLabel,
  fields,
  onClose,
}: {
  title: string;
  description: string;
  closeLabel: string;
  fields: AcademicDetailField[];
  onClose: () => void;
}) {
  return (
    <Modal
      isOpen
      title={title}
      description={description}
      size="2xl"
      closeLabel={closeLabel}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={onClose}
          className={academicSecondaryActionClass}
        >
          {closeLabel}
        </button>
      }
    >
      <dl className="grid gap-3 sm:grid-cols-2">
        {fields.map(({ label, value }) => (
          <div
            key={label}
            className="min-w-0 rounded-xl border border-border bg-card p-4"
          >
            <dt className="text-xs font-semibold text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-1 break-words text-sm text-foreground">
              {value === null || value === undefined || value === "" ? "—" : value}
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
