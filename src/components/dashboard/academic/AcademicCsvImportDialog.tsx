"use client";

import { useState, type ReactNode } from "react";
import { Download } from "lucide-react";
import FormModal from "@/components/ui/FormModal";
import { downloadCsv } from "@/lib/csv";
import {
  academicPrimaryActionClass,
  academicSecondaryActionClass,
} from "./AcademicImportButton";

export interface AcademicCsvTemplate {
  fileName: string;
  content: string;
}

interface AcademicCsvImportDialogProps<TResult> {
  title: string;
  description: string;
  format: string;
  instructions?: ReactNode;
  context?: ReactNode;
  template: AcademicCsvTemplate;
  fileLabel: string;
  templateLabel: string;
  downloadLabel: string;
  cancelLabel: string;
  submitLabel: string;
  submittingLabel: string;
  closeLabel: string;
  fileSizeError: string;
  fileTypeError: string;
  importError: string;
  maxFileSizeBytes: number;
  canImport?: boolean;
  onClose: () => void;
  onImport: (csv: string) => Promise<TResult>;
  onImported: (result: TResult) => void;
}

export default function AcademicCsvImportDialog<TResult>({
  title,
  description,
  format,
  instructions,
  context,
  template,
  fileLabel,
  templateLabel,
  downloadLabel,
  cancelLabel,
  submitLabel,
  submittingLabel,
  closeLabel,
  fileSizeError,
  fileTypeError,
  importError,
  maxFileSizeBytes,
  canImport = true,
  onClose,
  onImport,
  onImported,
}: AcademicCsvImportDialogProps<TResult>) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!file || !canImport || submitting) return;
    if (!file.name.toLocaleLowerCase().endsWith(".csv")) {
      setError(fileTypeError);
      return;
    }
    if (file.size > maxFileSizeBytes) {
      setError(fileSizeError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      onImported(await onImport(await file.text()));
    } catch {
      setError(importError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      isOpen
      title={title}
      description={description}
      eyebrow="CSV"
      size="2xl"
      closeLabel={closeLabel}
      onClose={() => {
        if (!submitting) onClose();
      }}
      closeOnEscape={!submitting}
      closeOnBackdropClick={!submitting}
      footer={
        <>
          <button
            type="button"
            disabled={submitting}
            data-modal-dismiss
            onClick={onClose}
            className={academicSecondaryActionClass}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={!file || !canImport || submitting}
            onClick={() => void submit()}
            className={academicPrimaryActionClass}
          >
            {submitting ? submittingLabel : submitLabel}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {context}
        {instructions && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {instructions}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <section className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {templateLabel}
            </h2>
            <code className="mt-2 block overflow-x-auto rounded-xl bg-muted p-3 text-xs text-foreground">
              {format}
            </code>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={() => downloadCsv(template.fileName, template.content)}
            className={academicSecondaryActionClass}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {downloadLabel}
          </button>
        </section>
        <label className="block text-sm font-semibold text-foreground">
          {fileLabel}
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={submitting || !canImport}
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError(null);
            }}
            className="mt-2 block min-h-11 w-full rounded-xl border border-border bg-background p-2 text-sm text-foreground file:mr-3 file:min-h-8 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:font-semibold file:text-primary disabled:opacity-60"
          />
          {file && (
            <span className="mt-2 block text-xs font-normal text-muted-foreground">
              {file.name} · {(file.size / 1024).toLocaleString()} KB
            </span>
          )}
        </label>
      </div>
    </FormModal>
  );
}
