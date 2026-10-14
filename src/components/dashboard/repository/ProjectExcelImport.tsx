"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import { primaryButton, secondaryButton } from "./repository-fields";

type Preview = {
  totalRows: number;
  importable: number;
  errors: { row: number; message: string }[];
  duplicates: { row: number; message: string }[];
  warnings: { row: number; message: string }[];
  sample: { row: number; title: string; code: string | null; reportingYear: number; academicUnit: string }[];
};

const readBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error("Could not read file"));
  reader.onload = () => {
    const result = reader.result;
    if (typeof result !== "string") return reject(new Error("Could not read file"));
    resolve(result.slice(result.indexOf(",") + 1));
  };
  reader.readAsDataURL(file);
});

export default function ProjectExcelImport({ onImported }: { onImported: () => void }) {
  const t = useTranslations("AcademicRepository.import");
  const [open, setOpen] = useState(false);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chooseFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLocaleLowerCase().endsWith(".xlsx")) {
      setError(t("xlsxOnly"));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError(t("tooLarge"));
      return;
    }
    setBusy(true);
    setError(null);
    setPreview(null);
    try {
      const encoded = await readBase64(file);
      const result = await apiFetch<Preview>("/academic/imports/projects/preview", {
        method: "POST",
        body: JSON.stringify({ fileBase64: encoded }),
      });
      setFileBase64(encoded);
      setPreview(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("previewError"));
    } finally {
      setBusy(false);
    }
  };

  const importFile = async () => {
    if (!fileBase64 || !preview?.importable || busy) return;
    setBusy(true);
    const operation = apiFetch<{ imported: number }>("/academic/imports/projects/commit", {
      method: "POST",
      body: JSON.stringify({ fileBase64 }),
    });
    toast.promise(operation, {
      loading: t("importing"),
      success: (result) => t("imported", { count: result.imported }),
      error: (cause: unknown) => cause instanceof Error ? cause.message : t("importError"),
    });
    try {
      await operation;
      setOpen(false);
      setPreview(null);
      setFileBase64(null);
      onImported();
    } catch {
      // Keep the preview visible so the user can correct the source file.
    } finally {
      setBusy(false);
    }
  };

  return <>
    <button type="button" className={secondaryButton} onClick={() => setOpen(true)}>
      <FileSpreadsheet className="h-4 w-4" />{t("button")}
    </button>
    {open && <Modal isOpen title={t("title")} description={t("description")} size="lg" onClose={() => !busy && setOpen(false)} closeOnEscape={!busy} closeOnBackdropClick={!busy} closeLabel={t("close")}>
      <div className="space-y-4">
        <label className="block text-sm font-medium">{t("fileLabel")}
          <input type="file" accept=".xlsx" disabled={busy} className="mt-2 block w-full rounded-xl border border-border bg-background p-3 text-sm" onChange={(event) => void chooseFile(event.target.files?.[0])} />
        </label>
        {busy && <p role="status" className="text-sm text-muted-foreground">{t("loading")}</p>}
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {preview && <div className="space-y-3 rounded-xl border border-border p-4">
          <p className="text-sm font-semibold">{t("counts", { importable: preview.importable, total: preview.totalRows })}</p>
          {preview.sample.length > 0 && <ul className="max-h-40 list-disc space-y-1 overflow-auto pl-5 text-sm">{preview.sample.map((row) => <li key={row.row}>{t("sampleRow", { row: row.row, title: row.title, year: row.reportingYear })}</li>)}</ul>}
          {[...preview.errors, ...preview.duplicates].slice(0, 30).map((item) => <p key={`${item.row}-${item.message}`} className="text-xs text-red-600 dark:text-red-400">{t("rowIssue", { row: item.row, message: item.message })}</p>)}
          {preview.warnings.slice(0, 15).map((item) => <p key={`${item.row}-${item.message}`} className="text-xs text-amber-700 dark:text-amber-300">{t("rowWarning", { row: item.row, message: item.message })}</p>)}
        </div>}
        <div className="flex justify-end gap-3">
          <button type="button" className={secondaryButton} disabled={busy} onClick={() => setOpen(false)}>{t("cancel")}</button>
          <button type="button" className={primaryButton} disabled={busy || !preview?.importable} onClick={() => void importFile()}>{t("confirm", { count: preview?.importable ?? 0 })}</button>
        </div>
      </div>
    </Modal>}
  </>;
}
